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

export type AdminIconName =
  | "home"
  | "servicios"
  | "agenda"
  | "horarios"
  | "calendario"
  | "reservas"
  | "finanzas"
  | "personalizacion"
  | "suscripcion";

const ICONOS: Record<AdminIconName, LucideIcon> = {
  home: Home,
  servicios: ListChecks,
  agenda: CalendarOff,
  horarios: Clock,
  calendario: CalendarDays,
  reservas: ClipboardList,
  finanzas: LineChart,
  personalizacion: Palette,
  suscripcion: CreditCard,
};

export interface AdminNavLink {
  href: string;
  label: string;
  icon: AdminIconName;
}

interface AdminShellProps {
  nombre: string;
  links: AdminNavLink[];
  /** Enlace al perfil público del negocio. */
  hrefPublico: string;
  /** Ruta de la página de suscripción (siempre accesible aunque esté bloqueado). */
  hrefSuscripcion: string;
  /** Si es true, solo se permite entrar a la página de suscripción. */
  bloqueado?: boolean;
  /** Acciones extra al pie del menú (ej. botón de cerrar sesión). */
  pie?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Cascarón único del panel de administración (real `/admin` y simulado
 * `/demo/admin`): sidebar con glassmorphism, indicador animado del enlace
 * activo, menú móvil tipo drawer, toasts, transición de página y bloqueo
 * por suscripción inactiva.
 */
export default function AdminShell({
  nombre,
  links,
  hrefPublico,
  hrefSuscripcion,
  bloqueado = false,
  pie,
  children,
}: AdminShellProps) {
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
        className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100"
      >
        Ver enlace público ↗
      </Link>
      {pie}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <ToastViewport />

      <aside className="hidden w-64 flex-col border-r border-slate-200/70 bg-white/70 p-6 backdrop-blur-xl md:flex">
        <div className="mb-4">
          <VLogo />
        </div>
        <h2 className="mb-8 text-lg font-bold text-slate-900">{nombre}</h2>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map(({ href, label, icon }) => {
            const Icon = ICONOS[icon];
            const activo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  activo
                    ? "text-sky-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {activo && (
                  <motion.span
                    layoutId="nav-activo"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-sky-50 ring-1 ring-sky-100"
                  />
                )}
                <Icon
                  className={`relative z-10 h-4 w-4 ${activo ? "text-sky-600" : ""}`}
                  aria-hidden="true"
                />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>
        {pieMenu}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <VLogo className="h-7 w-7 text-sm" />
          <h2 className="text-base font-bold text-slate-900">{nombre}</h2>
        </div>
        <AnimatedIconButton
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
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
              className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
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
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col bg-white p-6 shadow-xl md:hidden"
            >
              <div className="mb-8 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <VLogo className="h-7 w-7 text-sm" />
                  <h2 className="text-lg font-bold text-slate-900">{nombre}</h2>
                </div>
                <AnimatedIconButton
                  variante="cerrar"
                  onClick={() => setMenuAbierto(false)}
                  aria-label="Cerrar menú"
                  className="-mt-1"
                >
                  <X className="h-5 w-5" />
                </AnimatedIconButton>
              </div>
              <nav className="flex flex-1 flex-col gap-1">
                {links.map(({ href, label, icon }) => {
                  const Icon = ICONOS[icon];
                  const activo = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                        activo
                          ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
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
              Necesitas una suscripción activa para acceder a la administración
              de tu negocio.
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
