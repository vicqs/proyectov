/**
 * Esqueleto de carga instantánea mientras se consulta el detalle de la
 * reserva del turista por token en Supabase.
 */
export default function ReservaPublicaLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Cargando tu reserva"
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4 py-12"
    >
      <div className="w-full max-w-md animate-pulse rounded-3xl border border-sky-100 bg-white p-6 shadow-sm motion-reduce:animate-none sm:p-8">
        <div className="h-4 w-36 rounded bg-sky-100" />
        <div className="mt-4 h-7 w-48 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-64 max-w-full rounded bg-slate-100" />

        <div className="mt-6 space-y-3 rounded-2xl border border-sky-100 bg-sky-50/30 p-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between gap-4 py-1.5">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="mt-6 h-12 w-full rounded-2xl bg-slate-100" />
      </div>
    </main>
  );
}

