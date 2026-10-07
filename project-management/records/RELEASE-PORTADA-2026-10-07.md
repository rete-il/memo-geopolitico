# Publicación autorizada de la portada y del sistema visual

Fecha: 7 de octubre de 2026.

## Autorización y alcance

El usuario autorizó publicar todos los cambios terminados en `beta` y `main`, y dejar el proyecto de VS Code sin cambios ni commits pendientes de sincronización. Esta autorización sustituye el estado de revisión exclusivamente local de los registros del 6 y 7 de octubre.

La versión incluye la portada «Investigación y lectura», el mapa editorial con fondo marfil, navegación principal con Macroeventos rectores, cabeceras ilustradas uniformes, enlaces y controles por función, y la separación modular de portada, expedientes, Dashboard, Rectores y estilos. Texto neutro y explicaciones de investigación, verificación, fuentes y atención mediática conservados. Los contenidos publicados y sus datos permanecen canónicos.

Se incluyen los siete recursos optimizados utilizados por el sitio, sus originales y prompts, capturas de revisión, entregables gráficos preexistentes, documentación, pruebas y tareas portables de VS Code. Los informes de monitoreo y la captura de Analytics quedan locales mediante reglas acotadas de exclusión. No se publica información operativa de tráfico o créditos y no se borran archivos locales.

## Preparación y verificación

La QA completa de la versión revisada aprobó 344 pruebas, tipos sin errores ni advertencias, compilaciones de producción y editorial, datos, SEO, navegación y tipografía. Se comprobaron 836 archivos HTML públicos, 853 editoriales, 701 URLs con títulos únicos, 80 artículos, 105 expedientes y 27 alias. No se encontraron enlaces ni anclas rotos. Evidencia: `qa-nav-rectores-marfil-20261007.log` y los registros de revisión visual.

La revisión manual cubre escritorio, tablet y móvil, cabeceras e imágenes comunes, menú, navegación por teclado, filtros, selección de vista y evidencia desplegable. Las imágenes tienen un único registro de presentación y los colores y escalas generales permanecen parametrizados.

Antes de la entrega se verifica también la instalación limpia y `qa:production` con Node 22.12.0, la versión definida en `.nvmrc` y Netlify. Esa comprobación corresponde al mismo árbol de archivos que se enviará a ambas ramas; una aprobación local no se presenta como confirmación de despliegue remoto.

## Entrega y reversión

Base de ambas ramas remotas antes del release: `feacaf22a6b2ca5225c4f6bfca39a5ca6629dcf9`. El avance conserva el historial y no utiliza push forzado. Beta es una rama de GitHub; Netlify publica únicamente `main` en `https://memogeopolitico.com`.

Se conserva el checkout de trabajo en `beta`, se promueve `main` al mismo commit y se comprueban las referencias local/remota y el estado limpio del proyecto. La entrega a GitHub y la publicación en Netlify se verifican por separado, con el commit exacto y una revisión del sitio público.

Para revertir el producto, se debe crear un commit de reversión del commit de este release y publicarlo en ambas ramas. La base anterior permanece accesible en el historial; no se resetean ni fuerzan ramas remotas.

Referencias: [portada editorial](PORTADA-EDITORIAL-2026-10-06.md), [revisión modular](REVISION-UI-MODULAR-2026-10-06.md), [mapa editorial](MAPA-EDITORIAL-PORTADA-2026-10-07.md), [Rectores y fondo marfil](UNIFICACION-RECTORES-2026-10-07.md).
