"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { logoutAction } from "../../actions/auth";
import AnimatedIconButton from "../../components/AnimatedIconButton";

interface AdminMobileNavProps {
  negocioNombre: string;
  links: { href: string; label: string }[];
}

/**
 * Menú hamburguesa para mobile: header fijo + drawer superpuesto (con
 * overlay/backdrop) que se desliza desde la izquierda, siguiendo el patrón
 * estándar de navegación mobile (no empuja el contenido).
 */
export default function AdminMobileNav({
  negocioNombre,
  links,
}: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <h2 className="text-base font-bold text-slate-900">{negocioNombre}</h2>
        <AnimatedIconButton
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </AnimatedIconButton>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
              aria-hidden="true"
            />
            <motion.nav
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col gap-1 bg-white p-6 shadow-xl md:hidden"
            >
              <div className="mb-6 flex items-start justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {negocioNombre}
                </h2>
                <AnimatedIconButton
                  variante="cerrar"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                  className="-mt-1"
                >
                  <X className="h-5 w-5" />
                </AnimatedIconButton>
              </div>
              {links.map(({ href, label }) => {
                const activo = pathname === href;
                return (
                  <a
                    key={href}
                    href={href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      activo
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                    }`}
                  >
                    {label}
                  </a>
                );
              })}
              <form action={logoutAction} className="mt-auto">
                <button
                  type="submit"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
                >
                  Cerrar sesión
                </button>
              </form>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
