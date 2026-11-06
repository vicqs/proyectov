import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearReservaPublica } from "@/lib/data/public";
import { DataError } from "@/lib/data/db";
import { revalidarAdmin } from "@/lib/admin/util";
import { revalidarEmpresa } from "@/lib/empresa";
import { flagActiva, obtenerConfiguracion } from "@/lib/plataforma";
import { crearSesionCheckoutReserva, obtenerModoPasarelaReservas } from "@/lib/tilopay";

const checkoutSchema = z.object({
  servicio_id: z.string().uuid(),
  email_cliente: z.string().email().max(254),
  nombre_cliente: z.string().trim().min(1).max(100).optional(),
  cupos: z.number().int().min(1).max(50).optional(),
  fecha_hora: z.string().datetime({ offset: true }),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 });
    }
    const config = await obtenerConfiguracion();
    if (config.modo_mantenimiento || !flagActiva(config, "reservas_publicas")) {
      return NextResponse.json(
        { error: "Las reservas están temporalmente en pausa. Intenta más tarde." },
        { status: 503 },
      );
    }
    const modoPasarela = obtenerModoPasarelaReservas(config);
    if (modoPasarela === "deshabilitado") {
      return NextResponse.json({ error: "La pasarela de pagos todavía no está habilitada." }, { status: 503 });
    }
    const reserva = await crearReservaPublica({
      p_service_id: parsed.data.servicio_id,
      p_client_email: parsed.data.email_cliente.trim().toLowerCase(),
      p_client_name: parsed.data.nombre_cliente ?? null,
      p_quantity: parsed.data.cupos ?? 1,
      p_starts_at: parsed.data.fecha_hora,
    });
    const sesion = await crearSesionCheckoutReserva(reserva, modoPasarela);
    revalidarEmpresa(reserva.negocio_slug);
    revalidarAdmin();
    return NextResponse.json({
      proveedor: sesion.proveedor,
      token: sesion.token,
      checkout_url: sesion.checkoutUrl,
      reserva_id: sesion.reservaId,
    });
  } catch (error) {
    console.error("[checkout]", error);
    if (error instanceof SyntaxError) return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    if (error instanceof DataError && ["P0001", "P0002", "23505", "23514", "22023"].includes(error.code ?? "")) {
      return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : 409 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
