import LegalPage from "../../components/LegalPage";
import { obtenerConfiguracion } from "../../lib/plataforma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Política de Privacidad",
};

/**
 * Página estática de Política de Privacidad. Contenido genérico requerido
 * por las pasarelas de pago y bancos para habilitar el cobro en línea.
 * Debe ser revisado por un abogado antes de producción.
 */
export default async function PrivacidadPage() {
  const { privacidad_texto } = await obtenerConfiguracion();
  if (privacidad_texto) {
    return (
      <LegalPage tipo="privacidad">
        <div className="whitespace-pre-wrap">{privacidad_texto}</div>
      </LegalPage>
    );
  }

  return (
    <LegalPage tipo="privacidad" fechaActualizacion="27 de agosto de 2026">
      <section className="space-y-6 sm:space-y-8">
        <div className="-mx-4 rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-slate-200/70 hover:bg-slate-50/70">
          <h2 className="text-lg font-semibold text-slate-900">
            1. Datos que recopilamos
          </h2>
          <p>
            Recopilamos datos como nombre, correo electrónico y detalles de pago
            de las pymes afiliadas y de los turistas que realizan reservas a
            través de la Plataforma, únicamente los necesarios para procesar la
            reserva y el cobro correspondiente.
          </p>
        </div>

        <div className="-mx-4 rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-slate-200/70 hover:bg-slate-50/70">
          <h2 className="text-lg font-semibold text-slate-900">
            2. Uso de los datos
          </h2>
          <p>
            Los datos recopilados se utilizan para: procesar reservas y pagos,
            enviar confirmaciones por correo electrónico, prevenir fraude, y
            mejorar la calidad del servicio ofrecido.
          </p>
        </div>

        <div className="-mx-4 rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-slate-200/70 hover:bg-slate-50/70">
          <h2 className="text-lg font-semibold text-slate-900">
            3. Compartición con terceros
          </h2>
          <p>
            Compartimos datos estrictamente necesarios con procesadores de pago
            (ej. Stripe, Tilopay) y proveedores de infraestructura (ej.
            Supabase) exclusivamente para operar la Plataforma. No vendemos
            datos personales a terceros.
          </p>
        </div>

        <div className="-mx-4 rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-slate-200/70 hover:bg-slate-50/70">
          <h2 className="text-lg font-semibold text-slate-900">
            4. Almacenamiento y seguridad
          </h2>
          <p>
            Los datos se almacenan en infraestructura con cifrado en tránsito y
            en reposo. El acceso está restringido mediante políticas de
            seguridad a nivel de fila (Row Level Security) y autenticación de
            usuarios.
          </p>
        </div>

        <div className="-mx-4 rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-slate-200/70 hover:bg-slate-50/70">
          <h2 className="text-lg font-semibold text-slate-900">
            5. Derechos del usuario
          </h2>
          <p>
            Puedes solicitar la corrección o eliminación de tus datos personales
            en cualquier momento, contactando al correo de soporte indicado en
            el pie de la Plataforma.
          </p>
        </div>

        <div className="-mx-4 rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-slate-200/70 hover:bg-slate-50/70">
          <h2 className="text-lg font-semibold text-slate-900">
            6. Cookies y analíticas
          </h2>
          <p>
            Utilizamos herramientas de analítica (Vercel Analytics) para
            entender el uso agregado y anónimo de la Plataforma, sin identificar
            individualmente a los usuarios.
          </p>
        </div>

        <div className="-mx-4 rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-slate-200/70 hover:bg-slate-50/70">
          <h2 className="text-lg font-semibold text-slate-900">
            7. Cambios a esta política
          </h2>
          <p>
            Podemos actualizar esta política periódicamente. Los cambios
            relevantes serán notificados a través de la Plataforma.
          </p>
        </div>
      </section>
    </LegalPage>
  );
}
