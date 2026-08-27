import {
  Body,
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

export interface AlertaPymeProps {
  negocioNombre: string;
  servicioNombre: string;
  fechaHora: string; // ISO string
  emailCliente: string;
  montoUsd: number;
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
          <Section style={badge}>
            <Text style={badgeText}>✅ PAGADA</Text>
          </Section>

          <Heading style={heading}>¡Nueva reserva confirmada!</Heading>

          <Text style={paragraph}>
            {negocioNombre}, tienes una nueva reserva pagada. No necesitas
            cobrar nada más: el pago ya fue procesado exitosamente.
          </Text>

          <Section style={detailsBox}>
            <Row>
              <Text style={detailLabel}>Servicio</Text>
              <Text style={detailValue}>{servicioNombre}</Text>
            </Row>
            <Row>
              <Text style={detailLabel}>Fecha y hora</Text>
              <Text style={detailValue}>{fechaFormateada}</Text>
            </Row>
            <Row>
              <Text style={detailLabel}>Cliente</Text>
              <Text style={detailValue}>{emailCliente}</Text>
            </Row>
            <Row>
              <Text style={detailLabel}>Ingreso generado</Text>
              <Text style={detailValueHighlight}>
                ${montoUsd.toFixed(2)} USD
              </Text>
            </Row>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Puedes ver el detalle completo en tu panel de administración,
            sección "Reservas".
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
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "480px",
};

const badge = {
  backgroundColor: "#dcfce7",
  borderRadius: "999px",
  display: "inline-block",
  padding: "4px 12px",
  marginBottom: "16px",
};

const badgeText = {
  color: "#15803d",
  fontSize: "12px",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "0.05em",
};

const heading = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 12px",
};

const paragraph = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "22px",
  margin: "0 0 20px",
};

const detailsBox = {
  backgroundColor: "#f1f5f9",
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
  color: "#0f172a",
  margin: "0 0 12px",
};

const detailValueHighlight = {
  ...detailValue,
  color: "#15803d",
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
