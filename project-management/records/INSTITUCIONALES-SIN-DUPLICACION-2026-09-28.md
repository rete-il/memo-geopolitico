# Páginas institucionales: datos, aprobación y contenidos únicos

Se incorporaron en `src/config/features.json` los datos proporcionados por el responsable el 28 de septiembre. La aprobación recibida se registra en `institutional.reviewed`; el rótulo del panel ahora se refiere exclusivamente a los textos, sin implicar una verificación de proveedores o del servicio de alertas. No se activaron indicadores públicos ni se desplegó el sitio.

## Distribución de contenidos

- Aviso legal: identidad del responsable, país y domicilio proporcionado. Se conserva la localidad indicada, sin inventar una dirección postal adicional.
- Privacidad: tratamiento de datos, alojamiento, correo y conservación. Enlace a la identificación del responsable, sin volver a imprimirla. El canal general existente atiende las consultas de privacidad.
- Contacto: único directorio completo de los cuatro correos.
- Derechos y Correcciones: sus respectivos procedimientos y una acción directa de correo, sin repetir la tarjeta del directorio. El ajuste posterior muestra la dirección completa bajo la finalidad de la acción; se aplica también al canal de Privacidad y conserva un único enlace por bloque y los datos del registro central.
- Cookies: tecnologías del sitio y acceso a terceros. Suscripción: novedades, alta, preferencias y baja; su estado desactivado aparece una sola vez.

Los grupos, acciones y enlaces se resuelven en `tools/lib/institutional-presentation.mjs`. Las referencias excluyen destinos ocultos, la propia página y destinos repetidos. Privacidad depende de Aviso legal para mantener accesible la identificación central; Suscripción mantiene su dependencia de Privacidad. Los selectores de contactos existentes se conservan, incluidos los accesos de corrección en artículos y el correo del pie.

## Corrección de los avisos de revisión

Las capturas remitidas durante el ajuste correspondían a la salida estática anterior. Tras regenerar `dist-local`, ninguna de las siete páginas muestra los antiguos pendientes ni campos sin completar. El aviso local es una línea compacta. Los controles administrativos se consultan en el panel, agrupados por requisito, sin repetir una lista completa en cada página. Las funciones voluntariamente desactivadas no se presentan como errores de contenido.

## Conservación adoptada

Consultas generales: hasta 12 meses después del cierre, con revisión periódica y eliminación anticipada cuando la información deje de ser necesaria. Las excepciones documentales tienen que justificarse y revisarse al menos anualmente. El archivo editorial no autoriza conservar indefinidamente datos personales de los remitentes. Las futuras alertas mantienen los datos mientras dure el alta y, después, únicamente lo necesario para respetar la baja y acreditar su gestión.

Los 12 meses son una decisión organizativa para este sitio, no un plazo legal universal. Como referencia comparada, la [guía de conservación del ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/) vincula el plazo a la finalidad y la revisión periódica; no se ha utilizado para afirmar que la normativa británica sea aplicable al sitio.

La política debe aplicarse mediante la gestión de los buzones. Este cambio no configura borrado automático, no elimina mensajes ni crea recordatorios. Las copias de recuperación tienen condiciones distintas: [política de eliminación de Zoho](https://www.zoho.com/mail/help/data-deletion-policy.html) y [retención y archivo de Zoho](https://www.zoho.com/mail/help/adminconsole/ediscovery-setup.html). Las ventanas técnicas de [Netlify Observability](https://docs.netlify.com/manage/monitoring/observability/overview/) dependen del plan; no se promete un plazo técnico no comprobado en la cuenta.

## Verificación

- 13 pruebas aprobadas: contactos, visibilidad, dependencias, anclas, deduplicación, agrupación de requisitos y API local.
- Astro: cero errores y advertencias; 56 avisos informativos existentes.
- Compilaciones pública e institucional completadas; 797 y 804 HTML respectivamente. Navegación: 2.923 y 2.947 anclas, sin destinos de ancla faltantes.
- Inspección de las siete páginas servidas en 8766: sin listas obsoletas ni valores pendientes; identidad solo en Aviso legal y directorio solo en Contacto. Panel: aprobación marcada, identidad completa y controles agrupados. Vista móvil sin desbordamiento.
- Inspección de 803 archivos públicos generados: no contienen el nombre del responsable ni los correos de contacto mantenidos en modo local.
- Continúan desactivados la publicación institucional y el servicio de alertas. Las alertas todavía requieren proveedor, enlaces de gestión y comprobación del alta y la baja.
