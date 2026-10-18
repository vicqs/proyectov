import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión — Turismo Link",
  description: "Accede al panel de tu empresa o al de administración.",
  robots: { index: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
