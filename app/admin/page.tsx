import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  LifeBuoy,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { requerirAdmin } from "../../lib/admin/auth";
import { contar } from "../../lib/admin/db";
import {
  calcularMrr,
  cargarPlataforma,
  indexar,
  montoReserva,
} from "../../lib/admin/datos";
import { tienePermiso } from "../../lib/roles";
import { estadoEfectivo } from "../../lib/negocio-estado";
import { fechaCorta, pluralizar, usd } from "../../lib/admin/formato";
import { esCobroPasarela } from "../../lib/pagos";
import {
  Celda,
  Estadistica,
  PaginaAdmin,
  Tabla,
  Tarjeta,
} from "../../components/admin/ui";
import { InsigniaNegocio } from "../../components/admin/InsigniaNegocio";

export default async function AdminResumenPage() {
  const admin = await requerirAdmin("dashboard");
  const puedeSoporte = tienePermiso(admin.rol, "soporte");
  const puedeModeracion = tienePermiso(admin.rol, "moderacion");
  const puedeSistema = tienePermiso(admin.rol, "sistema");
  const puedeGestionarNegocios = tienePermiso(admin.rol, "negocios_gestionar");
  const [
    { negocios, servicios, reservas, planes },
    ticketsAbiertos,
    reportesPendientes,
    erroresSinResolver,
  ] = await Promise.all([
    cargarPlataforma(),
    puedeSoporte
      ? contar("tickets", { en: { estado: ["abierto", "en_curso"] } }).catch(
          () => 0,
        )
      : Promise.resolve(0),
    puedeModeracion
      ? contar("reportes_perfil", { eq: { estado: "pendiente" } }).catch(
          () => 0,
        )
      : Promise.resolve(0),
    puedeSistema
      ? contar("registro_sistema", {
          eq: { estado: "error", resuelto: false },
        }).catch(() => 0)
      : Promise.resolve(0),
  ]);

  const vivos = negocios.filter((n) => !n.eliminado_en);
  const hace30 = Date.now() - 30 * 86_400_000;
  const porEstado = { activa: 0, prueba: 0, inactiva: 0 };
  let suspendidos = 0;
  for (const n of vivos) {
    if (n.suspendido) suspendidos++;
    porEstado[estadoEfectivo(n)]++;
  }
  const nuevos30 = vivos.filter(
    (n) => n.creado_en && new Date(n.creado_en).getTime() >= hace30,
  ).length;

  const idxServicios = indexar(servicios);
  const pagadas = reservas.filter((r) => r.estado === "pagada");
  const ingresos30 = reservas
    .filter(esCobroPasarela)
    .filter((r) => new Date(r.fecha_hora).getTime() >= hace30)
    .reduce((a, r) => a + montoReserva(r, idxServicios), 0);

  const mostrarAtencion = puedeSoporte || puedeModeracion || puedeSistema;
  const atencion = ticketsAbiertos + reportesPendientes + erroresSinResolver;
  const notasAtencion = [
    puedeSoporte ? pluralizar(ticketsAbiertos, "ticket", "tickets") : null,
    puedeModeracion
      ? pluralizar(reportesPendientes, "reporte", "reportes")
      : null,
    puedeSistema ? pluralizar(erroresSinResolver, "error", "errores") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const hrefAtencion = puedeSoporte
    ? "/admin/soporte?estado=abierto"
    : puedeModeracion
      ? "/admin/moderacion"
      : "/admin/sistema";

  const recientes = [...vivos]
    .sort((a, b) => (b.creado_en ?? "").localeCompare(a.creado_en ?? ""))
    .slice(0, 6);

  return (
    <PaginaAdmin
      titulo="Resumen de la plataforma"
      descripcion="Estado general de negocios, ingresos y operación."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Estadistica
          titulo="Negocios"
          icono={<Building2 className="h-4 w-4" />}
          valor={String(vivos.length)}
          nota={`${pluralizar(nuevos30, "nuevo", "nuevos")} en 30 días`}
          href="/admin/negocios"
        />
        <Estadistica
          titulo="Activos"
          icono={<CheckCircle2 className="h-4 w-4" />}
          valor={String(porEstado.activa)}
          tono="bueno"
          href="/admin/negocios?estado=activa"
        />
        <Estadistica
          titulo="En prueba"
          valor={String(porEstado.prueba)}
          icono={<Clock className="h-4 w-4" />}
          href="/admin/negocios?estado=prueba"
        />
        <Estadistica
          titulo="Inactivos / suspendidos"
          icono={<ShieldAlert className="h-4 w-4" />}
          valor={`${porEstado.inactiva} / ${suspendidos}`}
          tono={porEstado.inactiva + suspendidos > 0 ? "malo" : "normal"}
          href="/admin/negocios?estado=suspendido"
        />
        {tienePermiso(admin.rol, "finanzas") && (
          <>
            <Estadistica
              titulo="MRR"
              icono={<Wallet className="h-4 w-4" />}
              valor={usd(calcularMrr(vivos, planes))}
              tono="bueno"
              nota="Suscripciones activas"
              href="/admin/finanzas"
            />
            <Estadistica
              titulo="Volumen 30 días"
              icono={<TrendingUp className="h-4 w-4" />}
              valor={usd(ingresos30)}
              nota="Reservas pagadas"
              href="/admin/finanzas"
            />
          </>
        )}
        <Estadistica
          titulo="Reservas totales"
          icono={<CalendarCheck className="h-4 w-4" />}
          valor={String(reservas.length)}
          nota={pluralizar(pagadas.length, "pagada", "pagadas")}
          href="/admin/reservas"
        />
        {mostrarAtencion && (
          <Estadistica
            titulo="Atención pendiente"
            icono={<LifeBuoy className="h-4 w-4" />}
            valor={String(atencion)}
            nota={notasAtencion}
            tono={atencion > 0 ? "malo" : "normal"}
            href={hrefAtencion}
          />
        )}
      </div>

      <Tarjeta
        titulo="Negocios recientes"
        descripcion="Últimas altas registradas en la plataforma."
      >
        <Tabla
          columnas={["Negocio", "Estado", "Alta", ""]}
          vacia={recientes.length === 0}
        >
          {recientes.map((n) => (
            <tr key={n.id}>
              <Celda>
                <Link
                  href={`/admin/negocios/${n.id}`}
                  className="font-medium text-sky-700 hover:underline"
                >
                  {n.nombre}
                </Link>
                <p className="text-xs text-slate-500">/{n.slug}</p>
              </Celda>
              <Celda>
                <InsigniaNegocio negocio={n} />
              </Celda>
              <Celda>{fechaCorta(n.creado_en)}</Celda>
              <Celda className="text-right">
                <Link
                  href={`/admin/negocios/${n.id}`}
                  className="text-xs font-semibold text-sky-700 hover:underline"
                >
                  {puedeGestionarNegocios ? "Gestionar →" : "Ver detalle →"}
                </Link>
              </Celda>
            </tr>
          ))}
        </Tabla>
        <div className="mt-4 flex justify-end">
          <Link
            href="/admin/negocios"
            className="text-sm font-semibold text-sky-700 hover:underline"
          >
            Ver todos los negocios ({vivos.length}) →
          </Link>
        </div>
      </Tarjeta>
    </PaginaAdmin>
  );
}
