# Preferencia opcional del Observatorio

Fecha: 29 de septiembre de 2026. Alcance: punto 9 aprobado por el usuario; implementación local, sin despliegue.

## Comportamiento

- La casilla «Recordar esta vista en este navegador» comienza desmarcada. Cambiar entre lista y tarjetas no escribe en el almacenamiento si no se ha marcado.
- Marcarla guarda la vista actual durante seis meses calendario desde la activación. Cambiar de vista no renueva el plazo. La caducidad se calcula en UTC y ajusta el día al último válido del mes correspondiente.
- Desmarcarla elimina la preferencia, conservando la vista que se está leyendo. Al recargar o volver al Observatorio se utiliza Lista. El borrado desde Cookies y servicios externos desactiva también el guardado en otras pestañas abiertas.
- Los valores antiguos, sin autorización explícita, se eliminan y no se interpretan como aceptación. El registro nuevo contiene únicamente versión, aceptación, vista, fecha de activación y vencimiento, sin identificadores personales.
- Una preferencia vencida deja de aplicarse. El sitio la elimina cuando vuelve a acceder a ella; el navegador no ejecuta esta limpieza si el sitio permanece cerrado.
- Si el navegador impide guardar o borrar, la lectura continúa y se informa del fallo. Una pestaña que no pudo borrar no reactiva automáticamente el guardado durante esa visita.

## Implementación y controles

La política compartida está en `tools/lib/browser-storage-policy.mjs`. El control de vista se separó de los filtros en `src/scripts/observatory-view.ts`; los filtros continúan usando la URL. La página institucional y su control de borrado describen el mismo comportamiento. No se incorporaron cookies ni servicios de seguimiento.

Las pruebas de política cubren aceptación, caducidad exacta, fin de mes y año bisiesto, revocación, valores antiguos y fallos de acceso. Las pruebas de integración ejecutan la política y el script de vista reales con eventos simulados, incluyendo revocación entre pestañas y retorno mediante el historial. Resultado enfocado: **23 pruebas aprobadas**.

## Verificación final

La comprobación en localhost confirmó la migración de una preferencia antigua, cambios de vista sin guardado, persistencia solo tras marcar, borrado desde otra pestaña, ausencia de recreación tras revocar y retorno a Lista al recargar. El control se revisó en escritorio y en una ventana móvil de 390 × 844 sin desbordamiento horizontal. Se dejó el navegador sin preferencia guardada al terminar.

Verificación conjunta con el [punto 10](PUNTO10-2026-09-29.md): **303 pruebas aprobadas**; comprobación de tipos sin errores ni advertencias; compilaciones pública, editorial e institucional completadas. La QA pública validó 673 URLs, 27 redirecciones y 2.943 anclas sin roturas, además de tipografía y ausencia de enlaces internos rotos. El Centro local se reinició y sus módulos respondieron correctamente. No se publicó en beta ni producción.
