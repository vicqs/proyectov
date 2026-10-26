import LegalPage from "../../components/LegalPage";
import { obtenerConfiguracion } from "../../lib/plataforma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Términos y Condiciones",
};

/**
 * Página estática de Términos y Condiciones. Contenido genérico requerido
 * por las pasarelas de pago (Tilopay, Stripe) y bancos para habilitar el
 * cobro en línea. Debe ser revisado por un abogado antes de producción.
 */
export default async function TerminosPage() {
  const { terminos_texto } = await obtenerConfiguracion();
  if (terminos_texto) {
    return (
      <LegalPage tipo="terminos">
        <div className="whitespace-pre-wrap">{terminos_texto}</div>
      </LegalPage>
    );
  }

  return (
    <LegalPage tipo="terminos" fechaActualizacion="27 de agosto de 2026">
      <section className="space-y-8 sm:space-y-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            1. Aceptación de los términos
          </h2>
          <p>
            Al acceder y utilizar la plataforma vuki ("la Plataforma"), tanto
            como negocio afiliado ("la Pyme") o como turista que realiza una
            reserva ("el Usuario"), aceptas quedar vinculado por estos Términos
            y Condiciones.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            2. Descripción del servicio
          </h2>
          <p>
            vuki es un intermediario tecnológico que permite a negocios
            turísticos publicar servicios, gestionar su agenda y recibir pagos
            en línea de sus clientes. La Plataforma no presta directamente los
            servicios turísticos ofrecidos por las pymes.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            3. Pagos y comisiones
          </h2>
          <p>
            Los pagos realizados por los Usuarios se procesan a través de
            pasarelas de pago de terceros. vuki retiene una comisión de
            intermediación sobre cada transacción exitosa, detallada en el panel
            de administración de cada Pyme.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            4. Suscripción del servicio
          </h2>
          <p>
            El uso del panel de empresa por parte de las Pymes está sujeto al
            pago de una suscripción mensual, la cual se renueva automáticamente
            salvo cancelación expresa por parte del titular de la cuenta.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            5. Cancelaciones y reembolsos
          </h2>
          <p>
            Las políticas de cancelación y reembolso de cada servicio turístico
            son definidas por la Pyme correspondiente. vuki no se hace
            responsable por disputas entre el Usuario y la Pyme derivadas de la
            prestación del servicio turístico.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            6. Limitación de responsabilidad
          </h2>
          <p>
            vuki no garantiza la disponibilidad ininterrumpida de la Plataforma
            y no será responsable por daños indirectos derivados del uso o la
            imposibilidad de uso del servicio.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">7. Contacto</h2>
          <p>
            Para consultas sobre estos términos, contáctanos a través del correo
            de soporte indicado en el pie de la Plataforma.
          </p>
        </div>
      </section>
    </LegalPage>
  );
}
