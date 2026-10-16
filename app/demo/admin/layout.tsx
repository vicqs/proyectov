"use client";

import AdminShell, { type AdminNavLink } from "../../../components/AdminShell";
import { mockNegocio } from "../../../lib/mockData";
import { useDemoStore } from "../../../lib/demoStore";

const NAV_LINKS: AdminNavLink[] = [
  { href: "/demo/admin", label: "Inicio", icon: "home" },
  { href: "/demo/admin/servicios", label: "Mis Servicios", icon: "servicios" },
  { href: "/demo/admin/horarios", label: "Horarios", icon: "horarios" },
  { href: "/demo/admin/agenda", label: "Agenda/Bloqueos", icon: "agenda" },
  { href: "/demo/admin/reservas", label: "Reservas", icon: "reservas" },
  { href: "/demo/admin/finanzas", label: "Finanzas", icon: "finanzas" },
  {
    href: "/demo/admin/personalizacion",
    label: "Personalización",
    icon: "personalizacion",
  },
  {
    href: "/demo/admin/suscripcion",
    label: "Suscripción",
    icon: "suscripcion",
  },
];

/**
 * Layout del panel de administración SIMULADO (`/demo/admin/*`). Sin
 * Supabase Auth: cualquiera puede entrar. Usa el mismo `AdminShell` que
 * `/admin`; si la suscripción no está "activa" bloquea todo excepto la
 * página de suscripción.
 */
export default function AdminDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { suscripcion, personalizacion } = useDemoStore(mockNegocio.slug);

  return (
    <AdminShell
      nombre={personalizacion.nombre}
      links={NAV_LINKS}
      hrefPublico={`/demo/${mockNegocio.slug}`}
      hrefSuscripcion="/demo/admin/suscripcion"
      bloqueado={suscripcion.estado !== "activa"}
    >
      {children}
    </AdminShell>
  );
}
