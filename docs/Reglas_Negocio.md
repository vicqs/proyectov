# 📜 Reglas de Negocio — Proyecto V

Este documento define el modelo de negocio, los planes de suscripción y el marco financiero/legal sobre el que opera Proyecto V.

## 1. 🎯 Público objetivo

Proyecto V está diseñado para **micro y pequeñas empresas turísticas (pymes)** de Costa Rica, con especial foco en negocios operativos que venden experiencias y actividades reservables por cupo/horario:

- 🏄 Escuelas de surf.
- 🌋 Operadores de tours y aventura (canopy, catarismo, avistamiento de vida silvestre, etc.).
- 🏨 Hospedajes boutique y B&Bs pequeños.
- 🚤 Actividades acuáticas y excursiones.

El perfil típico es un negocio con **operación local, equipo pequeño y sin capacidad de invertir en desarrollo a la medida**, que necesita una presencia web transaccional simple ("link en bio") sin pagar comisión por cada venta.

## 2. 💳 Modelo de suscripción (Tiers)

Proyecto V se monetiza mediante una **suscripción mensual fija**, no por comisión sobre ventas. Existen dos planes:

| Plan         | Precio          | Segmento objetivo                                                                     |
| ------------ | --------------- | ------------------------------------------------------------------------------------- |
| **Esencial** | **$25 USD/mes** | Zonas rurales / micro-pymes con volumen de reservas bajo-medio                        |
| **Pro**      | **$40 USD/mes** | Zonas de alta densidad turística / empresas más grandes con mayor volumen de reservas |

- El plan se paga **por el negocio**, no por el turista.
- El precio es fijo independientemente del volumen de ventas del mes — este es el pilar de la propuesta "cero comisiones".
- La gestión de suscripción (activación, cancelación, estado de prueba) se refleja en el panel de administración (`/admin/suscripcion`, demo en `/demo/admin/suscripcion`).

## 3. 🏦 Flujo financiero y legal

### Proyecto V es un puente tecnológico, no un PayFac

Proyecto V **no retiene, custodia ni procesa fondos de terceros**. La plataforma actúa exclusivamente como una **capa tecnológica** (agenda, catálogo de servicios, control de cupos y UI de checkout) que se conecta a pasarelas de pago autorizadas.

- Los pagos realizados por los turistas viajan **directamente desde la pasarela de pago hacia la cuenta bancaria de la pyme** — Proyecto V nunca es un intermediario del dinero.
- La integración se realiza mediante pasarelas de pago costarricenses como **TiloPay** u **OnvoPay**, que sí cuentan con el marco regulatorio correspondiente para procesar pagos con tarjeta.
- Al no agregar ni mezclar fondos de múltiples comercios en una cuenta propia, Proyecto V **no opera como un Facilitador de Pagos (PayFac)**, evitando así las obligaciones regulatorias y de supervisión que la **SUGEF** (Superintendencia General de Entidades Financieras) exige a los agregadores/procesadores de pagos.
- Cada pyme mantiene su **propia relación contractual y tributaria** con la pasarela de pago y con el **Ministerio de Hacienda** (facturación electrónica, declaración de ingresos), ya que el dinero ingresa directamente a su cuenta y bajo su cédula jurídica/física — Proyecto V no emite facturas por las ventas de servicios turísticos ni aparece como parte de esa cadena de pago.
- Esto simplifica drásticamente el cumplimiento normativo de la plataforma, ya que su facturación se limita a **su propio servicio de suscripción SaaS**, no a las transacciones turísticas de sus clientes.

### Consecuencia práctica

> 💡 Proyecto V vende **software como servicio**; la pyme turística vende **su propio servicio** y cobra **su propio dinero**, directamente. Proyecto V nunca aparece en el flujo de fondos entre el turista y la pyme.

## 4. ⭐ Propuesta de valor principal

1. **📅 Control de cupos automatizado** — la disponibilidad de cada horario/servicio se actualiza en tiempo real con cada reserva, evitando sobreventa y llamadas manuales de coordinación.
2. **🚫 Cero comisiones por venta** — el costo para la pyme es fijo y predecible (plan Esencial o Pro), sin importar cuánto venda ese mes.
3. **💵 Pagos directos y locales** — el dinero del turista llega directo a la cuenta bancaria de la pyme vía pasarelas costarricenses (TiloPay/OnvoPay), sin fricciones cambiarias ni demoras de liquidación de intermediarios internacionales.
4. **🔗 Simplicidad tipo "link en bio"** — un solo enlace público y transaccional, ideal para compartir en redes sociales, sin necesidad de un sitio web complejo o un equipo técnico propio.
