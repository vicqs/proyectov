/** Esqueleto instantáneo mientras carga cada página del panel. */
export default function AdminLoading() {
  return (
    <main
      className="mx-auto max-w-6xl animate-pulse px-6 py-12 sm:px-10 2xl:max-w-7xl"
      aria-busy="true"
      aria-label="Cargando"
    >
      <div className="h-7 w-48 rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-72 rounded-lg bg-slate-100" />
      <div className="mt-8 space-y-3">
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="h-20 rounded-2xl bg-slate-100" />
      </div>
    </main>
  );
}
