import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { MARCA } from "../lib/marca";

export interface AlertaPymeProps {
  negocioNombre: string;
  servicioNombre: string;
  fechaHora: string; // ISO string
  emailCliente: string;
  montoUsd: number;
  /** Texto opcional configurable por la administración global. */
  encabezado?: string;
  pie?: string;
}

/**
 * Alerta de nueva venta enviada al dueño de la pyme. Diseño práctico que
 * resalta que la cita ya fue pagada (no requiere acción de cobro adicional).
 */
export default function AlertaPyme({
  negocioNombre,
  servicioNombre,
  fechaHora,
  emailCliente,
  montoUsd,
  encabezado,
  pie,
}: AlertaPymeProps) {
  const fechaFormateada = new Date(fechaHora).toLocaleString("es-CR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <Html>
      <Head />
      <Preview>
        ¡Nueva reserva pagada! {servicioNombre} — ${montoUsd.toFixed(2)} USD
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={businessName}>{negocioNombre}</Text>

          <Section style={badge}>
            <Text style={badgeText}>✅ PAGADA</Text>
          </Section>

          <Heading style={heading}>¡Nueva reserva confirmada!</Heading>

          {encabezado && <Text style={paragraph}>{encabezado}</Text>}

          <Text style={paragraph}>
            {negocioNombre}, tienes una nueva reserva pagada. No necesitas
            cobrar nada más: el pago ya fue procesado exitosamente.
          </Text>

          <Section style={detailsBox}>
            <Row>
              <Column>
                <Text style={detailLabel}>Servicio</Text>
                <Text style={detailValue}>{servicioNombre}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detailLabel}>Fecha y hora</Text>
                <Text style={detailValue}>{fechaFormateada}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detailLabel}>Cliente</Text>
                <Text style={detailValue}>{emailCliente}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detailLabel}>Ingreso generado</Text>
                <Text style={detailValueHighlight}>
                  ${montoUsd.toFixed(2)} USD
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {pie && <Text style={footer}>{pie}</Text>}

          <Text style={footer}>
            Puedes ver el detalle completo en tu panel de empresa, sección
            "Reservas".
          </Text>

          <Text style={platformFooter}>
            {negocioNombre} · Reservado con{" "}
            <span style={wordmark}>
              {MARCA.nombre}
              <span style={wordmarkDot}>.</span>
            </span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

AlertaPyme.PreviewProps = {
  negocioNombre: "Escuela de Surf Pura Vida",
  servicioNombre: "Clase de surf 1h",
  fechaHora: new Date().toISOString(),
  emailCliente: "turista@example.com",
  montoUsd: 45,
} satisfies AlertaPymeProps;

const main = {
  backgroundColor: MARCA.colores.fondo,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  padding: "24px 0",
};

const container = {
  backgroundColor: MARCA.colores.blanco,
  border: "1px solid #e2e8f0",
  borderTop: `3px solid ${MARCA.colores.esmeralda}`,
  borderRadius: "20px",
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "480px",
};

const businessName = {
  fontSize: "18px",
  fontWeight: 700,
  color: MARCA.colores.oscuro,
  lineHeight: "26px",
  margin: "0 0 24px",
};

const badge = {
  backgroundColor: "#ecfdf5",
  borderLeft: `3px solid ${MARCA.colores.esmeralda}`,
  borderRadius: "12px",
  padding: "8px 12px",
  marginBottom: "16px",
};

const badgeText = {
  color: "#047857",
  fontSize: "12px",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "0.05em",
};

const heading = {
  fontSize: "22px",
  fontWeight: 700,
  color: MARCA.colores.oscuro,
  margin: "0 0 12px",
};

const paragraph = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "22px",
  margin: "0 0 20px",
};

const detailsBox = {
  backgroundColor: MARCA.colores.fondo,
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "16px",
};

const detailLabel = {
  fontSize: "12px",
  color: "#64748b",
  margin: "0",
};

const detailValue = {
  fontSize: "14px",
  fontWeight: 600,
  color: MARCA.colores.oscuro,
  margin: "0 0 12px",
};

const detailValueHighlight = {
  ...detailValue,
  color: "#047857",
  fontSize: "16px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const footer = {
  fontSize: "13px",
  color: "#64748b",
  lineHeight: "20px",
};

const platformFooter = {
  ...footer,
  fontSize: "12px",
  margin: "16px 0 0",
  textAlign: "center" as const,
};

const wordmark = {
  color: MARCA.colores.oscuro,
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "-0.3px",
};

const wordmarkDot = {
  color: MARCA.colores.esmeralda,
};
