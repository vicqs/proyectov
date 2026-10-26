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
  CLASE_INPUT,
  Campo,
  PaginaAdmin,
  Tarjeta,
} from "../../../../components/admin/ui";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requerirAdmin("soporte");
  const { id } = await params;
  const ticket = await leerUno("tickets", { eq: { id } });
  if (!ticket) notFound();
  const [mensajes, negocio] = await Promise.all([
    leer("ticket_mensajes", {
      eq: { ticket_id: id },
      orden: ["creado_en", true],
    }),
    leerUno("negocios", { eq: { id: ticket.negocio_id } }),
  ]);

  return (
    <PaginaAdmin
      titulo={ticket.asunto}
      descripcion={
        <>
          {negocio ? (
            <Link
              href={`/admin/negocios/${negocio.id}`}
              className="text-sky-700 hover:underline"
            >
              {negocio.nombre}
            </Link>
          ) : (
            "Negocio eliminado"
          )}{" "}
          · abierto por {ticket.creado_por} · {fechaHora(ticket.creado_en)}
        </>
      }
      accion={
        <Link
          href="/admin/soporte"
          className="text-sm text-sky-700 hover:underline"
        >
          Volver
        </Link>
      }
    >
      <Tarjeta titulo="Estado">
        <AccionForm
          accion={actualizarTicketAction.bind(null, id)}
          boton="Guardar"
          variante="neutro"
          enLinea
        >
          <Campo etiqueta="Estado">
            <select
              name="estado"
              defaultValue={ticket.estado}
              className={`${CLASE_INPUT} sm:w-40`}
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
              className={`${CLASE_INPUT} sm:w-36`}
            >
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </Campo>
        </AccionForm>
      </Tarjeta>

      <Tarjeta titulo="Conversación">
        <ul className="space-y-3">
          {mensajes.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl p-3 text-sm ${m.autor_tipo === "admin" ? "ml-8 bg-sky-50" : "mr-8 bg-slate-50"}`}
            >
              <p className="text-xs text-slate-400">
                {m.autor_tipo === "admin" ? "Soporte" : "Empresa"} ·{" "}
                {m.autor_email} · {fechaHora(m.creado_en)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-slate-800">
                {m.mensaje}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <AccionForm
            accion={responderTicketAdminAction.bind(null, id)}
            boton="Responder"
            limpiarAlOk
          >
            <textarea
              name="mensaje"
              required
              rows={4}
              maxLength={4000}
              className={CLASE_INPUT}
              aria-label="Escribe tu respuesta" placeholder="Escribe tu respuesta"
            />
          </AccionForm>
        </div>
      </Tarjeta>
    </PaginaAdmin>
  );
}
