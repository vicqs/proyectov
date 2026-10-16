import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { Reserva, Servicio } from "../../../types/database";
import FinanzasView from "../../../components/admin/FinanzasView";

/** Reserva con el precio del servicio embebido, usado solo en este dashboard. */
interface ReservaConMonto extends Reserva {
  servicio: Pick<Servicio, "nombre" | "precio_usd"> | null;
}

/**
 * Dashboard Financiero: KPIs calculados sobre las reservas "pagada" del
 * negocio del usuario autenticado. Server Component, respeta RLS.
 */
export default async function FinanzasPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: negocio } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  let pagos: ReservaConMonto[] = [];
  let reembolsos: ReservaConMonto[] = [];
  let errorCarga: string | null = null;

  if (negocio) {
    const { data, error } = await supabase
      .from("reservas")
      .select("*, servicio:servicios(nombre, precio_usd)")
      .eq("negocio_id", negocio.id)
      .in("estado", ["pagada", "cancelada"])
      .order("fecha_hora", { ascending: false });

    if (error) {
      errorCarga =
        "No se pudieron cargar los datos financieros. Intenta recargar la página.";
    } else {
      const filas = (data ?? []) as unknown as ReservaConMonto[];
      pagos = filas.filter((r) => r.estado === "pagada");
      // Cancelada con transacción = el cliente pagó y hay que devolverle el dinero.
      reembolsos = filas.filter((r) => r.estado === "cancelada" && r.trx_id);
    }
  } else {
    errorCarga = "No se encontró el negocio asociado a este usuario.";
  }

  const montoDe = (p: ReservaConMonto) =>
    p.monto_usd ?? (p.servicio?.precio_usd ?? 0) * (p.cupos ?? 1);

  return (
    <FinanzasView
      error={errorCarga}
      reembolsosPendientes={{
        cantidad: reembolsos.length,
        monto: reembolsos.reduce((acc, r) => acc + montoDe(r), 0),
      }}
      pagos={pagos.map((p) => ({
        id: p.id,
        fechaIso: p.fecha_hora,
        servicio: p.servicio?.nombre ?? "—",
        cliente: p.email_cliente,
        monto: montoDe(p),
      }))}
    />
  );
}
