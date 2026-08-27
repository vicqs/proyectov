import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { Negocio } from "../../../types/database";
import PersonalizacionForm from "./PersonalizacionForm";

/**
 * Página de personalización de marca: biografía, color de tema, logo e
 * imagen de portada. Server Component: carga los datos actuales del
 * negocio y los pasa como props al formulario (Client Component).
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
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Personalización
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Configura cómo se ve tu perfil público en{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5">
          /{(negocio as Negocio).slug}
        </code>
        .
      </p>

      <PersonalizacionForm negocio={negocio as Negocio} />
    </div>
  );
}
