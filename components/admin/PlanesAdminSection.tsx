"use client";

import { useEffect, useState } from "react";
import { Layers, Pencil, Plus, Sparkles, Star } from "lucide-react";
import { usd } from "../../lib/admin/formato";
import { Insignia, Tarjeta } from "./ui";
import { AccionForm } from "./AccionForm";
import { marcarPlanDefectoAction } from "../../actions/admin/suscripciones";
import { PlanDrawer, type FlagDisponible } from "./PlanDrawer";
import type { Plan } from "../../types/database";

interface PlanesAdminSectionProps {
  planesIniciales: Plan[];
  flagsDisponibles: FlagDisponible[];
}

export function PlanesAdminSection({
  planesIniciales,
  flagsDisponibles,
}: PlanesAdminSectionProps) {
  const [planes, setPlanes] = useState<Plan[]>(planesIniciales);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);

  useEffect(() => {
    setPlanes(planesIniciales);
  }, [planesIniciales]);

  function abrirCrear() {
    setPlanSeleccionado(null);
    setDrawerAbierto(true);
  }

  function abrirEditar(plan: Plan) {
    setPlanSeleccionado(plan);
    setDrawerAbierto(true);
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setPlanSeleccionado(null);
  }

  return (
    <>
      <Tarjeta
        titulo="Planes"
        descripcion="Catálogo de niveles de suscripción. Los cambios de precio aplican a los próximos cobros."
        accion={
          <button
            type="button"
            onClick={abrirCrear}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo plan</span>
          </button>
        }
      >
        {planes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <Layers className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              No hay planes configurados
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Crea tu primer plan para comenzar a cobrar suscripciones a los negocios de la plataforma.
            </p>
            <button
              type="button"
              onClick={abrirCrear}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Crear primer plan</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planes.map((p) => {
              const esDefecto = p.por_defecto;
              return (
                <div
                  key={p.id}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all hover:shadow-md ${
                    esDefecto
                      ? "border-sky-300 bg-gradient-to-b from-sky-50/40 via-white to-white ring-1 ring-sky-200/80 shadow-sm"
                      : "border-slate-200/90 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    {/* Cabecera de la tarjeta */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display text-base font-bold tracking-tight text-slate-900">
                            {p.nombre}
                          </h3>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {esDefecto && (
                            <Insignia tono="azul">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-sky-500 text-sky-500" />
                                <span>Por defecto</span>
                              </span>
                            </Insignia>
                          )}
                          <Insignia tono={p.activo ? "verde" : "gris"}>
                            {p.activo ? "Activo" : "Inactivo"}
                          </Insignia>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => abrirEditar(p)}
                        aria-label={`Editar ${p.nombre}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white hover:border-slate-300 hover:text-slate-900 cursor-pointer shadow-xs"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
                        <span>Editar</span>
                      </button>
                    </div>

                    {/* Precio mensual */}
                    <div className="mt-4">
                      <p className="flex items-baseline gap-1 text-2xl font-black tracking-tight text-slate-900">
                        {usd(p.precio_usd)}
                        <span className="text-xs font-normal text-slate-500">
                          USD / mes
                        </span>
                      </p>
                    </div>

                    {/* Identificador y funciones */}
                    <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Stripe Price ID:</span>
                        {p.stripe_price_id ? (
                          <span
                            title={p.stripe_price_id}
                            className="max-w-[170px] truncate font-mono text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
                          >
                            {p.stripe_price_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Sin vincular
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1.5">
                          Funciones incluidas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {flagsDisponibles.map((f) => {
                            const activa = p.flags?.[f.clave] ?? true;
                            return (
                              <span
                                key={f.clave}
                                title={f.ayuda}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                                  activa
                                    ? "bg-slate-100 text-slate-700 border border-slate-200/60"
                                    : "bg-slate-50 text-slate-400 line-through border border-transparent"
                                }`}
                              >
                                <span>{activa ? "✓" : "✗"}</span>
                                <span>{f.etiqueta}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de pie de tarjeta */}
                  {!esDefecto && p.activo && (
                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Acción rápida:</span>
                      <AccionForm
                        accion={marcarPlanDefectoAction.bind(null, p.id)}
                        boton="Hacer predeterminado"
                        variante="neutro"
                        tamano="xs"
                        confirmar={`¿Deseas establecer el plan "${p.nombre}" como predeterminado para nuevos negocios?`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Tarjeta>

      <PlanDrawer
        abierto={drawerAbierto}
        onClose={cerrarDrawer}
        plan={planSeleccionado}
        flagsDisponibles={flagsDisponibles}
      />
    </>
  );
}
