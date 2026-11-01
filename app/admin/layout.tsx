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
  {
    href: "/admin",
    label: "Resumen",
    icon: "dashboard",
    permiso: "dashboard",
    grupo: "Operación",
  },
  {
    href: "/admin/negocios",
    label: "Negocios",
    icon: "negocios",
    permiso: "negocios_ver",
    grupo: "Operación",
  },
  {
    href: "/admin/reservas",
    label: "Reservas",
    icon: "reservas",
    permiso: "reservas",
    grupo: "Operación",
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: "usuarios",
    permiso: "usuarios",
    grupo: "Operación",
  },
  {
    href: "/admin/suscripciones",
    label: "Suscripciones",
    icon: "suscripciones",
    permiso: "facturacion",
    grupo: "Monetización",
  },
  {
    href: "/admin/finanzas",
    label: "Finanzas",
    icon: "finanzas",
    permiso: "finanzas",
    grupo: "Monetización",
  },
  {
    href: "/admin/soporte",
    label: "Soporte",
    icon: "soporte",
    permiso: "soporte",
    grupo: "Atención",
  },
  {
    href: "/admin/moderacion",
    label: "Moderación",
    icon: "moderacion",
    permiso: "moderacion",
    grupo: "Atención",
  },
  {
    href: "/admin/comunicacion",
    label: "Comunicación",
    icon: "comunicacion",
    permiso: "comunicacion",
    grupo: "Atención",
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    icon: "configuracion",
    permiso: "configuracion",
    grupo: "Plataforma",
  },
  {
    href: "/admin/sistema",
    label: "Sistema",
    icon: "sistema",
    permiso: "sistema",
    grupo: "Plataforma",
  },
  {
    href: "/admin/auditoria",
    label: "Auditoría",
    icon: "auditoria",
    permiso: "auditoria",
    grupo: "Plataforma",
  },
  {
    href: "/admin/equipo",
    label: "Equipo",
    icon: "equipo",
    permiso: "equipo",
    grupo: "Plataforma",
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
            className="vuki-focus min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-sky-50"
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
