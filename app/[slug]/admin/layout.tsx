import Link from "next/link";
import { requerirEmpresa } from "@/lib/empresa";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import { estadoEfectivo } from "@/lib/negocio-estado";
import { funcionActivaNegocio, obtenerConfiguracion } from "@/lib/plataforma";
import { leer } from "@/lib/admin/db";
import { logoutAction } from "@/actions/auth";
import EmpresaShell, { type EmpresaNavLink } from "@/components/EmpresaShell";

const NAV_LINKS: EmpresaNavLink[] = [
  { href: "", label: "Inicio", icon: "home" },
  { href: "servicios", label: "Mis Servicios", icon: "servicios" },
  { href: "horarios", label: "Horarios", icon: "horarios" },
  { href: "calendario", label: "Calendario", icon: "calendario" },
  { href: "agenda", label: "Agenda/Bloqueos", icon: "agenda" },
  { href: "reservas", label: "Reservas", icon: "reservas" },
  { href: "finanzas", label: "Finanzas", icon: "finanzas" },
  {
    href: "personalizacion",
    label: "Personalización",
    icon: "personalizacion",
  },
  { href: "suscripcion", label: "Suscripción", icon: "suscripcion" },
  { href: "soporte", label: "Soporte", icon: "soporte" },
];

const ESTILO_ANUNCIO = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  aviso: "border-amber-200 bg-amber-50 text-amber-800",
  critico: "border-red-200 bg-red-50 text-red-800",
} as const;

function AvisoPantalla({
  titulo,
  mensaje,
}: {
  titulo: string;
  mensaje: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
      <p className="mt-2 text-sm text-slate-500">{mensaje}</p>
      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}

/**
 * Layout del panel de empresa. Es un Server Component: obtiene la
 * sesión y el negocio asociado al usuario en el servidor. El middleware
 * (`middleware.ts`) ya garantiza que solo llega aquí un usuario autenticado.
 * Si la suscripción está inactiva, el cascarón bloquea todo excepto la
 * página de suscripción. La administración global puede además suspender
 * el negocio, activar el modo mantenimiento o publicar anuncios.
 */
export default async function EmpresaLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const { negocio } = await requerirEmpresa(slug);
  const config = await obtenerConfiguracion();

  if (negocio.suspendido) {
    return (
      <AvisoPantalla
        titulo="Cuenta suspendida"
        mensaje={`${negocio.motivo_suspension ?? "Tu cuenta fue suspendida por la administración."} Escríbenos para resolverlo.`}
      />
    );
  }
  if (config.modo_mantenimiento) {
    return (
      <AvisoPantalla
        titulo="Plataforma en mantenimiento"
        mensaje={
          config.mensaje_mantenimiento ??
          "Volveremos en unos minutos. Gracias por tu paciencia."
        }
      />
    );
  }

  const efectivo = estadoEfectivo(negocio);
  const ahora = Date.now();
  const anuncios = (await leer("anuncios").catch(() => []))
    .filter(
      (a) =>
        a.activo &&
        (!a.expira_en || new Date(a.expira_en).getTime() > ahora) &&
        (a.segmento === "todas" || a.segmento === efectivo),
    )
    .sort((a, b) => b.creado_en.localeCompare(a.creado_en));

  const links = (await funcionActivaNegocio(negocio, "soporte_empresas"))
    ? NAV_LINKS
    : NAV_LINKS.filter((l) => l.href !== "soporte");

  return (
    <EmpresaShell
      colorPrimario={negocio.color_tema}
      colorSecundario={negocio.color_secundario}
      nombre={negocio.nombre}
      links={links.map((link) => ({
        ...link,
        href: rutaPanelEmpresa(negocio.slug, link.href),
      }))}
      hrefPublico={`/${negocio.slug}`}
      hrefSuscripcion={rutaPanelEmpresa(negocio.slug, "suscripcion")}
      bloqueado={false}
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
      {efectivo === "inactiva" && (
        <div className="mx-auto max-w-6xl px-6 pt-6 sm:px-10 2xl:max-w-7xl">
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>
              <span className="font-semibold">
                Tu enlace público está desactivado.
              </span>{" "}
              Sin suscripción activa no se reciben reservas. Puedes seguir
              usando el panel.
            </p>
            <Link
              href={rutaPanelEmpresa(negocio.slug, "suscripcion")}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Activar suscripción
            </Link>
          </div>
        </div>
      )}
      {anuncios.length > 0 && (
        <div className="mx-auto max-w-6xl space-y-2 px-6 pt-6 sm:px-10 2xl:max-w-7xl">
          {anuncios.map((a) => (
            <div
              key={a.id}
              role="status"
              className={`rounded-xl border px-4 py-3 text-sm ${ESTILO_ANUNCIO[a.severidad]}`}
            >
              <p className="font-semibold">{a.titulo}</p>
              <p>{a.mensaje}</p>
            </div>
          ))}
        </div>
      )}
      {children}
    </EmpresaShell>
  );
}
