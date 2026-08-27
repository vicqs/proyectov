export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">
        Turismo Link — Reservas y pagos en un solo enlace
      </h1>
      <p className="max-w-md text-slate-500">
        Visita el enlace de tu pyme favorita (ej.{" "}
        <code>/mi-escuela-de-surf</code>) para ver sus servicios y reservar.
      </p>
    </main>
  );
}
