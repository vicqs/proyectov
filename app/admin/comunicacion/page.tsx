import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, parametro } from "../../../lib/admin/formato";
import { estadoEfectivo } from "../../../lib/negocio-estado";
import {
  enviarComunicadoAction,
} from "../../../actions/admin/comunicacion";
import { AccionForm } from "../../../components/admin/AccionForm";
import { ComunicacionTabs } from "../../../components/admin/ComunicacionTabs";
import { AnunciosAdminSection } from "../../../components/admin/AnunciosAdminSection";
import {
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Celda,
  PaginaAdmin,
  Tabla,
  Tarjeta,
  TextareaConContador,
} from "../../../components/admin/ui";

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
    <AnunciosAdminSection
      anuncios={ordenados}
      conteoPorSegmento={conteoPorSegmento}
    />
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
