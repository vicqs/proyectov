"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
const CLASE_BOTON_NEUTRO =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2";

/**
 * Formulario de filtros que se aplica solo: los campos de texto con una
 * pequeña espera al teclear y el resto (select, fecha…) al cambiar.
 * Sin JS sigue funcionando como formulario GET (Enter envía).
 */
export function FiltrosAuto({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const form = useRef<HTMLFormElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendiente, iniciar] = useTransition();

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  function aplicar() {
    if (!form.current) return;
    const params = new URLSearchParams();
    for (const [clave, valor] of new FormData(form.current)) {
      if (typeof valor === "string" && valor.trim() !== "") {
        params.set(clave, valor.trim());
      }
    }
    const consulta = params.toString();
    iniciar(() =>
      router.replace(consulta ? `${pathname}?${consulta}` : pathname, {
        scroll: false,
      }),
    );
  }

  function alCambiar(e: React.FormEvent<HTMLFormElement>) {
    const destino = e.target as HTMLElement;
    if (temporizador.current) clearTimeout(temporizador.current);
    const esTexto =
      destino instanceof HTMLTextAreaElement ||
      (destino instanceof HTMLInputElement &&
        ["text", "search", "email", "number", ""].includes(destino.type));
    if (esTexto) temporizador.current = setTimeout(aplicar, 350);
    else aplicar();
  }

  function limpiar() {
    if (temporizador.current) clearTimeout(temporizador.current);
    form.current?.reset();
    for (const campo of Array.from(form.current?.elements ?? [])) {
      if (
        campo instanceof HTMLInputElement ||
        campo instanceof HTMLTextAreaElement
      ) {
        campo.value = "";
      } else if (campo instanceof HTMLSelectElement) {
        campo.selectedIndex = 0;
      }
    }
    iniciar(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <form
      ref={form}
      method="get"
      onInput={alCambiar}
      onSubmit={(e) => {
        e.preventDefault();
        if (temporizador.current) clearTimeout(temporizador.current);
        aplicar();
      }}
      aria-busy={pendiente}
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      {children}
      <button type="button" onClick={limpiar} className={CLASE_BOTON_NEUTRO}>
        Limpiar
      </button>
    </form>
  );
}
