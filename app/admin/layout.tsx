import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requerirAdmin } from "../../lib/admin/auth";
import { obtenerConfiguracion } from "../../lib/plataforma";
import { ETIQUETA_ROL, tienePermiso, type Permiso } from "../../lib/roles";
import { isStripeMockMode } from "../../lib/stripe";
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
  const [admin, config] = await Promise.all([
    requerirAdmin(),
    obtenerConfiguracion().catch(() => null),
  ]);
  const links: AdminNavLink[] = NAV.filter((l) =>
    tienePermiso(admin.rol, l.permiso),
  ).map(({ permiso: _permiso, ...resto }) => resto);
  const pagosSimulados = Boolean(config?.pagos_simulados);
  const modoDemo = pagosSimulados || isStripeMockMode;

  return (
    <AdminShell
      links={links}
      email={admin.email}
      rol={ETIQUETA_ROL[admin.rol]}
      modoDemo={modoDemo}
      pie={
        <form action={logoutAction}>
          <button
            type="submit"
            className="vuki-focus flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-slate-900 cursor-pointer"
          >
            <LogOut
              className="h-4 w-4 shrink-0 text-slate-500"
              aria-hidden="true"
            />
            <span>Cerrar sesión</span>
          </button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}
