import {
  mockBloqueos,
  mockNegocios,
  mockReservas,
  mockServicios,
} from "./data";

type TableName = "negocios" | "servicios" | "reservas" | "bloqueos_excepcion";

/** Devuelve la referencia mutable del arreglo en memoria de una tabla. */
function getTabla(tabla: TableName): Record<string, unknown>[] {
  switch (tabla) {
    case "negocios":
      return mockNegocios as unknown as Record<string, unknown>[];
    case "servicios":
      return mockServicios as unknown as Record<string, unknown>[];
    case "reservas":
      return mockReservas as unknown as Record<string, unknown>[];
    case "bloqueos_excepcion":
      return mockBloqueos as unknown as Record<string, unknown>[];
  }
}

interface Filtro {
  tipo: "eq" | "gte" | "in";
  columna: string;
  valor: unknown;
}

interface Resultado<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Mini query-builder que imita el subconjunto de la API fluida de
 * @supabase/supabase-js usado en este proyecto (`.select().eq().single()`,
 * `.insert()`, `.update()`, `.order()`, `.limit()`, etc.), operando sobre
 * arreglos en memoria en vez de hacer peticiones HTTP reales.
 */
class MockQueryBuilder<T extends Record<string, unknown>>
  implements PromiseLike<Resultado<T[]>>
{
  private filtros: Filtro[] = [];
  private ordenColumna: string | null = null;
  private ordenAscendente = true;
  private limite: number | null = null;
  private soloUno = false;
  private selectExpandeServicio = false;
  private pendiente: "select" | "insert" | "update" = "select";
  private payload: Partial<T> | null = null;

  constructor(private readonly tabla: TableName) {}

  select(columnas = "*") {
    this.selectExpandeServicio = columnas.includes("servicio:servicios");
    return this;
  }

  eq(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "eq", columna, valor });
    return this;
  }

  gte(columna: string, valor: unknown) {
    this.filtros.push({ tipo: "gte", columna, valor });
    return this;
  }

  in(columna: string, valores: unknown[]) {
    this.filtros.push({ tipo: "in", columna, valor: valores });
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

  insert(payload: Partial<T>) {
    this.pendiente = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Partial<T>) {
    this.pendiente = "update";
    this.payload = payload;
    return this;
  }

  single(): Promise<Resultado<T>> {
    this.soloUno = true;
    return this.ejecutar().then((resultado) => ({
      data: (resultado.data?.[0] as T) ?? null,
      error:
        resultado.error ??
        (resultado.data && resultado.data.length > 0
          ? null
          : { message: "No se encontró ningún registro." }),
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

  private cumpleFiltros(fila: Record<string, unknown>): boolean {
    return this.filtros.every((filtro) => {
      const valorFila = fila[filtro.columna];
      if (filtro.tipo === "eq") return valorFila === filtro.valor;
      if (filtro.tipo === "gte")
        return String(valorFila) >= String(filtro.valor);
      if (filtro.tipo === "in")
        return (filtro.valor as unknown[]).includes(valorFila);
      return true;
    });
  }

  private async ejecutar(): Promise<Resultado<T[]>> {
    const tablaRef = getTabla(this.tabla);

    if (this.pendiente === "insert" && this.payload) {
      const nuevaFila = {
        id: `mock-${this.tabla}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...this.payload,
      } as unknown as Record<string, unknown>;
      tablaRef.push(nuevaFila);
      return { data: [nuevaFila as T], error: null };
    }

    if (this.pendiente === "update" && this.payload) {
      const afectadas: Record<string, unknown>[] = [];
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
        const va = String(a[columna]);
        const vb = String(b[columna]);
        return this.ordenAscendente
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      });
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
    tabla: TableName,
  ) {
    return new MockQueryBuilder<T>(tabla);
  },
};
