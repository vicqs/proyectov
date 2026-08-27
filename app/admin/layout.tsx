import { redirect } from "next/navigation";
import {
  Calendar,
  ClipboardList,
  CreditCard,
  Home,
  LineChart,
  ListChecks,
  Palette,
} from "lucide-react";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import type { Negocio } from "../../types/database";
import { logoutAction } from "../../actions/auth";
import AdminMobileNav from "./AdminMobileNav";

const NAV_LINKS = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/servicios", label: "Mis Servicios", icon: ListChecks },
  { href: "/admin/agenda", label: "Agenda/Bloqueos", icon: Calendar },
  { href: "/admin/reservas", label: "Reservas", icon: ClipboardList },
  { href: "/admin/finanzas", label: "Finanzas", icon: LineChart },
  { href: "/admin/personalizacion", label: "Personalización", icon: Palette },
  { href: "/admin/suscripcion", label: "Suscripción", icon: CreditCard },
];

/**
 * Layout del panel de administración. Es un Server Component: obtiene la
 * sesión y el negocio asociado al usuario en el servidor. El middleware
 * (`middleware.ts`) ya garantiza que solo llega aquí un usuario autenticado.
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
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-6 md:flex">
        <h2 className="mb-8 text-lg font-bold text-slate-900">
          {negocioTyped.nombre}
        </h2>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
        </nav>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100"
          >
            Cerrar sesión
          </button>
        </form>
      </aside>

      {/* Menú hamburguesa (mobile) */}
      <AdminMobileNav
        negocioNombre={negocioTyped.nombre}
        links={NAV_LINKS.map(({ href, label }) => ({ href, label }))}
      />

      <div className="flex-1">
        <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
