"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  Link2,
  MapPin,
  Smartphone,
  Waves,
} from "lucide-react";
import VLogo from "../VLogo";
import MarcaReserva from "../MarcaReserva";

const HORAS = ["09:00", "11:00", "14:00"];

/** Vista ilustrativa local: no consulta negocios, crea reservas ni procesa pagos. */
export default function VistaPreviaProducto() {
  const [vista, setVista] = useState<"cliente" | "empresa">("cliente");
  const [hora, setHora] = useState("09:00");

  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:ml-auto lg:mr-0">
      <div className="mb-6 flex justify-center">
        <div
          role="group"
          aria-label="Seleccionar vista ilustrativa del producto"
          className="inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-xs font-medium backdrop-blur-md"
        >
          {(
            [
              ["cliente", "Vista del cliente", Smartphone],
              ["empresa", "Tu panel", LayoutDashboard],
            ] as const
          ).map(([valor, etiqueta, Icono]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={vista === valor}
              onClick={() => setVista(valor)}
              className={`flex min-h-11 items-center gap-2 rounded-full px-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
                vista === valor
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Icono className="h-3.5 w-3.5" aria-hidden="true" />
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-2.5 shadow-2xl shadow-black/25 backdrop-blur-sm sm:rounded-[2.5rem] sm:p-3">
        <div className="overflow-hidden rounded-[1.4rem] bg-white text-slate-900 sm:rounded-[1.8rem]">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
            </span>
            <span className="mx-auto inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <Link2 className="h-3 w-3" aria-hidden="true" />
              {vista === "cliente"
                ? "Tu enlace de reservas"
                : "Tu espacio de trabajo"}
            </span>
          </div>

          {vista === "cliente" ? (
            <section aria-label="Ejemplo de perfil público de un negocio">
              <div className="relative h-40 sm:h-44">
                <Image
                  src="https://images.unsplash.com/photo-1502933691298-84fc14542831?auto=format&fit=crop&w=900&q=85"
                  alt="Surf en una playa tropical, imagen ilustrativa de un servicio"
                  fill
                  sizes="(max-width: 640px) 90vw, 420px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                <span className="absolute left-5 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 backdrop-blur-sm">
                  Ejemplo de negocio
                </span>
                <div className="absolute -bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-sky-100 text-sky-700 shadow-sm">
                  <Waves className="h-7 w-7" aria-hidden="true" />
                </div>
              </div>
              <div className="px-5 pb-2 pt-8 sm:px-6">
                <h2 className="font-display text-xl font-bold tracking-tight">
                  Pura Vida Surf
                </h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  Tamarindo, Costa Rica
                </p>
                <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">Tu primera ola</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        Clase de surf · 90 min
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sm font-bold text-sky-700">
                      $45
                    </span>
                  </div>
                  <p className="mb-2.5 mt-5 text-xs font-medium text-slate-600">
                    Explora un horario de ejemplo
                  </p>
                  <div
                    role="group"
                    aria-label="Horarios ilustrativos"
                    className="flex gap-2"
                  >
                    {HORAS.map((valor) => (
                      <button
                        key={valor}
                        type="button"
                        aria-pressed={hora === valor}
                        onClick={() => setHora(valor)}
                        className={`vuki-focus min-h-11 flex-1 rounded-xl border px-2 text-xs font-semibold transition ${hora === valor ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {valor}
                      </button>
                    ))}
                  </div>
                  <p
                    aria-live="polite"
                    className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-800"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden="true"
                    />
                    {hora} · Así verían tus clientes la disponibilidad
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section
              aria-label="Ejemplo del panel de empresa"
              className="min-h-[438px] p-5 sm:min-h-[454px] sm:p-6"
            >
              <div className="flex items-center justify-between">
                <VLogo
                  showText
                  className="h-7 w-7"
                  wordmarkClassName="text-2xl"
                />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  Ejemplo
                </span>
              </div>
              <div className="mb-5 mt-7 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Pura Vida Surf</p>
                  <h2 className="font-display text-xl font-bold">
                    Tu agenda, clara.
                  </h2>
                </div>
                <CalendarDays
                  className="h-5 w-5 text-sky-600"
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-xs font-medium text-slate-600">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Una semana de experiencias
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="my-4 grid grid-cols-5 gap-2 text-center">
                {["Lun", "Mar", "Mié", "Jue", "Vie"].map((dia, i) => (
                  <div
                    key={dia}
                    className={`rounded-xl py-2 text-[10px] ${i === 2 ? "bg-sky-50 font-bold text-sky-800 ring-1 ring-sky-100" : "text-slate-500"}`}
                  >
                    {dia}
                    <span className="mt-1 block text-sm font-semibold">
                      {12 + i}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    hora: "09:00",
                    servicio: "Clase de surf",
                    detalle: "2 personas",
                    color: "bg-sky-50 border-sky-200 text-sky-700",
                  },
                  {
                    hora: "11:00",
                    servicio: "Surf en grupo",
                    detalle: "4 personas",
                    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
                  },
                  {
                    hora: "14:00",
                    servicio: "Clase privada",
                    detalle: "1 persona",
                    color: "bg-slate-50 border-slate-200 text-slate-600",
                  },
                ].map((reserva) => (
                  <div
                    key={reserva.hora}
                    className={`flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-3 ${reserva.color}`}
                  >
                    <span className="text-xs font-semibold">
                      {reserva.hora}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800">
                        {reserva.servicio}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-600">
                        {reserva.detalle}
                      </p>
                    </div>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </section>
          )}
          <div className="flex justify-center pb-2 pt-1">
            <MarcaReserva />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-48 hidden items-center gap-3 rounded-2xl border border-white/15 bg-slate-800/90 px-4 py-3 shadow-xl backdrop-blur-lg xl:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-white">
            Todo en un mismo lugar
          </p>
          <p className="mt-0.5 text-[10px] text-slate-300">
            Tu marca. Tus experiencias.
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
        Vista previa ilustrativa. Datos de ejemplo; no crea reservas ni cobros.
      </p>
    </div>
  );
}
