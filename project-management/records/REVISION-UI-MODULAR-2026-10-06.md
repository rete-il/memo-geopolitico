# Revisión visual y modular — 6 de octubre de 2026

## Encargo y criterio editorial

Revisar la portada y las páginas principales, corregir diferencias de tipografía, color, controles e imágenes, y centralizar los parámetros de uso general. Se conserva «Investigación y lectura», el lenguaje neutro y la explicación explícita de investigación, contraste de fuentes y atención mediática.

Se adoptan jerarquías de lectura claras, espaciado coherente, llamadas a acción por función y acceso temprano por intereses. Las referencias incluyen la [jerarquía visual de Nielsen Norman Group](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/), los [patrones de consistencia](https://www.nngroup.com/articles/consistency-and-standards/) y la organización de temas y publicaciones de [Chatham House](https://www.chathamhouse.org/), consultadas el 6 de octubre de 2026. El tamaño táctil de referencia es de 44 píxeles, alineado con el criterio [W3C sobre objetivos ampliados](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced).

## Cambios visuales

- Serif editorial y sans de interfaz conservadas, con escala común de títulos, cuerpo, metadatos y pies de imagen.
- Títulos de página más contenidos; metadatos legibles y botones coherentes en altura, peso, radio y espaciado.
- Los enlaces de navegación editorial comparten una implementación subrayada, sin variantes con caja. Los botones, pestañas y despliegues se reservan para acciones dentro de la página; el estado se indica mediante estilo y atributos nativos.
- Las seis cabeceras ilustradas comparten proporción 3:2, composición completa y ancho adaptado a su columna. Opinión y Contacto incorporan imágenes propias; el detalle de las correcciones figura al final.
- Acceso «Explorar temas» próximo a la presentación y bloque temático antes de las lecturas secundarias.
- Datos editoriales, fundamentos, fuentes y fechas conservados; no se introducen rankings de cobertura sin investigación documentada.

## Autoridad de cada ajuste

| Ajuste | Fuente de verdad |
| --- | --- |
| Paleta, familias y escala tipográfica, pesos, espacios y controles | `src/styles/tokens.css` |
| Apariencia e interacción de acciones y controles | `src/styles/controls.css` y `src/components/ActionLink.astro` |
| Destacado, límites, temas, rótulos y método de la portada | `src/config/home.ts` |
| Imágenes, alternativas textuales, dimensiones intrínsecas y de presentación, proporción, ajuste, pie, alineación, breakpoint y composición ilustrada | `src/config/editorial-images.ts` |
| Destinos compartidos de navegación y portada | `src/config/routes.ts` |
| Selección pública, exclusión de duplicados y validez del fundamento | `src/lib/home.ts` |
| Títulos, subtítulos, resúmenes y evidencia editorial | Markdown publicado y paquete público existente |

Las constantes estructurales de cada componente, como sus columnas o anclas funcionales, permanecen junto a su responsabilidad. Los parámetros visuales generales y las decisiones editoriales no se repiten dentro de las plantillas.

## Modularidad

La portada separa introducción, destacado, valoración, método, temas, lecturas recientes, accesos y opinión. Su ruta queda en 47 líneas, frente a las 507 de la versión anterior. La hoja global se convierte en un punto de entrada de 21 líneas con 18 módulos por responsabilidad, ninguno mayor de 344 líneas. Las rutas extensas del Observatorio se descomponen en componentes tipados: expediente de 625 a 212 líneas, dashboard de 574 a 168 y rectores de 543 a 190.

No se incorporan dependencias de ejecución nuevas. Los documentos y datos públicos extensos no se fragmentan artificialmente: su tamaño responde al contenido editorial, no a un controlador de interfaz.

## Verificación de las primeras revisiones

- `npm run qa`: salida 0; 340 pruebas aprobadas, validación de datos, Astro/TypeScript sin errores ni advertencias, compilaciones pública/editorial y comprobaciones de enlaces, SEO, navegación y tipografía. La comprobación informa 63 sugerencias no bloqueantes, mayoritariamente en pruebas y archivos históricos.
- Enlaces internos y anclas: 0 rotos en ambas compilaciones.
- Verificación estática: ningún color literal ni tamaño/peso tipográfico numérico en las plantillas y módulos CSS públicos fuera de `tokens.css`.
- Medición de interfaz: las 27 acciones de la portada comparten tipografía de interfaz de 14 px, peso 600 y altura de 44 px.
- Imágenes de la primera revisión: Inicio 240 px en escritorio / 150 px en móvil; interiores 180 / 130 px. Esta diferencia queda sustituida por la política uniforme descrita a continuación.
- Verificación visual: Inicio, Publicaciones, Observatorio, Acerca de, Rectores, Dashboard y el expediente de EE. UU.–China revisados en escritorio y a 320 px; sin desbordes de página. Las tablas conservan su desplazamiento interno cuando corresponde.
- Interacciones: las pestañas del dashboard muestran su panel; la búsqueda «China» devuelve 35 procesos en el corpus actual. Se preservan las pruebas de señales canónicas, relaciones, anclas, teclado y separación entre contenido público y vista editorial.
- La introducción se acorta para mejorar la lectura en pantallas estrechas, conservando investigación, verificación, contraste y atención mediática.
- Compilación pública posterior al último ajuste de texto completada; enlaces, anclas y tipografía verificados de nuevo sin errores.
- Contraste mínimo medido del texto de las acciones en la portada: 5,08:1 sobre sus fondos de presentación.
- Capturas de cierre: `outputs/landing/localhost-inicio-ui-v2-20261006.jpg` y `outputs/landing/localhost-inicio-ui-mobile-v2-20261006.jpg`.
- Cambios locales en `beta`, sin envío a GitHub.

## Corrección: imágenes consistentes en las cinco páginas principales

Por indicación del usuario, se incorpora una imagen a Opinión y se elimina la variante de tamaño de Inicio. `EditorialImage` sólo acepta el identificador del recurso; las páginas no asignan dimensiones ni estilos de imagen.

`src/config/editorial-images.ts` concentra el diseño común y genera su CSS: fuente 840 × 560, proporción 3:2, presentación 270 × 180 en escritorio y 195 × 130 en móvil, composición completa, pie, tipografía del pie, márgenes, alineación, carga y breakpoint. Los tokens generales de imagen duplicados se eliminan de `tokens.css`.

La nueva imagen conceptual de Opinión se guarda en `/images/editorial/opinion-perspectivas.webp`; fue creada con la herramienta integrada ImageGen. El original y el prompt se conservan en `outputs/landing/hero-opinion-perspectivas-v1.png` y `outputs/landing/hero-opinion-perspectivas-v1.prompt.txt`.

Comprobación de cierre: las cinco páginas miden exactamente 270 × 180 en escritorio y 195 × 130 a 390 px de viewport; las cinco imágenes cargan y no existe desborde horizontal. `npm run qa` completado con salida 0: 340 pruebas aprobadas, 0 errores y 0 advertencias de Astro, sin enlaces ni anclas rotas. Captura: `outputs/landing/localhost-opinion-imagenes-uniformes-20261006.jpg`.

## Corrección final: enlaces, controles e imágenes de mayor presencia

La revisión solicitada sobre todas las páginas sustituye las dimensiones anteriores y el uso de enlaces con variantes de botón. Se auditan las 27 plantillas Astro y sus componentes públicos, incluidos análisis, expedientes, fundamentos, Opinión, taxonomías, medios, señales, Dashboard, Rectores, institucionales y 404.

Los enlaces de navegación editorial se reconocen por el subrayado permanente y, cuando corresponde, la flecha. `ActionLink` conserva únicamente tamaño contextual y flecha; elimina las variantes primaria/secundaria. «Explorar temas», «Consultar análisis», «Evidencia y seguimiento» y «Consultar el fundamento» utilizan ese mismo criterio. Las cajas quedan reservadas para botones nativos de filtros, selección de vista, menú y controles de despliegue. Las pestañas conservan selección explícita; los enlaces de título, marca y menú conservan su jerarquía de lectura. El criterio sigue la [distinción de NN/G entre enlaces y botones](https://www.nngroup.com/videos/buttons-vs-links/) y el [patrón de enlace nativo de W3C](https://www.w3.org/WAI/ARIA/apg/patterns/link/), consultados el 6 de octubre de 2026.

`controls.css` define presentación, foco asociado al estilo base, estados ocultos/desactivados y tamaño táctil. Se retiran overrides locales de los desplegables de portada, almacenamiento y ramas de Rectores. Los títulos editoriales, fuentes, destinos, hooks, preferencias de almacenamiento y anclas canónicas se conservan. El apoyo al proyecto usa texto neutro y un enlace externo reconocible. Los gráficos y mapas mantienen su composición y contexto de datos.

Las imágenes de Inicio, Observatorio, Publicaciones, Opinión, Acerca de y Contacto ocupan el 100% de su columna. `editorial-images.ts` mantiene la autoridad única de recursos, proporción 3:2, ajuste completo, pie, alineación, carga y composición: columnas 1.55:1 en escritorio, una columna hasta 760 px y un tope compartido de 480 px en móvil. No se asignan dimensiones desde las páginas. Contacto reutiliza el primer texto institucional como presentación y la cabecera común; el cuerpo mantiene sus canales configurados y su lectura se limita mediante `--reading-measure` en tokens.

La nueva ilustración conceptual de Contacto fue creada con ImageGen integrado. Recurso optimizado: `public/images/editorial/contacto-dialogo.webp`, 840 × 560, 61.836 bytes. Original: `outputs/landing/hero-contacto-dialogo-v1.png`. Prompt exacto: `outputs/landing/hero-contacto-dialogo-v1.prompt.txt`. El sobre, los documentos y el globo son elementos conceptuales; el pie identifica la generación con IA.

Verificación final:

- `npm run qa`: salida 0, 340 pruebas aprobadas, Astro/TypeScript con 0 errores y 0 advertencias; 63 sugerencias no bloqueantes. Compilaciones de producción y editorial, datos, SEO, navegación y tipografía validados. Log: `qa-controles-imagenes-final-20261006.log`.
- 836 archivos HTML públicos y 853 editoriales: sin enlaces ni anclas rotos. Auditoría adicional de los anchors compilados: sin clases de botón, `role=button` ni destinos `href="#"` inoperantes en navegación.
- Las seis imágenes cargan y miden lo mismo: aproximadamente 452 × 301 a 1280 px; 355 × 236 a 390 px; 285 × 190 a 320 px. Sin desbordes horizontales.
- Revisión en navegador de las familias de página y de todas las institucionales a 320 px. Las tablas mantienen desplazamiento interno. La plantilla de etiquetas sin entradas públicas conserva su estado vacío y su fallback; la página 404 se comprueba en `/404.html`.
- Menú móvil abre y cierra con Escape. «Explorar temas» lleva a su ancla. «Ver muestra y límites» muestra la evidencia. Dashboard: pestañas Procesos/Matriz funcionales y 35 resultados para «China». Observatorio: Lista/Tarjetas funcionales, búsqueda con 35 resultados y restablecimiento con 105; no se activa el guardado de preferencias.
- Código público de interfaz: archivos de hasta 335 líneas, portada de 47, hoja global de 21. Sin dependencias nuevas ni cambios a las fuentes editoriales.
- Capturas actuales: `outputs/landing/localhost-inicio-ui-v3-20261006.jpg`, `localhost-acciones-ui-v3-20261006.jpg`, `localhost-contacto-ui-v3-20261006.jpg` y `localhost-contacto-mobile-ui-v3-20261006.jpg`.
- Cambios locales en `beta`, disponibles en localhost y VS Code, sin envío a GitHub.
