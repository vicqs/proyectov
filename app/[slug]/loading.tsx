/**
 * Esqueleto de carga instantánea para el perfil público del negocio (`/[slug]`).
 * Se muestra de inmediato mientras el servidor consulta el negocio, sus
 * servicios y la disponibilidad en Supabase.
 */
export default function NegocioPublicLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Cargando perfil del negocio"
      className="min-h-screen animate-pulse bg-white pb-24 motion-reduce:animate-none"
    >
      {/* Portada del negocio (idéntica a NegocioProfileClient) */}
      <div className="relative h-[30vh] min-h-[220px] w-full bg-slate-200" />

      <div className="relative mx-auto -mt-16 max-w-md px-6 sm:max-w-xl sm:px-8">
        {/* Logotipo */}
        <div className="h-28 w-28 shrink-0 rounded-3xl border-4 border-white bg-slate-200 shadow-xl sm:h-32 sm:w-32" />

        {/* Nombre y descripción */}
        <div className="mt-8 space-y-3">
          <div className="h-9 w-64 max-w-full rounded-xl bg-slate-200" />
          <div className="h-1 w-16 rounded-full bg-slate-200" />
          <div className="h-4 w-full max-w-md rounded bg-slate-100" />
          <div className="h-4 w-4/5 max-w-sm rounded bg-slate-100" />
        </div>

        {/* Catálogo de servicios (grid 1 col en móvil, 2 cols en sm+) */}
        <section className="mt-14">
          <div className="mb-6 h-4 w-44 rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="h-48 w-full bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="h-3.5 w-full rounded bg-slate-100" />
                  <div className="h-10 w-full rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

