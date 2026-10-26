"use server";

import { z } from "zod";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, leerUno } from "../../lib/admin/db";
import { campo, revalidarAdmin } from "../../lib/admin/util";

export async function resolverReporteAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("moderacion", async (admin) => {
    const estado = z
      .enum(["descartado", "atendido", "pendiente"])
      .safeParse(campo(datos, "estado"));
    if (!estado.success) return { error: "Estado inválido." };
    const reporte = await leerUno("reportes_perfil", { eq: { id } });
    if (!reporte) return { error: "Reporte no encontrado." };
    await actualizar(
      "reportes_perfil",
      {
        estado: estado.data,
        resuelto_por: estado.data === "pendiente" ? null : admin.email,
      },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: `reporte.${estado.data}`,
      entidad: "reporte",
      entidad_id: id,
      negocio_id: reporte.negocio_id,
    });
    revalidarAdmin();
    return { ok: "Reporte actualizado." };
  });
}
