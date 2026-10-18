import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { leer } from "@/lib/admin/db";
import { fechaHora } from "@/lib/admin/formato";
import { crearTicketAction, responderTicketAction } from "@/actions/soporte";
import { AccionForm } from "@/components/admin/AccionForm";
import EmpresaPage from "@/components/EmpresaPage";
import { notFound } from "next/navigation";
import { funcionActivaNegocio } from "@/lib/plataforma";

const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none";

export default async function SoportePage({ params }: EmpresaPageProps) {
  const { slug } = await params;
  const { negocio } = await requerirEmpresa(slug);
  if (!(await funcionActivaNegocio(negocio, "soporte_empresas"))) notFound();
  const tickets = (
    await leer("tickets", { eq: { negocio_id: negocio.id } })
  ).sort((a, b) => b.actualizado_en.localeCompare(a.actualizado_en));
  const mensajes = await Promise.all(
    tickets.map((t) =>
      leer("ticket_mensajes", {
        eq: { ticket_id: t.id },
        orden: ["creado_en", true],
      }),
    ),
  );

  return (
    <EmpresaPage
      titulo="Soporte"
      descripcion="Escríbenos si necesitas ayuda con tu cuenta."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Nuevo ticket
          </h2>
          <div className="mt-4">
            <AccionForm
              accion={crearTicketAction.bind(null, slug)}
              boton="Enviar"
              limpiarAlOk
            >
              <input
                name="asunto"
                required
                maxLength={150}
                placeholder="Asunto"
                className={INPUT}
              />
              <textarea
                name="mensaje"
                required
                rows={5}
                maxLength={4000}
                placeholder="Cuéntanos qué ocurre"
                className={INPUT}
              />
            </AccionForm>
          </div>
        </section>

        <section className="space-y-4">
          {tickets.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              Aún no has abierto tickets.
            </p>
          )}
          {tickets.map((t, i) => (
            <details
              key={t.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                {t.asunto}{" "}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {t.estado.replace("_", " ")}
                </span>
              </summary>
              <ul className="mt-4 space-y-3">
                {mensajes[i].map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-xl p-3 text-sm ${m.autor_tipo === "admin" ? "bg-sky-50" : "bg-slate-50"}`}
                  >
                    <p className="text-xs text-slate-400">
                      {m.autor_tipo === "admin" ? "Soporte" : "Tú"} ·{" "}
                      {fechaHora(m.creado_en)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800">
                      {m.mensaje}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <AccionForm
                  accion={responderTicketAction.bind(null, slug, t.id)}
                  boton="Responder"
                  variante="neutro"
                  limpiarAlOk
                >
                  <textarea
                    name="mensaje"
                    required
                    rows={3}
                    maxLength={4000}
                    placeholder="Escribe un mensaje"
                    className={INPUT}
                  />
                </AccionForm>
              </div>
            </details>
          ))}
        </section>
      </div>
    </EmpresaPage>
  );
}
