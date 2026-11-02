import { render } from "@react-email/components";
import { requerirAdmin } from "../../../lib/admin/auth";
import { FLAGS_CONOCIDOS, obtenerConfiguracion } from "../../../lib/plataforma";
import { aplicarVariables } from "../../../lib/email";
import { parametro } from "../../../lib/admin/formato";
import ReciboTurista from "../../../emails/ReciboTurista";
import AlertaPyme from "../../../emails/AlertaPyme";
import {
  guardarGeneralAction,
  guardarLegalAction,
  guardarPlantillasAction,
} from "../../../actions/admin/configuracion";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  ConfiguracionTabs,
  type TabConfiguracion,
} from "../../../components/admin/ConfiguracionTabs";
import { BloqueMantenimiento } from "../../../components/admin/BloqueMantenimiento";
import { VistaPreviaEmail } from "../../../components/admin/VistaPreviaEmail";
import {
  CLASE_CHECKBOX,
  CLASE_INPUT,
  Campo,
  PaginaAdmin,
  Tarjeta,
  TextareaConContador,
} from "../../../components/admin/ui";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("configuracion");
  const sp = searchParams ? await searchParams : {};
  const tabParam = parametro(sp?.tab);
  const tabInicial: TabConfiguracion =
    tabParam === "plantillas"
      ? "plantillas"
      : tabParam === "legales"
        ? "legales"
        : "general";

  const c = await obtenerConfiguracion();
  const vars = {
    negocio: "Escuela de Surf Pura Vida",
    servicio: "Clase de surf 1h",
  };
  const pr = c.plantillas_correo.recibo ?? {};
  const pa = c.plantillas_correo.alerta ?? {};
  const fecha = new Date(Date.now() + 3 * 86_400_000).toISOString();

  const [htmlRecibo, htmlAlerta] = await Promise.all([
    render(
      ReciboTurista({
        negocioNombre: vars.negocio,
        servicioNombre: vars.servicio,
        fechaHora: fecha,
        montoUsd: 45,
        trxId: "trx_ejemplo_123",
        emailCliente: "turista@example.com",
        encabezado: pr.encabezado
          ? aplicarVariables(pr.encabezado, vars)
          : undefined,
        pie: pr.pie ? aplicarVariables(pr.pie, vars) : undefined,
      }),
    ),
    render(
      AlertaPyme({
        negocioNombre: vars.negocio,
        servicioNombre: vars.servicio,
        fechaHora: fecha,
        emailCliente: "turista@example.com",
        montoUsd: 45,
        encabezado: pa.encabezado
          ? aplicarVariables(pa.encabezado, vars)
          : undefined,
        pie: pa.pie ? aplicarVariables(pa.pie, vars) : undefined,
      }),
    ),
  ]);

  const generalContent = (
    <Tarjeta
      id="general"
      titulo="General, límites y funciones"
      descripcion="Ajustes globales de cupos, límites multimedia y funciones activas."
    >
      <AccionForm accion={guardarGeneralAction} boton="Guardar configuración">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Días de prueba (nuevos negocios)">
            <input
              name="dias_prueba"
              type="number"
              min={0}
              max={90}
              defaultValue={c.dias_prueba}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo etiqueta="Cupos máximos por horario">
            <input
              name="max_cupos_horario"
              type="number"
              min={1}
              max={10000}
              defaultValue={c.max_cupos_horario}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo etiqueta="Tamaño máximo de imagen (MB)">
            <input
              name="max_imagen_mb"
              type="number"
              step="0.1"
              min={0.1}
              max={20}
              defaultValue={c.max_imagen_mb}
              className={CLASE_INPUT}
            />
          </Campo>
        </div>
        <Campo
          etiqueta="Slugs reservados adicionales"
          ayuda="Separados por coma o espacio. Se suman a los de la plataforma."
        >
          <TextareaConContador
            name="slugs_reservados"
            rows={2}
            maxLength={500}
            defaultValue={c.slugs_reservados.join(", ")}
          />
        </Campo>
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-slate-700">
            Funciones globales de la plataforma
          </span>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {FLAGS_CONOCIDOS.map((f) => (
              <label
                key={f.clave}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  name={`flag_${f.clave}`}
                  defaultChecked={c.flags[f.clave] ?? true}
                  className={`${CLASE_CHECKBOX} mt-0.5`}
                />
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">
                    {f.etiqueta}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 leading-relaxed">
                    {f.ayuda}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
        <BloqueMantenimiento
          modoMantenimientoInicial={c.modo_mantenimiento}
          mensajeInicial={c.mensaje_mantenimiento}
        />
      </AccionForm>
    </Tarjeta>
  );

  const plantillasContent = (
    <Tarjeta
      id="plantillas"
      titulo="Plantillas de correo"
      descripcion="Variables disponibles: {{negocio}} y {{servicio}}. Vacío = texto por defecto."
    >
      <AccionForm accion={guardarPlantillasAction} boton="Guardar plantillas">
        <div className="grid gap-6 xl:grid-cols-2">
          {(
            [
              ["recibo", "Recibo al turista", pr, htmlRecibo],
              ["alerta", "Alerta a la empresa", pa, htmlAlerta],
            ] as const
          ).map(([clave, titulo, p, html]) => (
            <div key={clave} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">
                {titulo}
              </h3>
              <Campo etiqueta="Asunto">
                <input
                  name={`${clave}_asunto`}
                  maxLength={150}
                  defaultValue={p.asunto ?? ""}
                  className={CLASE_INPUT}
                />
              </Campo>
              <Campo etiqueta="Texto adicional al inicio">
                <TextareaConContador
                  name={`${clave}_encabezado`}
                  rows={2}
                  maxLength={500}
                  defaultValue={p.encabezado ?? ""}
                />
              </Campo>
              <Campo etiqueta="Texto adicional al final">
                <TextareaConContador
                  name={`${clave}_pie`}
                  rows={2}
                  maxLength={500}
                  defaultValue={p.pie ?? ""}
                />
              </Campo>
              <p className="text-xs text-slate-400">
                Vista previa con los valores guardados:
              </p>
              <VistaPreviaEmail titulo={titulo} html={html} />
            </div>
          ))}
        </div>
      </AccionForm>
    </Tarjeta>
  );

  const legalesContent = (
    <Tarjeta
      id="legales"
      titulo="Textos legales"
      descripcion="Si dejas un campo vacío se muestra el texto por defecto. Se renderiza como texto plano; revísalo con un abogado."
    >
      <AccionForm accion={guardarLegalAction} boton="Guardar textos">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Campo etiqueta="Términos y condiciones">
            <TextareaConContador
              name="terminos_texto"
              rows={14}
              maxLength={30000}
              defaultValue={c.terminos_texto ?? ""}
            />
          </Campo>
          <Campo etiqueta="Política de privacidad">
            <TextareaConContador
              name="privacidad_texto"
              rows={14}
              maxLength={30000}
              defaultValue={c.privacidad_texto ?? ""}
            />
          </Campo>
        </div>
      </AccionForm>
    </Tarjeta>
  );

  return (
    <PaginaAdmin
      titulo="Configuración global"
      descripcion="Los cambios afectan a todos los negocios de inmediato."
    >
      <ConfiguracionTabs
        tabInicial={tabInicial}
        generalContent={generalContent}
        plantillasContent={plantillasContent}
        legalesContent={legalesContent}
      />
    </PaginaAdmin>
  );
}
