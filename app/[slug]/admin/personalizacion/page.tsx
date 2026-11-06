import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { obtenerConfiguracion } from "@/lib/plataforma";
import EmpresaPage from "@/components/EmpresaPage";
import PersonalizacionForm from "./PersonalizacionForm";

/**
 * Personalización de marca: biografía, color de tema, logo, imagen de
 * portada, cuenta IBAN de referencia y seguridad de acceso. Server Component:
 * carga los datos actuales del negocio y los pasa como props al formulario.
 */
export default async function PersonalizacionPage({
  params,
}: EmpresaPageProps) {
  const { slug } = await params;
  const [{ user, negocio }, config] = await Promise.all([
    requerirEmpresa(slug),
    obtenerConfiguracion(),
  ]);

  return (
    <EmpresaPage
      titulo="Personalización"
      descripcion={
        <>
          Configura la identidad visual de tu perfil público en{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">
            /{negocio.slug}
          </code>
          , tu cuenta IBAN de referencia y el acceso a tu panel.
        </>
      }
    >
      <PersonalizacionForm
        negocio={{
          slug: negocio.slug,
          nombre: negocio.nombre,
          descripcion: negocio.descripcion,
          cuenta_iban: negocio.cuenta_iban,
          whatsapp: negocio.whatsapp,
          color_tema: negocio.color_tema,
          color_secundario: negocio.color_secundario,
          logo_url: negocio.logo_url,
          imagen_portada_url: negocio.imagen_portada_url,
          email_contacto: negocio.email_contacto,
        }}
        emailCuenta={user.email ?? ""}
        maxImagenMb={config.max_imagen_mb}
      />
    </EmpresaPage>
  );
}
