"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface TextareaConContadorProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength: number;
  mostrarContador?: boolean;
}

/**
 * Textarea estándar con límite nativo `maxLength` y contador en vivo `{conteo}/{maxLength}`.
 * Compatible con Server Actions (usando `name` y `defaultValue`) y componentes controlados.
 */
export const TextareaConContador = forwardRef<
  HTMLTextAreaElement,
  TextareaConContadorProps
>(function TextareaConContador(
  {
    maxLength,
    minLength,
    defaultValue,
    value,
    onChange,
    onInput,
    rows = 3,
    className = "vuki-textarea",
    mostrarContador = true,
    ...props
  },
  ref
) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);

  useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement);

  const [conteo, setConteo] = useState(() => {
    if (typeof value === "string") return value.length;
    if (typeof defaultValue === "string") return defaultValue.length;
    if (typeof defaultValue === "number") return String(defaultValue).length;
    return 0;
  });

  // Si el formulario padre se resetea (ej. al guardar con éxito), actualizamos el contador
  useEffect(() => {
    const el = internalRef.current;
    if (!el || !el.form) return;
    const form = el.form;
    const onReset = () => {
      setTimeout(() => {
        setConteo(el.value.length);
      }, 0);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  // Mantener actualizado si defaultValue o value cambian externamente
  useEffect(() => {
    if (value !== undefined) {
      setConteo(typeof value === "string" ? value.length : 0);
    } else if (defaultValue !== undefined) {
      setConteo(
        typeof defaultValue === "string"
          ? defaultValue.length
          : String(defaultValue).length
      );
    }
  }, [value, defaultValue]);

  const longitudActual = typeof value === "string" ? value.length : conteo;

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    setConteo(e.currentTarget.value.length);
    if (onInput) {
      // React 19 tipa onInput con InputEvent nativo
      (onInput as (event: React.FormEvent<HTMLTextAreaElement>) => void)(e);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setConteo(e.target.value.length);
    onChange?.(e);
  }

  return (
    <div className="w-full space-y-1">
      <textarea
        ref={internalRef}
        {...props}
        rows={rows}
        minLength={minLength}
        maxLength={maxLength}
        {...(value !== undefined
          ? { value }
          : defaultValue !== undefined
          ? { defaultValue }
          : {})}
        onInput={handleInput}
        onChange={handleChange}
        className={className}
      />
      {mostrarContador && (
        <div className="flex items-center justify-end text-[11px] text-slate-400">
          <span
            className={
              longitudActual >= maxLength
                ? "font-semibold text-amber-600"
                : ""
            }
          >
            {longitudActual}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
});
