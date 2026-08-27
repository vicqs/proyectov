# Fase 4 — Motor de Personalización y Supabase Storage

## Qué se construyó

Permite al dueño de la pyme personalizar la apariencia de su "Link en Bio"
público: biografía, color de marca, logotipo e imagen de portada.

- [actions/personalizacion.ts](../actions/personalizacion.ts) — Server Action `actualizarPersonalizacionAction` + helper `subirImagen`.
- [app/admin/personalizacion/page.tsx](../app/admin/personalizacion/page.tsx) — Server Component: carga el `negocio` actual del usuario autenticado.
- [app/admin/personalizacion/PersonalizacionForm.tsx](../app/admin/personalizacion/PersonalizacionForm.tsx) — Client Component (`useActionState`), con `<ImagePicker>` que muestra vista previa (URL actual o la del archivo recién seleccionado con `URL.createObjectURL`).
- [app/[slug]/layout.tsx](../app/%5Bslug%5D/layout.tsx) — Layout público: obtiene el negocio por `slug`, inyecta `--color-tema` como variable CSS y muestra portada/logo.
- Cambios menores: [app/[slug]/page.tsx](../app/%5Bslug%5D/page.tsx) ahora muestra `negocio.descripcion`; [app/[slug]/BookingButton.tsx](../app/%5Bslug%5D/BookingButton.tsx) usa `var(--color-tema)` como color del botón.
- Nuevas columnas en `Negocio` ([types/database.ts](../types/database.ts)): `descripcion`, `color_tema`, `logo_url`, `imagen_portada_url`.

## 1. Políticas de Storage requeridas (bucket `negocios-media`)

El bucket debe existir como **público** (lectura pública para servir logo/portada
sin autenticación) pero con **escritura restringida** solo al dueño del negocio.
Estructura de rutas usada por el Server Action: `{negocio_id}/{logo|portada}-{timestamp}.{ext}`,
lo que permite escribir políticas basadas en el primer segmento de la ruta.

```sql
-- Bucket público de solo lectura para cualquiera (turistas viendo el perfil).
create policy "Lectura pública de media de negocios"
  on storage.objects for select
  using (bucket_id = 'negocios-media');

-- Solo el dueño del negocio puede subir/actualizar archivos bajo su propia carpeta
-- (primer segmento de la ruta = negocio_id).
create policy "Dueño sube su propia media"
  on storage.objects for insert
  with check (
    bucket_id = 'negocios-media'
    and (storage.foldername(name))[1] in (
      select id::text from negocios where user_id = auth.uid()
    )
  );

create policy "Dueño actualiza su propia media"
  on storage.objects for update
  using (
    bucket_id = 'negocios-media'
    and (storage.foldername(name))[1] in (
      select id::text from negocios where user_id = auth.uid()
    )
  );
```

Como el Server Action usa el cliente **SSR** (sesión del usuario, no la service
role key), estas políticas son las que realmente autorizan (o rechazan) cada
subida — el `negocio_id` usado en la ruta se resuelve siempre en el servidor a
partir de `auth.uid()`, nunca desde el cliente.

## 2. Cómo el Server Action maneja el `FormData` y la subida a Storage

`actualizarPersonalizacionAction` recibe el `FormData` completo del
formulario (texto + archivos) en una sola invocación:

1. **Validación de texto** con `zod`: `descripcion` (máx. 1000 caracteres) y
   `color_tema` (regex HEX `#RRGGBB`).
2. **Resolución del `negocio_id`**: se busca `negocios` por `user_id = auth.uid()`
   con el cliente SSR — si no hay sesión o no existe el negocio, se aborta con
   un error legible, sin tocar Storage ni la base de datos.
3. **Archivos opcionales**: `formData.get('logo')` / `formData.get('portada')`
   se leen como `File`. Si el usuario no seleccionó un archivo nuevo, ese campo
   se omite del `formData` (se envía vacío) y **no se sobrescribe** la URL existente.
4. **`subirImagen(...)`** (por archivo):
   - Rechaza tipos MIME fuera de `image/png`, `image/jpeg`, `image/webp`.
   - Rechaza archivos mayores a 5 MB.
   - Sube con `supabase.storage.from('negocios-media').upload(path, file, { upsert: true })`.
   - Obtiene la URL pública con `getPublicUrl(path)`.
   - Cualquier error (tipo, tamaño, fallo de red/policy) se lanza como `Error`
     con mensaje descriptivo, capturado en un `try/catch` en la acción principal.
5. **Update en `negocios`**: solo al final, con el payload de texto + las URLs
   nuevas (si hubo subida), se hace `update(...).eq('id', negocio.id)`.
6. `revalidatePath('/admin/personalizacion')` refresca la página tras el éxito.

Ningún paso deja código a medias: todas las ramas de error retornan un mensaje
claro (`PersonalizacionActionState.error`) y el formulario muestra el spinner de
carga vía `useFormStatus` mientras la acción está `pending`.

## 3. Variables CSS dinámicas y color de marca en Tailwind

Tailwind v4 no requiere un `tailwind.config.js` con temas por negocio — en vez
de eso, el color se inyecta como **variable CSS inline** en el layout público:

```tsx
<div style={{ '--color-tema': colorTema } as React.CSSProperties}>
```

Cualquier componente hijo puede consumir esa variable con `var(--color-tema)`
en un `style` inline (Tailwind no permite variables arbitrarias directamente en
clases sin configuración extra, así que se usa `style` para los valores 100%
dinámicos):

```tsx
<button style={{ backgroundColor: "var(--color-tema, #0284c7)" }}>
  Reservar
</button>
```

Esto se usa en:

- `app/[slug]/layout.tsx` — borde superior del contenido (`border-t-4` con `borderTopColor`).
- `app/[slug]/BookingButton.tsx` — color de fondo del botón de reserva.

El valor por defecto (`#0284c7`, azul cielo) se aplica tanto en el layout
(`COLOR_TEMA_DEFAULT`) como en el `fallback` de `var(--color-tema, #0284c7)`,
para negocios que aún no configuraron su color.

## Cómo probarlo (QA)

1. Ejecutar el DDL de columnas nuevas en `negocios` (`descripcion text`,
   `color_tema text`, `logo_url text`, `imagen_portada_url text`) y crear el
   bucket público `negocios-media` con las políticas de arriba.
2. Iniciar sesión, ir a `/admin/personalizacion`.
3. Cambiar la biografía y el color, subir un logo y una portada válidos (PNG/JPEG/WEBP, < 5 MB) → debe mostrar el spinner y luego "Personalización guardada correctamente."
4. Intentar subir un archivo no-imagen (ej. `.pdf`) → debe retornar el error de tipo sin romper la página.
5. Intentar subir una imagen > 5 MB → debe retornar el error de tamaño.
6. Visitar `/[slug]` del negocio: debe mostrarse la portada arriba, el logo superpuesto, la biografía y el botón de reserva con el color de marca elegido.
7. Repetir el flujo con un segundo usuario/negocio y confirmar (vía políticas RLS/Storage) que no puede sobrescribir archivos bajo la carpeta de otro `negocio_id`.
