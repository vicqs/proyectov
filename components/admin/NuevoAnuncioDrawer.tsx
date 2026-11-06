"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  Layers,
  Loader2,
  Megaphone,
  Plus,
  Send,
  Users,
} from "lucide-react";
import Drawer from "../Drawer";
import { toast } from "../Toast";
import {
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  TextareaConContador,
} from "./ui";
import { crearAnuncioAction } from "../../actions/admin/comunicacion";
import { conResilienciaRed } from "../../lib/errores";
import type { ResultadoAccion } from "../../lib/admin/auth";

const ESTADO_INICIAL: ResultadoAccion = {};
const crearAnuncioResiliente = conResilienciaRed(crearAnuncioAction);

interface NuevoAnuncioDrawerProps {
  abierto: boolean;
  onClose: () => void;
  conteoPorSegmento: {
    todas: number;
    activa: number;
    prueba: number;
    inactiva: number;
  };
}

export function NuevoAnuncioDrawer({
  abierto,
  onClose,
  conteoPorSegmento,
}: NuevoAnuncioDrawerProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [estado, enviar, pendiente] = useActionState(
    crearAnuncioResiliente,
    ESTADO_INICIAL,
  );

  function resetear() {
    formRef.current?.reset();
  }

  function handleClose() {
    if (pendiente) return;
    resetear();
    onClose();
  }

  useEffect(() => {
    if (estado.ok) {
      toast.success(estado.ok);
      resetear();
      router.refresh();
      onClose();
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado, onClose, router]);

  return (
    <Drawer
      abierto={abierto}
      titulo="Nuevo anuncio en panel"
      onClose={handleClose}
      ancho="max-w-lg sm:max-w-xl"
    >
      <form
        ref={formRef}
        action={enviar}
        className="flex flex-col min-h-full justify-between gap-6"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs text-sky-900 leading-relaxed">
            <Megaphone className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
            <p>
              El anuncio se fijará en la parte superior del panel de control de todas
              las empresas pertenecientes al segmento hasta que expire o sea desactivado.
            </p>
          </div>

          <Campo etiqueta="Título del anuncio">
            <input
              name="titulo"
              required
              maxLength={100}
              placeholder="Ej. Mantenimiento programado este domingo"
              className={CLASE_INPUT}
            />
          </Campo>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo etiqueta="Severidad">
              <select
                name="severidad"
                className={CLASE_SELECT}
                defaultValue="info"
              >
                <option value="info">Informativo (Azul)</option>
                <option value="aviso">Aviso (Ámbar)</option>
                <option value="critico">Crítico (Rojo)</option>
              </select>
            </Campo>

            <Campo etiqueta="Segmento destinatario">
              <select
                name="segmento"
                className={CLASE_SELECT}
                defaultValue="todas"
              >
                <option value="todas">
                  Todas las empresas ({conteoPorSegmento.todas})
                </option>
                <option value="activa">
                  Activas ({conteoPorSegmento.activa})
                </option>
                <option value="prueba">
                  En prueba ({conteoPorSegmento.prueba})
                </option>
                <option value="inactiva">
                  Inactivas ({conteoPorSegmento.inactiva})
                </option>
              </select>
            </Campo>
          </div>

          <div>
            <Campo etiqueta="Duración (días de vigencia)">
              <div className="relative w-full">
                <input
                  name="dias"
                  type="number"
                  min={0}
                  max={365}
                  defaultValue={7}
                  className={`${CLASE_INPUT} vuki-input-sin-spinner pr-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 select-none">
                  días
                </span>
              </div>
            </Campo>
            <p className="mt-1 text-[11px] text-slate-400">
              Indica 0 si deseas que el anuncio permanezca indefinidamente hasta ser desactivado a mano.
            </p>
          </div>

          <Campo etiqueta="Mensaje del anuncio">
            <TextareaConContador
              name="mensaje"
              required
              rows={4}
              maxLength={600}
              placeholder="Escribe el contenido detallado del aviso que leerán los negocios..."
            />
          </Campo>
        </div>

        <div className="mt-auto border-t border-slate-100 pt-4 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={pendiente}
            className="vuki-btn-secondary flex-1 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pendiente}
            className="vuki-btn-primary flex-1 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {pendiente ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Publicar anuncio</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
