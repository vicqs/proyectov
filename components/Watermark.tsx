"use client";

import { useEffect } from "react";

/**
 * Easter egg de autoría: al montarse en el navegador, imprime en la
 * consola un mensaje estilizado que identifica al arquitecto original del
 * sistema. No afecta el render ni la UI (retorna `null`).
 */
export default function Watermark() {
  useEffect(() => {
    console.info(
      "%c🏝️ Turismo Link %c\nSystem Architected & Developed by Victor Quiros Suarez.\nAll Rights Reserved. © " +
        new Date().getFullYear(),
      "font-size:16px; font-weight:bold; color:#0ea5e9; padding:4px 0;",
      "font-size:12px; color:#64748b;",
    );
  }, []);

  return null;
}
