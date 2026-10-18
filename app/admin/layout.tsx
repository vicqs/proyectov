import type { Metadata } from "next";
import { requerirAdmin } from "../../lib/admin/auth";
import { ETIQUETA_ROL, tienePermiso, type Permiso } from "../../lib/roles";
import { logoutAction } from "../../actions/auth";
import AdminShell, {
  type AdminNavLink,
} from "../../components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Administración global",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const NAV: (AdminNavLink & { permiso: Permiso })[] = [
  { href: "/admin", label: "Resumen", icon: "dashboard", permiso: "dashboard" },
  {
    href: "/admin/negocios",
    label: "Negocios",
    icon: "negocios",
    permiso: "negocios_ver",
  },
  {
    href: "/admin/suscripciones",
    label: "Suscripciones",
    icon: "suscripciones",
    permiso: "facturacion",
  },
  {
    href: "/admin/finanzas",
    label: "Finanzas",
    icon: "finanzas",
    permiso: "finanzas",
  },
  {
    href: "/admin/reservas",
    label: "Reservas",
    icon: "reservas",
    permiso: "reservas",
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: "usuarios",
    permiso: "usuarios",
  },
  {
    href: "/admin/soporte",
    label: "Soporte",
    icon: "soporte",
    permiso: "soporte",
  },
  {
    href: "/admin/moderacion",
    label: "Moderación",
    icon: "moderacion",
    permiso: "moderacion",
  },
  {
    href: "/admin/comunicacion",
    label: "Comunicación",
    icon: "comunicacion",
    permiso: "comunicacion",
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    icon: "configuracion",
    permiso: "configuracion",
  },
  {
    href: "/admin/sistema",
    label: "Sistema",
    icon: "sistema",
    permiso: "sistema",
  },
  {
    href: "/admin/auditoria",
    label: "Auditoría",
    icon: "auditoria",
    permiso: "auditoria",
  },
  {
    href: "/admin/equipo",
    label: "Equipo",
    icon: "equipo",
    permiso: "equipo",
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requerirAdmin();
  const links: AdminNavLink[] = NAV.filter((l) =>
    tienePermiso(admin.rol, l.permiso),
  ).map(({ permiso: _permiso, ...resto }) => resto);

  return (
    <AdminShell
      links={links}
      email={admin.email}
      rol={ETIQUETA_ROL[admin.rol]}
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
