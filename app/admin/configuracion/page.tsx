import { render } from "@react-email/components";
import { requerirAdmin } from "../../../lib/admin/auth";
import { FLAGS_CONOCIDOS, obtenerConfiguracion } from "../../../lib/plataforma";
import { aplicarVariables } from "../../../lib/email";
import ReciboTurista from "../../../emails/ReciboTurista";
import AlertaPyme from "../../../emails/AlertaPyme";
import {
  guardarGeneralAction,
  guardarLegalAction,
  guardarPlantillasAction,
} from "../../../actions/admin/configuracion";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  CLASE_INPUT,
  Campo,
  PaginaAdmin,
  Tarjeta,
} from "../../../components/admin/ui";

export default async function ConfiguracionPage() {
  await requerirAdmin("configuracion");
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

  return (
    <PaginaAdmin
      titulo="Configuración global"
      descripcion="Los cambios afectan a todos los negocios de inmediato."
    >
      <Tarjeta titulo="General, límites y funciones">
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
            <textarea
              name="slugs_reservados"
              rows={2}
              defaultValue={c.slugs_reservados.join(", ")}
              className={CLASE_INPUT}
            />
          </Campo>
          <fieldset className="space-y-2 rounded-xl border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-700">
              Funciones
            </legend>
            {FLAGS_CONOCIDOS.map((f) => (
              <label key={f.clave} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`flag_${f.clave}`}
                  defaultChecked={c.flags[f.clave] ?? true}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium text-slate-800">
                    {f.etiqueta}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {f.ayuda}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <legend className="px-1 text-sm font-medium text-amber-800">
              Modo mantenimiento
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="modo_mantenimiento"
                defaultChecked={c.modo_mantenimiento}
              />
              Bloquear reservas y paneles de empresa (el área admin sigue
              disponible)
            </label>
            <input
              name="mensaje_mantenimiento"
              maxLength={300}
              defaultValue={c.mensaje_mantenimiento ?? ""}
              aria-label="Mensaje para los usuarios" placeholder="Mensaje para los usuarios"
              className={CLASE_INPUT}
            />
          </fieldset>
        </AccionForm>
      </Tarjeta>

      <Tarjeta
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
                  <textarea
                    name={`${clave}_encabezado`}
                    rows={2}
                    maxLength={500}
                    defaultValue={p.encabezado ?? ""}
                    className={CLASE_INPUT}
                  />
                </Campo>
                <Campo etiqueta="Texto adicional al final">
                  <textarea
                    name={`${clave}_pie`}
                    rows={2}
                    maxLength={500}
                    defaultValue={p.pie ?? ""}
                    className={CLASE_INPUT}
                  />
                </Campo>
                <p className="text-xs text-slate-400">
                  Vista previa con los valores guardados:
                </p>
                <iframe
                  title={`Vista previa ${titulo}`}
                  sandbox=""
                  srcDoc={html}
                  className="h-96 w-full rounded-xl border border-slate-200 bg-white"
                />
              </div>
            ))}
          </div>
        </AccionForm>
      </Tarjeta>

      <Tarjeta
        titulo="Textos legales"
        descripcion="Si dejas un campo vacío se muestra el texto por defecto. Se renderiza como texto plano; revísalo con un abogado."
      >
        <AccionForm accion={guardarLegalAction} boton="Guardar textos">
          <Campo etiqueta="Términos y condiciones">
            <textarea
              name="terminos_texto"
              rows={8}
              maxLength={30000}
              defaultValue={c.terminos_texto ?? ""}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo etiqueta="Política de privacidad">
            <textarea
              name="privacidad_texto"
              rows={8}
              maxLength={30000}
              defaultValue={c.privacidad_texto ?? ""}
              className={CLASE_INPUT}
            />
          </Campo>
        </AccionForm>
      </Tarjeta>
    </PaginaAdmin>
  );
}
