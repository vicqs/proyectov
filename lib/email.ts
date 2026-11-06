import { Resend } from "resend";
import ReciboTurista, {
  type ReciboTuristaProps,
} from "../emails/ReciboTurista";
import AlertaPyme, { type AlertaPymeProps } from "../emails/AlertaPyme";
import { isPlaceholder } from "./supabase/config";
import type { DatabaseClient } from "./data/db";
import type { CodigoMoneda } from "./monedas";
import { obtenerConfiguracion } from "./plataforma";
import { registrarSistema } from "./registro";

/** Sustituye {{negocio}} y {{servicio}} en textos configurables. */
export function aplicarVariables(
  texto: string,
  vars: { negocio: string; servicio: string },
): string {
  return texto
    .replaceAll("{{negocio}}", vars.negocio)
    .replaceAll("{{servicio}}", vars.servicio);
}

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom =
  process.env.EMAIL_FROM ?? "vuki <notificaciones@localhost.dev>";

const resend = resendApiKey && !isPlaceholder(resendApiKey) ? new Resend(resendApiKey) : null;

export interface DatosConfirmacionReserva {
  negocioNombre: string;
  negocioLogoUrl?: string | null;
  negocioEmail: string; // correo del dueño de la pyme, destino de la alerta
  servicioNombre: string;
  fechaHora: string; // ISO string
  montoUsd: number;
  moneda?: CodigoMoneda;
  trxId: string;
  emailCliente: string;
  /** Venta directa de ítems (sin horario): ajusta etiquetas y asuntos. */
  esItem?: boolean;
  cantidad?: number;
  /** Enlace privado para que el turista vea o cancele su reserva. */
  gestionUrl?: string;
}

export interface ResultadoEnvioCorreos {
  reciboTuristaOk: boolean;
  alertaPymeOk: boolean;
}

/**
 * Envía el recibo al turista y la alerta de nueva venta a la pyme en
 * paralelo. Diseñada para NUNCA lanzar (throw): cualquier error de envío
 * se captura y se reporta en el resultado, para que quien la invoque
 * (ej. el webhook de pago) pueda seguir respondiendo 200 al banco sin
 * que un fallo de Resend rompa el flujo de negocio.
 */
export async function enviarCorreosConfirmacion(
  datos: DatosConfirmacionReserva,
  client?: DatabaseClient,
): Promise<ResultadoEnvioCorreos> {
  if (!resend || !process.env.EMAIL_FROM || isPlaceholder(emailFrom)) {
    console.error("[correo] RESEND_API_KEY y EMAIL_FROM no estan configuradas; no se enviaron los correos.");
    await registrarSistema({
      tipo: "correo", origen: "confirmacion_reserva", estado: "error", detalle: "Proveedor de correo no configurado",
    }, client);
    return { reciboTuristaOk: false, alertaPymeOk: false };
  }
  let config;
  try {
    config = await obtenerConfiguracion();
  } catch (error) {
    console.error("[correo] No se pudieron cargar las plantillas.", error);
    await registrarSistema({
      tipo: "correo", origen: "confirmacion_reserva", estado: "error", detalle: "Error al consultar las plantillas",
    }, client);
    return { reciboTuristaOk: false, alertaPymeOk: false };
  }
  const vars = { negocio: datos.negocioNombre, servicio: datos.servicioNombre };
  const pRecibo = config.plantillas_correo.recibo ?? {};
  const pAlerta = config.plantillas_correo.alerta ?? {};

  const reciboProps: ReciboTuristaProps = {
    negocioNombre: datos.negocioNombre,
    negocioLogoUrl: datos.negocioLogoUrl,
    servicioNombre: datos.servicioNombre,
    fechaHora: datos.fechaHora,
    montoUsd: datos.montoUsd,
    moneda: datos.moneda,
    trxId: datos.trxId,
    emailCliente: datos.emailCliente,
    gestionUrl: datos.gestionUrl,
    esItem: datos.esItem,
    cantidad: datos.cantidad,
    encabezado: pRecibo.encabezado
      ? aplicarVariables(pRecibo.encabezado, vars)
      : undefined,
    pie: pRecibo.pie ? aplicarVariables(pRecibo.pie, vars) : undefined,
  };

  const alertaProps: AlertaPymeProps = {
    negocioNombre: datos.negocioNombre,
    servicioNombre: datos.servicioNombre,
    fechaHora: datos.fechaHora,
    emailCliente: datos.emailCliente,
    montoUsd: datos.montoUsd,
    moneda: datos.moneda,
    esItem: datos.esItem,
    cantidad: datos.cantidad,
    encabezado: pAlerta.encabezado
      ? aplicarVariables(pAlerta.encabezado, vars)
      : undefined,
    pie: pAlerta.pie ? aplicarVariables(pAlerta.pie, vars) : undefined,
  };

  const asuntoRecibo = pRecibo.asunto
    ? aplicarVariables(pRecibo.asunto, vars)
    : `${datos.esItem ? "Tu compra" : "Tu reserva"} en ${datos.negocioNombre} (#${datos.trxId})`;
  const asuntoAlerta = pAlerta.asunto
    ? aplicarVariables(pAlerta.asunto, vars)
    : `${datos.esItem ? "Nueva venta" : "Nueva reserva confirmada"}: ${datos.servicioNombre} (#${datos.trxId})`;

  const [resRecibo, resAlerta] = await Promise.allSettled([
    resend.emails.send({
      from: emailFrom,
      to: datos.emailCliente,
      subject: asuntoRecibo,
      react: ReciboTurista(reciboProps),
    }),
    resend.emails.send({
      from: emailFrom,
      to: datos.negocioEmail,
      subject: asuntoAlerta,
      react: AlertaPyme(alertaProps),
    }),
  ]);

  const reciboOk =
    resRecibo.status === "fulfilled" && !resRecibo.value.error;
  const alertaOk =
    resAlerta.status === "fulfilled" && !resAlerta.value.error;

  if (!reciboOk) {
    const err =
      resRecibo.status === "rejected"
        ? resRecibo.reason
        : resRecibo.value.error;
    console.error("[correo] Error al enviar recibo al turista:", err);
  }
  if (!alertaOk) {
    const err =
      resAlerta.status === "rejected"
        ? resAlerta.reason
        : resAlerta.value.error;
    console.error("[correo] Error al enviar alerta a la pyme:", err);
  }

  await registrarSistema({
    tipo: "correo",
    origen: "confirmacion_reserva",
    estado: reciboOk && alertaOk ? "ok" : "error",
    detalle: `recibo=${reciboOk ? "ok" : "fallo"}, alerta=${alertaOk ? "ok" : "fallo"} (${datos.trxId})`,
  }, client);

  return {
    reciboTuristaOk: reciboOk,
    alertaPymeOk: alertaOk,
  };
}

/** Correo de texto plano (comunicados). Nunca lanza; devuelve si se envió. */
export async function enviarCorreoTexto(datos: {
  to: string;
  asunto: string;
  texto: string;
}, client?: DatabaseClient): Promise<boolean> {
  if (!resend || !process.env.EMAIL_FROM || isPlaceholder(emailFrom)) {
    console.error("[correo] Proveedor de correo no configurado; comunicado no enviado.");
    await registrarSistema({
      tipo: "correo", origen: "comunicado", estado: "error", detalle: "Proveedor de correo no configurado",
    }, client);
    return false;
  }
  try {
    const r = await resend.emails.send({
      from: emailFrom,
      to: datos.to,
      subject: datos.asunto,
      text: datos.texto,
    });
    if (r.error) console.error("[correo] El proveedor rechazo el comunicado.", r.error);
    return !r.error;
  } catch (error) {
    console.error("[correo] No se pudo enviar el comunicado.", error);
    return false;
  }
}
