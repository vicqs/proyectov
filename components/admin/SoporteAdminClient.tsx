"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Celda,
  Insignia,
  Paginacion,
  Tabla,
  type TonoInsignia,
} from "./ui";
import { fechaHora } from "../../lib/admin/formato";
import { TicketDrawer } from "./TicketDrawer";
import type { Ticket } from "../../types/database";

const TONO_TICKET: Record<string, TonoInsignia> = {
  abierto: "ambar",
  en_curso: "azul",
  resuelto: "verde",
  cerrado: "gris",
};

const ETIQUETAS_ESTADO: Record<string, string> = {
  abierto: "Abierto",
  en_curso: "En curso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

const TONO_PRIORIDAD: Record<string, TonoInsignia> = {
  baja: "gris",
  normal: "azul",
  alta: "ambar",
  urgente: "rojo",
};

const ETIQUETAS_PRIORIDAD: Record<string, string> = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

interface SoporteAdminClientProps {
  filas: Ticket[];
  negociosMap: Record<string, string>;
  pagina: number;
  paginas: number;
  total: number;
  estado: string;
  q: string;
  ticketIdInicial?: string;
}

export function SoporteAdminClient({
  filas,
  negociosMap,
  pagina,
  paginas,
  total,
  estado,
  q,
  ticketIdInicial,
}: SoporteAdminClientProps) {
  const searchParams = useSearchParams();
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(
    () => {
      const id = ticketIdInicial || searchParams.get("ticketId");
      if (id) {
        return filas.find((t) => t.id === id) ?? null;
      }
      return null;
    },
  );

  // Si las filas se actualizan por un refresh de servidor, mantener sincronizado el ticket actual
  useEffect(() => {
    if (ticketSeleccionado) {
      const actualizado = filas.find((t) => t.id === ticketSeleccionado.id);
      if (actualizado) {
        setTicketSeleccionado(actualizado);
      }
    }
  }, [filas]);

  return (
    <>
      <Tabla
        columnas={["Asunto", "Negocio", "Estado", "Prioridad", "Actualizado", ""]}
        vacia={filas.length === 0}
      >
        {filas.map((t) => (
          <tr key={t.id}>
            <Celda>
              <button
                type="button"
                onClick={() => setTicketSeleccionado(t)}
                className="text-left font-medium text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
              >
                {t.asunto}
              </button>
            </Celda>
            <Celda>
              {negociosMap[t.negocio_id] ? (
                <Link
                  href={`/admin/negocios/${t.negocio_id}`}
                  className="text-slate-700 hover:text-sky-700 hover:underline"
                >
                  {negociosMap[t.negocio_id]}
                </Link>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </Celda>
            <Celda>
              <Insignia tono={TONO_TICKET[t.estado] ?? "gris"}>
                {ETIQUETAS_ESTADO[t.estado] ?? t.estado}
              </Insignia>
            </Celda>
            <Celda>
              <Insignia tono={TONO_PRIORIDAD[t.prioridad] ?? "gris"}>
                {ETIQUETAS_PRIORIDAD[t.prioridad] ?? t.prioridad}
              </Insignia>
            </Celda>
            <Celda className="whitespace-nowrap text-slate-500">
              {fechaHora(t.actualizado_en)}
            </Celda>
            <Celda className="text-right whitespace-nowrap">
              <button
                type="button"
                onClick={() => setTicketSeleccionado(t)}
                className="inline-flex items-center gap-1 font-semibold text-xs text-sky-700 hover:text-sky-900 hover:underline cursor-pointer py-1 px-2 rounded-lg hover:bg-sky-50 transition"
              >
                <span>Atender</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </Celda>
          </tr>
        ))}
      </Tabla>

      <Paginacion
        pagina={pagina}
        paginas={paginas}
        total={total}
        base="/admin/soporte"
        params={{ estado, q }}
      />

      <TicketDrawer
        ticket={ticketSeleccionado}
        negocioNombre={
          ticketSeleccionado
            ? negociosMap[ticketSeleccionado.negocio_id]
            : undefined
        }
        onClose={() => setTicketSeleccionado(null)}
      />
    </>
  );
}
