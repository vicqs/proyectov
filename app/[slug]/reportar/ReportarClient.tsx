"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import { AccionForm } from "@/components/admin/AccionForm";
import PaginaPublica from "@/components/PaginaPublica";
import SelectorIdioma from "@/components/SelectorIdioma";
import { reportarPerfilAction } from "@/actions/reportar";
import { LocaleProvider, useTranslations } from "@/lib/i18n";

const INPUT =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-vuki-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vuki-ocean/20";

interface Props {
  slug: string;
  nombre: string;
}

/** Formulario público de reporte con selector ES/EN (mismo idioma que el perfil). */
export default function ReportarClient(props: Props) {
  return (
    <LocaleProvider>
      <Contenido {...props} />
    </LocaleProvider>
  );
}

function Contenido({ slug, nombre }: Props) {
  const { t, locale } = useTranslations();

  return (
    <PaginaPublica
      titulo={`${t("rep_titulo")} ${nombre}`}
      etiqueta={t("rep_etiqueta")}
      icono={<Flag className="h-4 w-4" />}
      descripcion={t("rep_descripcion")}
      accion={<SelectorIdioma className="border-slate-200 bg-white" />}
      pie={
        <Link
          href={`/${encodeURIComponent(slug)}`}
          className="vuki-focus inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-sky-800 hover:underline"
        >
          {t("rep_volver")}
        </Link>
      }
    >
      <div>
        <AccionForm
          accion={reportarPerfilAction.bind(null, slug)}
          boton={t("rep_enviar")}
          limpiarAlOk
        >
          <input type="hidden" name="idioma" value={locale} />
          <label
            htmlFor="reporte-motivo"
            className="block text-sm font-medium text-slate-700"
          >
            {t("rep_motivo")}
          </label>
          <select
            id="reporte-motivo"
            name="motivo"
            required
            className={INPUT}
            defaultValue="contenido"
          >
            <option value="contenido">{t("rep_m_contenido")}</option>
            <option value="fraude">{t("rep_m_fraude")}</option>
            <option value="suplantacion">{t("rep_m_suplantacion")}</option>
            <option value="otro">{t("rep_m_otro")}</option>
          </select>
          <label
            htmlFor="reporte-detalle"
            className="block text-sm font-medium text-slate-700"
          >
            {t("rep_detalles")}
          </label>
          <textarea
            id="reporte-detalle"
            name="detalle"
            rows={4}
            maxLength={1000}
            placeholder={t("rep_detalles")}
            className={INPUT}
          />
          <label
            htmlFor="reporte-email"
            className="block text-sm font-medium text-slate-700"
          >
            {t("rep_correo")}
          </label>
          <input
            id="reporte-email"
            name="email"
            type="email"
            placeholder={t("rep_correo")}
            className={INPUT}
          />
        </AccionForm>
      </div>
    </PaginaPublica>
  );
}

