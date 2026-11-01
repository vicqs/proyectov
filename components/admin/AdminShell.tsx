"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Building2,
  CreditCard,
  FileClock,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Megaphone,
  ClipboardList,
  Settings,
  ShieldAlert,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ToastViewport } from "../Toast";
import VLogo from "../VLogo";
import AnimatedIconButton from "../AnimatedIconButton";

export type AdminIconName =
  | "dashboard"
  | "negocios"
  | "suscripciones"
  | "finanzas"
  | "reservas"
  | "usuarios"
  | "soporte"
  | "moderacion"
  | "comunicacion"
  | "configuracion"
  | "sistema"
  | "auditoria"
  | "equipo";

const ICONOS: Record<AdminIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  negocios: Building2,
  suscripciones: CreditCard,
  finanzas: LineChart,
  reservas: ClipboardList,
  usuarios: Users,
  soporte: LifeBuoy,
  moderacion: ShieldAlert,
  comunicacion: Megaphone,
  configuracion: Settings,
  sistema: HeartPulse,
  auditoria: FileClock,
  equipo: UserCog,
};

export interface AdminNavLink {
  href: string;
  label: string;
  icon: AdminIconName;
  grupo?: string;
}

/** Cascarón unificado del área `/admin`: diseño, animaciones y estándares idénticos al panel de empresa. */
export default function AdminShell({
  links,
  email,
  rol,
  pie,
  children,
}: {
  links: AdminNavLink[];
  email: string;
  rol: string;
  pie: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);
  const activo = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  const nav = (vertical: boolean) => {
    let ultimoGrupo: string | undefined = undefined;
    return links.map(({ href, label, icon, grupo }) => {
      const Icon = ICONOS[icon];
      const on = activo(href);
      const mostrarCabecera = vertical && !!grupo && grupo !== ultimoGrupo;
      if (mostrarCabecera) ultimoGrupo = grupo;

      return (
        <div key={href} className="contents">
          {mostrarCabecera && (
            <p className="mt-4 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 first:mt-0">
              {grupo}
            </p>
          )}
          <Link
            href={href}
            aria-current={on ? "page" : undefined}
            className={`vuki-focus relative flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              on
                ? "text-sky-950 font-semibold"
                : "text-slate-600 hover:bg-sky-50/70 hover:text-sky-900"
            } ${vertical ? "" : "whitespace-nowrap"}`}
          >
            {on && (
              <motion.span
                layoutId="nav-activo-admin"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-vuki-ocean/10 ring-1 ring-vuki-ocean/15"
              />
            )}
            <Icon
              className={`relative z-10 h-4 w-4 shrink-0 ${on ? "text-vuki-ocean" : "text-slate-500"}`}
              aria-hidden="true"
            />
            <span className="relative z-10">{label}</span>
          </Link>
        </div>
      );
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-vuki-surface lg:flex-row">
      <ToastViewport />

      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-sky-100 bg-white p-5 lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-vuki-ocean to-vuki-emerald"
        />
        <div className="relative mb-4 mt-2 overflow-hidden rounded-3xl bg-vuki-ink p-5 shadow-lg shadow-slate-900/10">
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
            Administración global
          </p>
          <p className="relative mt-1 break-all text-sm font-semibold leading-relaxed text-white">
            {email}
          </p>
          <div className="relative mt-4 flex items-center justify-between">
            <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
              {rol}
            </span>
            <div
              aria-hidden="true"
              className="h-0.5 w-10 rounded-full bg-vuki-emerald"
            />
          </div>
        </div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Gestiona la plataforma
        </p>
        <nav
          aria-label="Navegación de administración"
          className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1"
        >
          {nav(true)}
        </nav>
        <div className="mt-4 border-t border-slate-100 pt-3">{pie}</div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-vuki-ink px-4 py-3 shadow-sm shadow-slate-950/10 lg:hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-vuki-ocean to-vuki-emerald"
        />
        <div className="flex min-w-0 items-center gap-2.5">
          <VLogo tone="light" className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sky-200">
              vuki · Administración
            </p>
            <h2 className="truncate text-sm font-bold text-white">{email}</h2>
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
                    Administración · {rol}
                  </p>
                  <p className="mt-1 break-words text-sm font-bold text-white">
                    {email}
                  </p>
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
                aria-label="Navegación de administración"
                className="flex flex-1 flex-col gap-1 overflow-y-auto"
              >
                {nav(true)}
              </nav>
              <div className="mt-4 border-t border-slate-100 pt-3">{pie}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
