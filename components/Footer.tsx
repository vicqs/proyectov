/**
 * Footer global minimalista. Muestra únicamente el aviso de derechos de
 * autor visible al usuario (sin correo ni datos personales adicionales).
 */
export default function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="py-6 text-center text-xs text-gray-400">
      © {anioActual} Victor Quiros Suarez. Todos los derechos reservados.
    </footer>
  );
}
