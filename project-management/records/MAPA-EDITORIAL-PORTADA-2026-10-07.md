# Propuesta local: mapa editorial de la portada — 7 de octubre de 2026

## Evaluación

El bloque de Publicaciones, Observatorio y Macroeventos rectores expresa la estructura central del sitio. Su versión anterior aparecía después de las últimas publicaciones, sin encabezado ni explicación de las funciones. Los conteos y los enlaces le daban el aspecto de un catálogo secundario y no mostraban la pertenencia de los rectores al Observatorio.

El corpus público actual contiene 105 expedientes, incluidos 13 rectores, y 80 publicaciones. Los expedientes pueden vincular varios análisis; algunos aún no tienen publicación asociada. Las relaciones documentadas permiten distintas rutas de lectura. Esta arquitectura del contenido se distingue del método de investigación descrito en «Del documento al análisis».

## Propuesta preparada en localhost

- Situar `HomePaths` inmediatamente después de `HomeHero`, antes del análisis destacado.
- Presentarlo como «Mapa editorial», con el título «Cómo se organiza el sitio» y una introducción breve.
- Ordenar los accesos por su función: Marco estructural / Evidencia y seguimiento / Interpretación y lectura.
- Agrupar Macroeventos rectores y Observatorio bajo «Dentro del Observatorio»; mantener Publicaciones como análisis conectado. El orden del DOM es también el orden visual y de teclado.
- Usar un fondo marfil, borde fino y acento ocre, con los colores derivados de la paleta general. Los conteos quedan como metadatos secundarios, después de explicar la función de cada acceso. Esta corrección sustituye la primera propuesta de banda azul oscura por indicación del usuario; ver [unificación de Rectores](UNIFICACION-RECTORES-2026-10-07.md).
- Mantener la navegación como enlaces nativos compartidos, sin numeración de etapas ni flechas entre las áreas que sugieran un flujo obligatorio. «Explorar macroeventos rectores» precisa el destino del enlace anterior «Explorar procesos relacionados».
- Adaptar los grupos a una columna hasta 960 px y sus entradas hasta 760 px. En móvil se compactan los espacios, conservando las explicaciones visibles.

El criterio de orientación temprana, rótulos descriptivos y jerarquía sigue los [principios de portada de NN/G](https://www.nngroup.com/articles/homepage-design-principles/). La sección incorpora H2 y H3 según el [patrón de encabezados de W3C](https://www.w3.org/WAI/tutorials/page-structure/headings/). Referencias consultadas el 7 de octubre de 2026.

## Autoridad y alcance del código

| Responsabilidad | Fuente |
| --- | --- |
| Título, descripciones, orden, grupos, etiquetas y ancla | `src/config/home.ts` |
| Composición responsive del mapa | `src/components/home/HomePaths.astro` |
| Colores semánticos `structure-*` y escalas generales | `src/styles/tokens.css` |
| Estilo y semántica de enlaces | `ActionLink.astro` y `controls.css` existentes |
| Conteos públicos | `src/lib/home.ts` |

Observatorio cuenta todos los expedientes del corpus público visible, también los pausados o archivados. La etiqueta cambia a «expedientes disponibles» para coincidir con el índice y conservar a los rectores como subconjunto. Los estados y los datos editoriales conservan su significado. Una prueba con un rector pausado y un expediente archivado cubre este contrato. El validador también verifica el acceso a Rectores y obtiene el número de accesos del HTML real, sustituyendo el diagnóstico fijo de dos por los tres existentes.

## Verificación de la primera propuesta

- `npm run qa`: salida 0, 341 pruebas aprobadas, 0 errores y 0 advertencias de Astro/TypeScript, 63 sugerencias no bloqueantes. Log: `qa-estructura-editorial-20261007.log`.
- Tras los ajustes finales de texto y espaciado se repiten las compilaciones pública/editorial y las validaciones de build, SEO, navegación y tipografía: salida 0. Log: `qa-estructura-final-build-20261007.log`.
- 836 archivos HTML públicos y 853 editoriales; sin enlaces ni anclas rotos. El validador informa tres accesos principales reales en Inicio.
- Navegador: revisión a 1280, 1024, 768, 390 y 320 px sin desbordes horizontales. En escritorio se alinean los tres enlaces; en tablet y móvil se preserva la agrupación. Ajuste móvil final comprobado después de recargar la página.
- Los tres enlaces abren Rectores, Observatorio y Publicaciones. Tab avanza desde Rectores a Observatorio y después a Publicaciones.
- Contraste del enlace en la banda: 9,76:1. Los colores de texto e interacción se derivan de tokens, sin paleta duplicada.
- Capturas: `outputs/landing/localhost-estructura-editorial-20261007.jpg` y `outputs/landing/localhost-estructura-mobile-20261007.jpg`.
- Propuesta local en `beta`, preparada para revisión en `http://localhost:4321/#home-structure` y VS Code.
