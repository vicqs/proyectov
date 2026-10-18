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
}

/** Cascarón del área `/admin`: sidebar en escritorio y barra desplazable en móvil. */
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

  const nav = (vertical: boolean) =>
    links.map(({ href, label, icon }) => {
      const Icon = ICONOS[icon];
      const on = activo(href);
      return (
        <Link
          key={href}
          href={href}
          aria-current={on ? "page" : undefined}
          className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            on
              ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          } ${vertical ? "" : "whitespace-nowrap"}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </Link>
      );
    });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white p-5 lg:flex">
        <div className="mb-4">
          <VLogo />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Administración global
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
          {email}
        </p>
        <p className="mb-6 text-xs text-slate-500">{rol}</p>
        <nav
          aria-label="Navegación de administración"
          className="flex flex-1 flex-col gap-1 overflow-y-auto"
        >
          {nav(true)}
        </nav>
        <div className="mt-4">{pie}</div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <VLogo className="h-7 w-7 text-sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              Administración · {rol}
            </p>
            <p className="truncate text-sm font-bold text-slate-900">{email}</p>
          </div>
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
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col bg-white p-6 shadow-xl lg:hidden"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <VLogo className="h-7 w-7 text-sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">
                      Administración · {rol}
                    </p>
                    <p className="truncate text-sm font-bold text-slate-900">
                      {email}
                    </p>
                  </div>
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
              <nav
                aria-label="Navegación de administración"
                className="flex flex-1 flex-col gap-1 overflow-y-auto"
              >
                {nav(true)}
              </nav>
              <div className="mt-4">{pie}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
