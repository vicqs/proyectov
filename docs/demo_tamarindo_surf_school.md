# Demo público "Tamarindo Surf School" — Guía rápida

> Este archivo documenta el **prototipo de demo sin backend** usado para
> mostrar el producto a clientes potenciales. Es seguro subirlo a git: no
> contiene credenciales reales ni datos sensibles, todo es información
> ficticia en memoria (`lib/mockData.ts`).

## Enlace del cliente (público)

```
/demo/surf-tamarindo
```

Este es el "link en bio" que vería un turista. Permite ver los servicios
de "Tamarindo Surf School" y simular una reserva + pago completo
(horario → datos → tarjeta → confirmación), con recibo digital animado.

## Enlace de administrador (demo)

```
/demo/admin/suscripcion
```

Esta ruta simula (100% en `localStorage`, sin Supabase ni Tilopay) el
panel donde el dueño del negocio gestiona su suscripción SaaS:

- Ver el estado actual ("Activa", "Prueba gratuita" o "Inactiva").
- **Simular pago y activar** → pone la suscripción en "activa".
- **Cancelar suscripción (simular impago)** → pone la suscripción en
  "inactiva".

Este panel no tiene login (no hay backend), es de acceso libre solo para
fines de demostración.

## ¿Qué pasa con el link del cliente si la suscripción está inactiva?

Si desde `/demo/admin/suscripcion` cancelas la suscripción, al visitar
`/demo/surf-tamarindo` verás una pantalla de "Enlace no disponible" en
lugar de los servicios — así se demuestra el efecto de negocio sin pagar,
sin necesidad de Supabase ni de una pasarela de pago real todavía.

## ¿Dónde SÍ existe esa lógica de "bloquear el link si no paga"?

En la aplicación real (no en este demo), bajo el flujo de \*\*Fase 6
(Financiero + Suscripción SaaS)`:

- `types/database.ts` → campo `estado_suscripcion` ("activa" | "inactiva" | "prueba").
- `app/admin/suscripcion/page.tsx` → panel donde el dueño del negocio ve su
  estado y paga (o simula pagar, en modo mock).
- Actualmente el middleware/rutas **no bloquean** el perfil público
  (`app/[slug]/page.tsx`) según `estado_suscripcion` — eso sería un cambio
  adicional a implementar si se quiere reflejar "si no paga, su link deja
  de funcionar" también en producción (hoy solo se refleja en su propio
  panel `/admin/suscripcion`).

## Rutas y archivos relevantes de este demo

| Archivo                                    | Rol                                                            |
| ------------------------------------------ | -------------------------------------------------------------- |
| `lib/mockData.ts`                          | Datos ficticios del negocio y servicios                        |
| `lib/reservasStorage.ts`                   | Persiste horarios "reservados" en `localStorage` del navegador |
| `lib/suscripcionStorage.ts`                | Persiste el estado de suscripción simulado en `localStorage`   |
| `lib/i18n.tsx`                             | Traducciones ES/EN del checkout                                |
| `components/ServicioCard.tsx`              | Tarjeta de servicio                                            |
| `components/AnimatedCheckoutSheet.tsx`     | Bottom sheet de reserva/pago simulado                          |
| `app/demo/[slug]/page.tsx`                 | Página pública del demo (SEO/metadata)                         |
| `app/demo/[slug]/NegocioProfileClient.tsx` | UI interactiva del perfil público (valida suscripción)         |
| `app/demo/admin/suscripcion/page.tsx`      | Panel de administración simulado de la suscripción             |

## Cómo probarlo

1. `npm run dev`
2. Abrir `http://localhost:3000/demo/surf-tamarindo`
3. Elegir un servicio → completar el checkout simulado → ver el recibo.
