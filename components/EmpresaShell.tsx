"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CalendarOff,
  ClipboardList,
  Clock,
  CreditCard,
  Home,
  LineChart,
  LifeBuoy,
  ListChecks,
  Menu,
  Palette,
  ShieldAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { ToastViewport } from "./Toast";
import VLogo from "./VLogo";
import AnimatedIconButton from "./AnimatedIconButton";
import {
  COLOR_PRIMARIO_DEFECTO,
  COLOR_SECUNDARIO_DEFECTO,
  esHex,
} from "../lib/color";

const NAV_ACTIVO_TEXTO = "text-(--marca-texto)";
const NAV_ACTIVO_FONDO =
  "bg-[color-mix(in_srgb,var(--marca)_12%,white)] ring-1 ring-[color-mix(in_srgb,var(--marca)_25%,white)]";

export type EmpresaIconName =
  | "home"
  | "servicios"
  | "agenda"
  | "horarios"
  | "calendario"
  | "reservas"
  | "finanzas"
  | "personalizacion"
  | "suscripcion"
  | "soporte";

const ICONOS: Record<EmpresaIconName, LucideIcon> = {
  home: Home,
  servicios: ListChecks,
  agenda: CalendarOff,
  horarios: Clock,
  calendario: CalendarDays,
  reservas: ClipboardList,
  finanzas: LineChart,
  personalizacion: Palette,
  suscripcion: CreditCard,
  soporte: LifeBuoy,
};

export interface EmpresaNavLink {
  href: string;
  label: string;
  icon: EmpresaIconName;
}

interface EmpresaShellProps {
  nombre: string;
  links: EmpresaNavLink[];
  /** Enlace al perfil público del negocio. */
  hrefPublico: string;
  /** Ruta de la página de suscripción (siempre accesible aunque esté bloqueado). */
  hrefSuscripcion: string;
  /** Si es true, solo se permite entrar a la página de suscripción. */
  bloqueado?: boolean;
  /** Acciones extra al pie del menú (ej. botón de cerrar sesión). */
  pie?: React.ReactNode;
  /** Colores de marca del negocio (HEX); se usan como acento del panel. */
  colorPrimario?: string | null;
  colorSecundario?: string | null;
  children: React.ReactNode;
}

/**
 * Cascarón único del panel de empresa (real `/[slug]/admin` y simulado
 * `/[slug]/admin`): sidebar con glassmorphism, indicador animado del enlace
 * activo, menú móvil tipo drawer, toasts, transición de página y bloqueo
 * por suscripción inactiva.
 */
export default function EmpresaShell({
  nombre,
  links,
  hrefPublico,
  hrefSuscripcion,
  bloqueado = false,
  pie,
  colorPrimario,
  colorSecundario,
  children,
}: EmpresaShellProps) {
  const marca = esHex(colorPrimario) ? colorPrimario : COLOR_PRIMARIO_DEFECTO;
  const marca2 = esHex(colorSecundario)
    ? colorSecundario
    : esHex(colorPrimario)
      ? colorPrimario
      : COLOR_SECUNDARIO_DEFECTO;
  const estiloMarca = {
    "--marca": marca,
    "--marca-2": marca2,
    // Superficies suaves y tinta oscura para admitir cualquier color del negocio.
    "--marca-fondo": "color-mix(in srgb, var(--marca) 8%, white)",
    "--marca-borde": "color-mix(in srgb, var(--marca) 22%, white)",
    "--marca-texto": "color-mix(in srgb, var(--marca) 40%, #0f172a)",
    "--marca-2-fondo": "color-mix(in srgb, var(--marca-2) 8%, white)",
    "--marca-2-borde": "color-mix(in srgb, var(--marca-2) 22%, white)",
    "--marca-2-texto": "color-mix(in srgb, var(--marca-2) 40%, #0f172a)",
  } as React.CSSProperties;
  const pathname = usePathname();
  const [montado, setMontado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  const esPaginaSuscripcion = pathname.startsWith(hrefSuscripcion);
  const mostrarBloqueo = bloqueado && !esPaginaSuscripcion && montado;

  const pieMenu = (
    <div className="flex flex-col gap-1">
      <Link
        href={hrefPublico}
        className="vuki-focus flex min-h-11 items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-sky-800 transition hover:bg-sky-50"
      >
        Ver enlace público ↗
      </Link>
      {pie}
    </div>
  );

  return (
    <div
      style={estiloMarca}
      className="flex min-h-screen flex-col bg-vuki-surface lg:flex-row"
    >
      <ToastViewport />

      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-sky-100 bg-white p-5 lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-vuki-ocean to-vuki-emerald"
        />
        <div className="relative mb-6 mt-2 overflow-hidden rounded-3xl bg-vuki-ink p-5 shadow-lg shadow-slate-900/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-vuki-ocean/25 blur-2xl"
          />
          <Link
            href="/"
            aria-label="vuki · inicio"
            className="vuki-focus relative inline-flex rounded-xl"
          >
            <VLogo showText tone="light" className="h-9 w-9" />
          </Link>
          <p className="relative mt-5 text-xs font-semibold text-sky-200">
            Panel de empresa
          </p>
          <h2 className="relative mt-1 break-words font-display text-base font-bold leading-snug text-white">
            {nombre}
          </h2>
          <div
            aria-hidden="true"
            className="relative mt-5 h-0.5 w-12 rounded-full bg-vuki-emerald"
          />
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Gestiona tu negocio
        </p>
        <nav
          aria-label="Navegación de empresa"
          className="flex flex-1 flex-col gap-1"
        >
          {links.map(({ href, label, icon }) => {
            const Icon = ICONOS[icon];
            const activo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`vuki-focus relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  activo
                    ? NAV_ACTIVO_TEXTO
                    : "text-slate-600 hover:bg-sky-50/70 hover:text-sky-900"
                }`}
              >
                {activo && (
                  <motion.span
                    layoutId="nav-activo"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className={`absolute inset-0 rounded-xl ${NAV_ACTIVO_FONDO}`}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" aria-hidden="true" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>
        {pieMenu}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-vuki-ink px-4 py-3 shadow-sm shadow-slate-950/10 lg:hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-vuki-ocean to-vuki-emerald"
        />
        <div className="flex min-w-0 items-center gap-2.5">
          <VLogo tone="light" className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sky-200">vuki · Empresa</p>
            <h2 className="truncate text-base font-bold text-white">
              {nombre}
            </h2>
          </div>
        </div>
        <AnimatedIconButton
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          className="vuki-focus min-h-11 min-w-11 shrink-0 text-slate-100 hover:bg-white/10 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </AnimatedIconButton>
      </header>

      <AnimatePresence>
        {menuAbierto && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuAbierto(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col overflow-y-auto border-r border-sky-100 bg-white p-6 shadow-xl lg:hidden"
            >
              <div className="mb-6 flex items-start justify-between gap-2 rounded-2xl border border-white/10 bg-vuki-ink p-4 shadow-lg shadow-slate-900/10">
                <div className="min-w-0">
                  <VLogo
                    showText
                    tone="light"
                    className="h-8 w-8"
                    wordmarkClassName="text-2xl"
                  />
                  <p className="mt-4 text-xs font-semibold text-sky-200">
                    Panel de empresa
                  </p>
                  <h2 className="mt-1 break-words text-lg font-bold text-white">
                    {nombre}
                  </h2>
                </div>
                <AnimatedIconButton
                  variante="cerrar"
                  onClick={() => setMenuAbierto(false)}
                  aria-label="Cerrar menú"
                  className="vuki-focus -mt-1 min-h-11 min-w-11 shrink-0 text-slate-100 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </AnimatedIconButton>
              </div>
              <nav
                aria-label="Navegación de empresa"
                className="flex flex-1 flex-col gap-1"
              >
                {links.map(({ href, label, icon }) => {
                  const Icon = ICONOS[icon];
                  const activo = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={activo ? "page" : undefined}
                      className={`vuki-focus flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                        activo
                          ? `${NAV_ACTIVO_FONDO} ${NAV_ACTIVO_TEXTO}`
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
              {pieMenu}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1">
        {mostrarBloqueo ? (
          <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <ShieldAlert
                className="h-8 w-8 text-amber-600"
                aria-hidden="true"
              />
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
              Activa tu suscripción para continuar
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
              Necesitas una suscripción activa para acceder al panel de tu
              empresa.
            </p>
            <Link
              href={hrefSuscripcion}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Ir a Suscripción
            </Link>
          </main>
        ) : (
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
