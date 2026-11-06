import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAdmin } from "../../../../lib/admin/auth";
import { leer, leerUno } from "../../../../lib/admin/db";
import { fechaHora } from "../../../../lib/admin/formato";
import {
  actualizarTicketAction,
  responderTicketAdminAction,
} from "../../../../actions/admin/soporte";
import { AccionForm } from "../../../../components/admin/AccionForm";
import {
  CLASE_BOTON_NEUTRO,
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  PaginaAdmin,
  Tarjeta,
  TextareaConContador,
} from "../../../../components/admin/ui";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requerirAdmin("soporte");
  const { id } = await params;
  const [ticketConNegocio, mensajes] = await Promise.all([
    leerUno("tickets", { eq: { id } }).then(async (ticket) => {
      if (!ticket) return null;
      const negocio = await leerUno("negocios", { eq: { id: ticket.negocio_id } });
      return { ticket, negocio };
    }),
    leer("ticket_mensajes", {
      eq: { ticket_id: id },
      orden: ["creado_en", true],
    }),
  ]);
  if (!ticketConNegocio) notFound();
  const { ticket, negocio } = ticketConNegocio;

  return (
    <PaginaAdmin
      titulo={`Ticket #${ticket.id.slice(0, 8)}: ${ticket.asunto}`}
      descripcion={
        <span>
          De {ticket.creado_por} ·{" "}
          {negocio ? (
            <Link
              href={`/admin/negocios/${negocio.id}`}
              className="text-sky-700 hover:underline font-semibold"
            >
              {negocio.nombre}
            </Link>
          ) : (
            "—"
          )}
        </span>
      }
      accion={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/soporte" className={CLASE_BOTON_NEUTRO}>
            ← Volver a soporte
          </Link>
          {negocio && (
            <Link
              href={`/admin/negocios/${negocio.id}`}
              className={CLASE_BOTON_NEUTRO}
            >
              Ficha negocio ↗
            </Link>
          )}
        </div>
      }
    >
      <Tarjeta titulo="Estado del ticket">
        <AccionForm
          accion={actualizarTicketAction.bind(null, id)}
          boton="Guardar estado"
          variante="neutro"
          enLinea
        >
          <Campo etiqueta="Estado">
            <select
              name="estado"
              defaultValue={ticket.estado}
              className={CLASE_SELECT}
            >
              <option value="abierto">Abierto</option>
              <option value="en_curso">En curso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </Campo>
          <Campo etiqueta="Prioridad">
            <select
              name="prioridad"
              defaultValue={ticket.prioridad}
              className={CLASE_SELECT}
            >
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </Campo>
        </AccionForm>
      </Tarjeta>

      <Tarjeta titulo="Conversación">
        {mensajes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Este ticket aún no tiene mensajes registrados.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Envía una respuesta abajo para iniciar la conversación con la empresa.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {mensajes.map((m) => (
              <li
                key={m.id}
                className={`rounded-2xl p-4 text-sm ${
                  m.autor_tipo === "admin"
                    ? "ml-6 sm:ml-12 border border-sky-100 bg-sky-50/70"
                    : "mr-6 sm:mr-12 border border-slate-200 bg-slate-50/70"
                }`}
              >
                <p className="text-xs font-semibold text-slate-500">
                  {m.autor_tipo === "admin" ? "🛡️ Soporte vuki" : "🏢 Empresa"} ·{" "}
                  {m.autor_email} · {fechaHora(m.creado_en)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {m.mensaje}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Responder al cliente
          </h3>
          <AccionForm
            accion={responderTicketAdminAction.bind(null, id)}
            boton="Enviar respuesta"
            limpiarAlOk
          >
            <TextareaConContador
              name="mensaje"
              required
              rows={4}
              maxLength={4000}
              aria-label="Escribe tu respuesta"
              placeholder="Escribe tu respuesta a la empresa..."
            />
          </AccionForm>
        </div>
      </Tarjeta>
    </PaginaAdmin>
  );
}
