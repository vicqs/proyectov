"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Locale = "es" | "en";

/** Diccionario básico de traducciones para el perfil público del turista. */
const diccionario = {
  es: {
    servicios_disponibles: "Servicios disponibles",
    sin_servicios: "Este negocio aún no tiene servicios disponibles.",
    elige_horario: "Elige un horario disponible",
    sin_horarios: "Este servicio no tiene horarios disponibles en este momento.",
    continuar: "Continuar",
    continuar_pago: "Continuar al pago",
    volver: "Volver",
    tus_datos: "Tus datos",
    nombre_completo: "Nombre completo",
    correo_electronico: "Correo electrónico",
    correo_invalido: "Ingresa un correo válido, por ejemplo: ana@email.com",
    correo_duplicado:
      "Este correo ya tiene una reserva para esta experiencia. Usa otro correo.",
    pago_seguro: "Pago seguro",
    total_a_pagar: "Total a pagar",
    numero_tarjeta: "Número de tarjeta",
    vencimiento: "Vencimiento",
    cvc: "CVC",
    pagar: "Pagar",
    error_pago: "No se pudo procesar el pago. Intenta de nuevo.",
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
    quedan: "quedan",
    personas: "Personas (cupos)",
    quitar_persona: "Quitar una persona",
    agregar_persona: "Agregar una persona",
    enlace_no_disponible: "Enlace no disponible",
    agenda_inactiva:
      "La agenda de este negocio no está disponible temporalmente.",
    reserva_confirmada: "Tu reserva está confirmada",
    whatsapp_mensaje: "Hola, quisiera consultar sobre una reserva.",
    horario_no_disponible: "El horario ya no está disponible.",
    pago_confirmado: "¡Pago confirmado! Revisa tu correo para ver el recibo.",
    pago_cancelado: "El pago fue cancelado. Tu reserva quedó pendiente.",
    reportar_perfil: "Reportar este perfil",
    rep_titulo: "Reportar",
    rep_etiqueta: "Ayúdanos a cuidar la comunidad",
    rep_descripcion:
      "Cuéntanos qué te preocupa de este perfil. Lo revisará nuestro equipo.",
    rep_volver: "Volver al perfil",
    rep_motivo: "Motivo del reporte",
    rep_m_contenido: "Contenido inapropiado",
    rep_m_fraude: "Posible fraude",
    rep_m_suplantacion: "Suplantación",
    rep_m_otro: "Otro",
    rep_detalles: "Detalles (opcional)",
    rep_correo: "Tu correo (opcional)",
    rep_enviar: "Enviar reporte",
  },
  en: {
    servicios_disponibles: "Available services",
    sin_servicios: "This business has no available services yet.",
    elige_horario: "Choose an available time",
    sin_horarios: "This service has no available times at the moment.",
    continuar: "Continue",
    continuar_pago: "Continue to payment",
    volver: "Back",
    tus_datos: "Your details",
    nombre_completo: "Full name",
    correo_electronico: "Email address",
    correo_invalido: "Enter a valid email address, e.g. anna@email.com",
    correo_duplicado:
      "This email already has a booking for this experience. Please use another email.",
    pago_seguro: "Secure payment",
    total_a_pagar: "Total to pay",
    numero_tarjeta: "Card number",
    vencimiento: "Expiry",
    cvc: "CVC",
    pagar: "Pay",
    error_pago: "Payment could not be processed. Please try again.",
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
    quedan: "left",
    personas: "Guests",
    quitar_persona: "Remove one guest",
    agregar_persona: "Add one guest",
    enlace_no_disponible: "Link unavailable",
    agenda_inactiva: "This business's booking page is temporarily unavailable.",
    reserva_confirmada: "Your booking is confirmed",
    whatsapp_mensaje: "Hi, I would like to ask about a booking.",
    horario_no_disponible: "This time is no longer available.",
    pago_confirmado: "Payment confirmed! Check your email for the receipt.",
    pago_cancelado: "Payment was cancelled. Your booking is still pending.",
    reportar_perfil: "Report this profile",
    rep_titulo: "Report",
    rep_etiqueta: "Help us keep the community safe",
    rep_descripcion:
      "Tell us what concerns you about this profile. Our team will review it.",
    rep_volver: "Back to profile",
    rep_motivo: "Reason for the report",
    rep_m_contenido: "Inappropriate content",
    rep_m_fraude: "Possible fraud",
    rep_m_suplantacion: "Impersonation",
    rep_m_otro: "Other",
    rep_detalles: "Details (optional)",
    rep_correo: "Your email (optional)",
    rep_enviar: "Send report",
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
  const [locale, setLocaleState] = useState<Locale>("es");

  // Idioma inicial: preferencia guardada o idioma del navegador (tras montar,
  // para no provocar diferencias de hidratación).
  useEffect(() => {
    const guardado = window.localStorage.getItem("locale");
    if (guardado === "es" || guardado === "en") {
      setLocaleState(guardado);
    } else if (navigator.language?.toLowerCase().startsWith("en")) {
      setLocaleState("en");
    }
  }, []);

  const setLocale = useCallback((nuevo: Locale) => {
    setLocaleState(nuevo);
    try {
      window.localStorage.setItem("locale", nuevo);
    } catch {
      // Almacenamiento no disponible: la preferencia solo dura la sesión.
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (clave) => diccionario[locale][clave],
    }),
    [locale, setLocale],
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
