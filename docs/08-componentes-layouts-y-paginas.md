# 08. Componentes, layouts y páginas

## 8.1 `Layout.astro`

**Responsabilidad:** estructura HTML, idioma, viewport, canonical, Google Fonts, título, description, Open Graph y Twitter.

**Props:** `title`, `description`, `image`.

**Fortalezas:**

- `lang="es"`;
- canonical absoluto basado en `Astro.site`;
- metadatos básicos centralizados;
- estilo global importado una sola vez.

**Limitaciones:**

- imagen predeterminada `/default-og.png` ausente;
- no declara favicons;
- solo carga Playfair Display; el directorio solicita Inter sin importarlo;
- `og:type` siempre es `website`;
- profundidad no le pasa título ni descripción;
- no incluye Phosphor Icons, por lo que los iconos desaparecen fuera de la portada;
- no ofrece slots de `head`, header o footer;
- no incluye JSON-LD, RSS o sitemap.

## 8.2 `Header.astro`

**Responsabilidad:** marca y navegación global.

**Hallazgos:**

- sticky, con fondo slate oscuro y estado activo parcial;
- usa un `<h1>` para la marca en todas las páginas, lo que compite con el `<h1>` editorial;
- el logo no enlaza a inicio;
- no existe menú móvil ni botón de expansión;
- dos enlaces apuntan a rutas inexistentes;
- depende de Phosphor cargado desde otra página.

## 8.3 Componentes de portada

### `SidebarAlertas.astro`

Renderiza el título y una lista de `AlertCard`. Usa `any` y un área de scroll con scrollbar oculto.

### `AlertCard.astro`

- presenta región, fecha, título, cuerpo y vínculo;
- mapea severidad a tokens Tailwind;
- sincroniza hover con Nanostore;
- realiza `scrollIntoView` cuando un marcador activa la tarjeta.

Riesgos: fecha congelada por build, eventos solo mouse para la sincronización y props sin tipar.

### `MapaGlobal.astro`

- crea mapa Leaflet y MarkerCluster;
- carga tiles CARTO;
- ordena marcadores por severidad;
- soporta múltiples coordenadas para una alerta;
- colorea clusters según severidad máxima;
- sincroniza marcadores con tarjetas.

Riesgos: `L` y objetos Leaflet son `any`, dependencia CDN, IDs globales únicos, falta de estado de error y accesibilidad limitada.

### `ListaEnsayos.astro`

Muestra tarjetas simples de hasta cinco ensayos. El texto visual “Análisis a Fondo” no coincide claramente con la taxonomía de la colección `ensayos`.

### `PanelDerecho.astro`

Renderiza `monitores.json`. El propietario confirmó que es un prototipo. Debe mantenerse etiquetado como tal hasta definir metodología y flujo de actualización.

## 8.4 Páginas

### `src/pages/index.astro`

Orquesta portada, carga dependencias CDN y contiene estilos globales específicos del mapa y tipografía. Ordena ensayos, renderiza alertas y prepara payload cartográfico.

Problema estructural: la página carga dependencias que también necesita el Header o las páginas de profundidad, pero solamente las carga aquí.

### `src/pages/ensayos/[id].astro`

Genera una ruta por ensayo. Pasa metadata al Layout, muestra tags, autor, fecha y contenido `prose`.

Observaciones:

- diseño editorial visualmente logrado;
- `coverImage` puede apuntar a un archivo inexistente;
- no hay navegación anterior/siguiente, volver al archivo o compartir;
- no hay tabla de contenidos ni tiempo de lectura;
- el Header conserva otro `<h1>`.

### `src/pages/profundidad/[slug].astro`

Genera las páginas de profundidad, badge de severidad, fecha, contenido, fuentes opcionales y llamada a Ko-fi.

Riesgos:

- usa `<Layout>` sin título, description ni imagen;
- URL de Ko-fi es placeholder `tu_usuario`;
- los iconos no se cargan en esta ruta;
- el tipo editorial no incluye autor, descripción ni actualización;
- las fuentes estructuradas no se usan en las piezas actuales.

### `src/pages/ensayos/[...page].astro`

Configura paginación de diez ensayos, pero el template contiene solo un comentario. La ruta `/ensayos/` está técnicamente generada y funcionalmente vacía.

### `src/pages/directorio.astro`

Aplicación de 985 líneas que reúne:

- markup de filtros, KPIs, gráficos, tabla, modal y pie;
- aproximadamente 700 líneas de CSS global encapsulado por `.dashboard-root`;
- serialización del JSON;
- carga del script público.

Es el principal candidato a descomposición modular.

## 8.5 Matriz de dependencias

| Componente/página      | Depende de                                                    |
| ---------------------- | ------------------------------------------------------------- |
| Layout                 | `global.css`, Google Fonts, `Astro.site`                      |
| Header                 | `Astro.url`, Phosphor global no declarado                     |
| Inicio                 | tres colecciones, seis componentes, Leaflet CDN, Phosphor CDN |
| AlertCard              | Nanostore `activeAlertId`                                     |
| MapaGlobal             | Nanostore, Leaflet global, MarkerCluster global               |
| PanelDerecho           | `monitores.json`                                              |
| Directorio             | `medios.json`, `directorio.js`, Excel público                 |
| Ensayo individual      | colección ensayos, Layout, Header                             |
| Profundidad individual | colección profundidad, Layout, Header                         |
