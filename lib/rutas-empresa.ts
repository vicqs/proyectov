/** Rutas canónicas del panel; el rol Empresa no comparte la ruta global /admin. */
export function rutaPanelEmpresa(slug: string, seccion = ""): string {
  const base = `/${encodeURIComponent(slug)}/admin`;
  return seccion ? `${base}/${seccion}` : base;
}

/** Solo admite las secciones conocidas al resolver enlaces antiguos. */
export function seccionPanelAnterior(
  segmentos: string[] = [],
  negocioId?: string,
): string | null {
  if (segmentos.length === 0) return "";
  const secciones = [
    "servicios",
    "horarios",
    "calendario",
    "agenda",
    "reservas",
    "finanzas",
    "personalizacion",
    "suscripcion",
  ];
  if (segmentos.length === 1 && secciones.includes(segmentos[0])) {
    return segmentos[0];
  }
  if (
    segmentos.length === 3 &&
    segmentos[0] === "suscripcion" &&
    segmentos[1] === "simulado" &&
    negocioId &&
    segmentos[2] === negocioId
  ) {
    return `suscripcion/simulado/${encodeURIComponent(negocioId)}`;
  }
  return null;
}

export function conservarBusqueda(
  ruta: string,
  parametros: Record<string, string | string[] | undefined>,
): string {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (Array.isArray(valor)) {
      valor.forEach((item) => busqueda.append(clave, item));
    } else if (valor !== undefined) {
      busqueda.append(clave, valor);
    }
  }
  return busqueda.size ? `${ruta}?${busqueda}` : ruta;
}
