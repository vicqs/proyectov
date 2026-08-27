import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export interface ReciboTuristaProps {
  negocioNombre: string;
  negocioLogoUrl?: string | null;
  servicioNombre: string;
  fechaHora: string; // ISO string
  montoUsd: number;
  trxId: string;
  emailCliente: string;
}

/**
 * Recibo de pago enviado al turista. Diseño minimalista y responsivo,
 * pensado para renderizar de forma consistente en clientes de correo
 * (Gmail, Outlook, Apple Mail) usando componentes de @react-email/components.
 */
export default function ReciboTurista({
  negocioNombre,
  negocioLogoUrl,
  servicioNombre,
  fechaHora,
  montoUsd,
  trxId,
  emailCliente,
}: ReciboTuristaProps) {
  const fechaFormateada = new Date(fechaHora).toLocaleString("es-CR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <Html>
      <Head />
      <Preview>
        Tu reserva con {negocioNombre} fue confirmada — {servicioNombre}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {negocioLogoUrl && (
            <Img
              src={negocioLogoUrl}
              alt={negocioNombre}
              width="56"
              height="56"
              style={logo}
            />
          )}

          <Heading style={heading}>¡Reserva confirmada!</Heading>

          <Text style={paragraph}>
            Hola, tu pago para <strong>{servicioNombre}</strong> con{" "}
            <strong>{negocioNombre}</strong> se procesó correctamente.
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
              <Text style={detailLabel}>Monto pagado</Text>
              <Text style={detailValue}>${montoUsd.toFixed(2)} USD</Text>
            </Row>
            <Row>
              <Text style={detailLabel}>ID de transacción</Text>
              <Text style={detailValueMono}>{trxId}</Text>
            </Row>
          </Section>

          <Hr style={hr} />

          <Text style={footerNote}>
            Conserve este correo como comprobante de su reserva. Fue enviado a{" "}
            <strong>{emailCliente}</strong>.
          </Text>

          <Text style={footer}>{negocioNombre} · Turismo Link</Text>
        </Container>
      </Body>
    </Html>
  );
}

ReciboTurista.PreviewProps = {
  negocioNombre: "Escuela de Surf Pura Vida",
  negocioLogoUrl: null,
  servicioNombre: "Clase de surf 1h",
  fechaHora: new Date().toISOString(),
  montoUsd: 45,
  trxId: "trx_mock_123456",
  emailCliente: "turista@example.com",
} satisfies ReciboTuristaProps;

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

const logo = {
  borderRadius: "12px",
  marginBottom: "16px",
  objectFit: "cover" as const,
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

const detailValueMono = {
  ...detailValue,
  fontFamily: "monospace",
  fontSize: "12px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const footerNote = {
  fontSize: "13px",
  color: "#64748b",
  lineHeight: "20px",
};

const footer = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "16px",
  textAlign: "center" as const,
};
