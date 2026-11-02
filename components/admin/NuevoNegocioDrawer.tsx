"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Store } from "lucide-react";
import Drawer from "../Drawer";
import { toast } from "../Toast";
import { CLASE_INPUT, Campo } from "./ui";
import { crearNegocioAction } from "../../actions/admin/negocios";
import type { ResultadoAccion } from "../../lib/admin/auth";
import type { Negocio } from "../../types/database";

function aSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-z0-9]+/g, "-") // guiones para caracteres no alfanuméricos
    .replace(/^-+|-+$/g, "") // quitar guiones extremos
    .slice(0, 40);
}

const ESTADO_INICIAL: ResultadoAccion = {};

interface NuevoNegocioDrawerProps {
  abierto: boolean;
  onClose: () => void;
  onCreado?: (negocio?: Negocio) => void;
}

export function NuevoNegocioDrawer({
  abierto,
  onClose,
  onCreado,
}: NuevoNegocioDrawerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

  const [estado, enviar, pendiente] = useActionState(
    crearNegocioAction,
    ESTADO_INICIAL,
  );

  function resetearFormulario() {
    setNombre("");
    setSlug("");
    setSlugEditadoManualmente(false);
    formRef.current?.reset();
  }

  function handleClose() {
    if (pendiente) return;
    resetearFormulario();
    onClose();
  }

  useEffect(() => {
    if (estado.ok) {
      const matchPassword = estado.ok.match(
        /(?:contraseña temporal:?|temporal:?)\s*([^\s(),.]+)/i,
      );
      if (matchPassword && matchPassword[1]) {
        navigator?.clipboard?.writeText(matchPassword[1]).catch(() => {});
      }
      toast.success(estado.ok);
      onCreado?.(estado.negocio as Negocio | undefined);
      resetearFormulario();
      onClose();
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado, onClose, onCreado]);

  function alCambiarNombre(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNombre(val);
    if (!slugEditadoManualmente) {
      setSlug(aSlug(val));
    }
  }

  function alCambiarSlug(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugEditadoManualmente(true);
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  return (
    <Drawer
      abierto={abierto}
      titulo="Nuevo negocio"
      onClose={handleClose}
    >
      <form
        ref={formRef}
        action={enviar}
        className="flex flex-col h-full justify-between gap-6"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 text-xs text-sky-900 leading-relaxed">
            <Store className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
            <div>
              <p className="font-semibold">Alta de nuevo negocio</p>
              <p className="text-sky-700/90 mt-0.5">
                Crea la empresa y su usuario dueño. El negocio comenzará automáticamente en periodo de prueba de 14 días.
              </p>
            </div>
          </div>

          <Campo etiqueta="Nombre del negocio">
            <input
              name="nombre"
              required
              maxLength={80}
              value={nombre}
              onChange={alCambiarNombre}
              placeholder="Ej. Escuela de Surf Pura Vida"
              className={CLASE_INPUT}
              disabled={pendiente}
            />
          </Campo>

          <Campo
            etiqueta="Slug (URL pública)"
            ayuda="Se genera automáticamente. Debe tener entre 3 y 40 caracteres."
          >
            <div className="relative">
              <input
                name="slug"
                required
                pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]"
                value={slug}
                onChange={alCambiarSlug}
                placeholder="ej. escuela-surf-pura-vida"
                className={CLASE_INPUT}
                disabled={pendiente}
              />
              {slug && (
                <span className="mt-1 block text-xs text-sky-700">
                  URL: vuki.dev/<b>{slug}</b>
                </span>
              )}
            </div>
          </Campo>

          <Campo
            etiqueta="Correo del dueño"
            ayuda="Si no existe, se crea con una contraseña temporal segura que podrás copiar."
          >
            <input
              name="email"
              type="email"
              required
              placeholder="dueno@ejemplo.com"
              className={CLASE_INPUT}
              disabled={pendiente}
            />
          </Campo>

          <Campo etiqueta="Cuenta IBAN (opcional)">
            <input
              name="cuenta_iban"
              maxLength={40}
              placeholder="CR05015202001026284066"
              className={CLASE_INPUT}
              disabled={pendiente}
            />
          </Campo>
        </div>

        <div className="flex gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
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
              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>Crear negocio</span>
          </button>
        </div>
      </form>
    </Drawer>
  );
}

