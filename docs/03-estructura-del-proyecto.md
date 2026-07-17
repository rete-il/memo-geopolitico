# 03. Estructura del proyecto

## 3.1 Árbol funcional

```text
/
├── public/
│   ├── data/Medios_Geopolitica.xlsx
│   ├── js/directorio.js
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AlertCard.astro
│   │   ├── Header.astro
│   │   ├── ListaEnsayos.astro
│   │   ├── MapaGlobal.astro
│   │   ├── PanelDerecho.astro
│   │   └── SidebarAlertas.astro
│   ├── content/
│   │   ├── alertas/
│   │   ├── ensayos/
│   │   └── profundidad/
│   ├── data/
│   │   ├── catalizadores.json
│   │   ├── escenarios.json
│   │   ├── friccion.json
│   │   ├── medios.json
│   │   └── monitores.json
│   ├── layouts/Layout.astro
│   ├── pages/
│   │   ├── directorio.astro
│   │   ├── index.astro
│   │   ├── ensayos/[...page].astro
│   │   ├── ensayos/[id].astro
│   │   ├── profundidad/[slug].astro
│   │   └── profundidad/indo-pacifico.md
│   ├── store/mapStore.ts
│   ├── styles/global.css
│   ├── utils/time.ts
│   └── content.config.ts
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── package-lock.json
├── robots.txt
├── README.md
└── index.html
```

## 3.2 Convenciones actuales

- Páginas: `src/pages` determina rutas.
- Componentes: PascalCase con extensión `.astro`.
- Contenido: Markdown con nombres de archivo usados como IDs/slugs.
- Datos: JSON en español, con claves normalizadas en minúsculas y guion bajo cuando es necesario.
- Utilidades y estado: TypeScript.
- Script grande del directorio: JavaScript público no tipado.

## 3.3 Archivos especiales

### `index.html` en la raíz

Es un prototipo previo de 537 líneas con Tailwind por CDN, D3, Observable Plot y datos mock. Astro no lo usa como ruta principal; la portada efectiva es `src/pages/index.astro`. Debe etiquetarse como referencia histórica, moverse a una carpeta de prototipos o eliminarse después de confirmar que no contiene decisiones aún necesarias.

### `README.md`

Conserva el texto del starter minimal de Astro. No describe Memo Geopolítico, su arquitectura ni su flujo editorial. Debe reemplazarse en la fase de reacondicionamiento por un README de entrada que enlace esta carpeta `docs/`.

### `robots.txt`

Contiene:

```text
User-agent: *
Disallow: /
```

El sitio ya está publicado, pero este archivo se encuentra en la raíz y no en `public/`. Con la configuración Astro observada no debe asumirse que llega a `dist/`. Si se traslada a `public/` sin corregirlo, bloqueará todo el rastreo.

### `tailwind.config.mjs`

Convive con configuración CSS-first en `src/styles/global.css`. La implementación efectiva usa Tailwind 4 mediante `@tailwindcss/vite`, `@import 'tailwindcss'`, `@plugin` y `@theme`. El archivo de configuración conserva una forma asociada a configuraciones anteriores y debe revisarse para evitar dos fuentes de verdad.

## 3.4 Archivos generados o que no deben editarse

- `node_modules/`: dependencias instaladas.
- `.astro/`: tipos y caché generados.
- `dist/`: resultado del build.
- `package-lock.json`: se actualiza mediante npm; no editar manualmente.

## 3.5 Archivos ausentes que convendría incorporar

- `.env.example`, si aparecen variables de entorno.
- `.nvmrc` o `.node-version`, si no quedó incorporado en el commit posterior.
- `netlify.toml`, para fijar build, cabeceras y redirects.
- `public/robots.txt` con política de producción.
- `public/default-og.png` o equivalente.
- página `404.astro`.
- configuración de formato y lint.
- pruebas unitarias y end-to-end.
- script de generación de `medios.json` desde Excel o fuente canónica.
- guía de contribución y registro de decisiones arquitectónicas.
