import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import type { Negocio } from "../../types/database";
import { logoutAction } from "../../actions/auth";
import AdminShell, { type AdminNavLink } from "../../components/AdminShell";

const NAV_LINKS: AdminNavLink[] = [
  { href: "/admin", label: "Inicio", icon: "home" },
  { href: "/admin/servicios", label: "Mis Servicios", icon: "servicios" },
  { href: "/admin/horarios", label: "Horarios", icon: "horarios" },
  { href: "/admin/calendario", label: "Calendario", icon: "calendario" },
  { href: "/admin/agenda", label: "Agenda/Bloqueos", icon: "agenda" },
  { href: "/admin/reservas", label: "Reservas", icon: "reservas" },
  { href: "/admin/finanzas", label: "Finanzas", icon: "finanzas" },
  {
    href: "/admin/personalizacion",
    label: "Personalización",
    icon: "personalizacion",
  },
  { href: "/admin/suscripcion", label: "Suscripción", icon: "suscripcion" },
];

/**
 * Layout del panel de administración. Es un Server Component: obtiene la
 * sesión y el negocio asociado al usuario en el servidor. El middleware
 * (`middleware.ts`) ya garantiza que solo llega aquí un usuario autenticado.
 * Si la suscripción está inactiva, el cascarón bloquea todo excepto la
 * página de suscripción.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const negocioTyped = negocio as Negocio;

  return (
    <AdminShell
      nombre={negocioTyped.nombre}
      links={NAV_LINKS}
      hrefPublico={`/${negocioTyped.slug}`}
      hrefSuscripcion="/admin/suscripcion"
      bloqueado={negocioTyped.estado_suscripcion === "inactiva"}
      pie={
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100"
          >
            Cerrar sesión
          </button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}
