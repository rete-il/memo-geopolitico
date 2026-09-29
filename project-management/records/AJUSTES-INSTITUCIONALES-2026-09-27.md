# Pie de página y redacción institucional

Solicitud: corregir el correo fragmentado en el pie, usar lenguaje neutro en Derechos y las demás páginas institucionales, explicar alojamiento y conservación, y completar los datos conocidos del responsable.

## Aplicado

- El pie común reserva espacio a la identidad y al correo. La navegación se organiza en Explorar e Información, derivados del registro compartido y de las páginas visibles. El diseño se apila en pantallas estrechas sin introducir listas alternativas de destinos.
- Las siete páginas institucionales mantienen un registro neutro, sin voseo ni tuteo. También se ajustaron las acciones de suscripción y los mensajes del panel local.
- `tools/lib/institutional-identity.mjs` reúne los nombres y explicaciones de los seis campos. La plantilla institucional, el panel local y la validación de publicación consumen ese registro. La conservación admite un texto de varios párrafos en el panel.
- Alojamiento identifica al servicio que almacena y entrega los archivos del sitio. Conservación identifica los plazos y criterios de almacenamiento y eliminación de correos y registros; la explicación no establece un plazo por sí misma.
- Netlify se completó como proveedor de alojamiento, respaldado por README, el registro OPS-001 y netlify.toml. Zoho se conserva como proveedor de correo ya documentado. No se verificaron cuentas ni envíos.

## Datos pendientes

No se encontró nombre completo o entidad responsable, país ni domicilio destinados a figurar en el sitio. Se solicitaron al usuario; no se deducen de alias, cuentas o zona horaria. Tampoco se establece una política de conservación sin definir sus plazos o criterios reales. Los indicadores públicos siguen desactivados.

## Verificación

- Siete pruebas de contactos, visibilidad institucional y API de configuración aprobadas.
- Compilaciones pública e institucional completadas. La navegación conserva 2.923 y 2.944 anclas internas respectivamente, sin destinos de ancla faltantes.
- Derechos: verificación visual del texto neutro y del pie. Correo completo en una línea, sin desbordamiento horizontal, a 320, 390, 768, 1.024 y 1.440 píxeles.
- Privacidad: Netlify, Zoho y las explicaciones visibles en Responsable y servicios. El panel local recibe los seis campos y sus ayudas desde la misma definición.
- Sin publicación en beta o producción. Las vistas locales se sirven en 8765 (salida pública) y 8766 (revisión institucional); el panel de configuración permanece en 4322.
