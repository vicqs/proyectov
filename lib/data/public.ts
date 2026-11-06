import "server-only";

import { cache } from "react";
import type { Database, DetalleReservaPublica, DisponibilidadPublicaDb, Servicio } from "@/types/database";
import type { HorarioPublico } from "../tipos-publicos";
import { etiquetaHorario } from "../horarios";
import { createSupabaseServerClient } from "../supabase/server";
import { DataError } from "./db";

type Response<T> = { data: T | null; error: { message: string; code?: string } | null };

function unwrap<T>(result: Response<T>): T {
  if (result.error) throw new DataError(result.error.message, result.error.code);
  if (result.data === null) throw new DataError("Supabase no devolvio una respuesta valida.");
  return result.data;
}

function first<T>(result: T[]): T {
  const row = result[0];
  if (!row) throw new DataError("La operacion no devolvio el registro esperado.");
  return row;
}

async function pages<T>(read: (from: number, to: number) => Promise<Response<T[]>>): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 1000) {
    const batch = unwrap(await read(from, from + 999));
    result.push(...batch);
    if (batch.length < 1000) return result;
  }
}

export const obtenerNegocioPublico = cache(async (slug: string) => {
  const client = await createSupabaseServerClient();
  return unwrap(await client.rpc("get_public_business", { p_slug: slug.toLowerCase() }))[0] ?? null;
});

export const listarServiciosPublicos = cache(async (businessId: string): Promise<Servicio[]> => {
  const client = await createSupabaseServerClient();
  return pages(async (from, to) =>
    await client.rpc("get_public_services", { p_business_id: businessId }).range(from, to),
  );
});

export const listarHorariosPublicos = cache(async (businessId: string): Promise<HorarioPublico[]> => {
  const client = await createSupabaseServerClient();
  const slots: DisponibilidadPublicaDb[] = await pages(async (from, to) =>
    await client.rpc("get_public_availability", { p_business_id: businessId }).range(from, to),
  );
  return slots.map((slot) => {
    const fechaHora = new Date(slot.fecha_hora).toISOString();
    return {
      id: slot.id, servicioId: slot.servicio_id, fechaHora, label: etiquetaHorario(fechaHora),
      cuposTotales: slot.cupos_totales,
      cuposDisponibles: Math.max(0, slot.cupos_totales - slot.cupos_ocupados),
    };
  });
});

export const obtenerReservaPorToken = cache(async (token: string): Promise<DetalleReservaPublica | null> => {
  const client = await createSupabaseServerClient();
  return unwrap(await client.rpc("get_booking_by_token", { p_token: token }))[0] ?? null;
});

type BookingArgs = Database["public"]["Functions"]["create_public_booking"]["Args"];

export async function crearReservaPublica(args: BookingArgs): Promise<DetalleReservaPublica> {
  const client = await createSupabaseServerClient();
  return first(unwrap(await client.rpc("create_public_booking", args)));
}

export async function reservarConPagoSimulado(args: BookingArgs): Promise<DetalleReservaPublica> {
  const client = await createSupabaseServerClient();
  return first(unwrap(await client.rpc("create_simulated_booking", args)));
}

export async function confirmarReservaSimulada(token: string): Promise<DetalleReservaPublica> {
  const client = await createSupabaseServerClient();
  return first(unwrap(await client.rpc("complete_simulated_booking", { p_token: token })));
}

export async function cancelarReservaPorToken(token: string): Promise<DetalleReservaPublica> {
  const client = await createSupabaseServerClient();
  return first(unwrap(await client.rpc("cancel_public_booking", { p_token: token })));
}

export async function cambiarSuscripcionSimulada(businessId: string, active: boolean) {
  const client = await createSupabaseServerClient();
  return first(unwrap(await client.rpc("set_simulated_subscription", { p_business_id: businessId, p_active: active })));
}

export async function registrarReportePublico(
  args: Database["public"]["Functions"]["register_profile_report"]["Args"],
) {
  const client = await createSupabaseServerClient();
  return unwrap(await client.rpc("register_profile_report", args));
}
