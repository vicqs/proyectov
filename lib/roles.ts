import type { RolAdmin } from "../types/database";

export type Permiso =
  | "dashboard"
  | "negocios_ver"
  | "negocios_gestionar"
  | "facturacion"
  | "finanzas"
  | "reservas"
  | "usuarios"
  | "soporte"
  | "moderacion"
  | "comunicacion"
  | "configuracion"
  | "sistema"
  | "auditoria"
  | "equipo";

export const TODOS_LOS_PERMISOS: Permiso[] = [
  "dashboard",
  "negocios_ver",
  "negocios_gestionar",
  "facturacion",
  "finanzas",
  "reservas",
  "usuarios",
  "soporte",
  "moderacion",
  "comunicacion",
  "configuracion",
  "sistema",
  "auditoria",
  "equipo",
];

const PERMISOS_POR_ROL: Record<RolAdmin, Permiso[]> = {
  superadmin: TODOS_LOS_PERMISOS,
  finanzas: [
    "dashboard",
    "negocios_ver",
    "facturacion",
    "finanzas",
    "reservas",
    "auditoria",
  ],
  soporte: [
    "dashboard",
    "negocios_ver",
    "reservas",
    "usuarios",
    "soporte",
    "moderacion",
    "sistema",
  ],
};

export const ROLES_ADMIN: RolAdmin[] = ["superadmin", "finanzas", "soporte"];

export const ETIQUETA_ROL: Record<RolAdmin, string> = {
  superadmin: "Superadministrador",
  finanzas: "Finanzas",
  soporte: "Soporte",
};

export function esRolAdmin(valor: unknown): valor is RolAdmin {
  return typeof valor === "string" && (ROLES_ADMIN as string[]).includes(valor);
}

export function tienePermiso(
  rol: RolAdmin | null | undefined,
  permiso: Permiso,
): boolean {
  return !!rol && PERMISOS_POR_ROL[rol].includes(permiso);
}

export function permisosDeRol(rol: RolAdmin): Permiso[] {
  return PERMISOS_POR_ROL[rol];
}
