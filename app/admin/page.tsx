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
import { leer } from "../../lib/admin/db";
import {
  calcularMrr,
  cargarPlataforma,
  indexar,
  montoReserva,
} from "../../lib/admin/datos";
import { tienePermiso } from "../../lib/roles";
import { estadoEfectivo } from "../../lib/negocio-estado";
import { fechaCorta, usd } from "../../lib/admin/formato";
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
  const { negocios, servicios, reservas, planes } = await cargarPlataforma();
  const [tickets, reportes, registros] = await Promise.all([
    leer("tickets").catch(() => []),
    leer("reportes_perfil").catch(() => []),
    leer("registro_sistema").catch(() => []),
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

  const ticketsAbiertos = tickets.filter(
    (t) => t.estado === "abierto" || t.estado === "en_curso",
  ).length;
  const reportesPendientes = reportes.filter(
    (r) => r.estado === "pendiente",
  ).length;
  const erroresSinResolver = registros.filter(
    (r) => r.estado === "error" && !r.resuelto,
  ).length;
  const atencion = ticketsAbiertos + reportesPendientes + erroresSinResolver;

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
          nota={`${nuevos30} nuevos en 30 días`}
        />
        <Estadistica
          titulo="Activos"
          icono={<CheckCircle2 className="h-4 w-4" />}
          valor={String(porEstado.activa)}
          tono="bueno"
        />
        <Estadistica
          titulo="En prueba"
          valor={String(porEstado.prueba)}
          icono={<Clock className="h-4 w-4" />}
        />
        <Estadistica
          titulo="Inactivos / suspendidos"
          icono={<ShieldAlert className="h-4 w-4" />}
          valor={`${porEstado.inactiva} / ${suspendidos}`}
          tono={porEstado.inactiva + suspendidos > 0 ? "malo" : "normal"}
        />
        {tienePermiso(admin.rol, "finanzas") && (
          <>
            <Estadistica
              titulo="MRR"
              icono={<Wallet className="h-4 w-4" />}
              valor={usd(calcularMrr(vivos, planes))}
              tono="bueno"
              nota="Suscripciones activas"
            />
            <Estadistica
              titulo="Volumen 30 días"
              icono={<TrendingUp className="h-4 w-4" />}
              valor={usd(ingresos30)}
              nota="Reservas pagadas"
            />
          </>
        )}
        <Estadistica
          titulo="Reservas totales"
          icono={<CalendarCheck className="h-4 w-4" />}
          valor={String(reservas.length)}
          nota={`${pagadas.length} pagadas`}
        />
        <Estadistica
          titulo="Atención pendiente"
          icono={<LifeBuoy className="h-4 w-4" />}
          valor={String(atencion)}
          nota={`${ticketsAbiertos} tickets · ${reportesPendientes} reportes · ${erroresSinResolver} errores`}
          tono={atencion > 0 ? "malo" : "normal"}
        />
      </div>

      <Tarjeta titulo="Negocios recientes">
        <Tabla
          columnas={["Negocio", "Estado", "Alta"]}
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
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </PaginaAdmin>
  );
}
