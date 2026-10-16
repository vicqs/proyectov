/** Escapa una celda CSV y neutraliza inyección de fórmulas (=, +, -, @). */
function celda(valor: string | number): string {
  let texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

/** Descarga un CSV (UTF-8 con BOM para que Excel respete las tildes). */
export function descargarCsv(
  nombreArchivo: string,
  encabezados: string[],
  filas: (string | number)[][],
) {
  const contenido = [encabezados, ...filas]
    .map((fila) => fila.map(celda).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + contenido], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
