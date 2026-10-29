import { NextResponse } from "next/server";
import { obtenerAdminAutenticado } from "../../../../lib/admin/auth";
import { registrarAuditoria } from "../../../../lib/admin/auditoria";
import { leer, listarUsuariosAuth } from "../../../../lib/admin/db";
import { indexar, montoReserva } from "../../../../lib/admin/datos";
import { celdaCsv } from "../../../../lib/admin/formato";
import { estadoEfectivo } from "../../../../lib/negocio-estado";
import { esCobroPasarela } from "../../../../lib/pagos";
import { tienePermiso, type Permiso } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

const PERMISO: Record<string, Permiso> = {
  negocios: "negocios_ver",
  reservas: "reservas",
  finanzas: "finanzas",
  auditoria: "auditoria",
  usuarios: "usuarios",
};

function csv(cabeceras: string[], filas: unknown[][]): string {
  return [cabeceras, ...filas]
    .map((fila) => fila.map(celdaCsv).join(","))
    .join("\r\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const { tipo } = await params;
  const admin = await obtenerAdminAutenticado();
  if (!admin) return new NextResponse("No encontrado", { status: 404 });
  const permiso = PERMISO[tipo];
  if (!permiso) return new NextResponse("No encontrado", { status: 404 });
  if (!tienePermiso(admin.rol, permiso)) {
    return new NextResponse("Sin permiso", { status: 403 });
  }

  let contenido = "";
  if (tipo === "negocios") {
    const negocios = await leer("negocios");
    contenido = csv(
      [
        "id",
        "nombre",
        "slug",
        "estado",
        "suspendido",
        "eliminado_en",
        "creado_en",
      ],
      negocios.map((n) => [
        n.id,
        n.nombre,
        n.slug,
        estadoEfectivo(n),
        n.suspendido ? "si" : "no",
        n.eliminado_en ?? "",
        n.creado_en ?? "",
      ]),
    );
  } else if (tipo === "reservas" || tipo === "finanzas") {
    const [reservas, servicios, negocios] = await Promise.all([
      leer("reservas"),
      leer("servicios"),
      leer("negocios"),
    ]);
    const idxS = indexar(servicios);
    const nombre = new Map(negocios.map((n) => [n.id, n.nombre]));
    const lista =
      tipo === "finanzas"
        ? reservas.filter(esCobroPasarela)
        : reservas;
    contenido = csv(
      [
        "id",
        "negocio",
        "servicio",
        "fecha_hora",
        "cliente",
        "estado",
        "trx_id",
        "monto_usd",
      ],
      lista.map((r) => [
        r.id,
        nombre.get(r.negocio_id) ?? "",
        idxS.get(r.servicio_id)?.nombre ?? "",
        r.fecha_hora,
        r.email_cliente,
        r.estado,
        r.trx_id ?? "",
        montoReserva(r, idxS),
      ]),
    );
  } else if (tipo === "auditoria") {
    const filas = await leer("auditoria", { orden: ["creado_en", false] });
    contenido = csv(
      [
        "fecha",
        "actor",
        "rol",
        "accion",
        "entidad",
        "entidad_id",
        "negocio_id",
      ],
      filas.map((a) => [
        a.creado_en,
        a.actor_email,
        a.actor_rol,
        a.accion,
        a.entidad,
        a.entidad_id ?? "",
        a.negocio_id ?? "",
      ]),
    );
  } else {
    const [usuarios, perfiles, negocios] = await Promise.all([
      listarUsuariosAuth(),
      leer("perfiles").catch(() => []),
      leer("negocios"),
    ]);
    const perfil = new Map(perfiles.map((p) => [p.user_id, p]));
    const negocioDe = new Map(negocios.map((n) => [n.user_id, n.slug]));
    contenido = csv(
      ["id", "email", "rol_admin", "bloqueado", "negocio", "ultimo_acceso"],
      usuarios.map((u) => [
        u.id,
        u.email ?? "",
        perfil.get(u.id)?.rol_admin ?? "",
        perfil.get(u.id)?.bloqueado ? "si" : "no",
        negocioDe.get(u.id) ?? "",
        u.last_sign_in_at ?? "",
      ]),
    );
  }

  await registrarAuditoria(admin, {
    accion: "exportar.csv",
    entidad: "exportacion",
    entidad_id: tipo,
  });

  return new NextResponse(`\uFEFF${contenido}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tipo}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
