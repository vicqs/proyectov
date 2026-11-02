import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, parametro } from "../../../lib/admin/formato";
import { estadoEfectivo } from "../../../lib/negocio-estado";
import {
  alternarAnuncioAction,
  crearAnuncioAction,
  eliminarAnuncioAction,
  enviarComunicadoAction,
} from "../../../actions/admin/comunicacion";
import { AccionForm } from "../../../components/admin/AccionForm";
import { ComunicacionTabs } from "../../../components/admin/ComunicacionTabs";
import {
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Celda,
  Insignia,
  PaginaAdmin,
  Tabla,
  Tarjeta,
  TextareaConContador,
  type TonoInsignia,
} from "../../../components/admin/ui";

const TONO: Record<string, TonoInsignia> = {
  info: "azul",
  aviso: "ambar",
  critico: "rojo",
};

const ETIQUETAS_SEVERIDAD: Record<string, string> = {
  info: "Informativo",
  aviso: "Aviso",
  critico: "Crítico",
};

export default async function ComunicacionPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("comunicacion");
  const sp = searchParams ? await searchParams : {};
  const tabParam = parametro(sp?.tab);
  const tabInicial = tabParam === "comunicados" ? "comunicados" : "anuncios";

  const [anuncios, comunicados, negocios] = await Promise.all([
    leer("anuncios").catch(() => []),
    leer("comunicados").catch(() => []),
    leer("negocios").catch(() => []),
  ]);

  const vivos = negocios.filter((n) => !n.eliminado_en);
  const conteoPorSegmento = {
    todas: vivos.length,
    activa: vivos.filter((n) => estadoEfectivo(n) === "activa").length,
    prueba: vivos.filter((n) => estadoEfectivo(n) === "prueba").length,
    inactiva: vivos.filter((n) => estadoEfectivo(n) === "inactiva").length,
  };

  const ordenados = [...anuncios].sort((a, b) =>
    b.creado_en.localeCompare(a.creado_en),
  );
  const historial = [...comunicados]
    .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
    .slice(0, 20);

  const SEGMENTOS = (
    <>
      <option value="todas">
        Todas las empresas ({conteoPorSegmento.todas})
      </option>
      <option value="activa">
        Activas ({conteoPorSegmento.activa})
      </option>
      <option value="prueba">
        En prueba ({conteoPorSegmento.prueba})
      </option>
      <option value="inactiva">
        Inactivas ({conteoPorSegmento.inactiva})
      </option>
    </>
  );

  const anunciosContent = (
    <div className="space-y-6">
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
                placeholder="Ej. Mantenimiento programado"
                className={CLASE_INPUT}
              />
            </Campo>
            <Campo etiqueta="Severidad">
              <select
                name="severidad"
                className={`${CLASE_SELECT} w-full`}
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
                className={`${CLASE_SELECT} w-full`}
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
            <TextareaConContador
              name="mensaje"
              required
              rows={3}
              maxLength={600}
              placeholder="Detalle del anuncio visible para los negocios..."
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
              <div className="flex items-center gap-2">
                <Insignia tono={TONO[a.severidad] ?? "gris"}>
                  {ETIQUETAS_SEVERIDAD[a.severidad] ?? a.severidad}
                </Insignia>
                <p className="font-semibold text-slate-900">{a.titulo}</p>
              </div>
              <p className="mt-1 max-w-xl whitespace-pre-wrap text-xs text-slate-600">
                {a.mensaje}
              </p>
            </Celda>
            <Celda className="capitalize">{a.segmento}</Celda>
            <Celda>
              <Insignia tono={a.activo ? "verde" : "gris"}>
                {a.activo ? "Activo" : "Inactivo"}
              </Insignia>
            </Celda>
            <Celda>{a.expira_en ? fechaHora(a.expira_en) : "Nunca"}</Celda>
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
                  confirmar="¿Eliminar este anuncio definitivamente?"
                />
              </div>
            </Celda>
          </tr>
        ))}
      </Tabla>
    </div>
  );

  const comunicadosContent = (
    <div className="space-y-6">
      <Tarjeta
        titulo="Enviar comunicado por correo"
        descripcion="Texto plano al dueño de cada negocio del segmento (máximo 200 negocios por envío)."
      >
        <AccionForm
          accion={enviarComunicadoAction}
          boton="Enviar comunicado"
          confirmar="¿Enviar este correo a todo el segmento seleccionado? No se puede deshacer."
        >
          <Campo etiqueta="Segmento destinatario">
            <select
              name="segmento"
              className={CLASE_SELECT}
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
              placeholder="Asunto del comunicado"
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo etiqueta="Mensaje">
            <TextareaConContador
              name="mensaje"
              required
              rows={6}
              maxLength={5000}
              placeholder="Escribe el mensaje que recibirán los dueños de las empresas..."
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
              <Celda className="font-medium text-slate-900">{c.asunto}</Celda>
              <Celda className="capitalize">{c.segmento}</Celda>
              <Celda>
                {c.enviados}/{c.destinatarios}
              </Celda>
              <Celda>
                <span className={c.fallidos > 0 ? "text-red-600 font-semibold" : ""}>
                  {c.fallidos}
                </span>
              </Celda>
              <Celda>{c.creado_por}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </div>
  );

  return (
    <PaginaAdmin
      titulo="Comunicación"
      descripcion="Anuncios dentro del panel de empresa y correos masivos."
    >
      <ComunicacionTabs
        tabInicial={tabInicial}
        conteoAnuncios={ordenados.length}
        conteoComunicados={comunicados.length}
        anunciosContent={anunciosContent}
        comunicadosContent={comunicadosContent}
      />
    </PaginaAdmin>
  );
}
