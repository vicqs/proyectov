/** Esqueleto instantáneo mientras carga cada página del panel. */
export default function EmpresaLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Cargando sección del panel"
      className="mx-auto w-full min-w-0 max-w-7xl animate-pulse px-4 py-6 motion-reduce:animate-none sm:px-8 sm:py-8 lg:px-10"
    >
      <div className="h-7 w-52 rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-lg bg-slate-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-200/80 bg-white p-5"
          >
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-7 w-20 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-24 rounded-2xl border border-slate-200/80 bg-white" />
        <div className="h-24 rounded-2xl border border-slate-200/80 bg-white" />
        <div className="h-24 rounded-2xl border border-slate-200/80 bg-white" />
      </div>
    </main>
  );
}
