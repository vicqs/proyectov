/** Identidad institucional de vuki. No sustituye la marca de cada negocio. */
export const MARCA = {
  nombre: "vuki",
  lema: "Tu agenda y tus reservas en un solo link.",
  descripcion:
    "Un enlace para tus experiencias, una agenda para tu negocio. Reservas y disponibilidad para pymes turísticas de Costa Rica.",
  colores: {
    oscuro: "#0f172a",
    azul: "#0284c7",
    esmeralda: "#10b981",
    fondo: "#f8fafc",
    blanco: "#ffffff",
  },
} as const;

/**
 * Monograma VK reconstruido desde «docs/branding/logo nuevo.jfif».
 * Dos diagonales de corte recto y un arco esmeralda separado del brazo azul.
 * Se conservan las proporciones ópticas de la lámina, no sus cotas ilustrativas.
 */
export const ISOTIPO_VUKI = {
  viewBox: "0 0 512 512",
  viewBoxLibre: "0 0 512 384",
  lado: 512,
  radio: 102.4,
  transformacionMarco: "translate(64 112) scale(0.75)",
} as const;

export const TRAZOS_VUKI = {
  izquierdo: "M0 0H99L241 284L197 384Z",
  derecho: "M416 0H512L382 205Q323 199 270 223Z",
  arco: "M196 384A158 158 0 0 1 512 384H434A80 80 0 0 0 274 384Z",
} as const;

/**
 * Wordmark de Plus Jakarta Sans ExtraBold (800), con espaciado óptico del manual.
 * Puntos circulares según el nuevo manual: tanto la «i» como el final esmeralda.
 * Los contornos evitan sustituciones de fuente en SVG y tarjetas sociales.
 */
export const LOGOTIPO_VUKI = {
  viewBox: "0 0 2304 797",
  ancho: 2.304,
  alto: 0.797,
  lineaBase: 785,
  letras: [
    { x: 0, d: "M226 0L11 546L173 546L322 133L260 133L409 546L571 546L356 0Z" },
    {
      x: 580,
      d: "M251 -12Q185 -12 138.5 16.5Q92 45 68 96Q44 147 44 215L44 546L194 546L194 227Q194 196 206.5 172.5Q219 149 242 136Q265 123 294 123Q324 123 346.5 136Q369 149 381.5 172.5Q394 196 394 227L394 546L544 546L544 0L404 0L404 108L412 84Q393 35 350.5 11.5Q308 -12 251 -12Z",
    },
    {
      x: 1180,
      d: "M55 0L55 757L205 757L205 272L149 290L390 546L575 546L377 326L574 0L404 0L239 277L326 299L159 117L205 204L205 0Z",
    },
    { x: 1755, d: "M55 0L55 546L205 546L205 0Z" },
  ],
  puntoLetraI: { cx: 1885, cy: 695, r: 90 },
  puntoFinal: { cx: 2150, cy: 90, r: 90 },
} as const;
