# Memo Geopolítico: auditoría de experiencia de lectura y arquitectura

Fecha: 27 de septiembre de 2026. Estado: diagnóstico y propuesta; pendiente de implementación.

## 1. Conclusión

El sitio tiene una identidad visual reconocible y una base documental considerable. La principal dificultad es encontrar, distinguir y recorrer ese contenido. La portada presenta primero la estructura del proyecto; el catálogo obliga a recorrer demasiadas tarjetas; las páginas extensas no ofrecen un índice; y algunos términos públicos describen el sistema de trabajo antes que la utilidad para el lector.

La solución propuesta conserva la identidad gráfica y el rigor editorial. Organiza cada pantalla alrededor de tres tareas: **entender un tema, comprobar la evidencia y seguir sus cambios**. El lector informado y el especialista tendrán la misma puerta de entrada y acceso directo a diferentes niveles de profundidad. No se propone separar el sitio en una versión simplificada y otra profesional.

Los problemas de enlaces repetidos motivaron correcciones generales que ya funcionan. Queda por ordenar las bibliografías, explicar mejor qué aporta cada destino y evitar que la centralización de textos dependa de copiar archivos durante la compilación.

Los correos acordados se localizaron en conversaciones del proyecto, pero siguen sin cargarse en la configuración del sitio. Su ausencia actual es una falta de integración, no una falta de información aportada por el usuario.

## 2. Alcance y evidencia

Se revisaron el código, la configuración, los datos y los HTML generados. La inspección de navegador incluyó portada, menú móvil, Publicaciones, el análisis de contrapesos, su expediente y cronología, Observatorio y sus filtros, Opinión, la ficha de Mounk, Medios y Contacto local.

Se comparó escritorio con una ventana de 390 × 844 píxeles. Las medidas verticales son observaciones de esa ventana, no métricas de velocidad ni resultados de un estudio con usuarios.

La versión pública generada se sirvió desde `dist` en el puerto 8765; la institucional local, desde `dist-local` en 8766. Ambas carpetas habían sido generadas el 23 de septiembre. No se recompiló durante la auditoría porque el proceso actual también escribe archivos de contenido. No se desplegó a beta ni se comprobó la versión remota en producción.

| Inventario comprobado | Cantidad |
|---|---:|
| Publicaciones | 75 |
| Procesos del Observatorio | 100 |
| Señales | 258 |
| Documentos fuente | 356 |
| Medios y organizaciones del directorio | 107 |
| Entradas de Opinión | 5 |
| Páginas HTML en la versión pública, incluida 404 | 797 |

Verificaciones ejecutadas sobre la versión existente:

- El validador de navegación revisó 2.923 enlaces con anclas internas y no encontró anclas ausentes en los destinos que pudo resolver. Comprobó los accesos al expediente de los 75 artículos y el acceso al original de las cinco opiniones.
- El validador SEO informó 668 URLs válidas y 75 artículos con datos estructurados. Es su cobertura específica, no el total de HTML.
- Se inspeccionaron enlaces externos repetidos en los HTML de los 75 artículos y los estados de evaluación de los 107 medios.
- No se ejecutó la batería completa de pruebas ni se certificó accesibilidad, rendimiento, cumplimiento legal o funcionamiento del correo. Los resultados históricos del proyecto no se presentan aquí como pruebas nuevas.

## 3. Lo que conviene conservar

- Tipografía editorial, paleta, separación entre títulos y cuerpo, y personalidad de Memo Geopolítico.
- Resúmenes desarrollados de las tarjetas. La solución a la extensión del catálogo será filtrar y paginar, no deshacer la ampliación solicitada.
- Separación entre análisis propio, seguimiento documental y opiniones de terceros.
- Fecha original y fecha de incorporación visibles en Opinión cuando existen.
- Selección compartida de las tres incorporaciones recientes en la portada y acceso «Ver más opiniones» al principio y al final.
- Enlaces a cronologías y señales concretas, en lugar de abrir siempre la cabecera del expediente.
- Etiquetas de formularios, enlace para saltar al contenido, estilos de foco y tratamiento de movimiento reducido existentes.
- El menú mediante diálogo nativo: se comprobó que Escape lo cierra y devuelve el foco al botón de apertura.
- Generación estática, configuración central y separación entre revisión local y publicación. No hay una necesidad demostrada de migrar de framework o introducir un CMS remoto.

## 4. Correcciones priorizadas

P1 indica una corrección prioritaria de acceso, confianza o integridad editorial. P2 indica una mejora importante de recorrido o mantenimiento. No se detectó ni se atribuye aquí una vulnerabilidad crítica.

| ID | Prioridad | Hallazgo y evidencia | Corrección propuesta | Criterio de aceptación |
|---|---|---|---|---|
| UX-01 | P1 | Por debajo de 1050 px desaparece la navegación de escritorio. El menú alternativo no contiene Publicaciones, Recursos visuales ni Acerca de; tampoco ofrece el acceso general al Observatorio. | Generar escritorio y móvil desde el mismo registro de destinos. Presentar primero secciones principales y después exploración por temas, regiones y actores. | Todas las secciones públicas principales se alcanzan desde cualquier página móvil al abrir el menú; mismos nombres y reglas de visibilidad. |
| UX-02 | P1 | Publicaciones muestra 75 tarjetas sin búsqueda, filtros ni paginación. A 390 × 844, el documento mide unos 49.203 px: aproximadamente 58 alturas de ventana. | Búsqueda, filtros de tema y región, orden explícito y paginación enlazable; propuesta inicial de 12 resultados por página. Conservar el resumen completo de cada tarjeta. | Se encuentra un artículo sin recorrer todo el catálogo. La URL conserva consulta, filtros, orden y página; volver desde una lectura conserva el contexto. |
| UX-03 | P1 | En el Observatorio, «Taiwan» devuelve cinco procesos y «Taiwán» cuatro, con conjuntos diferentes. La búsqueda usa minúsculas pero no normaliza tildes; parte del índice incluye identificadores de actores. | Un módulo compartido de normalización e indexación, con nombres públicos y alias controlados además de identificadores. Aplicarlo a todos los catálogos con búsqueda. | Ambas consultas devuelven el mismo conjunto. Mayúsculas, espacios y variantes previstas no producen omisiones; búsqueda por nombre de actor comprobada. |
| UX-04 | P1 | Trece medios con confianza «Por revisar» y estado «propuesto» se muestran con 0,0/5. Periodismo Puro, con puntuación nula, sí aparece «Por evaluar». | Distinguir evaluación pendiente de una nota cero real mediante estado explícito. Revisar los registros de origen y presentar «Evaluación pendiente» mientras no haya evaluación. | Ninguna fuente pendiente se presenta como valorada negativamente. Las notas publicadas permiten consultar criterio y fecha de revisión. |
| UX-05 | P1 | Los correos ya acordados no están cargados. La plantilla utiliza campos que no representan bien los cuatro canales reales y no contempla Prensa. | Registrar los contactos por finalidad y reutilizarlos en Contacto, pie, correcciones y datos institucionales. | Se muestran exactamente las direcciones recuperadas, sin aliases inventados; modificar un contacto actualiza todos sus usos. |
| UX-06 | P2 | La portada dedica su primera pantalla a explicar rutas. No presenta títulos recientes de análisis propios; Opinión es el bloque de lecturas concretas. | Encabezar con un análisis destacado y publicaciones recientes; dar espacio próximo a procesos actualizados y mantener Opinión con tres incorporaciones. Reducir la altura de las tarjetas que solo explican secciones. | Desde la primera pantalla se reconoce una lectura concreta y cómo acceder al seguimiento. La portada cambia al incorporarse contenido elegible. |
| UX-07 | P2 | En móvil, los ocho filtros del Observatorio desplazan el inicio de los resultados a unos 2.127 px del comienzo. | Búsqueda y filtros principales visibles; filtros avanzados desplegables con contador de activos, resultados y «Limpiar filtros». | Tras la introducción breve y los controles principales se ve al menos el comienzo de los resultados. Los filtros avanzados siguen disponibles con teclado. |
| UX-08 | P2 | El análisis de contrapesos tiene 11 encabezados de segundo nivel y unos 9.719 px de altura móvil, sin índice. El acceso estructurado a la evidencia está al final. | Índice generado a partir de los encabezados y acceso breve al bloque de evidencia desde el inicio. Expedientes con índice equivalente. | Se puede llegar a evidencia, perspectivas e incertidumbres sin recorrer el texto completo; los destinos no quedan tapados por la cabecera. |
| UX-09 | P2 | La tarjeta de contrapesos usa lenguaje concreto; el artículo aún comienza con «Instituciones, coaliciones y reglas de sucesión filtran la influencia de las redes…». | Revisión editorial de aperturas, subtítulos y etiquetas de todo el catálogo. Explicar actores, acciones y consecuencias antes de introducir categorías analíticas. | Tarjeta y artículo mantienen la misma promesa de lectura. Revisión humana; una sincronización técnica no se toma como garantía de claridad. |
| UX-10 | P2 | En la ficha móvil de Mounk, el título del recuadro de Fontevecchia está a unos 873 px y «Claves de esta lectura» a 2.058 px. | Mostrar primero las claves y el acceso al original; conservar después el recuadro destacado con sus logros y fuentes. En escritorio puede acompañar lateralmente si hay espacio suficiente. | La entrevista y la interpretación de Memo se identifican antes de la reseña biográfica; se conserva íntegro el contenido solicitado sobre el periodista. |
| UX-11 | P2 | Medios reúne 107 entradas con 92 valores distintos de función y 93 de perspectiva. Esos desplegables se parecen a listados de descripciones individuales. | Crear facetas públicas agrupadas; mantener descripciones detalladas en cada ficha. Explicar perspectiva, uso y límites sin una clasificación automática por palabras. | Los filtros agrupan conjuntos útiles y sus categorías son comprensibles; no se pierde la descripción ni se equipara perspectiva con fiabilidad. |
| UX-12 | P2 | La tabla de Medios mide unos 708 px dentro de un contenedor móvil de 355 px. El desplazamiento horizontal queda dentro de la tabla, sin desbordar la página, pero oculta columnas. | Fichas adaptables en móvil y tabla comparativa en escritorio, derivadas del mismo registro; alternativa de tabla con desplazamiento claramente indicado. | Nombre, uso, estado de evaluación y acceso a detalles son visibles sin exploración horizontal obligatoria. |
| UX-13 | P2 | Recursos visuales ocupa un destino principal aunque declara que no tiene recursos autorizados para publicación independiente. | Condicionar su presencia destacada a la disponibilidad real. Mantener una ruta útil para enlaces existentes y explicar los recursos disponibles dentro de artículos cuando corresponda. | El menú no promete un catálogo vacío; no se publican automáticamente recursos todavía no autorizados. |
| UX-14 | P2 | Acerca de explica Astro, archivos y APIs; Medios menciona «Excel canónico», «función epistemológica» y «sin llamadas externas». Autoría aparece como «Por Rete», sin perfil enlazado. | Reescribir para explicar propósito, responsables, selección de fuentes, correcciones y financiación conocida. Llevar los detalles técnicos a documentación apropiada. Añadir perfiles desde el registro de autores. | El lector identifica quién firma y cómo se trabaja sin conocer la arquitectura técnica. No se inventan credenciales ni datos personales. |
| UX-15 | P2 | Publicaciones se ordena por actualización, pero las tarjetas muestran generalmente solo la fecha de publicación. Opinión utiliza incorporación y distingue la fecha original. | Declarar el criterio de orden y mostrar la fecha que lo explica. Mantener por defecto Opinión por incorporación descendente; ofrecer orden por fecha original si resulta útil. | Ninguna tarjeta parece estar fuera de orden por ocultar la fecha usada. Las fechas desconocidas permanecen desconocidas, sin reconstrucciones inventadas. |
| UX-16 | P2 | Cada página institucional exige los mismos ocho datos, aunque Contacto no consume todos. En local, los botones operativos de suscripción nunca se muestran, incluso con configuración completa. | Dependencias por página y servicio; distinguir visibilidad, preparación y operación. Previsualizar el diseño final de suscripción con acciones inertes. | Contacto no depende de configurar un boletín. La vista local permite revisar todos los estados sin dar altas ni enviar información. |

Referencias principales: `src/components/Header.astro:6`, `src/styles/global.css:2484`, `src/pages/publicaciones/index.astro:50`, `src/scripts/observatory-filters.ts:33`, `src/components/ProcessCard.astro:101`, `src/pages/medios/index.astro`, `src/config/features.json`, `src/pages/index.astro`, `src/pages/opinion/[...slug].astro`, `src/pages/acerca-de.astro` y `tools/lib/institutional-policy.mjs`.

## 5. Enlaces: qué es un problema y qué no

### Resultado actual

La tarjeta de contrapesos lleva al artículo correcto. Su página tiene un acceso a la cronología del expediente, un enlace al análisis general en el texto y un acceso al proceso general. Son destinos relacionados, con funciones diferentes. No se encontró un bucle infinito de ejecución: la circularidad observada corresponde a recorridos de clics y contenido repetido.

El control actual confirma, para los 75 artículos, la ausencia del enlace genérico al expediente propio y la presencia de un acceso único a su cronología. En las cinco opiniones confirma un acceso único al original. Esto es una mejora general ya implementada, no un pendiente.

La inspección adicional encuentra al menos un destino externo repetido en 74 de los 75 artículos. **Ese número no significa 74 artículos defectuosos**: una cita contextual y su referencia bibliográfica cumplen funciones distintas.

En contrapesos, por ejemplo, el mismo informe de la CIDH aparece como cita en «Evidencia documentada», como referencia en «Incertidumbres y fuentes» y otra vez en «Fuentes vinculadas». Las dos listas bibliográficas superpuestas añaden repetición sin explicar un aporte diferente.

### Política general propuesta

| Función del enlace | Comportamiento |
|---|---|
| Abrir una lectura | El título y el botón de una tarjeta pueden compartir destino: es una convención de entrada, no una falsa ampliación. |
| Consultar evidencia | Llevar a la sección o señal concreta y explicar qué se encontrará. |
| Volver | Rotular como regreso al análisis o al listado; conservar contexto de búsqueda y desplazamiento cuando sea posible. |
| Continuar | Recomendar otra lectura y explicar en una frase su relación; excluir la página actual. |
| Citar | Mantener el vínculo junto a la afirmación. No eliminarlo por haberse citado el documento antes. |
| Bibliografía | Una entrada por documento fuente dentro de la bibliografía consolidada, con las llamadas pertinentes desde el texto. |
| Navegación persistente | Mantener cabecera y pie, y las repeticiones intencionales pedidas, como «Ver más opiniones» arriba y abajo. |

No se propone esconder enlaces según el historial del lector. Leer una página no hace que su evidencia deje de ser consultable. Tampoco se propone eliminar toda relación artículo–expediente: el problema es presentarla varias veces como si fueran ampliaciones distintas.

### Solución modular

Extender la política existente con relaciones explícitas: destino, sección, tipo de relación, etiqueta y aporte. El bloque reutilizable organiza evidencia, regreso y continuación. La deduplicación se hace dentro de cada función y bloque; no sobre toda la página indiscriminadamente.

La bibliografía utilizará identificadores de documento. Las citas y listas derivarán de esos registros. No basta comparar títulos o dominios: documentos distintos del mismo medio, versiones diferentes y anclas con significado deben conservarse. La migración de bibliografías manuales requiere revisar correspondencias y preservar todas las citas.

El transformador actual de Markdown es una protección útil, pero no debe ser la única definición editorial del recorrido. Opera sobre enlaces directos en párrafos, encabezados y tablas; no cubre automáticamente todo HTML manual ni todas las referencias indirectas. La validación del HTML final debe seguir siendo la última comprobación.

## 6. Arquitectura de navegación propuesta

### Navegación global

- **Principal:** Inicio, Publicaciones, Observatorio y Opinión.
- **Explorar:** Temas, Regiones, Actores, Fuentes y medios; Recursos visuales cuando haya catálogo autorizado.
- **Proyecto:** Acerca de, Metodología, Contacto y Correcciones cuando estén habilitados.
- **Buscar:** un acceso reconocible y disponible también en móvil. La primera mejora puede reutilizar búsquedas por sección; una búsqueda global posterior debe indicar el tipo de resultado y excluir contenido privado o no publicado.
- **Pie:** grupos anteriores más páginas institucionales aplicables, correo general y apoyo/suscripción solo según su configuración. Evitar una única fila de enlaces sin jerarquía.

No cambiar URLs existentes por un cambio de rótulo. «Fuentes y medios» puede seguir utilizando `/medios/`. Dentro de cada análisis, «fuente» seguirá designando el documento concreto que respalda una afirmación.

### Portada

```text
Identidad + navegación + búsqueda
Presentación breve del proyecto
Análisis destacado con título, resumen, fecha y acceso
Últimas publicaciones: lecturas concretas
Seguimiento: procesos con novedades documentadas
Opinión: tres incorporaciones recientes
  Ver más opiniones al comienzo y al final
Explorar por tema y región
Método, contacto y pie organizado
```

La selección debe partir de un catálogo compartido. Para un destacado manual, registrar una decisión editorial por ID; si no existe o deja de ser elegible, usar una regla de respaldo. Evitar repetir la misma publicación en destacado y últimas lecturas. Una corrección de puntuación no debe presentarse como un acontecimiento nuevo: las novedades de seguimiento deben apoyarse en cambios documentados.

### Publicación

```text
Ruta de navegación
Título + subtítulo concreto + autor enlazado + fechas pertinentes
Resumen de lo que explica
Índice de lectura + acceso a evidencia
Cuerpo del análisis
Bibliografía consolidada
Evidencia y seguimiento del proceso
Una o dos lecturas relacionadas con su aporte explicado
Señalar una corrección
```

El acceso inicial a evidencia puede apuntar al bloque de la propia página; ese bloque conserva un único enlace externo al expediente. Así se gana orientación sin reinstalar tres botones al mismo destino. El resumen inicial no debe repetir inmediatamente el primer párrafo del cuerpo.

### Expediente del Observatorio

```text
Qué proceso seguimos y por qué importa
Qué cambió + fecha de la última evidencia relevante
Índice: cronología, fuentes, hipótesis, incertidumbres, escenarios
Cronología y documentos
Desarrollo analítico por secciones
Relación explícita con el análisis publicado
```

Las hipótesis alternativas, indicadores y criterios de refutación permanecen disponibles. Su presentación puede agruparse para facilitar la lectura, con anclas estables y acceso directo para especialistas.

### Opinión

Mantener el orden descendente por incorporación, con fecha original claramente distinguida. La ficha debe responder primero qué sostiene el autor, por qué se seleccionó y dónde está el original. Después, perfiles de autor y entrevistador y vínculos al contraste de Memo. El recuadro de Fontevecchia permanece destacado, con sus fuentes.

## 7. Correos recuperados y ubicación

La evidencia procede de las tareas del proyecto **«Ubicación de correos UI UX SEO»** y **«Crear aliases de email»**. Allí se registraron los siguientes canales:

| Dirección | Uso y ubicación propuesta |
|---|---|
| contacto@memogeopolitico.com | Consultas generales. Visible en Contacto y en el pie. |
| editorial@memogeopolitico.com | Comunicaciones editoriales y correcciones. Contacto, política de correcciones y acción al final de los artículos. |
| colaboraciones@memogeopolitico.com | Propuestas de colaboración. Bloque específico de Contacto. |
| prensa@memogeopolitico.com | Consultas de prensa. Bloque específico de Contacto. |

`info@memogeopolitico.com` figura como alias alternativo; no es necesario mostrar dos puertas equivalentes. `cuentas@memogeopolitico.com` y `dmarc@memogeopolitico.com` cumplen funciones privadas/técnicas y deben quedar fuera de la interfaz y del paquete público.

Zoho aparece como proveedor en esas conversaciones. No se comprobó en esta auditoría la recepción, el envío ni la configuración DNS actual. No se enviaron mensajes.

El esquema propuesto tiene un dominio de correo central, canales identificados por finalidad y visibilidad explícita. Las plantillas consultan ese registro. «Señalar una corrección» prepara el destinatario editorial y el contexto del artículo; no envía nada automáticamente. Un canal de privacidad deberá asignarse a una dirección real acordada, sin inventar un buzón `privacidad@`.

Las referencias históricas recuperadas corresponden a las tareas `6ab3d2ce-d5a8-83e8-9972-3820a4b96476` y `6ab05a19-8184-83e8-aff1-3827c571512c`. Se consignan para trazabilidad interna, no para publicarlas en el sitio.

## 8. Código, módulos y flujo de publicación

### A. Fuente editorial única sin escrituras implícitas

`tools/lib/editorial-presentation.mjs` se ejecuta en `astro:config:setup`. Toma publicaciones y reescribe descripciones y preguntas en datos locales, públicos y de vista previa. También copia el Markdown completo a copias con estado publicado. El observador atiende altas y cambios, pero no eliminaciones.

La regla ya abarca el catálogo, pero **centralizar la edición no equivale a haber eliminado las copias ni sus efectos secundarios**. Una compilación puede modificar archivos fuente. Además, la pregunta del artículo y la pregunta de seguimiento del proceso quedan acopladas al artículo más reciente.

Propuesta:

1. Definir propietario de cada dato: publicación, proceso, señal, fuente, persona y configuración del sitio.
2. Referenciar por ID. Si el proceso necesita usar el resumen del artículo, declararlo en una proyección de presentación; no sobrescribir su registro de investigación durante el build.
3. Mantener campos independientes cuando representan preguntas distintas. Una excepción editorial debe ser explícita, no una copia accidental.
4. Exportar datos mediante una operación identificable y validada. Compilar debe leer entradas y escribir únicamente salidas/cachés previstas.
5. Resolver eliminación, cambio de slug, varios artículos por proceso y pérdida de una referencia sin conservar contenido obsoleto silenciosamente.

Criterio: cambiar el subtítulo en su única fuente actualiza todas sus presentaciones; compilar no altera el contenido canónico ni las notas de investigación.

### B. Separación de contenido público y vista previa

`src/content.config.ts` carga `publicadas` y `_preview`. `getPublicationEntries` deduplica por `post_id` y estado/fecha antes de aplicar la selección pública. Por ello, una copia de `_preview` con estado publicado puede competir con el archivo canónico.

La inspección encontró 54 IDs compartidos; no encontró cuerpos publicados distintos entre esas copias ni publicaciones exclusivas de `_preview` marcadas como publicadas. Se trata de una fragilidad del contrato, **no de una filtración comprobada**.

Propuesta: seleccionar primero el conjunto permitido por el modo y resolver después identidades. En producción manda la fuente pública; en revisión local las sustituciones deben ser deliberadas y señaladas. Añadir un caso de prueba que demuestre que una copia de revisión más reciente no cambia la salida pública.

### C. Módulos compartidos, sin un componente que haga todo

| Responsabilidad | Módulo propuesto o evolución del existente |
|---|---|
| Rutas, rótulos y aparición por canal | Registro de navegación consumido por cabecera, menú y pie. |
| Elegibilidad, fechas, destacados y selección | Capa de catálogo; reutilizar la ordenación compartida de Opinión. |
| Búsqueda y filtros | Normalización común, índice con nombres/alias y estado en URL. |
| Tarjetas | Variantes de presentación sobre los mismos datos: portada, catálogo y relación. |
| Recorridos de lectura | Evolución de `ReadingLinks` y la política de destinos; relaciones tipadas. |
| Referencias documentales | Registro de fuentes y bibliografía derivada, con citas preservadas. |
| Personas | Perfiles reutilizables de autores y entrevistadores. |
| Contactos y páginas opcionales | Registro institucional con requisitos específicos y estados visibles. |

Las consultas a colecciones deben resolverse una vez por página o proceso de generación y pasarse a componentes cuando corresponda. No hace falta introducir una caché global que permanezca obsoleta al editar. Los estilos compartidos deben organizarse por patrones de interfaz y componentes; dividir el archivo CSS, por sí solo, no demuestra una mejora de rendimiento.

### D. Activación y previsualización comprensibles

Conservar un lugar central para páginas opcionales, apoyo y suscripción. Mostrar por elemento: visible en revisión local, preparado, habilitado públicamente y dependencias pendientes. Las acciones operativas de un servicio son otro estado.

Las dependencias deben responder al contenido o servicio concreto, sin bloquear Contacto por datos exclusivos de suscripción. Eso no implica omitir requisitos aplicables a páginas institucionales; su revisión se hará según el funcionamiento real del sitio.

El panel debe distinguir «configuración guardada» de «vista generada» y «publicada». Registrar fecha y versión de la generación ayudaría a explicar por qué un cambio guardado no aparece en localhost. Es una mejora pertinente al problema repetido por el usuario, no una atribución retrospectiva de una única causa.

### E. QA y rendimiento

`package.json` define `validate:navigation`, pero el comando principal `qa` no lo ejecuta. Tampoco incorpora la generación institucional en esa secuencia. Integrar las verificaciones de los modos y funciones que se modifican para que las regresiones no pasen inadvertidas.

El HTML de Dashboard ocupa aproximadamente 537 KiB sin comprimir y el índice del Observatorio 341 KiB. Es un indicio para medir y reducir salida innecesaria; no prueba una mala puntuación de rendimiento. Medir transferencia, renderizado e interacción antes y después de paginar y filtrar. Priorizar datos y marcado necesarios antes de introducir más JavaScript.

## 9. Orden de implementación propuesto

| Entrega | Alcance | Comprobación antes de considerarla terminada |
|---|---|---|
| 1. Acceso y confianza | Menú común; integración de correos; representación correcta de evaluaciones pendientes; búsqueda tolerante a tildes. | Móvil y teclado; comparación Taiwan/Taiwán; los 13 casos pendientes; direcciones tomadas del registro único. |
| 2. Catálogos y portada | Publicaciones filtrables/paginadas; fechas y orden claros; portada con lecturas; filtros avanzados del Observatorio; organización de Medios. | Buscar, abrir y regresar conserva estado; nuevas incorporaciones aparecen; resúmenes completos y contenido autorizado preservados. |
| 3. Lectura y evidencia | Índices; bibliografía consolidada; perfiles; orden de Mounk; relaciones y rótulos; revisión de lenguaje público. | Recorrido artículo → evidencia → señal/documento → regreso; citas y anclas válidas; ninguna falsa ampliación. |
| 4. Datos y activación | Proyecciones sin reescritura implícita; selección pública/preview inequívoca; estados institucionales y de generación; QA integrada. | Build sin cambios en contenido fuente; ninguna copia local sustituye producción; escenarios visible/oculto/configurado probados. |

Las responsabilidades de datos se acuerdan al comenzar, antes de crear nuevos componentes. Las entregas son unidades revisables, no desarrollos aislados con constantes o reglas duplicadas. No se propone un plazo cerrado sin conocer las decisiones de contenido institucional que falten.

## 10. Condiciones de aceptación de conjunto

1. Todos los destinos principales están disponibles en escritorio y móvil.
2. Publicaciones, procesos, opiniones y medios se encuentran mediante controles adecuados al volumen real.
3. La fecha visible explica el orden. Se distingue incorporación, publicación original y actualización.
4. Todo enlace de ampliación aporta un destino o sección identificable; las repeticiones deliberadas tienen una función clara.
5. Hay una bibliografía consolidada por artículo y se conservan las citas contextuales.
6. Los contactos reales se editan una sola vez. Direcciones privadas y datos no autorizados no entran en el paquete público.
7. Las evaluaciones pendientes no se representan como calificaciones negativas.
8. El menú, filtros, índices y paginación funcionan con teclado, foco visible y etiquetas comprensibles. Se revisan contraste, zoom y tamaños táctiles en la implementación, sin dar por certificada accesibilidad por esta inspección.
9. El build no modifica el contenido canónico. La previsualización no altera la selección pública.
10. Las páginas opcionales respetan sus indicadores y muestran en local los estados necesarios para revisión, sin operar servicios externos.

## 11. Estado al entregar

Se entrega esta auditoría con evidencia, propuestas y criterios verificables. No se modificó el código del sitio ni su contenido editorial durante esta auditoría; este documento es el único agregado. No se publicaron páginas, no se enviaron correos y no se desplegó a beta.

Quedan para la implementación: las correcciones enumeradas, la revisión integral de lenguaje, las decisiones institucionales que no constan en el proyecto y la comprobación funcional del correo por sus canales autorizados. No hace falta volver a pedir al usuario las cuatro direcciones ya recuperadas.
