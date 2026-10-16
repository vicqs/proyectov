import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../../lib/supabase";
import { construirHorarios } from "../../../lib/horarios";

/**
 * Esquema de validación estricta del cuerpo del request.
 * Evita persistir datos corruptos (ej. emails inválidos o fechas mal formadas).
 */
const checkoutSchema = z.object({
  servicio_id: z.string().uuid(),
  email_cliente: z.string().email(),
  fecha_hora: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { servicio_id, email_cliente, fecha_hora } = parsed.data;

    // Se obtiene el negocio_id a partir del servicio para mantener el
    // aislamiento multi-tenant (negocio_id siempre debe venir de la BD,
    // nunca confiar en un valor enviado por el cliente).
    const { data: servicio, error: servicioError } = await supabaseAdmin
      .from("servicios")
      .select("id, negocio_id")
      .eq("id", servicio_id)
      .single();

    if (servicioError || !servicio) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 },
      );
    }

    const { data: negocio } = await supabaseAdmin
      .from("negocios")
      .select("id, estado_suscripcion")
      .eq("id", servicio.negocio_id)
      .single();
    if (!negocio || negocio.estado_suscripcion === "inactiva") {
      return NextResponse.json(
        { error: "Este negocio no acepta reservas por ahora." },
        { status: 409 },
      );
    }

    // Mismas reglas que el perfil público: horario real, cupos y sin duplicados.
    const emailNorm = email_cliente.trim().toLowerCase();
    const [{ data: reservas }, { data: bloqueos }, { data: horariosDb }] =
      await Promise.all([
        supabaseAdmin.from("reservas").select("*").eq("negocio_id", negocio.id),
        supabaseAdmin
          .from("bloqueos_excepcion")
          .select("*")
          .eq("negocio_id", negocio.id),
        supabaseAdmin.from("horarios").select("*").eq("negocio_id", negocio.id),
      ]);

    if (
      (reservas ?? []).some(
        (r) =>
          r.estado !== "cancelada" &&
          r.servicio_id === servicio_id &&
          r.email_cliente.trim().toLowerCase() === emailNorm,
      )
    ) {
      return NextResponse.json(
        { error: "Este correo ya tiene una reserva para este servicio." },
        { status: 409 },
      );
    }

    const slot = construirHorarios(
      (horariosDb ?? []).filter((h) => h.servicio_id === servicio_id),
      reservas ?? [],
      bloqueos ?? [],
      true,
    ).find(
      (h) => new Date(h.fechaHora).getTime() === new Date(fecha_hora).getTime(),
    );
    if (!slot || slot.cuposDisponibles < 1) {
      return NextResponse.json(
        { error: "El horario no está disponible." },
        { status: 409 },
      );
    }

    // Acción 1: crear la reserva en estado 'pendiente'.
    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from("reservas")
      .insert({
        servicio_id,
        negocio_id: servicio.negocio_id,
        fecha_hora: slot.fechaHora,
        email_cliente: emailNorm,
        cupos: 1,
        token_gestion: crypto.randomUUID(),
        estado: "pendiente",
      })
      .select("id")
      .single();

    if (reservaError || !reserva) {
      throw reservaError ?? new Error("No se pudo crear la reserva.");
    }

    // Acción 2: respuesta de la "pasarela de pagos". Mientras no haya una
    // integración real (ej. Tilopay), se redirige a una pantalla de pago
    // simulada dentro de la misma app (ver /app/pago-simulado).
    const checkoutMock = {
      token: `mock_tk_${reserva.id}`,
      checkout_url: `/pago-simulado/${reserva.id}`,
      reserva_id: reserva.id,
    };

    return NextResponse.json(checkoutMock, { status: 200 });
  } catch (error) {
    console.error("Error en /api/checkout:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
