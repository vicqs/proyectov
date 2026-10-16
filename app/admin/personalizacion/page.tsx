import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { Negocio } from "../../../types/database";
import AdminPage from "../../../components/AdminPage";
import PersonalizacionForm from "./PersonalizacionForm";

/**
 * Personalización de marca: biografía, color de tema, logo e imagen de
 * portada. Server Component: carga los datos actuales del negocio y los
 * pasa como props al formulario (Client Component).
 */
export default async function PersonalizacionPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: negocio, error } = await supabase
    .from("negocios")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !negocio) {
    redirect("/login");
  }

  return (
    <AdminPage
      titulo="Personalización"
      descripcion={
        <>
          Configura cómo se ve tu perfil público en{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">
            /{(negocio as Negocio).slug}
          </code>
          .
        </>
      }
    >
      <PersonalizacionForm negocio={negocio as Negocio} />
    </AdminPage>
  );
}
