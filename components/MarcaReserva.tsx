import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "../lib/cn";
import { LogotipoVuki } from "./VLogo";

interface MarcaReservaProps {
  idioma?: "es" | "en";
  className?: string;
}

/** Sello de plataforma independiente del idioma/contexto del negocio. */
export default function MarcaReserva({
  idioma = "es",
  className,
}: MarcaReservaProps) {
  return (
    <Link
      href="/"
      className={cn(
        "vuki-focus inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs text-slate-500 transition-colors hover:text-slate-800",
        className,
      )}
    >
      <Zap className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
      <span>{idioma === "en" ? "Booked with" : "Reservado con"}</span>
      <LogotipoVuki className="text-sm text-vuki-ink" />
    </Link>
  );
}
