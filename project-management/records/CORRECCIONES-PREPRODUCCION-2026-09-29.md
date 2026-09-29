# Correcciones previas a producción

Fecha: 29 de septiembre de 2026.

Alcance: implementación de los puntos 1–8 aprobados después de la revisión general. Los cambios permanecen locales; no se ejecutaron commits ni despliegues a beta o producción. Este registro documenta esta ronda y no reemplaza los registros anteriores.

## Cambios implementados

| Punto | Resultado |
| --- | --- |
| 1. Comprobaciones de producción | Corregidos los escenarios de prueba que dependían de los indicadores institucionales reales y de importaciones antiguas del buscador. Las pruebas de configuración escriben ahora en archivos temporales. `qa:production` reúne pruebas, datos, tipos, compilación pública, enlaces, SEO y tipografía; Netlify queda configurado para ejecutarlo antes de publicar. La validación pública no exige una compilación editorial ni datos privados de previsualización. |
| 2. Persistencia de filtros | Un módulo común de URL conserva búsqueda y selección al pulsar Enter, recargar y utilizar Atrás. Se aplica a los filtros del Observatorio, Medios y panel de seguimiento. |
| 3. Referencias y bibliografía | Reparadas ocho referencias en cinco artículos. La bibliografía de los 75 artículos utiliza un transformador compartido: reúne las fuentes al final, evita duplicar URL y conserva citas y notas. Las referencias ausentes o pendientes generan un error explícito. El detalle de verificación de originales y sus límites está en el registro bibliográfico enlazado abajo. |
| 4. Matriz del Observatorio | Los 100 procesos se agrupan en las 19 posiciones ocupadas de la matriz. Cada posición ofrece un desglose navegable; así se resuelve la superposición, incluida una posición que contenía 44 procesos. |
| 5. Accesibilidad | Pestañas con navegación por teclado y relaciones ARIA, anuncios de conteos al filtrar y ajuste del contraste de los rótulos ámbar a 5,51:1. Verificadas las pestañas en escritorio y móvil. |
| 6. Destinos y metadatos | Política compartida de rutas geográficas y metatítulos. Los 27 alias de espacios bajo `/regiones/` conservan acceso mediante redirecciones a `/espacios-geopoliticos/`, con fallback HTML local, canonical y noindex. Se generan reglas `301!` para Netlify. El índice enlaza directamente al destino canónico. Los metatítulos distinguen análisis, expedientes, actores y categorías sin modificar los H1 editoriales. |
| 7. Claridad y navegación | Rótulos más explícitos para el panel de seguimiento y las fichas de Opinión; se distingue la persona entrevistada de la firma de un artículo original. La visibilidad de Recursos visuales depende de que existan recursos públicos completos: una sección vacía no se ofrece en la navegación ni en el sitemap y permanece sin indexación. |
| 8. Administración | Se distinguen los valores guardados de los cambios pendientes. Los requisitos se recalculan antes de guardar y se agrupan para las páginas seleccionadas; pueden descartarse los cambios. El servidor conserva validación de origen, revisión y contenido. Los conflictos no habilitan reintentos con una revisión obsoleta; ante una respuesta de guardado incierta se consulta el estado persistido antes de afirmar el resultado. |

Referencia específica: [Referencias y bibliografía de las publicaciones](FUENTES-BIBLIOGRAFIA-2026-09-29.md). No se reescribieron las conclusiones de los artículos para resolver sus referencias.

## Verificación independiente del paquete

Se creó una copia temporal de los **504 archivos actuales rastreados y nuevos no ignorados**, sin `.git`, archivos `.env`, `local-preview`, sesiones privadas ni compilaciones anteriores. Desde esa copia se ejecutó `qa:production` con telemetría desactivada y los indicadores de producción explícitos.

Resultados del snapshot comprobado:

- **286 pruebas aprobadas**, ninguna fallida.
- Comprobación de tipos: **0 errores, 0 advertencias y 18 sugerencias** en 195 archivos.
- Compilación pública: **802 páginas y 803 archivos HTML**; 75 artículos, 100 expedientes y 5 opiniones.
- Datos válidos. Se conservan las **40 advertencias editoriales preexistentes** sobre cantidad de clasificaciones temáticas.
- SEO: **673 URL con metatítulos únicos y 27 alias redirigidos**.
- Enlaces y navegación: **0 enlaces internos rotos y 2.943 anclas comprobadas sin roturas**.
- Tipografía: **802 páginas** con un único título compartido, no vacío y sin punto final.

La comparación SHA-256 confirmó que ninguno de los 504 archivos originales cambió durante la prueba. Tampoco el sincronizador modificó los archivos de la copia. El directorio temporal se eliminó después de verificar sus límites y retirar el enlace de dependencias; se conservó el registro de ejecución en `C:\Users\ricar\AppData\Local\Temp\memo-release-isolated-2JP7N2.log`.

**Límite de esta comprobación:** las dependencias instaladas se reutilizaron mediante un enlace a `node_modules`. Esto comprueba el paquete y su independencia de datos privados, pero no equivale a una instalación nueva con `npm ci` ni a una ejecución dentro de Netlify. No se cambiaron dependencias como parte de esta prueba.

## Revisión visual y estado de publicación

La comprobación interactiva final se realizó en localhost sobre la compilación pública, con escritorio y ventana móvil de 390 × 844. Se eliminó una regla global `:active` que desplazaba el botón de la matriz durante la pulsación. El clic abre ahora el grupo completo de 44 procesos en ambos tamaños; la lista también admite teclado. Las pestañas reconocen su orientación y responden a las flechas correspondientes. No se observó desbordamiento horizontal del documento en la vista móvil comprobada.

También se verificaron búsqueda, Enter, recarga y Atrás en Medios; filtros y pestañas del panel; una bibliografía consolidada y la redirección local de Ártico. En un administrador aislado se probaron requisitos incompletos, descarte, guardado válido y persistencia tras recargar. La configuración real permaneció intacta y el servicio local se reinició con el código nuevo.

Tras el ajuste de la matriz se repitieron 16 pruebas enfocadas (todas aprobadas), las tres compilaciones y los controles de enlaces, SEO y tipografía. Las versiones pública y editorial no presentan enlaces internos rotos. `git diff --check` terminó sin errores. Se corrigió la fecha de generación de las proyecciones a 29 de septiembre, conservando las fechas editoriales; el panel identifica por separado la última revisión de procesos.

Las seis páginas institucionales y los correos mantienen la habilitación para una próxima publicación ya autorizada. Suscripción y apoyo al proyecto continúan desactivados en producción. Cambiar la comprobación de Netlify no ejecuta un despliegue.

## Pendientes fuera de los puntos implementados

- **Punto 9 — «Recordar mi elección»:** no se incorporó la casilla opcional para guardar la vista del Observatorio. El almacenamiento conserva el comportamiento documentado previamente; esta ronda no introduce un banner general de consentimiento.
- **Punto 10 — Dependencias y caché:** quedan pendientes la actualización de `xlsx` y el ajuste de la regla de caché de Netlify para los recursos generados en `/_astro/`. No se modificaron estos elementos.
- Antes de publicar: incorporar el paquete completo de cambios y ejecutar el procedimiento de publicación autorizado. No se ha realizado ninguna publicación en esta ronda.

Actualización posterior del mismo día: el usuario aprobó y se implementaron el [punto 9, preferencia opcional](PREFERENCIA-EXPLICITA-2026-09-29.md), y [ambos cambios del punto 10](PUNTO10-2026-09-29.md). Las decisiones anteriores quedan resueltas; continúa pendiente el despliegue.
