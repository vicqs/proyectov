"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { NegocioListado } from "../../lib/data/columnas";
import { normalizarMoneda } from "../../lib/monedas";
import { estadoEfectivo } from "../../lib/negocio-estado";
import { fechaCorta, paginar } from "../../lib/admin/formato";
import {
  CLASE_BOTON,
  CLASE_BOTON_NEUTRO,
  CampoBusqueda,
  Celda,
  FiltrosGet,
  PaginaAdmin,
  Paginacion,
  Tabla,
} from "./ui";
import { InsigniaNegocio } from "./InsigniaNegocio";
import { NuevoNegocioDrawer } from "./NuevoNegocioDrawer";

export function NegociosAdminClient({
  negociosIniciales,
  reservasPorNegocio,
  puedeGestionar,
  qInicial = "",
  estadoInicial = "",
  paginaInicial = 1,
  abrirNuevoInicial = false,
}: {
  negociosIniciales: NegocioListado[];
  reservasPorNegocio: Record<string, number>;
  puedeGestionar: boolean;
  qInicial?: string;
  estadoInicial?: string;
  paginaInicial?: number;
  abrirNuevoInicial?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerAbierto, setDrawerAbierto] = useState(abrirNuevoInicial);
  const [negocios, setNegocios] = useState<NegocioListado[]>(negociosIniciales);

  useEffect(() => {
    setNegocios(negociosIniciales);
  }, [negociosIniciales]);

  function cerrarDrawer() {
    setDrawerAbierto(false);
    if (searchParams.has("nuevo")) {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("nuevo");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  function alCrearNegocio(nuevoNegocio?: NegocioListado) {
    if (nuevoNegocio) {
      setNegocios((prev) => [
        nuevoNegocio,
        ...prev.filter((n) => n.id !== nuevoNegocio.id),
      ]);
    }
    cerrarDrawer();
    router.refresh();
  }

  const q = (searchParams.get("q") ?? qInicial).trim().toLowerCase();
  const estado = searchParams.get("estado") ?? estadoInicial;
  const pagina = searchParams.get("pagina") ?? String(paginaInicial);

  const conteos = useMemo(
    () => ({
      todos: negocios.filter((n) => !n.eliminado_en).length,
      activa: negocios.filter(
        (n) => !n.eliminado_en && estadoEfectivo(n) === "activa",
      ).length,
      prueba: negocios.filter(
        (n) => !n.eliminado_en && estadoEfectivo(n) === "prueba",
      ).length,
      inactiva: negocios.filter(
        (n) => !n.eliminado_en && estadoEfectivo(n) === "inactiva",
      ).length,
      suspendido: negocios.filter((n) => !n.eliminado_en && n.suspendido).length,
      eliminado: negocios.filter((n) => !!n.eliminado_en).length,
    }),
    [negocios],
  );

  const filtrados = useMemo(() => {
    return negocios
      .filter((n) => {
        if (estado === "eliminado") return !!n.eliminado_en;
        if (n.eliminado_en) return false;
        if (estado === "suspendido") return !!n.suspendido;
        if (
          estado === "activa" ||
          estado === "prueba" ||
          estado === "inactiva"
        ) {
          return estadoEfectivo(n) === estado;
        }
        return true;
      })
      .filter(
        (n) =>
          !q ||
          n.nombre.toLowerCase().includes(q) ||
          n.slug.toLowerCase().includes(q),
      )
      .sort((a, b) => (b.creado_en ?? "").localeCompare(a.creado_en ?? ""));
  }, [negocios, estado, q]);

  const pag = paginar(filtrados, pagina);

  return (
    <PaginaAdmin
      titulo="Negocios"
      descripcion="Todas las empresas registradas en la plataforma."
      accion={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/admin/exportar/negocios" className={CLASE_BOTON_NEUTRO}>
            Exportar CSV
          </a>
          {puedeGestionar && (
            <button
              type="button"
              onClick={() => setDrawerAbierto(true)}
              className={CLASE_BOTON}
            >
              Nuevo negocio
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
        <div
          role="group"
          aria-label="Filtrar por estado del negocio"
          className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3"
        >
          {[
            { id: "", etiqueta: "Todos", conteo: conteos.todos },
            { id: "activa", etiqueta: "Activos", conteo: conteos.activa },
            { id: "prueba", etiqueta: "En prueba", conteo: conteos.prueba },
            { id: "inactiva", etiqueta: "Inactivos", conteo: conteos.inactiva },
            {
              id: "suspendido",
              etiqueta: "Suspendidos",
              conteo: conteos.suspendido,
            },
            {
              id: "eliminado",
              etiqueta: "Eliminados",
              conteo: conteos.eliminado,
            },
          ].map((tab) => {
            const on = estado === tab.id;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (tab.id) params.set("estado", tab.id);
            const href = `/admin/negocios?${params.toString()}`;
            return (
              <Link
                key={tab.id}
                href={href}
                className={`vuki-tab-pill ${on ? "vuki-tab-pill-active" : ""}`}
              >
                {tab.etiqueta}
                <span
                  className={
                    on ? "vuki-tab-pill-badge-active" : "vuki-tab-pill-badge"
                  }
                >
                  {tab.conteo}
                </span>
              </Link>
            );
          })}
        </div>

        <FiltrosGet>
          <input type="hidden" name="estado" value={estado} />
          <CampoBusqueda
            defaultValue={q}
            placeholder="Buscar por nombre o slug..."
            ariaLabel="Buscar por nombre o slug"
            className="sm:w-80"
          />
        </FiltrosGet>
      </div>

      <Tabla
        columnas={["Negocio", "Estado", "Reservas", "Alta", ""]}
        vacia={pag.filas.length === 0}
      >
        {pag.filas.map((n) => (
          <tr key={n.id}>
            <Celda>
              <Link
                href={`/admin/negocios/${n.id}`}
                className="font-medium text-slate-900 hover:text-sky-700 hover:underline"
              >
                {n.nombre}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>/{n.slug}</span>
                <span>·</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                  {normalizarMoneda(n.moneda, "USD")}
                </span>
                {!n.eliminado_en && (
                  <>
                    <span>·</span>
                    <Link
                      href={`/${n.slug}`}
                      target="_blank"
                      className="text-slate-400 hover:text-sky-700 hover:underline"
                      title="Ver perfil público"
                    >
                      Público ↗
                    </Link>
                  </>
                )}
              </div>
            </Celda>
            <Celda>
              <InsigniaNegocio negocio={n} />
            </Celda>
            <Celda>{reservasPorNegocio[n.id] ?? 0}</Celda>
            <Celda>{fechaCorta(n.creado_en)}</Celda>
            <Celda className="text-right">
              <Link
                href={`/admin/negocios/${n.id}`}
                className="font-semibold text-sky-700 hover:underline text-xs"
              >
                {puedeGestionar ? "Gestionar →" : "Ver detalle →"}
              </Link>
            </Celda>
          </tr>
        ))}
      </Tabla>

      <Paginacion
        {...pag}
        base="/admin/negocios"
        params={{ q: q || undefined, estado: estado || undefined }}
      />

      <NuevoNegocioDrawer
        abierto={drawerAbierto}
        onClose={cerrarDrawer}
        onCreado={alCrearNegocio}
      />
    </PaginaAdmin>
  );
}

