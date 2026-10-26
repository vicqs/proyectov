import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora } from "../../../lib/admin/formato";
import {
  alternarAnuncioAction,
  crearAnuncioAction,
  eliminarAnuncioAction,
  enviarComunicadoAction,
} from "../../../actions/admin/comunicacion";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  CLASE_INPUT,
  Campo,
  Celda,
  Insignia,
  PaginaAdmin,
  Tabla,
  Tarjeta,
  type TonoInsignia,
} from "../../../components/admin/ui";

const TONO: Record<string, TonoInsignia> = {
  info: "azul",
  aviso: "ambar",
  critico: "rojo",
};

const SEGMENTOS = (
  <>
    <option value="todas">Todas las empresas</option>
    <option value="prueba">En prueba</option>
    <option value="activa">Activas</option>
    <option value="inactiva">Inactivas</option>
  </>
);

export default async function ComunicacionPage() {
  await requerirAdmin("comunicacion");
  const [anuncios, comunicados] = await Promise.all([
    leer("anuncios").catch(() => []),
    leer("comunicados").catch(() => []),
  ]);
  const ordenados = [...anuncios].sort((a, b) =>
    b.creado_en.localeCompare(a.creado_en),
  );
  const historial = [...comunicados]
    .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
    .slice(0, 20);

  return (
    <PaginaAdmin
      titulo="Comunicación"
      descripcion="Anuncios dentro del panel de empresa y correos masivos."
    >
      <Tarjeta
        titulo="Nuevo anuncio"
        descripcion="Se muestra en el panel de las empresas del segmento hasta que expire o lo desactives."
      >
        <AccionForm
          accion={crearAnuncioAction}
          boton="Publicar anuncio"
          limpiarAlOk
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Título">
              <input
                name="titulo"
                required
                maxLength={100}
                className={CLASE_INPUT}
              />
            </Campo>
            <Campo etiqueta="Severidad">
              <select
                name="severidad"
                className={CLASE_INPUT}
                defaultValue="info"
              >
                <option value="info">Informativo</option>
                <option value="aviso">Aviso</option>
                <option value="critico">Crítico</option>
              </select>
            </Campo>
            <Campo etiqueta="Segmento">
              <select
                name="segmento"
                className={CLASE_INPUT}
                defaultValue="todas"
              >
                {SEGMENTOS}
              </select>
            </Campo>
            <Campo etiqueta="Expira en (días, 0 = sin fecha)">
              <input
                name="dias"
                type="number"
                min={0}
                max={365}
                defaultValue={7}
                className={CLASE_INPUT}
              />
            </Campo>
          </div>
          <Campo etiqueta="Mensaje">
            <textarea
              name="mensaje"
              required
              rows={3}
              maxLength={600}
              className={CLASE_INPUT}
            />
          </Campo>
        </AccionForm>
      </Tarjeta>

      <Tabla
        columnas={["Anuncio", "Segmento", "Estado", "Expira", "Acciones"]}
        vacia={ordenados.length === 0}
        vacio="Sin anuncios."
      >
        {ordenados.map((a) => (
          <tr key={a.id}>
            <Celda>
              <Insignia tono={TONO[a.severidad] ?? "gris"}>
                {a.severidad}
              </Insignia>
              <p className="mt-1 font-medium text-slate-900">{a.titulo}</p>
              <p className="max-w-md text-xs text-slate-500">{a.mensaje}</p>
            </Celda>
            <Celda>{a.segmento}</Celda>
            <Celda>
              {a.activo ? (
                <Insignia tono="verde">Activo</Insignia>
              ) : (
                <Insignia>Inactivo</Insignia>
              )}
            </Celda>
            <Celda>{a.expira_en ? fechaHora(a.expira_en) : "—"}</Celda>
            <Celda>
              <div className="flex flex-wrap gap-2">
                <AccionForm
                  accion={alternarAnuncioAction.bind(null, a.id, !a.activo)}
                  boton={a.activo ? "Desactivar" : "Activar"}
                  variante="neutro"
                />
                <AccionForm
                  accion={eliminarAnuncioAction.bind(null, a.id)}
                  boton="Eliminar"
                  variante="peligro"
                  confirmar="¿Eliminar este anuncio?"
                />
              </div>
            </Celda>
          </tr>
        ))}
      </Tabla>

      <Tarjeta
        titulo="Enviar comunicado por correo"
        descripcion="Texto plano al dueño de cada negocio del segmento (máximo 200 negocios por envío)."
      >
        <AccionForm
          accion={enviarComunicadoAction}
          boton="Enviar comunicado"
          confirmar="¿Enviar este correo a todo el segmento? No se puede deshacer."
        >
          <Campo etiqueta="Segmento">
            <select
              name="segmento"
              className={`${CLASE_INPUT} sm:w-64`}
              defaultValue="todas"
            >
              {SEGMENTOS}
            </select>
          </Campo>
          <Campo etiqueta="Asunto">
            <input
              name="asunto"
              required
              maxLength={150}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo etiqueta="Mensaje">
            <textarea
              name="mensaje"
              required
              rows={6}
              maxLength={5000}
              className={CLASE_INPUT}
            />
          </Campo>
        </AccionForm>
      </Tarjeta>

      <Tarjeta titulo="Historial de comunicados">
        <Tabla
          columnas={[
            "Fecha",
            "Asunto",
            "Segmento",
            "Enviados",
            "Fallidos",
            "Por",
          ]}
          vacia={historial.length === 0}
          vacio="Aún no se enviaron comunicados."
        >
          {historial.map((c) => (
            <tr key={c.id}>
              <Celda>{fechaHora(c.creado_en)}</Celda>
              <Celda>{c.asunto}</Celda>
              <Celda>{c.segmento}</Celda>
              <Celda>
                {c.enviados}/{c.destinatarios}
              </Celda>
              <Celda>{c.fallidos}</Celda>
              <Celda>{c.creado_por}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </PaginaAdmin>
  );
}
