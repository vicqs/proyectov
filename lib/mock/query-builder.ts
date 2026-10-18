import {
  mockAnuncios,
  mockAuditoria,
  mockBloqueos,
  mockComunicados,
  mockConfiguracion,
  mockHorarios,
  mockNegocios,
  mockNotas,
  mockPerfiles,
  mockPlanes,
  mockReembolsos,
  mockRegistroSistema,
  mockReportes,
  mockReservas,
  mockServicios,
  mockTicketMensajes,
  mockTickets,
} from "./data";

type Fila = Record<string, unknown>;

const globalMock = globalThis as unknown as {
  __neMockTablas?: Record<string, Fila[]>;
};

/**
 * Referencia mutable de cada tabla en memoria. Se guarda en `globalThis` para
 * que acciones, páginas y layouts vean los mismos datos aunque Next los
 * compile en bundles distintos durante el desarrollo.
 */
const TABLAS: Record<string, Fila[]> = (globalMock.__neMockTablas ??= {
  negocios: mockNegocios as unknown as Fila[],
  servicios: mockServicios as unknown as Fila[],
  reservas: mockReservas as unknown as Fila[],
  bloqueos_excepcion: mockBloqueos as unknown as Fila[],
  horarios: mockHorarios as unknown as Fila[],
  perfiles: mockPerfiles as unknown as Fila[],
  planes: mockPlanes as unknown as Fila[],
  auditoria: mockAuditoria as unknown as Fila[],
  configuracion_plataforma: mockConfiguracion as unknown as Fila[],
  anuncios: mockAnuncios as unknown as Fila[],
  comunicados: mockComunicados as unknown as Fila[],
  tickets: mockTickets as unknown as Fila[],
  ticket_mensajes: mockTicketMensajes as unknown as Fila[],
  notas_internas: mockNotas as unknown as Fila[],
  reportes_perfil: mockReportes as unknown as Fila[],
  registro_sistema: mockRegistroSistema as unknown as Fila[],
  reembolsos: mockReembolsos as unknown as Fila[],
});

/** Valores por defecto que en Postgres rellenan los `default` de las columnas. */
const DEFAULTS: Record<string, () => Fila> = {
  auditoria: () => ({ creado_en: ahora() }),
  anuncios: () => ({
    severidad: "info",
    segmento: "todas",
    activo: true,
    expira_en: null,
    creado_en: ahora(),
  }),
  comunicados: () => ({
    segmento: "todas",
    destinatarios: 0,
    enviados: 0,
    fallidos: 0,
    creado_en: ahora(),
  }),
  tickets: () => ({
    estado: "abierto",
    prioridad: "normal",
    creado_en: ahora(),
    actualizado_en: ahora(),
  }),
  ticket_mensajes: () => ({ creado_en: ahora() }),
  notas_internas: () => ({ creado_en: ahora() }),
  reportes_perfil: () => ({
    estado: "pendiente",
    detalle: null,
    email_reportante: null,
    resuelto_por: null,
    creado_en: ahora(),
  }),
  registro_sistema: () => ({
    resuelto: false,
    detalle: null,
    payload: null,
    creado_en: ahora(),
  }),
  reembolsos: () => ({ estado: "pendiente", creado_en: ahora() }),
  planes: () => ({ activo: true, por_defecto: false, stripe_price_id: null }),
  perfiles: () => ({
    rol_admin: null,
    bloqueado: false,
    sesiones_revocadas_desde: null,
  }),
  negocios: () => ({ creado_en: ahora() }),
};

function ahora() {
  return new Date().toISOString();
}

function getTabla(tabla: string): Fila[] {
  const ref = TABLAS[tabla];
  if (!ref) throw new Error(`Tabla mock desconocida: ${tabla}`);
  return ref;
}

type TipoFiltro = "eq" | "neq" | "gte" | "gt" | "lt" | "lte" | "in" | "is";

interface Filtro {
  tipo: TipoFiltro;
  columna: string;
  valor: unknown;
}

interface Resultado<T> {
  data: T | null;
  error: { message: string } | null;
}

function comparar(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * Mini query-builder que imita el subconjunto de la API fluida de
 * @supabase/supabase-js usado en este proyecto, operando sobre arreglos en
 * memoria en vez de hacer peticiones HTTP reales.
 */
class MockQueryBuilder<T extends Record<string, unknown>>
  implements PromiseLike<Resultado<T[]>>
{
  private filtros: Filtro[] = [];
  private ordenColumna: string | null = null;
  private ordenAscendente = true;
  private limite: number | null = null;
  private desde: number | null = null;
  private hasta: number | null = null;
  private selectExpandeServicio = false;
  private pendiente: "select" | "insert" | "update" | "delete" | "upsert" =
    "select";
  private payload: Partial<T> | Partial<T>[] | null = null;
  private conflicto: string[] = [];

  constructor(private readonly tabla: string) {}

  select(columnas = "*") {
    this.selectExpandeServicio = columnas.includes("servicio:servicios");
    return this;
  }

  eq(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "eq", columna, valor });
    return this;
  }

  neq(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "neq", columna, valor });
    return this;
  }

  gte(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "gte", columna, valor });
    return this;
  }

  gt(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "gt", columna, valor });
    return this;
  }

  lt(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "lt", columna, valor });
    return this;
  }

  lte(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "lte", columna, valor });
    return this;
  }

  in(columna: string, valores: unknown[]) {
    this.filtros.push({ tipo: "in", columna, valor: valores });
    return this;
  }

  is(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "is", columna, valor });
    return this;
  }

  order(columna: string, opts?: { ascending?: boolean }) {
    this.ordenColumna = columna;
    this.ordenAscendente = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limite = n;
    return this;
  }

  range(desde: number, hasta: number) {
    this.desde = desde;
    this.hasta = hasta;
    return this;
  }

  insert(payload: Partial<T> | Partial<T>[]) {
    this.pendiente = "insert";
    this.payload = payload;
    return this;
  }

  upsert(payload: Partial<T> | Partial<T>[], opts?: { onConflict?: string }) {
    this.pendiente = "upsert";
    this.payload = payload;
    this.conflicto = (opts?.onConflict ?? "id")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    return this;
  }

  update(payload: Partial<T>) {
    this.pendiente = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.pendiente = "delete";
    return this;
  }

  single(): Promise<Resultado<T>> {
    return this.ejecutar().then((resultado) => ({
      data: (resultado.data?.[0] as T) ?? null,
      error:
        resultado.error ??
        (resultado.data && resultado.data.length > 0
          ? null
          : { message: "No se encontró ningún registro." }),
    }));
  }

  maybeSingle(): Promise<Resultado<T>> {
    return this.ejecutar().then((resultado) => ({
      data: (resultado.data?.[0] as T) ?? null,
      error: resultado.error,
    }));
  }

  then<TResult1 = Resultado<T[]>, TResult2 = never>(
    onfulfilled?:
      | ((value: Resultado<T[]>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.ejecutar().then(onfulfilled, onrejected);
  }

  private cumpleFiltros(fila: Fila): boolean {
    return this.filtros.every((filtro) => {
      const v = fila[filtro.columna];
      switch (filtro.tipo) {
        case "eq":
          return v === filtro.valor;
        case "neq":
          return v !== filtro.valor;
        case "gte":
          return String(v) >= String(filtro.valor);
        case "gt":
          return String(v) > String(filtro.valor);
        case "lt":
          return String(v) < String(filtro.valor);
        case "lte":
          return String(v) <= String(filtro.valor);
        case "in":
          return (filtro.valor as unknown[]).includes(v);
        case "is":
          // `undefined` equivale a `null` (columna sin valor).
          return filtro.valor === null
            ? v === null || v === undefined
            : v === filtro.valor;
      }
    });
  }

  private nuevaFila(p: Partial<T>, i: number): Fila {
    return {
      id: `mock-${this.tabla}-${Date.now()}-${i}-${Math.floor(Math.random() * 100000)}`,
      ...(DEFAULTS[this.tabla]?.() ?? {}),
      ...p,
    } as Fila;
  }

  private async ejecutar(): Promise<Resultado<T[]>> {
    let tablaRef: Fila[];
    try {
      tablaRef = getTabla(this.tabla);
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
    const lista = (p: Partial<T> | Partial<T>[]) =>
      Array.isArray(p) ? p : [p];

    if (this.pendiente === "insert" && this.payload) {
      const filas = lista(this.payload).map((p, i) => this.nuevaFila(p, i));
      tablaRef.push(...filas);
      return { data: filas as T[], error: null };
    }

    if (this.pendiente === "upsert" && this.payload) {
      const resultado: Fila[] = [];
      lista(this.payload).forEach((p, i) => {
        const existente = tablaRef.find((fila) =>
          this.conflicto.every(
            (col) =>
              (p as Fila)[col] !== undefined && fila[col] === (p as Fila)[col],
          ),
        );
        if (existente) {
          Object.assign(existente, p);
          resultado.push(existente);
        } else {
          const fila = this.nuevaFila(p, i);
          tablaRef.push(fila);
          resultado.push(fila);
        }
      });
      return { data: resultado as T[], error: null };
    }

    if (this.pendiente === "update" && this.payload) {
      const afectadas: Fila[] = [];
      for (const fila of tablaRef) {
        if (this.cumpleFiltros(fila)) {
          Object.assign(fila, this.payload);
          afectadas.push(fila);
        }
      }
      if (afectadas.length === 0) {
        return {
          data: null,
          error: { message: "No se encontró el registro a actualizar." },
        };
      }
      return { data: afectadas as T[], error: null };
    }

    if (this.pendiente === "delete") {
      const eliminadas: Fila[] = [];
      for (let i = tablaRef.length - 1; i >= 0; i--) {
        if (this.cumpleFiltros(tablaRef[i])) {
          eliminadas.push(...tablaRef.splice(i, 1));
        }
      }
      return { data: eliminadas as T[], error: null };
    }

    let filas = tablaRef.filter((fila) => this.cumpleFiltros(fila));

    if (this.selectExpandeServicio) {
      filas = filas.map((fila) => ({
        ...fila,
        servicio:
          mockServicios.find((servicio) => servicio.id === fila.servicio_id) ??
          null,
      }));
    }

    if (this.ordenColumna) {
      const columna = this.ordenColumna;
      filas = [...filas].sort((a, b) => {
        const r = comparar(a[columna], b[columna]);
        return this.ordenAscendente ? r : -r;
      });
    }

    if (this.desde !== null && this.hasta !== null) {
      filas = filas.slice(this.desde, this.hasta + 1);
    }
    if (this.limite !== null) {
      filas = filas.slice(0, this.limite);
    }

    return { data: filas as T[], error: null };
  }
}

/** Cliente mock que imita `.from(tabla)` de @supabase/supabase-js. */
export const mockDbClient = {
  from<T extends Record<string, unknown> = Record<string, unknown>>(
    tabla: string,
  ) {
    return new MockQueryBuilder<T>(tabla);
  },
};
