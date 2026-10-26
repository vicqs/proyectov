import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { MARCA } from "../lib/marca";

export interface ReciboTuristaProps {
  negocioNombre: string;
  negocioLogoUrl?: string | null;
  servicioNombre: string;
  fechaHora: string; // ISO string
  montoUsd: number;
  trxId: string;
  emailCliente: string;
  gestionUrl?: string;
  /** Texto opcional configurable por la administración global. */
  encabezado?: string;
  pie?: string;
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
  gestionUrl,
  encabezado,
  pie,
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
          <Section>
            <Row>
              {negocioLogoUrl && (
                <Column width="56" style={businessLogoCell}>
                  <Img
                    src={negocioLogoUrl}
                    alt={negocioNombre}
                    width="56"
                    height="56"
                    style={logo}
                  />
                </Column>
              )}
              <Column style={businessNameCell}>
                <Text style={businessName}>{negocioNombre}</Text>
              </Column>
            </Row>
          </Section>

          <Heading style={heading}>¡Reserva confirmada!</Heading>

          {encabezado && <Text style={paragraph}>{encabezado}</Text>}

          <Text style={paragraph}>
            Hola, tu pago para <strong>{servicioNombre}</strong> con{" "}
            <strong>{negocioNombre}</strong> se procesó correctamente.
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
                <Text style={detailLabel}>Monto pagado</Text>
                <Text style={detailValue}>${montoUsd.toFixed(2)} USD</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detailLabel}>ID de transacción</Text>
                <Text style={detailValueMono}>{trxId}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {gestionUrl && (
            <Text style={footerNote}>
              ¿Necesitas ver o cancelar tu reserva?{" "}
              <Link href={gestionUrl} style={link}>
                Gestionar mi reserva
              </Link>
            </Text>
          )}

          <Text style={footerNote}>
            Conserve este correo como comprobante de su reserva. Fue enviado a{" "}
            <strong>{emailCliente}</strong>.
          </Text>

          {pie && <Text style={footerNote}>{pie}</Text>}

          <Text style={footer}>
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

const logo = {
  display: "block" as const,
  borderRadius: "12px",
};

const businessLogoCell = {
  padding: "0 16px 24px 0",
  verticalAlign: "middle" as const,
};

const businessNameCell = {
  padding: "0 0 24px",
  verticalAlign: "middle" as const,
};

const businessName = {
  fontSize: "18px",
  fontWeight: 700,
  color: MARCA.colores.oscuro,
  lineHeight: "26px",
  margin: "0",
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

const detailValueMono = {
  ...detailValue,
  fontFamily: "monospace",
  fontSize: "12px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const link = {
  color: "#0369a1",
  textDecoration: "underline",
};

const footerNote = {
  fontSize: "13px",
  color: "#64748b",
  lineHeight: "20px",
};

const footer = {
  fontSize: "12px",
  color: "#64748b",
  lineHeight: "20px",
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
