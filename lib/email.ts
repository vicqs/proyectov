import { Resend } from "resend";
import ReciboTurista, {
  type ReciboTuristaProps,
} from "../emails/ReciboTurista";
import AlertaPyme, { type AlertaPymeProps } from "../emails/AlertaPyme";
import { isMockMode } from "./mock/client";

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
    return { reciboTuristaOk: true, alertaPymeOk: true };
  }

  const reciboProps: ReciboTuristaProps = {
    negocioNombre: datos.negocioNombre,
    negocioLogoUrl: datos.negocioLogoUrl,
    servicioNombre: datos.servicioNombre,
    fechaHora: datos.fechaHora,
    montoUsd: datos.montoUsd,
    trxId: datos.trxId,
    emailCliente: datos.emailCliente,
  };

  const alertaProps: AlertaPymeProps = {
    negocioNombre: datos.negocioNombre,
    servicioNombre: datos.servicioNombre,
    fechaHora: datos.fechaHora,
    emailCliente: datos.emailCliente,
    montoUsd: datos.montoUsd,
  };

  const [reciboResult, alertaResult] = await Promise.allSettled([
    resend!.emails.send({
      from: emailFrom,
      to: datos.emailCliente,
      subject: `Tu reserva con ${datos.negocioNombre} fue confirmada`,
      react: ReciboTurista(reciboProps),
    }),
    resend!.emails.send({
      from: emailFrom,
      to: datos.negocioEmail,
      subject: `Nueva reserva pagada: ${datos.servicioNombre}`,
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

  return {
    reciboTuristaOk:
      reciboResult.status === "fulfilled" && !reciboResult.value.error,
    alertaPymeOk:
      alertaResult.status === "fulfilled" && !alertaResult.value.error,
  };
}
