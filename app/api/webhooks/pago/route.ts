import { NextRequest, NextResponse, after } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enviarCorreosConfirmacion } from "../../../../lib/email";

/**
 * El banco/pasarela envía notificaciones asíncronas (webhook) para
 * confirmar o rechazar un pago. `trx_id` es el identificador de la
 * transacción bancaria, útil para conciliación y auditoría.
 */
const webhookSchema = z.object({
  reserva_id: z.string().uuid(),
  estado: z.enum(["pendiente", "pagada"]),
  trx_id: z.string().optional(),
});

const PAGO_WEBHOOK_SECRET = process.env.PAGO_WEBHOOK_SECRET;

/**
 * Valida que la notificación provenga realmente del banco/pasarela: se
 * compara un HMAC-SHA256 del cuerpo crudo (calculado con el secreto
 * compartido) contra la firma enviada en el header `x-signature`.
 * `timingSafeEqual` evita ataques de timing en la comparación.
 */
function firmaValida(rawBody: string, firmaRecibida: string | null): boolean {
  if (!PAGO_WEBHOOK_SECRET) {
    console.error("PAGO_WEBHOOK_SECRET no está configurado.");
    return false;
  }
  if (!firmaRecibida) {
    return false;
  }

  const firmaEsperada = crypto
    .createHmac("sha256", PAGO_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const bufferRecibido = Buffer.from(firmaRecibida);
  const bufferEsperado = Buffer.from(firmaEsperada);

  if (bufferRecibido.length !== bufferEsperado.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferRecibido, bufferEsperado);
}

export async function POST(request: NextRequest) {
  try {
    // Se lee el cuerpo como texto crudo para poder validar la firma HMAC
    // antes de parsearlo como JSON.
    const rawBody = await request.text();
    const firmaRecibida = request.headers.get("x-signature");

    // 1. Validar la firma del banco.
    if (!firmaValida(rawBody, firmaRecibida)) {
      console.error("Firma de webhook inválida o ausente.");
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const parsed = webhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", detalles: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { reserva_id, estado, trx_id } = parsed.data;

    // 2. Actualizar el estado de la reserva (idempotente: si no existe, 404).
    const { data: reserva, error: updateError } = await supabaseAdmin
      .from("reservas")
      .update({ estado, trx_id })
      .eq("id", reserva_id)
      .select(
        "id, servicio_id, negocio_id, fecha_hora, email_cliente, estado, trx_id",
      )
      .single();

    if (updateError || !reserva) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 },
      );
    }

    // Solo se notifica por correo cuando el pago fue exitoso.
    if (reserva.estado === "pagada") {
      // 3. Obtener los datos de negocio y servicio necesarios para los correos.
      const [{ data: servicio }, { data: negocio }] = await Promise.all([
        supabaseAdmin
          .from("servicios")
          .select("nombre, precio_usd")
          .eq("id", reserva.servicio_id)
          .single(),
        supabaseAdmin
          .from("negocios")
          .select("nombre, logo_url, user_id")
          .eq("id", reserva.negocio_id)
          .single(),
      ]);

      if (servicio && negocio) {
        const { data: negocioAuthUser } =
          await supabaseAdmin.auth.admin.getUserById(negocio.user_id);
        const negocioEmail = negocioAuthUser?.user?.email;

        if (negocioEmail) {
          // 4. Enviar los correos SIN bloquear la respuesta HTTP al banco.
          // `after()` programa el envío para después de que la respuesta ya
          // fue enviada, garantizando un status 200 rápido y que el runtime
          // no termine la función antes de que Resend complete el envío.
          after(async () => {
            const resultado = await enviarCorreosConfirmacion({
              negocioNombre: negocio.nombre,
              negocioLogoUrl: negocio.logo_url,
              negocioEmail,
              servicioNombre: servicio.nombre,
              fechaHora: reserva.fecha_hora,
              montoUsd: servicio.precio_usd,
              trxId: reserva.trx_id ?? "N/A",
              emailCliente: reserva.email_cliente,
            });

            if (!resultado.reciboTuristaOk || !resultado.alertaPymeOk) {
              console.error(
                `Envío de correos incompleto para la reserva ${reserva.id}:`,
                resultado,
              );
            }
          });
        } else {
          console.error(
            `No se encontró email del dueño para negocio_id=${reserva.negocio_id}, no se enviarán correos.`,
          );
        }
      } else {
        console.error(
          `No se pudo resolver servicio/negocio para la reserva ${reserva.id}, no se enviarán correos.`,
        );
      }
    }

    return NextResponse.json(
      { ok: true, reserva_id: reserva.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en /api/webhooks/pago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
