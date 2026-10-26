# 📜 Reglas de Negocio — vuki

Este documento define el modelo de negocio, la propuesta de planes de suscripción y el marco financiero/legal de diseño de vuki.

## 1. 🎯 Público objetivo

vuki está diseñado para **micro y pequeñas empresas turísticas (pymes)** de Costa Rica, con especial foco en negocios operativos que venden experiencias y actividades reservables por cupo/horario:

- 🏄 Escuelas de surf.
- 🌋 Operadores de tours y aventura (canopy, catarismo, avistamiento de vida silvestre, etc.).
- 🏨 Hospedajes boutique y B&Bs pequeños.
- 🚤 Actividades acuáticas y excursiones.

El perfil típico es un negocio con **operación local, equipo pequeño y sin capacidad de invertir en desarrollo a la medida**, que necesita una presencia web transaccional simple ("link en bio") sin pagar comisión por cada venta.

## 2. 💳 Modelo de suscripción (Tiers)

vuki se monetiza mediante una **suscripción mensual fija**, no por comisión sobre ventas. La propuesta comercial contempla dos planes:

| Plan         | Precio          | Segmento objetivo                                                                     |
| ------------ | --------------- | ------------------------------------------------------------------------------------- |
| **Esencial** | **$25 USD/mes** | Zonas rurales / micro-pymes con volumen de reservas bajo-medio                        |
| **Pro**      | **$40 USD/mes** | Zonas de alta densidad turística / empresas más grandes con mayor volumen de reservas |

> **Propuesta, no tarifa operativa:** los planes Esencial ($25) y Pro ($40) se conservan como aspiración comercial. La operación mantiene los planes y descuentos configurados, el precio de respaldo de **$15 USD** de [lib/plataforma.ts](../lib/plataforma.ts) y el checkout de suscripciones de Stripe con `STRIPE_PRICE_ID`. El rebranding no cambia importes, identificadores ni reglas de cobro.

- El plan se paga **por el negocio**, no por el turista.
- El precio es fijo independientemente del volumen de ventas del mes — este es el pilar de la propuesta "cero comisiones".
- La gestión de suscripción (activación, cancelación, estado de prueba) se refleja en el panel de empresa (`/[slug]/admin/suscripcion`, ej. `/surf-tamarindo/admin/suscripcion`).

## 3. 🏦 Flujo financiero y legal

### vuki es un puente tecnológico, no un PayFac

> **Flujo objetivo:** los pagos de reservas turísticas siguen simulados. Stripe se utiliza para suscripciones SaaS; **TiloPay/OnvoPay no están implementados**. El flujo directo a la pyme descrito a continuación es una propuesta de integración, no una capacidad activada por el cambio de marca.

vuki **no retiene, custodia ni procesa fondos de terceros**. La plataforma actúa exclusivamente como una **capa tecnológica** (agenda, catálogo de servicios, control de cupos y UI de checkout) cuyo diseño contempla conectarse a pasarelas de pago autorizadas.

- En el flujo propuesto, los pagos realizados por los turistas viajan **directamente desde la pasarela de pago hacia la cuenta bancaria de la pyme** — vuki nunca es un intermediario del dinero.
- La integración propuesta contempla pasarelas de pago costarricenses como **TiloPay** u **OnvoPay**, con el marco regulatorio correspondiente para procesar pagos con tarjeta; ninguna de estas dos integraciones está implementada.
- Al no agregar ni mezclar fondos de múltiples comercios en una cuenta propia, vuki **no opera como un Facilitador de Pagos (PayFac)**, evitando así las obligaciones regulatorias y de supervisión que la **SUGEF** (Superintendencia General de Entidades Financieras) exige a los agregadores/procesadores de pagos.
- Cada pyme mantiene su **propia relación contractual y tributaria** con la pasarela de pago y con el **Ministerio de Hacienda** (facturación electrónica, declaración de ingresos), ya que el dinero ingresa directamente a su cuenta y bajo su cédula jurídica/física — vuki no emite facturas por las ventas de servicios turísticos ni aparece como parte de esa cadena de pago.
- Esto simplifica drásticamente el cumplimiento normativo de la plataforma, ya que su facturación se limita a **su propio servicio de suscripción SaaS**, no a las transacciones turísticas de sus clientes.

### Consecuencia práctica

> 💡 vuki vende **software como servicio**; la pyme turística vende **su propio servicio** y cobra **su propio dinero**, directamente. vuki nunca aparece en el flujo de fondos entre el turista y la pyme.

## 4. ⭐ Propuesta de valor principal

1. **📅 Control de cupos automatizado** — la disponibilidad de cada horario/servicio se actualiza en tiempo real con cada reserva, evitando sobreventa y llamadas manuales de coordinación.
2. **🚫 Cero comisiones por venta** — el costo para la pyme es fijo y predecible (plan Esencial o Pro), sin importar cuánto venda ese mes.
3. **💵 Pagos directos y locales (propuesta)** — el diseño prevé que el dinero del turista llegue directo a la cuenta bancaria de la pyme vía pasarelas costarricenses (TiloPay/OnvoPay), buscando evitar fricciones cambiarias y demoras de liquidación de intermediarios internacionales; no es una integración implementada.
4. **🔗 Simplicidad tipo "link en bio"** — un solo enlace público y transaccional, ideal para compartir en redes sociales, sin necesidad de un sitio web complejo o un equipo técnico propio.
