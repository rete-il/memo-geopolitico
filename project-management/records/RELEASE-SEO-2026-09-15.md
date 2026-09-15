# Publicación y SEO — 15 de septiembre de 2026

## Autorización y alcance

El usuario autorizó optimizar SEO y pasar todo el trabajo terminado a beta y main.
Se publican 50 análisis: siete rectores y 43 procesos complementarios, con fecha
de publicación 2026-09-15. Los registros de compleción anteriores describen el
estado previo a esta autorización. Los demás borradores conservan su estado.

## Cambios

- Artículos completos persistentes en publicadas, sincronizados con expedientes
  y archivos editoriales canónicos. Total: 75 artículos y 100 expedientes.
- Canonical del dominio público, robots de producción indexable y noindex para
  beta, branch deploys, deploy previews y vista editorial local.
- Datos estructurados Organization, WebSite, BreadcrumbList y Article; autor
  visible resuelto desde catálogo; fechas y títulos de los artículos.
- Sitemap con fechas reales de actualización de artículos y expedientes.
- Validador SEO que recorre todas las URLs del sitemap y verifica archivos,
  canonical, robots, títulos, descripciones y datos estructurados.
- Validación de evidencia publicada compatible con rectores que referencian
  señales existentes; referencias inexistentes siguen fallando.
- Catálogos de medios regenerados desde Excel maestro para resolver la
  desincronización previa de fechas. Se conservan los 106 medios.

## Comprobaciones

- 226 pruebas aprobadas; Astro check sin errores ni advertencias.
- 790 páginas públicas, 807 editoriales, cero enlaces internos rotos.
- Sitemap: 761 URLs; 75 artículos con datos estructurados.
- Producción indexable; vista editorial con noindex.
- HTTP y www redirigen al dominio canónico HTTPS.
- El rastreo e inclusión final dependen del buscador. Sitemap anunciado en
  robots.txt; no se ha enviado mediante una cuenta de Search Console.

Referencia: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

## Entrega y reversión

Integración mediante avance rápido, sin reescribir el historial de beta ni main.
Base previa: 7b91c09. Si fuera necesario revertir, crear un commit de reversión
del release y desplegarlo, preservando el historial.
