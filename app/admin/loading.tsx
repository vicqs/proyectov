export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="mx-auto max-w-7xl animate-pulse space-y-4 px-4 py-8 sm:px-8"
    >
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="h-4 w-72 max-w-full rounded bg-slate-200" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200" />
    </div>
  );
}
