import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import EmpresaPage from "@/components/EmpresaPage";
import PersonalizacionForm from "./PersonalizacionForm";

/**
 * Personalización de marca: biografía, color de tema, logo e imagen de
 * portada. Server Component: carga los datos actuales del negocio y los
 * pasa como props al formulario (Client Component).
 */
export default async function PersonalizacionPage({
  params,
}: EmpresaPageProps) {
  const { slug } = await params;
  const { negocio } = await requerirEmpresa(slug);

  return (
    <EmpresaPage
      titulo="Personalización"
      descripcion={
        <>
          Configura cómo se ve tu perfil público en{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">
            /{negocio.slug}
          </code>
          .
        </>
      }
    >
      <PersonalizacionForm negocio={negocio} />
    </EmpresaPage>
  );
}
