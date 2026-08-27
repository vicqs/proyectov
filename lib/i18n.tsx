"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Locale = "es" | "en";

/** Diccionario básico de traducciones para el perfil público del turista. */
const diccionario = {
  es: {
    servicios_disponibles: "Servicios disponibles",
    elige_horario: "Elige un horario disponible",
    continuar: "Continuar",
    continuar_pago: "Continuar al pago",
    tus_datos: "Tus datos",
    nombre_completo: "Nombre completo",
    correo_electronico: "Correo electrónico",
    pago_seguro: "Pago seguro",
    total_a_pagar: "Total a pagar",
    numero_tarjeta: "Número de tarjeta",
    vencimiento: "Vencimiento",
    cvc: "CVC",
    pagar: "Pagar",
    conectando_banco: "Conectando con el banco...",
    puede_tardar: "Esto puede tardar unos segundos.",
    pago_exitoso: "¡Pago exitoso!",
    recibo_enviado: "Te enviamos el recibo a",
    recibo_digital: "Recibo digital",
    negocio: "Negocio",
    servicio: "Servicio",
    fecha_hora: "Fecha y hora",
    cliente: "Cliente",
    total_pagado: "Total pagado",
    listo: "Listo",
    reservado: "Reservado",
    cerrar: "Cerrar",
    min: "min",
    reservar: "Reservar",
  },
  en: {
    servicios_disponibles: "Available services",
    elige_horario: "Choose an available time",
    continuar: "Continue",
    continuar_pago: "Continue to payment",
    tus_datos: "Your details",
    nombre_completo: "Full name",
    correo_electronico: "Email address",
    pago_seguro: "Secure payment",
    total_a_pagar: "Total to pay",
    numero_tarjeta: "Card number",
    vencimiento: "Expiry",
    cvc: "CVC",
    pagar: "Pay",
    conectando_banco: "Connecting to your bank...",
    puede_tardar: "This may take a few seconds.",
    pago_exitoso: "Payment successful!",
    recibo_enviado: "We sent your receipt to",
    recibo_digital: "Digital receipt",
    negocio: "Business",
    servicio: "Service",
    fecha_hora: "Date and time",
    cliente: "Customer",
    total_pagado: "Total paid",
    listo: "Done",
    reservado: "Booked",
    cerrar: "Close",
    min: "min",
    reservar: "Book now",
  },
} as const;

export type ClaveTraduccion = keyof (typeof diccionario)["es"];

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (clave: ClaveTraduccion) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Provee el idioma activo (ES/EN) y la función de traducción `t()` al árbol. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (clave) => diccionario[locale][clave],
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/** Hook de traducción para el frontend público (ES/EN). */
export function useTranslations() {
  const contexto = useContext(LocaleContext);
  if (!contexto) {
    throw new Error("useTranslations debe usarse dentro de un LocaleProvider");
  }
  return contexto;
}
