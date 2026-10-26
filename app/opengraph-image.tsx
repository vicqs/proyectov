import { ImageResponse } from "next/og";
import { IsotipoVuki, LogotipoVuki } from "../components/VLogo";
import { LOGOTIPO_VUKI, MARCA } from "../lib/marca";

export const alt = "vuki · Tu agenda y tus reservas en un solo link";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 76px",
          backgroundColor: MARCA.colores.oscuro,
          backgroundImage:
            "radial-gradient(ellipse at 100% 0%, #064e3b 0%, transparent 55%), radial-gradient(ellipse at 0% 100%, #0c4a6e 0%, transparent 60%)",
          color: MARCA.colores.blanco,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <IsotipoVuki
            tone="light"
            preserveAspectRatio="xMidYMax meet"
            width={88}
            height={66}
          />
          <LogotipoVuki
            width={LOGOTIPO_VUKI.ancho * 72}
            height={LOGOTIPO_VUKI.alto * 72}
            style={{ color: MARCA.colores.blanco }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              maxWidth: 950,
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: -2,
            }}
          >
            Tu agenda y tus reservas en un solo link.
          </div>
          <div style={{ display: "flex", color: "#cbd5e1", fontSize: 26 }}>
            Más tiempo para crear experiencias inolvidables.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#a7f3d0",
              fontSize: 22,
            }}
          >
            <span
              style={{
                display: "flex",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: MARCA.colores.esmeralda,
              }}
            />
            Hecho para el turismo de Costa Rica
          </div>
          <div style={{ display: "flex", color: "#94a3b8", fontSize: 20 }}>
            Servicios · Agenda · Reservas
          </div>
        </div>
      </div>
    ),
    size,
  );
}
