"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { motion } from "framer-motion";
import { mockNegocio } from "../../../../lib/mockData";
import {
  actualizarPersonalizacion,
  useDemoStore,
} from "../../../../lib/demoStore";
import AdminPage from "../../../../components/AdminPage";
import { toast } from "../../../../components/Toast";

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none";

/** Personalización del panel simulado: nombre, biografía, color e imágenes (URL). */
export default function AdminDemoPersonalizacionPage() {
  const { personalizacion } = useDemoStore(mockNegocio.slug);
  const [form, setForm] = useState(personalizacion);

  function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!/^#[0-9a-fA-F]{6}$/.test(form.colorTema)) {
      toast.error("El color debe estar en formato HEX (ej. #0284c7)");
      return;
    }
    actualizarPersonalizacion(mockNegocio.slug, form);
    toast.success("Personalización guardada correctamente.");
  }

  return (
    <AdminPage
      titulo="Personalización"
      descripcion={
        <>
          Configura cómo se ve tu perfil público en{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">
            /demo/{mockNegocio.slug}
          </code>
          .
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="nombre"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Nombre del negocio
          </label>
          <input
            id="nombre"
            required
            minLength={2}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className={INPUT}
          />
        </div>

        <div>
          <label
            htmlFor="descripcion"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Biografía del negocio
          </label>
          <textarea
            id="descripcion"
            rows={4}
            maxLength={1000}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Cuéntale al turista qué hace especial a tu negocio..."
            className={INPUT}
          />
        </div>

        <div>
          <label
            htmlFor="color_tema"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Color de marca
          </label>
          <div className="flex items-center gap-3">
            <input
              id="color_tema"
              type="color"
              value={form.colorTema}
              onChange={(e) => setForm({ ...form, colorTema: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
            />
            <span className="text-sm text-slate-500">
              Este color se usará como acento en tu perfil público.
            </span>
          </div>
        </div>

        {(
          [
            ["logoUrl", "URL del logotipo"],
            ["portadaUrl", "URL de la imagen de portada"],
          ] as const
        ).map(([campo, etiqueta]) => (
          <div key={campo}>
            <label
              htmlFor={campo}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              {etiqueta}
            </label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {form[campo] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form[campo]}
                    alt={etiqueta}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <input
                id={campo}
                value={form[campo]}
                onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                placeholder="https://..."
                className={INPUT}
              />
            </div>
          </div>
        ))}

        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <Save className="h-4 w-4" />
          Guardar cambios
        </motion.button>
      </form>
    </AdminPage>
  );
}
