"use server";

import { z } from "zod";
import type { FinancialTransaction } from "@/types/database";
import { obtenerEmpresaOperativa, revalidarEmpresa } from "@/lib/empresa";
import { actualizar, leerUno } from "@/lib/data/server";
import { DataError } from "@/lib/data/db";
import { reservaATransaccionFinanciera } from "@/lib/finanzas";
import { registrarEventoNegocio } from "@/lib/admin/auditoria";
import { revalidarAdmin } from "@/lib/admin/util";

export type ComprobanteInput = Pick<
  FinancialTransaction,
  "id" | "voucher_type" | "client_name" | "client_id_type" | "client_tax_id" | "invoice_status" | "invoice_consecutive"
>;
export type ComprobanteResultado = { transaccion: FinancialTransaction } | { error: string };

const schema = z.object({
  id: z.string().uuid(),
  voucher_type: z.enum(["TE", "FE"]),
  client_name: z.string().trim().max(100).nullable(),
  client_id_type: z.enum(["fisica", "juridica", "dimex", "nite", "extranjero"]).nullable(),
  client_tax_id: z.string().trim().max(32).nullable(),
  invoice_status: z.enum(["pending", "issued"]),
  invoice_consecutive: z.string().regex(/^\d{20}$/, "El consecutivo debe tener exactamente 20 dígitos.").nullable(),
}).superRefine((value, context) => {
  if (value.voucher_type === "FE" && (!value.client_name || !value.client_id_type || !value.client_tax_id)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "La FE requiere nombre y datos fiscales del receptor." });
  }
});

/** Registra comprobantes externos o de demostración; no emite documentos ante Hacienda. */
export async function guardarComprobanteAction(slug: string, input: ComprobanteInput): Promise<ComprobanteResultado> {
  const contexto = await obtenerEmpresaOperativa(slug);
  if ("error" in contexto) return { error: contexto.error };
  const { negocio, user } = contexto;
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos fiscales inválidos." };
  try {
    const filtro = { id: parsed.data.id, negocio_id: negocio.id };
    const { id, ...values } = parsed.data;
    const payload = {
      ...values,
      invoice_consecutive:
        values.invoice_status === "issued" ? values.invoice_consecutive : null,
    };
    const actual = await leerUno("transacciones_financieras", { eq: filtro });
    let saved: FinancialTransaction | null = null;
    if (actual) {
      await actualizar("transacciones_financieras", payload, filtro);
      saved = await leerUno("transacciones_financieras", { eq: filtro });
    } else {
      const reserva = await leerUno("reservas", { eq: filtro });
      if (!reserva) {
        throw new DataError("No se encontró la transacción de este negocio.");
      }
      const actualizacionReserva = {
        voucher_type: payload.voucher_type,
        nombre_cliente: payload.client_name,
        client_id_type: payload.client_id_type,
        client_tax_id: payload.client_tax_id,
        invoice_status: payload.invoice_status,
        invoice_consecutive: payload.invoice_consecutive,
      };
      await actualizar("reservas", actualizacionReserva, filtro);
      saved =
        (await leerUno("transacciones_financieras", {
          eq: { reserva_id: id, negocio_id: negocio.id },
        })) ??
        reservaATransaccionFinanciera(
          { ...reserva, ...actualizacionReserva },
          await leerUno("servicios", {
            eq: { id: reserva.servicio_id, negocio_id: negocio.id },
          }),
        );
    }
    if (!saved) throw new DataError("No se pudo verificar el comprobante guardado.");
    await registrarEventoNegocio({ id: user.id, email: user.email ?? "" }, {
      accion: "factura.actualizar", entidad: "transaccion", entidad_id: id, negocio_id: negocio.id,
      detalle: { voucher_type: saved.voucher_type, invoice_status: saved.invoice_status },
    });
    revalidarEmpresa(negocio.slug);
    revalidarAdmin();
    return { transaccion: saved };
  } catch (error) {
    console.error("[facturación]", error);
    return { error: error instanceof DataError ? error.message : "No se pudo guardar el comprobante." };
  }
}
