"use client";

import { useEffect, useRef, useState } from "react";

interface VistaPreviaEmailProps {
  titulo: string;
  html: string;
}

export function VistaPreviaEmail({ titulo, html }: VistaPreviaEmailProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [altura, setAltura] = useState<number>(750);

  const sincronizarAltura = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc?.body) {
        const contenidoH = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight,
        );
        if (contenidoH > 100) {
          // Asigna la altura exacta del contenido con un margen de holgura para eliminar scrollbar vertical
          setAltura(contenidoH + 28);
        }
      }
    } catch {
      // Si la seguridad del navegador restringe la lectura, la altura mínima asegura visibilidad completa
    }
  };

  useEffect(() => {
    sincronizarAltura();
  }, [html]);

  return (
    <div className="w-full">
      <iframe
        ref={iframeRef}
        title={`Vista previa ${titulo}`}
        sandbox="allow-same-origin"
        srcDoc={html}
        onLoad={sincronizarAltura}
        style={{ height: `${altura}px` }}
        className="h-auto min-h-[720px] w-full rounded-xl border border-slate-200 bg-white shadow-2xs transition-[height] duration-200"
      />
    </div>
  );
}

