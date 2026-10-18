# 🗺️ Roadmap — Proyecto V

Roadmap de desarrollo estructurado en 3 fases, desde el prototipo actual hasta el lanzamiento beta con pymes piloto. Usa checkboxes para llevar seguimiento accionable del avance.

---

## 🎬 Fase 1: Prototipo (Actual)

Estado actual del proyecto: prototipo funcional con capa mock local.

- [x] Perfil público del negocio con catálogo de servicios (`/[slug]`).
- [x] Flujo de checkout animado multi-paso (`AnimatedCheckoutSheet.tsx`).
- [ ] Pulir el modal de pago simulado (validaciones de tarjeta, mensajes de error, estados de carga más realistas).
- [ ] Completar la vista de suscripciones en el panel de empresa con los tiers **Esencial ($25/mes)** y **Pro ($40/mes)**, incluyendo comparación de beneficios y selector de plan.
- [ ] Revisar consistencia de textos e i18n en todos los pasos del flujo de reservas.
- [ ] Pruebas de usabilidad internas con el equipo antes de mostrarla a pymes reales.

---

## ⚙️ Fase 2: MVP Técnico

Transición del prototipo a una aplicación con backend real, persistencia y pagos funcionales.

- [ ] Migrar de la capa mock a una base de datos real (PostgreSQL/Supabase), siguiendo el esquema relacional proyectado en [docs/bd/Estructura_Datos.md](bd/Estructura_Datos.md) (`Company`, `Service`, `Schedule`, `Booking`).
- [ ] Reemplazar las acciones del store (`crearServicio`, `crearHorario`, `crearReserva`, etc.) por Server Actions/API conectadas a Supabase, manteniendo la misma interfaz para minimizar cambios en la UI.
- [ ] Implementar autenticación real para las pymes (login, registro, recuperación de contraseña, sesión por negocio).
- [x] Proteger las rutas de `/[slug]/admin/*` con autenticación en middleware y autorización por `user_id` + `slug` en cada página y Server Action mediante [lib/empresa.ts](../lib/empresa.ts).
- [ ] Conectar la API real de **TiloPay** u **OnvoPay**, sustituyendo el paso `"pago"` simulado de `AnimatedCheckoutSheet.tsx` por el modal/checkout embebido real.
- [ ] Implementar el webhook real de confirmación de pago que dispara la creación de la reserva (`estado_pago`) solo tras el pago efectivo.
- [ ] Habilitar el cobro real de la suscripción mensual de la pyme (plan Esencial/Pro).
- [ ] Migrar el envío de notificaciones (Resend + React Email) a los eventos reales de reserva/pago.
- [ ] Pruebas end-to-end del flujo completo: registro de pyme → creación de servicio → reserva de turista → pago real → confirmación.

---

## 🚀 Fase 3: Lanzamiento Beta

Validación en el mundo real con negocios piloto antes del lanzamiento general.

- [ ] Seleccionar y onboardear **2-3 pymes piloto en la costa** (ej. escuelas de surf, tours) para uso real de la plataforma.
- [ ] Acompañamiento cercano durante las primeras semanas de operación (soporte directo, monitoreo de errores).
- [ ] Recolectar feedback estructurado de las pymes piloto y de sus turistas sobre el flujo de reserva y pago.
- [ ] Ajustes finales de UX/UI basados en el feedback real (fricciones detectadas, claridad de textos, rendimiento en móvil).
- [ ] Revisar métricas clave: tasa de conversión de reserva, tasa de éxito de pago, tiempo promedio de checkout.
- [ ] Validar el flujo financiero/legal en producción (fondos llegando directo a la cuenta de la pyme, sin retención — ver [docs/Reglas_Negocio.md](Reglas_Negocio.md)).
- [ ] Preparar plan de lanzamiento general (marketing, incorporación de nuevas pymes, soporte escalable).
