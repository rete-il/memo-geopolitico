# Referencias y bibliografía de las publicaciones

Fecha: 29 de septiembre de 2026. Alcance aprobado: punto 3 de la revisión previa a producción. Sin despliegue remoto.

## Corrección de las referencias

La revisión detectó ocho referencias no resueltas en cinco artículos. Dos IDs de fuentes de Sudán contenían mayúsculas incompatibles con la normalización del catálogo público; se corrigieron en el artículo publicado y sus copias derivadas.

Las otras seis fuentes ya existían en el Observatorio canónico, pero estaban pendientes de verificación y por eso se excluían de la proyección pública. Se comprobaron los originales antes de actualizar su estado, con fecha y alcance documentados en cada registro canónico:

- [ICPC: resumen del plenario de 2026](https://www.iscpc.org/events/2026-plenary-meeting/): página actualizada el 20 de abril; confirmadas las cifras de reparación citadas por el artículo. Información de la organización sectorial, no una auditoría independiente.
- [Parlamento británico: sesión del 18 de mayo](https://committees.parliament.uk/event/27216/formal-meeting-oral-evidence-session/): comprobados la ficha, los participantes y el objeto de la sesión. No se revisaron las transcripciones completas.
- [Comisión Europea: plataforma de conectividad](https://enlargement.ec.europa.eu/news/eu-launches-connectivity-agenda-platform-strengthen-links-between-europe-and-central-asia-through-2026-06-23_en): comunicado del 23 de junio. Los compromisos e intenciones de financiación no se consideran inversión ejecutada.
- [Chatham House: riesgo de interrupciones en estrechos](https://www.chathamhouse.org/2026/06/next-strait-hormuz-crisis-could-be-even-worse): comentario del 17 de junio, actualizado el 18. Sus escenarios se mantienen como interpretación.
- [RB Rail: encuentro de Bruselas](https://www.railbaltica.org/news/rail-baltica-in-focus-brussels-event-spotlights-europes-strategic-cross-border-rail-link/): comprobado el texto indexado del original del 8 de junio, incluidos los objetivos y kilómetros preparados para construcción. La apertura directa devolvió un error temporal. Es información del promotor y no certifica disponibilidad operativa.
- [LSM: financiación de Rail Baltica](https://eng.lsm.lv/article/economy/transport/01.06.2026-latvia-might-lose-eur50-million-eu-funding-for-rail-baltica.a649505/): comprobado el original del 1 de junio. La pérdida de financiación se mantiene como riesgo, no como resultado consumado.

No se añadieron fuentes nuevas ni se modificó la prosa de los cinco artículos. La proyección pública pasa de 356 a 362 registros de fuentes; no se añadieron señales. Se actualizaron únicamente los registros verificados, sus relaciones con los procesos y las dos referencias que tenían mayúsculas incompatibles.

## Presentación común

El transformador `publication-bibliography.mjs` reúne las secciones bibliográficas bajo un único título final «Fuentes». Conserva las notas editoriales, las subsecciones que explican el alcance de una ampliación y todas las citas en el cuerpo de lectura. Completa la bibliografía con las fuentes del catálogo que aún no estaban citadas en ella, evitando repetir enlaces por URL. Los fragmentos y consultas diferentes se preservan.

La plantilla deja de añadir una segunda lista «Fuentes vinculadas». El artículo Markdown sigue siendo la fuente de sus notas bibliográficas; la presentación se resuelve en un módulo para todo el catálogo, sin modificar individualmente las bibliografías de 61 artículos.

Las fuentes ausentes o pendientes de un artículo publicado producen un error explícito tanto en la validación de datos como al procesar el Markdown. No se descartan con `filter(Boolean)`. Los borradores conservan su texto si el paquete privado de previsualización no está disponible en una compilación pública.

## Comprobación

- Siete pruebas bibliográficas: citas, notas, ampliaciones, referencias Markdown, URL compartidas, errores de integridad, ausencia del paquete privado y recorrido del catálogo.
- Recorrido de los 75 artículos: todas sus referencias resueltas, una bibliografía final, sin repetir URL bibliográficas ni perder nodos de lectura.
- Tres pruebas de navegación compartida aprobadas junto con las pruebas bibliográficas.
- Validación de datos aprobada; se mantienen las 40 advertencias editoriales de clasificación preexistentes.

La compilación integral y la revisión visual quedan a cargo de la integración de los puntos aprobados.
