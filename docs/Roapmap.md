# 🗺️ Roadmap — Proyecto V

Roadmap de desarrollo estructurado en 3 fases, desde la demo interactiva actual hasta el lanzamiento beta con pymes piloto. Usa checkboxes para llevar seguimiento accionable del avance.

---

## 🎬 Fase 1: Demo Interactiva (Actual)

Estado actual del proyecto: prototipo funcional en memoria (`/demo/*`), sin backend real, pensado para presentaciones comerciales a pymes.

- [x] Perfil público del negocio con catálogo de servicios (`/demo/[slug]`).
- [x] Panel de administración de demo (`/demo/admin`) con servicios, horarios y reservas.
- [x] Store en memoria con Zustand (`lib/demoStore.ts`) simulando multi-tenant por `slug`.
- [x] Flujo de checkout animado multi-paso (`AnimatedCheckoutSheet.tsx`).
- [ ] Pulir el modal de pago simulado (validaciones de tarjeta, mensajes de error, estados de carga más realistas).
- [ ] Completar la vista de suscripciones en el admin con los tiers **Esencial ($25/mes)** y **Pro ($40/mes)**, incluyendo comparación de beneficios y selector de plan.
- [ ] Revisar consistencia de textos e i18n en todos los pasos del flujo de demo.
- [ ] Pruebas de usabilidad internas con el equipo antes de mostrarla a pymes reales.

---

## ⚙️ Fase 2: MVP Técnico

Transición de la demo a una aplicación con backend real, persistencia y pagos funcionales.

- [ ] Migrar de Zustand (en memoria) a una base de datos real (PostgreSQL/Supabase), siguiendo el esquema relacional proyectado en [docs/Estructura_Datos.md](Estructura_Datos.md) (`Company`, `Service`, `Schedule`, `Booking`).
- [ ] Reemplazar las acciones del store (`crearServicio`, `crearHorario`, `crearReserva`, etc.) por Server Actions/API conectadas a Supabase, manteniendo la misma interfaz para minimizar cambios en la UI.
- [ ] Implementar autenticación real para las pymes (login, registro, recuperación de contraseña, sesión por negocio).
- [ ] Proteger las rutas de `/admin/*` con middleware de autenticación y autorización por `company_id`.
- [ ] Conectar la API real de **TiloPay** u **OnvoPay**, sustituyendo el paso `"pago"` simulado de `AnimatedCheckoutSheet.tsx` por el modal/checkout embebido real (ver [docs/Arquitectura_Tecnica.md](Arquitectura_Tecnica.md#3-💳-flujo-de-pago-mock-actual-vs-futuro-con-tilopayonvopay)).
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
