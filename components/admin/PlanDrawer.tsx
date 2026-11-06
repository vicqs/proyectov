"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CreditCard,
  Layers,
  Loader2,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import Drawer from "../Drawer";
import { toast } from "../Toast";
import { CLASE_CHECKBOX, CLASE_INPUT, Campo, Insignia } from "./ui";
import { AccionForm } from "./AccionForm";
import {
  actualizarPlanAction,
  crearPlanAction,
  marcarPlanDefectoAction,
} from "../../actions/admin/suscripciones";
import { conResilienciaRed } from "../../lib/errores";
import type { Plan } from "../../types/database";
import type { ResultadoAccion } from "../../lib/admin/auth";

export interface FlagDisponible {
  clave: string;
  etiqueta: string;
  ayuda?: string;
}

const ESTADO_INICIAL: ResultadoAccion = {};

interface PlanDrawerProps {
  abierto: boolean;
  onClose: () => void;
  plan?: Plan | null;
  flagsDisponibles: FlagDisponible[];
}

export function PlanDrawer({
  abierto,
  onClose,
  plan,
  flagsDisponibles,
}: PlanDrawerProps) {
  const esEdicion = Boolean(plan);
  const titulo = esEdicion ? `Editar plan: ${plan?.nombre}` : "Nuevo plan";

  return (
    <Drawer abierto={abierto} titulo={titulo} onClose={onClose}>
      {esEdicion && plan ? (
        <FormularioEditarPlan
          key={plan.id}
          plan={plan}
          onClose={onClose}
          flagsDisponibles={flagsDisponibles}
        />
      ) : (
        <FormularioCrearPlan
          key="nuevo"
          onClose={onClose}
          flagsDisponibles={flagsDisponibles}
        />
      )}
    </Drawer>
  );
}

function FormularioCrearPlan({
  onClose,
  flagsDisponibles,
}: {
  onClose: () => void;
  flagsDisponibles: FlagDisponible[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const accionResiliente = useMemo(
    () => conResilienciaRed(crearPlanAction),
    [],
  );

  const [estado, enviar, pendiente] = useActionState(
    accionResiliente,
    ESTADO_INICIAL,
  );

  useEffect(() => {
    if (estado.ok) {
      toast.success(estado.ok);
      router.refresh();
      onClose();
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado, onClose, router]);

  return (
    <form
      ref={formRef}
      action={enviar}
      className="flex flex-col min-h-full justify-between gap-6"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs text-sky-900 leading-relaxed">
          <Sparkles className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
          <p>
            Define un nuevo nivel de suscripción. El plan se creará como activo y
            estará disponible para asignar a negocios.
          </p>
        </div>

        <Campo etiqueta="Nombre del plan">
          <input
            name="nombre"
            required
            placeholder="Ej. Plan Pro, Plan Anual..."
            className={CLASE_INPUT}
          />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo etiqueta="Precio mensual (USD)">
            <input
              name="precio_usd"
              type="number"
              step="0.01"
              min={0}
              required
              placeholder="15.00"
              className={CLASE_INPUT}
            />
          </Campo>

          <Campo etiqueta="Stripe Price ID (opcional)">
            <input
              name="stripe_price_id"
              placeholder="price_..."
              className={CLASE_INPUT}
            />
          </Campo>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Layers className="h-3.5 w-3.5 text-sky-600" />
            <span>Funciones incluidas</span>
          </div>

          <div className="space-y-2.5">
            {flagsDisponibles.map((f) => (
              <label
                key={f.clave}
                className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  name={`flag_${f.clave}`}
                  defaultChecked
                  className={`${CLASE_CHECKBOX} mt-0.5`}
                />
                <div>
                  <span className="font-medium text-slate-900">
                    {f.etiqueta}
                  </span>
                  {f.ayuda && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {f.ayuda}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={pendiente}
          className="vuki-btn-secondary flex-1"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pendiente}
          className="vuki-btn-primary flex-1"
        >
          {pendiente ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
              <span>Creando plan...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Crear plan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function FormularioEditarPlan({
  plan,
  onClose,
  flagsDisponibles,
}: {
  plan: Plan;
  onClose: () => void;
  flagsDisponibles: FlagDisponible[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const accionBound = useMemo(
    () => conResilienciaRed(actualizarPlanAction.bind(null, plan.id)),
    [plan.id],
  );

  const [estado, enviar, pendiente] = useActionState(
    accionBound,
    ESTADO_INICIAL,
  );

  useEffect(() => {
    if (estado.ok) {
      toast.success(estado.ok);
      router.refresh();
      onClose();
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado, onClose, router]);

  const formId = `form-editar-plan-${plan.id}`;

  return (
    <div className="flex flex-col min-h-full justify-between gap-6">
      <div className="space-y-5">
        <form
          id={formId}
          ref={formRef}
          action={enviar}
          className="space-y-5"
        >
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Estado:</span>
              <Insignia tono={plan.activo ? "verde" : "gris"}>
                {plan.activo ? "Activo" : "Inactivo"}
              </Insignia>
              {plan.por_defecto && <Insignia tono="azul">Por defecto</Insignia>}
            </div>
            <span className="font-mono text-xs text-slate-400">ID: {plan.id}</span>
          </div>

          <Campo etiqueta="Nombre del plan">
            <input
              name="nombre"
              defaultValue={plan.nombre}
              required
              className={CLASE_INPUT}
            />
          </Campo>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo etiqueta="USD / mes">
              <input
                name="precio_usd"
                type="number"
                step="0.01"
                min={0}
                defaultValue={plan.precio_usd}
                required
                className={CLASE_INPUT}
              />
            </Campo>

            <Campo etiqueta="Stripe Price ID">
              <input
                name="stripe_price_id"
                defaultValue={plan.stripe_price_id ?? ""}
                placeholder="price_..."
                className={CLASE_INPUT}
              />
            </Campo>
          </div>

          <p className="text-[11px] text-slate-500 -mt-2">
            Los cambios de precio afectarán a los próximos ciclos de facturación de los negocios suscritos.
          </p>

          {/* Checkbox de activo / inactivo */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
            {plan.por_defecto ? (
              <div>
                <input type="hidden" name="activo" value="on" />
                <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-not-allowed select-none">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className={`${CLASE_CHECKBOX} mt-0.5 opacity-60`}
                  />
                  <div>
                    <span className="font-medium text-slate-700">Plan activo</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      El plan por defecto no puede desactivarse. Para desactivarlo, establece otro plan como predeterminado primero.
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="activo"
                  defaultChecked={plan.activo}
                  className={`${CLASE_CHECKBOX} mt-0.5`}
                />
                <div>
                  <span className="font-medium text-slate-900">
                    Plan activo
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Los planes inactivos no se ofrecen a nuevos comercios ni se pueden seleccionar manualmente en cuentas activas.
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Funciones incluidas */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Layers className="h-3.5 w-3.5 text-sky-600" />
              <span>Funciones incluidas</span>
            </div>

            <div className="space-y-2.5">
              {flagsDisponibles.map((f) => {
                const activo = plan.flags?.[f.clave] ?? true;
                return (
                  <label
                    key={f.clave}
                    className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      name={`flag_${f.clave}`}
                      defaultChecked={activo}
                      className={`${CLASE_CHECKBOX} mt-0.5`}
                    />
                    <div>
                      <span className="font-medium text-slate-900">
                        {f.etiqueta}
                      </span>
                      {f.ayuda && (
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {f.ayuda}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </form>

        {/* Opción para predeterminar si no lo es */}
        {!plan.por_defecto && plan.activo && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs text-sky-950">
            <div>
              <p className="font-semibold text-slate-900">Plan predeterminado</p>
              <p className="text-[11px] text-slate-500">
                Los nuevos negocios recibirán este plan al registrarse.
              </p>
            </div>
            <AccionForm
              accion={marcarPlanDefectoAction.bind(null, plan.id)}
              boton="Hacer predeterminado"
              variante="neutro"
              tamano="xs"
              confirmar={`¿Deseas establecer "${plan.nombre}" como el plan por defecto para nuevos negocios?`}
            />
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={pendiente}
          className="vuki-btn-secondary flex-1"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form={formId}
          disabled={pendiente}
          className="vuki-btn-primary flex-1"
        >
          {pendiente ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
              <span>Guardando cambios...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Guardar cambios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
