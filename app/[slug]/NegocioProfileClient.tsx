"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, DollarSign } from "lucide-react";
import type { MockNegocio, MockServicio } from "../../lib/mockData";
import CheckoutMock from "../../components/CheckoutMock";

interface NegocioProfileClientProps {
  negocio: MockNegocio;
}

/**
 * Vista interactiva del perfil público (Client Component): tarjetas de
 * servicios + apertura del modal de checkout simulado. Se separa del
 * `page.tsx` (Server Component) para poder seguir exportando
 * `generateMetadata` (SEO/Open Graph) desde el servidor.
 */
export default function NegocioProfileClient({
  negocio,
}: NegocioProfileClientProps) {
  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<MockServicio | null>(null);

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* Header con portada + logo */}
      <div className="relative h-48 w-full sm:h-64">
        <Image
          src={negocio.portadaUrl}
          alt={`Portada de ${negocio.nombre}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>

      <div className="relative mx-auto -mt-12 max-w-md px-4 sm:max-w-lg">
        <div className="flex items-end gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-md sm:h-24 sm:w-24">
            <Image
              src={negocio.logoUrl}
              alt={`Logo de ${negocio.nombre}`}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        </div>

        <header className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {negocio.nombre}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {negocio.descripcion}
          </p>
        </header>

        <section className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Servicios disponibles
          </h2>

          {negocio.servicios.map((servicio) => (
            <button
              key={servicio.id}
              type="button"
              onClick={() => setServicioSeleccionado(servicio)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              style={{ borderColor: undefined }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {servicio.nombre}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {servicio.descripcion}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-slate-400" />$
                  {servicio.precioUsd.toFixed(2)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {servicio.duracionMin} min
                </span>
              </div>

              <span
                className="mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: negocio.colorTema }}
              >
                Reservar
              </span>
            </button>
          ))}
        </section>
      </div>

      {servicioSeleccionado && (
        <CheckoutMock
          servicio={servicioSeleccionado}
          negocioNombre={negocio.nombre}
          onClose={() => setServicioSeleccionado(null)}
        />
      )}
    </main>
  );
}
