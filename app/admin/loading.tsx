export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="mx-auto max-w-7xl animate-pulse space-y-4 px-4 py-6 motion-reduce:animate-none sm:px-8 sm:py-8"
    >
      <div className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 to-emerald-50/60 p-6 sm:p-8">
        <div className="h-3 w-36 rounded bg-sky-200/70" />
        <div className="mt-4 h-8 w-64 max-w-full rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-3xl border border-sky-100 bg-white p-5"
          >
            <div className="h-8 w-8 rounded-xl bg-sky-100" />
            <div className="mt-3 h-4 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-3xl border border-sky-100 bg-white" />
    </div>
  );
}
