/**
 * Esqueleto de carga instantánea para la pantalla de pago simulado.
 */
export default function PagoSimuladoLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Cargando resumen de pago"
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4 py-12"
    >
      <div className="w-full max-w-md animate-pulse rounded-3xl border border-sky-100 bg-white p-6 shadow-sm motion-reduce:animate-none sm:p-8">
        <div className="h-4 w-44 rounded bg-sky-100" />
        <div className="mt-4 h-7 w-52 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-40 rounded bg-slate-100" />

        <div className="my-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
          <div className="h-3 w-24 rounded bg-emerald-200/70" />
          <div className="mt-2 h-8 w-32 rounded-lg bg-emerald-200/80" />
        </div>

        <div className="mb-5 h-3 w-56 rounded bg-slate-100" />
        <div className="h-12 w-full rounded-xl bg-slate-200" />
        <div className="mt-2 h-12 w-full rounded-xl bg-slate-100" />
      </div>
    </main>
  );
}

