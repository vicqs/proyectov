"use server";

import { z } from "zod";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, insertar, leer, leerUno } from "../../lib/admin/db";
import { indexar, monedaReserva, montoReserva } from "../../lib/admin/datos";
import { moneda } from "../../lib/admin/formato";
import { campo, esUuid, revalidarAdmin } from "../../lib/admin/util";
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
    if (!esUuid(id)) return { error: "Identificador de reserva inválido." };
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
      ok:
        reserva.estado === "pagada" && esTrxPasarela(reserva.trx_id)
          ? "Reserva cancelada y reembolso pendiente registrado automáticamente."
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
    if (!esUuid(id)) return { error: "Identificador de reserva inválido." };
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
    const [listaServicios, negocio] = await Promise.all([
      leer("servicios", { eq: { negocio_id: reserva.negocio_id } }),
      leerUno("negocios", { eq: { id: reserva.negocio_id } }),
    ]);
    const servicios = indexar(listaServicios);
    const idxNeg = negocio ? new Map([[negocio.id, negocio]]) : undefined;
    const codMoneda = monedaReserva(reserva, servicios, idxNeg);
    const maximo = montoReserva(reserva, servicios, idxNeg);
    const monto = z.coerce
      .number()
      .positive("El monto debe ser mayor que 0.")
      .safeParse(campo(datos, "monto_usd") || String(maximo));
    if (!monto.success) return { error: monto.error.issues[0].message };
    if (monto.data > maximo + 0.001) {
      return {
        error: `El reembolso no puede superar ${moneda(maximo, codMoneda)}.`,
      };
    }
    const motivoParsed = z
      .string()
      .trim()
      .min(3, "Indica el motivo del reembolso.")
      .max(500, "El motivo es demasiado largo.")
      .safeParse(campo(datos, "motivo"));
    if (!motivoParsed.success) return { error: motivoParsed.error.issues[0].message };
    const motivo = motivoParsed.data;

    const existente = await leerUno("reembolsos", {
      eq: { reserva_id: id },
    }).catch(() => null);
    if (existente?.estado === "completado") {
      return { error: "Esta reserva ya tiene un reembolso completado." };
    }

    let reembolsoId = existente?.id;
    if (existente) {
      await actualizar(
        "reembolsos",
        {
          monto_usd: monto.data,
          currency: codMoneda,
          motivo,
          creado_por: admin.email,
        },
        { id: existente.id },
      );
    } else {
      const creado = await insertar("reembolsos", {
        reserva_id: id,
        negocio_id: reserva.negocio_id,
        monto_usd: monto.data,
        currency: codMoneda,
        motivo,
        estado: "pendiente",
        creado_por: admin.email,
      });
      reembolsoId = creado.id;
    }

    if (reserva.estado === "pagada") {
      await actualizar("reservas", { estado: "cancelada" }, { id });
    }
    await registrarAuditoria(admin, {
      accion: "reembolso.registrar",
      entidad: "reembolso",
      entidad_id: reembolsoId ?? id,
      negocio_id: reserva.negocio_id,
      detalle: {
        reserva_id: id,
        monto_usd: monto.data,
        currency: codMoneda,
        motivo,
      },
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
  return accionAdmin("finanzas", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de reembolso inválido." };
    const reembolso = await leerUno("reembolsos", { eq: { id } });
    if (!reembolso) return { error: "Reembolso no encontrado." };
    if (reembolso.estado === "completado")
      return { error: "Ya estaba completado." };
    await actualizar("reembolsos", { estado: "completado" }, { id });
    const negocio = await leerUno("negocios", {
      eq: { id: reembolso.negocio_id },
    });
    await registrarAuditoria(admin, {
      accion: "reembolso.completar",
      entidad: "reembolso",
      entidad_id: id,
      negocio_id: reembolso.negocio_id,
    });
    revalidarAdmin();
    if (negocio) revalidarEmpresa(negocio.slug);
    return { ok: "Reembolso marcado como completado." };
  });
}
