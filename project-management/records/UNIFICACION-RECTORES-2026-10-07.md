# Mapa claro y unificación de Macroeventos rectores — 7 de octubre de 2026

## Criterio y correcciones

El usuario considera demasiado fuerte el fondo oscuro del mapa editorial y solicita incorporar Macroeventos rectores a la barra principal, con el diseño común de las páginas principales.

La evaluación profesional es contextual: una banda de alto contraste y gran superficie acumulaba más peso visual del necesario para orientar la lectura. Su importancia se conserva mediante ubicación temprana, encabezado, escala y agrupación. Se adopta marfil (`paper-deep`), borde fino, texto azul oscuro y un acento ocre superior. Los colores `structure-*` continúan concentrados en `tokens.css`; los enlaces mantienen la apariencia compartida. El contraste del texto de enlace sobre el panel es 5,08:1; el del cuerpo, 7,29:1. El criterio se apoya en la [jerarquía visual](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) y la [consistencia](https://www.nngroup.com/articles/consistency-and-standards/) de NN/G, consultadas el 7 de octubre de 2026.

La lista única `primaryNavigation` incorpora «Macroeventos rectores» después de Inicio. Barra, menú móvil y pie reutilizan sus reglas de visibilidad y el mismo destino. Todos los enlaces de cada contexto comparten tipografía, peso y tratamiento. El espaciado de la barra usa la escala general; las etiquetas completas se conservan y el menú se utiliza hasta 1200 px.

La selección activa elige la ruta visible más específica, con límite de segmento. Así, `/observatorio/rectores/` activa Rectores, mientras el índice y los expedientes del Observatorio activan Observatorio. La política pura se prueba con rutas anidadas, prefijos parecidos, consultas, anclas, Inicio y destinos externos; no se marca simultáneamente una ruta padre y su subruta.

Rectores utiliza `page-intro--illustrated`, `page-intro__copy`, `PageTitle` y `EditorialImage`, como las otras seis cabeceras. Se retiran la composición y los márgenes exclusivos de `rector-intro`; el regreso al Observatorio queda debajo de la cabecera como enlace compartido. El texto canónico, los grupos, las relaciones, las tarjetas y los scripts se conservan.

## Imagen y fuentes de autoridad

`src/config/editorial-images.ts` registra el recurso `rectores` y conserva la autoridad única de dimensiones, proporción, ajuste, caption, tipografía, alineación y responsive para las siete imágenes. Las páginas sólo seleccionan su identificador.

La ilustración conceptual fue creada con ImageGen integrado: atlas, carpetas y capas de documentos, globo y lápiz, en la misma paleta de investigación y lectura. No representa evidencia o datos geopolíticos reales; el pie identifica la generación con IA.

- Recurso optimizado: `public/images/editorial/rectores-marco-estructural.webp`, 840 × 560, 89.298 bytes.
- Original: `outputs/landing/hero-rectores-marco-estructural-v1.png`.
- Prompt exacto: `outputs/landing/hero-rectores-marco-estructural-v1.prompt.txt`.
- Apariencia del panel: `tokens.css` y composición `HomePaths.astro` existentes.
- Destinos y etiquetas: `src/lib/navigation.ts`, con rutas de `src/config/routes.ts`.
- Selección activa: `tools/lib/navigation-policy.mjs`; Header consume el mismo resultado para barra y menú.

## Verificación final

- `npm run qa`: salida 0, 344 pruebas aprobadas, 0 errores y 0 advertencias de Astro/TypeScript; 63 sugerencias no bloqueantes. Compilaciones pública/editorial y validaciones de datos, SEO, navegación y tipografía completadas. Log: `qa-nav-rectores-marfil-20261007.log`.
- 836 archivos HTML públicos y 853 editoriales; sin enlaces ni anclas rotos.
- Prueba enfocada de navegación: 6 aprobadas; prueba SSR de Rectores con sus componentes y registro reales: 4 aprobadas. Se conservan las aserciones anteriores.
- Siete cabeceras medidas a 1280 px: título de 54,955 px y todas las imágenes aproximadamente 452 × 301. A 390 px, las siete imágenes miden aproximadamente 355 × 236. Todos los recursos cargan y no hay desbordes horizontales.
- Cabecera de Rectores comprobada a 1440, 1280, 1220, 1200, 1024, 768, 390 y 320 px. Barra sin desborde donde se muestra; menú disponible en los tamaños menores. Las siete etiquetas de la barra usan 14 px/peso 600; las del menú usan el mismo rol entre sí.
- Menú móvil: Rectores abre su ruta y el diálogo se cierra. Escape funciona. Tanto barra como menú indican únicamente Rectores como activo en su índice.
- Capturas actuales: `outputs/landing/localhost-estructura-marfil-20261007.jpg`, `localhost-estructura-marfil-mobile-20261007.jpg`, `localhost-rectores-unificado-20261007.jpg` y `localhost-rectores-mobile-unificado-20261007.jpg`.
- Cambios locales en `beta`, preparados para revisión en localhost y VS Code.
