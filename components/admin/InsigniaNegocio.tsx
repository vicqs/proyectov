import type { Negocio } from "../../types/database";
import { estadoEfectivo } from "../../lib/negocio-estado";
import { Insignia } from "./ui";

/** Estado visible de un negocio combinando eliminación, suspensión y suscripción. */
export function InsigniaNegocio({ negocio }: { negocio: Negocio }) {
  if (negocio.eliminado_en) return <Insignia tono="gris">Eliminado</Insignia>;
  if (negocio.suspendido) return <Insignia tono="rojo">Suspendido</Insignia>;
  const estado = estadoEfectivo(negocio);
  if (estado === "activa") return <Insignia tono="verde">Activa</Insignia>;
  if (estado === "prueba") return <Insignia tono="azul">En prueba</Insignia>;
  return <Insignia tono="ambar">Inactiva</Insignia>;
}
