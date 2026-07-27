# Memo Geopolítico — sitio rediseñado

Actualización local v0.4.0 del nuevo modelo editorial:

- Astro 7 y Tailwind CSS 4.
- Generación completamente estática.
- Datos locales en Markdown y JSON.
- Sin API, CMS, base de datos, SSR ni funciones de Netlify.
- Navegación basada en Procesos, Publicaciones, Señales y Recursos visuales.
- Ko-fi controlado por `src/config/features.json`.
- Expedientes en desarrollo visibles mediante una proyección pública saneada.
- Cuatro publicaciones autorizadas y trece posts en preparación.
- Posts en preparación visibles solo en el modo editorial y en el build de QA.
- Inicio y archivo de Publicaciones limitados a textos en estado `publicado`.
- Inicio preparado para mostrar las seis publicaciones más recientes.
- Trabajo en curso concentrado en el Observatorio.
- Dashboard público del Observatorio en modo consulta, sin controles de edición.
- Páginas metodológicas específicas para las valoraciones de cada publicación.
- Carga de contenido resistente a copias antiguas de `_preview`, sin IDs
  duplicados ni sobrescritura de publicaciones.

## Requisitos

- Node.js 22.12 o posterior.
- Las carpetas locales del Observatorio, Medios y archivo editorial.

## Instalación

```powershell
npm install
```

## Vincular las fuentes locales

Copiá `local-sources.example.json` como `local-sources.json` y ajustá las rutas:

```json
{
  "observatorio": "../dashboards/observatorio/data/macroeventos.json",
  "taxonomia": "../dashboards/observatorio/data/taxonomia-temas.json",
  "medios": "../dashboards/medios/data/Medios_Geopolitica_con_ids.xlsx",
  "publicaciones": "../archivo-editorial"
}
```

El archivo `local-sources.json` está ignorado por Git y puede contener rutas
absolutas de Windows.

Después ejecutá:

```powershell
npm run sync:local -- --config local-sources.json
```

La sincronización:

1. Lee el Observatorio y elimina campos administrativos.
2. Genera una proyección pública saneada de los expedientes publicados y en
   desarrollo.
3. Genera una vista editorial local con las fuentes, señales y posts pendientes.
4. Conserva las publicaciones autorizadas en `publicadas/` y migra los
   Markdown restantes al contrato de Publicaciones v2.
5. Regenera el catálogo público de Medios desde el Excel canónico.
6. Valida IDs, relaciones entre señales y fuentes y estados de publicación.

Los archivos de vista local se guardan en rutas ignoradas por Git. El build de
producción no los incluye.

## Desarrollo y QA

```powershell
npm run dev
```

La vista de desarrollo reproduce el comportamiento público:

- Inicio muestra solamente publicaciones autorizadas.
- Publicaciones contiene el archivo de textos publicados.
- Observatorio muestra los 17 expedientes saneados, incluidos los trece en
  curso.
- El título de un proceso solo enlaza cuando existe un post publicado; “Abrir
  expediente” siempre conduce a la ficha del Observatorio.
- `/observatorio/dashboard/` ofrece la vista pública de consulta del dashboard.
- Cada tarjeta de valoraciones enlaza con una página específica que explica que
  sus pautas de interpretación todavía están en desarrollo.

Para revisar además los trece posts en preparación:

```powershell
npm run dev:editorial
```

Esta vista muestra una franja visible de “Vista editorial local”.

```powershell
npm run check
npm run test
npm run validate:data
npm run build
npm run build:preview
```

- `npm run build` reproduce el build de producción: expone los 17 expedientes
  saneados, el dashboard de consulta y rutas solamente para los cuatro posts
  publicados.
- `npm run build:preview` genera en `dist-preview` una versión estática para QA
  con borradores, sin reemplazar el `dist` de producción.
- `npm run qa` ejecuta toda la secuencia.

## Ko-fi

La configuración permanece centralizada:

```json
{
  "enabledInDevelopment": true,
  "enabledInProduction": false
}
```

Se encuentra en `src/config/features.json`. Cuando está desactivada, no se
renderiza el CTA ni el enlace del pie.

## Netlify

`netlify.toml` fija:

- comando: `npm run build`;
- carpeta publicada: `dist`;
- Node.js 22.12;
- `PUBLIC_INCLUDE_DRAFTS=false`.

La rama `main` debe seguir siendo la única fuente de producción. Este paquete no
crea commits ni modifica GitHub.

## Estructura principal

```text
src/
├── content/publicaciones/
│   ├── publicadas/             posts autorizados y persistentes
│   └── _preview/               posts en preparación regenerables
├── data/public/                proyección pública
├── components/
├── layouts/
├── lib/
└── pages/
    ├── observatorio/
    ├── publicaciones/
    ├── recursos-visuales/
    ├── medios/
    ├── regiones/
    └── temas/

local-preview/                  datos locales ignorados por Git
tools/                          sincronización y validación
plantillas/                     contratos editoriales
```

## Seguridad editorial

Los expedientes en desarrollo se generan en producción con una advertencia de
estado y solo con campos públicos. Las fuentes no verificadas, las señales sin
una fuente verificada, las notas, prompts, backups, historiales y controles
internos nunca se copian a esa proyección. En las tarjetas, el título solo es
navegable cuando existe un post publicado; para los otros procesos permanece
activo únicamente “Abrir expediente”. El build público no genera rutas para
posts en preparación. El dashboard público se alimenta de esta misma proyección
saneada y no contiene funciones para guardar, importar, restaurar, editar ni
eliminar datos.
