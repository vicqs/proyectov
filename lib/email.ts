import { Resend } from "resend";
import ReciboTurista, {
  type ReciboTuristaProps,
} from "../emails/ReciboTurista";
import AlertaPyme, { type AlertaPymeProps } from "../emails/AlertaPyme";
import { isMockMode } from "./mock/client";
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
  process.env.EMAIL_FROM ?? "Turismo Link <notificaciones@localhost.dev>";

if (!isMockMode && (!resendApiKey || !process.env.EMAIL_FROM)) {
  throw new Error(
    "Faltan variables de entorno de correo: RESEND_API_KEY y EMAIL_FROM son requeridas.",
  );
}

const resend = isMockMode ? null : new Resend(resendApiKey);

export interface DatosConfirmacionReserva {
  negocioNombre: string;
  negocioLogoUrl?: string | null;
  negocioEmail: string; // correo del dueño de la pyme, destino de la alerta
  servicioNombre: string;
  fechaHora: string; // ISO string
  montoUsd: number;
  trxId: string;
  emailCliente: string;
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
): Promise<ResultadoEnvioCorreos> {
  if (isMockMode) {
    console.info(
      `✉ [modo simulado] Se habrían enviado el recibo a "${datos.emailCliente}" y la alerta a "${datos.negocioEmail}" para la reserva ${datos.trxId}.`,
    );
    await registrarSistema({
      tipo: "correo",
      origen: "confirmacion_reserva",
      estado: "ok",
      detalle: `Simulado para la reserva ${datos.trxId}`,
    });
    return { reciboTuristaOk: true, alertaPymeOk: true };
  }

  const config = await obtenerConfiguracion();
  const vars = { negocio: datos.negocioNombre, servicio: datos.servicioNombre };
  const pRecibo = config.plantillas_correo.recibo ?? {};
  const pAlerta = config.plantillas_correo.alerta ?? {};

  const reciboProps: ReciboTuristaProps = {
    negocioNombre: datos.negocioNombre,
    negocioLogoUrl: datos.negocioLogoUrl,
    servicioNombre: datos.servicioNombre,
    fechaHora: datos.fechaHora,
    montoUsd: datos.montoUsd,
    trxId: datos.trxId,
    emailCliente: datos.emailCliente,
    gestionUrl: datos.gestionUrl,
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
    encabezado: pAlerta.encabezado
      ? aplicarVariables(pAlerta.encabezado, vars)
      : undefined,
    pie: pAlerta.pie ? aplicarVariables(pAlerta.pie, vars) : undefined,
  };

  const [reciboResult, alertaResult] = await Promise.allSettled([
    resend!.emails.send({
      from: emailFrom,
      to: datos.emailCliente,
      subject: pRecibo.asunto
        ? aplicarVariables(pRecibo.asunto, vars)
        : `Tu reserva con ${datos.negocioNombre} fue confirmada`,
      react: ReciboTurista(reciboProps),
    }),
    resend!.emails.send({
      from: emailFrom,
      to: datos.negocioEmail,
      subject: pAlerta.asunto
        ? aplicarVariables(pAlerta.asunto, vars)
        : `Nueva reserva pagada: ${datos.servicioNombre}`,
      react: AlertaPyme(alertaProps),
    }),
  ]);

  if (reciboResult.status === "rejected") {
    console.error("Error al enviar el recibo al turista:", reciboResult.reason);
  } else if (reciboResult.value.error) {
    console.error(
      "Resend rechazó el recibo al turista:",
      reciboResult.value.error,
    );
  }

  if (alertaResult.status === "rejected") {
    console.error("Error al enviar la alerta a la pyme:", alertaResult.reason);
  } else if (alertaResult.value.error) {
    console.error(
      "Resend rechazó la alerta a la pyme:",
      alertaResult.value.error,
    );
  }

  const reciboOk =
    reciboResult.status === "fulfilled" && !reciboResult.value.error;
  const alertaOk =
    alertaResult.status === "fulfilled" && !alertaResult.value.error;
  await registrarSistema({
    tipo: "correo",
    origen: "confirmacion_reserva",
    estado: reciboOk && alertaOk ? "ok" : "error",
    detalle: `recibo=${reciboOk ? "ok" : "fallo"}, alerta=${alertaOk ? "ok" : "fallo"} (${datos.trxId})`,
  });

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
}): Promise<boolean> {
  if (isMockMode) {
    console.info(
      `✉ [modo simulado] Comunicado a "${datos.to}": ${datos.asunto}`,
    );
    return true;
  }
  try {
    const r = await resend!.emails.send({
      from: emailFrom,
      to: datos.to,
      subject: datos.asunto,
      text: datos.texto,
    });
    return !r.error;
  } catch {
    return false;
  }
}
