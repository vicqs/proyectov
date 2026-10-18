## NE Changelog

Upgraders: for a fresh start, consider running these commands

- `git clean -xdf`
- `npm install`

<a name="0.0.1"></a>

# 0.1.1 (2017-02-07)

- updates modules
  - NE beta 1
  - add module patients
  - add module food

## Admin global

- Nuevo rol Administrador en /admin (negocios, suscripciones, finanzas, reservas, usuarios, soporte, moderación, configuración, sistema, comunicación, auditoría, equipo).
- Conectado con Empresa y público: suspensión, mantenimiento, flags, anuncios, textos legales. SQL: docs/bd/migracion_admin_global.sql.
- Superadmin local: ver CREDENCIALES_LOCALES.md (no versionado); ADMIN_GLOBAL_EMAILS para producción.
