/**
 * Route Handler que sirve /humans.txt — práctica estándar (humanstxt.org)
 * para declarar la autoría del proyecto de forma legible por humanos y
 * motores de búsqueda, sin exponer datos personales en la UI.
 */
import { NextResponse } from "next/server";

const CONTENIDO = `/* TEAM */
Autor: Victor Quiros Suarez
Nacionalidad: Costarricense
Contacto: victor.quirossuarez [at] gmail.com

/* COPYRIGHT */
© ${new Date().getFullYear()} Victor Quiros Suarez. Todos los derechos reservados.
Este software y su código fuente son propiedad intelectual de Victor Quiros Suarez.
Queda prohibida su reproducción, distribución o modificación sin autorización expresa del autor.

/* SITE */
Última actualización: ${new Date().toISOString().slice(0, 10)}
Construido con: Next.js, React, TypeScript, Tailwind CSS
`;

export function GET() {
  return new NextResponse(CONTENIDO, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
