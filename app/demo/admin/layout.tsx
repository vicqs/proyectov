"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CreditCard,
  Home,
  ListChecks,
  Menu,
  ShieldAlert,
  X,
} from "lucide-react";
import { mockNegocio } from "../../../lib/mockData";
import { useDemoStore } from "../../../lib/demoStore";
import { ToastViewport } from "../../../components/Toast";
import VLogo from "../../../components/VLogo";
import AnimatedIconButton from "../../../components/AnimatedIconButton";

const NAV_LINKS = [
  { href: "/demo/admin", label: "Inicio", icon: Home },
  { href: "/demo/admin/servicios", label: "Mis Servicios", icon: ListChecks },
  { href: "/demo/admin/horarios", label: "Horarios", icon: Clock },
  { href: "/demo/admin/reservas", label: "Reservas", icon: Calendar },
  { href: "/demo/admin/suscripcion", label: "Suscripción", icon: CreditCard },
];

/**
 * Layout del panel de administración SIMULADO (`/demo/admin/*`). Sin
 * Supabase Auth: cualquiera puede entrar, pero — igual que en la app
 * real — si la suscripción no está "activa", se bloquea el acceso a todo
 * excepto a la propia página de suscripción, para que el demo refleje el
 * mismo comportamiento de negocio que `/admin`. Sidebar con estilo premium
 * (glassmorphism sutil) + transición de página con framer-motion.
 */
export default function AdminDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [montado, setMontado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { suscripcion } = useDemoStore(mockNegocio.slug);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  const esPaginaSuscripcion = pathname === "/demo/admin/suscripcion";
  const suscripcionActiva = suscripcion.estado === "activa";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <ToastViewport />
      <aside className="hidden w-64 flex-col border-r border-slate-200/70 bg-white/70 p-6 backdrop-blur-xl md:flex">
        <div className="mb-4">
          <VLogo />
        </div>
        <h2 className="mb-8 text-lg font-bold text-slate-900">
          {mockNegocio.nombre}
        </h2>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
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
        <Link
          href={`/demo/${mockNegocio.slug}`}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100"
        >
          Ver enlace público ↗
        </Link>
      </aside>

      {/* Menú hamburguesa (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <VLogo className="h-7 w-7 text-sm" />
          <h2 className="text-base font-bold text-slate-900">
            {mockNegocio.nombre}
          </h2>
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
                  <h2 className="text-lg font-bold text-slate-900">
                    {mockNegocio.nombre}
                  </h2>
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
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
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
              <Link
                href={`/demo/${mockNegocio.slug}`}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Ver enlace público ↗
              </Link>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1">
        {!esPaginaSuscripcion && montado && !suscripcionActiva ? (
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
              href="/demo/admin/suscripcion"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Ir a Suscripción
            </Link>
          </main>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
