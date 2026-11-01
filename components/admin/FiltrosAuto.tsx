"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const CLASE_BOTON_LIMPIAR =
  "vuki-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]";

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
      className="vuki-filtros flex flex-wrap items-center gap-2.5 rounded-2xl border border-sky-100 bg-white p-3.5 shadow-sm shadow-slate-900/[0.02]"
    >
      {children}
      <button type="button" onClick={limpiar} className={CLASE_BOTON_LIMPIAR}>
        {pendiente && (
          <Loader2
            className="h-3.5 w-3.5 animate-spin text-vuki-ocean"
            aria-hidden="true"
          />
        )}
        Limpiar
      </button>
    </form>
  );
}
