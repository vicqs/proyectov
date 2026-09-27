# 🧭 Flujo de Reservas — User Journey del Turista

Este documento describe el recorrido exacto que sigue un turista al reservar un servicio a través del perfil público de un negocio (ej. `/demo/surf-tamarindo`), junto con los componentes Next.js/React involucrados en cada paso.

## Vista general del flujo

```
Selección de Servicio → Selección de Fecha/Hora → Datos del Turista → Pasarela de Pago → Confirmación
```

Todo el recorrido ocurre **sin salir de la página** (experiencia tipo Single Page App dentro de la ruta pública), usando un modal/bottom sheet que avanza por pasos con animaciones de Framer Motion.

---

## 1. 🏄 Selección de servicio

El turista llega al enlace público del negocio (compartido por Instagram/WhatsApp, ej. `/demo/surf-tamarindo`) y ve el catálogo de servicios disponibles (ej. "Clase Privada de Surf").

- **Ruta/página**: `app/demo/[slug]/page.tsx` — Server Component que carga los datos del negocio (`mockNegocio`) y define metadata SEO (`generateMetadata`).
- **Cliente**: [app/demo/[slug]/NegocioProfileClient.tsx](../app/demo/%5Bslug%5D/NegocioProfileClient.tsx) — Client Component (`"use client"`) que renderiza el listado de servicios con animación escalonada (`staggerChildren`) y lee el estado reactivo del negocio vía `useDemoStore(negocio.slug)`.
- **Componente de tarjeta**: [components/ServicioCard.tsx](../components/ServicioCard.tsx) — muestra imagen, nombre, duración y precio con el color de marca del negocio (`colorTema`). Al hacer click/tap (`onSeleccionar`), guarda el servicio elegido en el estado local (`setServicioSeleccionado`).
- Este click **abre el flujo de checkout**, montando `AnimatedCheckoutSheet` en el paso inicial `"horario"`.

## 2. 📅 Selección de fecha y hora

El turista ve la disponibilidad real del servicio elegido — solo las franjas horarias con cupos libres.

- **Componente**: [components/AnimatedCheckoutSheet.tsx](../components/AnimatedCheckoutSheet.tsx), paso `"horario"`.
- **Datos**: `horariosDelServicio` — se filtran en `NegocioProfileClient.tsx` a partir de `horarios` (provenientes de `useDemoStore`), cruzando por `servicioId`. Cada `DemoHorario` expone `label` (ej. "Hoy 2:00 PM"), `cuposTotales` y `cuposDisponibles`, permitiendo deshabilitar o resaltar horarios agotados.
- El turista selecciona un horario (`horarioSeleccionado`), lo que habilita el botón para avanzar al siguiente paso (`setPaso("datos")`, con `setDireccion(1)` para la animación de deslizamiento hacia la derecha).

## 3. 📝 Recopilación de datos

Se solicitan los datos mínimos necesarios para identificar y contactar al turista.

- **Componente**: mismo `AnimatedCheckoutSheet.tsx`, paso `"datos"`.
- **Campos**: nombre (`nombre`), correo (`email`, validado con `REGEX_EMAIL`) y, según el servicio, cantidad de personas/cupos a reservar.
- Validaciones en cliente antes de continuar: formato de correo (`errorEmail`) y verificación de reservas duplicadas contra `reservasExistentes` (para evitar que el mismo correo reserve dos veces el mismo horario).
- Al validar correctamente, se avanza al paso `"pago"`.

## 4. 💳 Pasarela de pago

Se levanta el paso de pago dentro del **mismo bottom sheet**, sin redirigir a otra página ni dominio externo.

- **Componente**: `AnimatedCheckoutSheet.tsx`, paso `"pago"` — actualmente renderiza campos de tarjeta simulados (número, vencimiento, CVC) con formateo en vivo (`formatearNumeroTarjeta`, `formatearVencimiento`) y validación básica (`vencimientoValido`).
- Al confirmar, se transiciona automáticamente al paso `"cargando"` (spinner `Loader2` de `lucide-react`) mientras se simula el procesamiento (`setTimeout`).
- **Alternativa simplificada**: en flujos más simples del perfil de demo puro, [components/CheckoutMock.tsx](../components/CheckoutMock.tsx) colapsa este paso en un único modal con un botón "Confirmar y pagar (simulado)".
- **Futuro (ver [docs/Arquitectura_Tecnica.md](Arquitectura_Tecnica.md#3-💳-flujo-de-pago-mock-actual-vs-futuro-con-tilopayonvopay))**: este paso está preparado para ser reemplazado por el **modal embebido de TiloPay u OnvoPay**, manteniendo al turista dentro de la web (sin redirect), y confirmando el pago mediante un webhook real en vez del `setTimeout` simulado.

## 5. ✅ Confirmación

El turista ve la pantalla de éxito y, en el mismo instante, el cupo queda bloqueado en el sistema para evitar sobreventa.

- **Componente**: `AnimatedCheckoutSheet.tsx`, paso `"exito"` — muestra ícono `CheckCircle2`, resumen de la reserva y el identificador de transacción simulado (`trxIdSimulado`, formato `TL-XXXXXXXX`).
- **Actualización de estado**: al llegar a este paso, se invoca el callback `onReservaConfirmada(horarioId, nombreCliente, emailCliente)`, definido en `NegocioProfileClient.tsx` como `handleReservaConfirmada`, que llama a `crearReserva(...)` de [lib/demoStore.ts](../lib/demoStore.ts).
- **Bloqueo de cupo**: `crearReserva` en el store de Zustand decrementa `cuposDisponibles` del `DemoHorario` correspondiente y agrega el nuevo registro a `reservas` — como el store es reactivo, **todas las tarjetas y horarios se re-renderizan al instante** reflejando la nueva disponibilidad, sin necesidad de recargar la página.
- El turista puede cerrar el sheet (`onClose`), volviendo al perfil público con el catálogo ya actualizado.

---

## 🧩 Resumen de componentes por paso

| Paso                     | Componente principal                                                               | Tipo                                              |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1. Selección de servicio | `app/demo/[slug]/page.tsx` + `NegocioProfileClient.tsx` + `ServicioCard.tsx`       | Server Component (datos) + Client Components (UI) |
| 2. Fecha y hora          | `AnimatedCheckoutSheet.tsx` (paso `"horario"`)                                     | Client Component                                  |
| 3. Datos del turista     | `AnimatedCheckoutSheet.tsx` (paso `"datos"`)                                       | Client Component                                  |
| 4. Pago                  | `AnimatedCheckoutSheet.tsx` (pasos `"pago"` / `"cargando"`) o `CheckoutMock.tsx`   | Client Component                                  |
| 5. Confirmación          | `AnimatedCheckoutSheet.tsx` (paso `"exito"`) + `lib/demoStore.ts` (`crearReserva`) | Client Component + Store Zustand                  |
