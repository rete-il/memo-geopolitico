# Corrección de indexación — 16 de septiembre de 2026

Solicitud: resolver los hallazgos revisados en Search Console.

## Evidencia inicial

- Indexación, actualización 13/09: 473 URLs indexadas y 19 excluidas.
- Sitemap leído el 15/09: 761 URLs descubiertas, estado correcto.
- Exclusiones: 9 URLs 404, 3 redirecciones y 7 duplicados metodológicos.
- La inspección de la ficha asistencia-militar-occidental-ucrania-transformacion
  confirmó rastreo e indexación permitidos. Google seleccionó como canónica la
  ficha base-industrial-defensa-guerra-rusia-ucrania.

## Correcciones

- Las 100 fichas metodológicas provisionales, con texto genérico repetido,
  permanecen accesibles con noindex,follow y salen del sitemap. La metodología
  general y los artículos conservan su indexabilidad.
- Se incorpora /observatorio/rectores/ al sitemap: total esperado 662 URLs.
- /directorio y /directorio/ redirigen permanentemente a /medios/.
- /ensayos/turquia y su variante con barra redirigen al análisis actual de
  Turquía como potencia bisagra. Se comparó el tema del ensayo histórico en
  d770755 con el contenido de la publicación vigente.
- Los artículos retirados /ensayos/la_ilustracion_oscura (ambas variantes),
  /profundidad/nato-ankara2026 (ambas variantes) y
  /profundidad/india-nzelandia conservan 404: no existe equivalente actual.
  No se restauran textos antiguos ni se redirigen a contenido irrelevante.
- Las redirecciones normales no requieren indexar las URLs de origen.

## Validación

Build completado; validador SEO: 662 URLs y 75 artículos con datos estructurados.
Nueve pruebas de publicaciones y taxonomías aprobadas. El validador también
comprueba noindex de fichas, exclusión del sitemap y destinos de redirecciones.

Los cambios previos de Opinión pertenecen a otro trabajo y no forman parte de
esta corrección. Los números de Search Console no cambiarán hasta que Google
vuelva a rastrear y procesar las URLs; no se garantiza posición ni tráfico.
