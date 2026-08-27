import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Footer from "../components/Footer";
import Watermark from "../components/Watermark";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Reserva y paga tu experiencia turística",
  description:
    "Link en bio transaccional para pymes turísticas: agenda y paga en segundos.",
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
    <html lang="es" className={inter.variable}>
      <body className="font-sans">
        {children}
        <Footer />
        <Watermark />
        <Analytics />
      </body>
    </html>
  );
}
