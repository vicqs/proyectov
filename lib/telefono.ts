export interface PaisTelefono {
  /** Código ISO 3166-1 alpha-2 (único por entrada). */
  iso: string;
  /** Nombre del país en español. */
  nombre: string;
  /** Bandera emoji. */
  bandera: string;
  /** Prefijo telefónico internacional sin el signo + (ej. "506"). */
  codigo: string;
  /** Agrupación de dígitos para formatear el número local (ej. [4, 4] -> "8888 7777"). */
  grupos: readonly number[];
  /** Ejemplo visual formateado para usar como placeholder. */
  ejemplo: string;
}

export const PAISES_TELEFONO: readonly PaisTelefono[] = [
  {
    iso: "CR",
    nombre: "Costa Rica",
    bandera: "🇨🇷",
    codigo: "506",
    grupos: [4, 4],
    ejemplo: "8888 7777",
  },
  {
    iso: "PA",
    nombre: "Panamá",
    bandera: "🇵🇦",
    codigo: "507",
    grupos: [4, 4],
    ejemplo: "6123 4567",
  },
  {
    iso: "NI",
    nombre: "Nicaragua",
    bandera: "🇳🇮",
    codigo: "505",
    grupos: [4, 4],
    ejemplo: "8123 4567",
  },
  {
    iso: "GT",
    nombre: "Guatemala",
    bandera: "🇬🇹",
    codigo: "502",
    grupos: [4, 4],
    ejemplo: "5123 4567",
  },
  {
    iso: "SV",
    nombre: "El Salvador",
    bandera: "🇸🇻",
    codigo: "503",
    grupos: [4, 4],
    ejemplo: "7123 4567",
  },
  {
    iso: "HN",
    nombre: "Honduras",
    bandera: "🇭🇳",
    codigo: "504",
    grupos: [4, 4],
    ejemplo: "9123 4567",
  },
  {
    iso: "MX",
    nombre: "México",
    bandera: "🇲🇽",
    codigo: "52",
    grupos: [2, 4, 4],
    ejemplo: "55 1234 5678",
  },
  {
    iso: "CO",
    nombre: "Colombia",
    bandera: "🇨🇴",
    codigo: "57",
    grupos: [3, 3, 4],
    ejemplo: "300 123 4567",
  },
  {
    iso: "US",
    nombre: "Estados Unidos / Canadá",
    bandera: "🇺🇸",
    codigo: "1",
    grupos: [3, 3, 4],
    ejemplo: "555 123 4567",
  },
  {
    iso: "ES",
    nombre: "España",
    bandera: "🇪🇸",
    codigo: "34",
    grupos: [3, 3, 3],
    ejemplo: "612 345 678",
  },
  {
    iso: "AR",
    nombre: "Argentina",
    bandera: "🇦🇷",
    codigo: "54",
    grupos: [2, 4, 4],
    ejemplo: "11 1234 5678",
  },
  {
    iso: "CL",
    nombre: "Chile",
    bandera: "🇨🇱",
    codigo: "56",
    grupos: [1, 4, 4],
    ejemplo: "9 1234 5678",
  },
  {
    iso: "PE",
    nombre: "Perú",
    bandera: "🇵🇪",
    codigo: "51",
    grupos: [3, 3, 3],
    ejemplo: "912 345 678",
  },
  {
    iso: "EC",
    nombre: "Ecuador",
    bandera: "🇪🇨",
    codigo: "593",
    grupos: [2, 3, 4],
    ejemplo: "99 123 4567",
  },
  {
    iso: "UY",
    nombre: "Uruguay",
    bandera: "🇺🇾",
    codigo: "598",
    grupos: [2, 3, 3],
    ejemplo: "99 123 456",
  },
  {
    iso: "PY",
    nombre: "Paraguay",
    bandera: "🇵🇾",
    codigo: "595",
    grupos: [3, 3, 3],
    ejemplo: "981 123 456",
  },
  {
    iso: "BO",
    nombre: "Bolivia",
    bandera: "🇧🇴",
    codigo: "591",
    grupos: [4, 4],
    ejemplo: "7123 4567",
  },
  {
    iso: "VE",
    nombre: "Venezuela",
    bandera: "🇻🇪",
    codigo: "58",
    grupos: [3, 3, 4],
    ejemplo: "412 123 4567",
  },
  {
    iso: "BR",
    nombre: "Brasil",
    bandera: "🇧🇷",
    codigo: "55",
    grupos: [2, 5, 4],
    ejemplo: "11 91234 5678",
  },
] as const;

export const PAIS_TELEFONO_POR_DEFECTO: PaisTelefono = PAISES_TELEFONO[0];

/** Cantidad exacta de dígitos locales que requiere el país seleccionado. */
export function totalDigitosPais(pais: PaisTelefono): number {
  return pais.grupos.reduce((acc, n) => acc + n, 0);
}

/** Busca un país por su código ISO (o devuelve el país por defecto). */
export function obtenerPaisPorIso(iso: string): PaisTelefono {
  return (
    PAISES_TELEFONO.find((p) => p.iso === iso) ?? PAIS_TELEFONO_POR_DEFECTO
  );
}

/**
 * Extrae solo los dígitos locales y los recorta al máximo permitido por el país.
 * Si el usuario pega el número completo con el código de país incluido
 * (ej. "+506 85956666"), retira automáticamente el prefijo del país activo.
 */
export function extraerDigitosLocales(
  entrada: string,
  pais: PaisTelefono,
): string {
  const max = totalDigitosPais(pais);
  let digitos = entrada.replace(/\D/g, "");
  if (
    digitos.length > max &&
    digitos.startsWith(pais.codigo) &&
    digitos.length - pais.codigo.length <= max
  ) {
    digitos = digitos.slice(pais.codigo.length);
  }
  return digitos.slice(0, max);
}

/**
 * Formatea una cadena de dígitos locales según los bloques del país
 * seleccionados (ej. "85956666" con [4, 4] -> "8595 6666").
 */
export function formatearNumeroLocal(
  entrada: string,
  pais: PaisTelefono,
): string {
  const digitos = extraerDigitosLocales(entrada, pais);
  if (!digitos) return "";

  const partes: string[] = [];
  let cursor = 0;
  for (const tam of pais.grupos) {
    if (cursor >= digitos.length) break;
    partes.push(digitos.slice(cursor, cursor + tam));
    cursor += tam;
  }
  return partes.join(" ");
}

/**
 * Separa un teléfono almacenado (ej. "50685956666" o "+506 85956666")
 * en el país correspondiente y los dígitos locales sin el código de país.
 */
export function descomponerTelefono(valorAlmacenado: string | null | undefined): {
  pais: PaisTelefono;
  digitosLocales: string;
} {
  const digitos = (valorAlmacenado ?? "").replace(/\D/g, "");
  if (!digitos) {
    return { pais: PAIS_TELEFONO_POR_DEFECTO, digitosLocales: "" };
  }

  // Ordenar por longitud de prefijo descendente para coincidir primero "+506" antes que códigos cortos
  const ordenados = [...PAISES_TELEFONO].sort(
    (a, b) => b.codigo.length - a.codigo.length,
  );

  for (const pais of ordenados) {
    if (digitos.startsWith(pais.codigo)) {
      const resto = digitos.slice(pais.codigo.length);
      return {
        pais,
        digitosLocales: resto.slice(0, totalDigitosPais(pais)),
      };
    }
  }

  return {
    pais: PAIS_TELEFONO_POR_DEFECTO,
    digitosLocales: digitos.slice(0, totalDigitosPais(PAIS_TELEFONO_POR_DEFECTO)),
  };
}

