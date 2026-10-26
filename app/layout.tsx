import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Footer from "../components/Footer";
import Watermark from "../components/Watermark";
import { MARCA } from "../lib/marca";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

function metadataBase(): URL {
  try {
    const url = new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    );
    return url.protocol === "https:" || url.protocol === "http:"
      ? url
      : new URL("http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  applicationName: MARCA.nombre,
  title: {
    default: `${MARCA.nombre} · Tu agenda y tus reservas en un solo link`,
    template: `%s — ${MARCA.nombre}`,
  },
  description: MARCA.descripcion,
  openGraph: {
    type: "website",
    locale: "es_CR",
    siteName: MARCA.nombre,
    title: `${MARCA.nombre} · ${MARCA.lema}`,
    description: MARCA.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: `${MARCA.nombre} · ${MARCA.lema}`,
    description: MARCA.descripcion,
  },
  authors: [{ name: "Victor Quiros Suarez" }],
  creator: "Victor Quiros Suarez",
  publisher: "Victor Quiros Suarez",
  other: {
    copyright: `© ${new Date().getFullYear()} Victor Quiros Suarez. Todos los derechos reservados.`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans">
        {children}
        <Footer />
        <Watermark />
        <Analytics />
      </body>
    </html>
  );
}
