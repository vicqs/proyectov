"use server";

import { z } from "zod";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, insertar, leer, leerUno } from "../../lib/admin/db";
import { indexar, montoReserva } from "../../lib/admin/datos";
import { campo, revalidarAdmin } from "../../lib/admin/util";
import { revalidarEmpresa } from "../../lib/empresa";
import {
  admiteReembolsoPasarela,
  esPagoManual,
  esTrxPasarela,
} from "../../lib/pagos";

export async function cancelarReservaAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("reservas", async (admin) => {
    const reserva = await leerUno("reservas", { eq: { id } });
    if (!reserva) return { error: "Reserva no encontrada." };
    if (reserva.estado === "cancelada")
      return { error: "La reserva ya está cancelada." };
    await actualizar("reservas", { estado: "cancelada" }, { id });
    const negocio = await leerUno("negocios", {
      eq: { id: reserva.negocio_id },
    });
    await registrarAuditoria(admin, {
      accion: "reserva.cancelar",
      entidad: "reserva",
      entidad_id: id,
      negocio_id: reserva.negocio_id,
      detalle: { estado_anterior: reserva.estado },
    });
    revalidarAdmin();
    if (negocio) revalidarEmpresa(negocio.slug);
    return {
      ok: esTrxPasarela(reserva.trx_id)
        ? "Reserva cancelada. Registra el reembolso si el cliente ya pagó."
        : "Reserva cancelada.",
    };
  });
}

export async function registrarReembolsoAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("reservas", async (admin) => {
    const reserva = await leerUno("reservas", { eq: { id } });
    if (!reserva) return { error: "Reserva no encontrada." };
    if (esPagoManual(reserva.trx_id)) {
      return {
        error:
          "Las reservas con pago manual se gestionan directamente con el comercio, fuera de la pasarela.",
      };
    }
    if (!admiteReembolsoPasarela(reserva)) {
      return { error: "Solo se reembolsan reservas pagadas por pasarela." };
    }
    const servicios = indexar(
      await leer("servicios", { eq: { negocio_id: reserva.negocio_id } }),
    );
    const maximo = montoReserva(reserva, servicios);
    const monto = z.coerce
      .number()
      .positive("El monto debe ser mayor que 0.")
      .safeParse(campo(datos, "monto_usd") || String(maximo));
    if (!monto.success) return { error: monto.error.issues[0].message };
    if (monto.data > maximo + 0.001) {
      return {
        error: `El reembolso no puede superar ${maximo.toFixed(2)} USD.`,
      };
    }
    const motivo = campo(datos, "motivo");
    if (motivo.length < 3) return { error: "Indica el motivo del reembolso." };

    const existentes = await leer("reembolsos", {
      eq: { reserva_id: id },
    }).catch(() => []);
    if (existentes.length > 0)
      return { error: "Esta reserva ya tiene un reembolso registrado." };

    const reembolso = await insertar("reembolsos", {
      reserva_id: id,
      negocio_id: reserva.negocio_id,
      monto_usd: monto.data,
      motivo,
      estado: "pendiente",
      creado_por: admin.email,
    });
    if (reserva.estado === "pagada") {
      await actualizar("reservas", { estado: "cancelada" }, { id });
    }
    const negocio = await leerUno("negocios", {
      eq: { id: reserva.negocio_id },
    });
    await registrarAuditoria(admin, {
      accion: "reembolso.registrar",
      entidad: "reembolso",
      entidad_id: reembolso.id,
      negocio_id: reserva.negocio_id,
      detalle: { reserva_id: id, monto_usd: monto.data, motivo },
    });
    revalidarAdmin();
    if (negocio) revalidarEmpresa(negocio.slug);
    return {
      ok: "Reembolso registrado como pendiente; la reserva quedó cancelada.",
    };
  });
}

export async function completarReembolsoAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("reservas", async (admin) => {
    const reembolso = await leerUno("reembolsos", { eq: { id } });
    if (!reembolso) return { error: "Reembolso no encontrado." };
    if (reembolso.estado === "completado")
      return { error: "Ya estaba completado." };
    await actualizar("reembolsos", { estado: "completado" }, { id });
    await registrarAuditoria(admin, {
      accion: "reembolso.completar",
      entidad: "reembolso",
      entidad_id: id,
      negocio_id: reembolso.negocio_id,
    });
    revalidarAdmin();
    return { ok: "Reembolso marcado como completado." };
  });
}
