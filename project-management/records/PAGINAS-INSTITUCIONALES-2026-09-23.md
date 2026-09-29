# Páginas institucionales y control de publicación

Implementación local; no se desplegó ni se envió a beta.

Actualización del 27 de septiembre: los cuatro correos acordados ya se integraron en un registro único y en el panel local. La descripción de pendientes de este registro refleja el estado del 23 de septiembre; consultar [la primera etapa de UI/UX](UI-UX-ETAPA-1-2026-09-27.md) para el estado actual.

## Un lugar de configuración

El Centro local ofrece «Páginas y funciones públicas» en `/sitio.html`. Todos los indicadores nuevos y el control existente de Ko-fi se guardan en `src/config/features.json`. Cada página tiene un indicador local y otro público independientes. Guardar no despliega nada. Los textos se mantienen una sola vez en `src/data/institutional.json` y se renderizan mediante una plantilla común.

Rutas: `/contacto/`, `/aviso-legal/`, `/privacidad/`, `/cookies/`, `/derechos/`, `/correcciones/` y `/suscripcion/`.

El pie y el sitemap consumen el mismo registro de páginas. Una ruta desactivada no se genera en la compilación pública; no depende de ocultar un enlace con CSS. Todas las nuevas páginas están inicialmente desactivadas para publicación y habilitadas en local. La vista institucional se marca noindex. La función de apoyo conserva sus indicadores anteriores.

## Uso local

- Centro: `node centro-local/server.mjs`, dirección `http://127.0.0.1:4322/sitio.html`.
- Vista con actualización automática: `npm run dev:institutional`, dirección `http://localhost:8766/`.
- Compilación local separada: `npm run build:institutional`, genera `dist-local/` (no versionado).
- Después de editar datos en el Centro, actualizar desarrollo o regenerar la compilación. La versión pública utiliza `npm run build`, sin modo institucional.

La API de edición es exclusiva del servidor local. Exige origen coincidente para guardar, valida los tipos y enlaces, rechaza cambios concurrentes y solo acepta claves existentes. No acepta rutas de archivos ni claves privadas de servicios.

## Qué está implementado y qué requiere datos externos

Están implementados el panel, los indicadores, las páginas, los enlaces de correo configurables, la presentación de los canales y la conexión mediante enlaces a un formulario de suscripción alojado por un proveedor. Las funciones de preferencias y baja usan la dirección del proveedor configurado. No se almacenan suscriptores en este repositorio ni se simulan altas. La vista local mantiene desactivada la captación.

Faltan el nombre del responsable, país, domicilio de contacto, correos reales, alojamiento, proveedor de correo y criterios de conservación. El correo institucional requiere crear y verificar los buzones y la configuración del dominio en el proveedor elegido: introducir una dirección en el panel no crea ese buzón.

Para suscripciones faltan proveedor, formulario de alta con temas, enlace de preferencias/baja y privacidad. Debe comprobarse en ese proveedor el ciclo de confirmación de alta y baja. Solo entonces se marca la verificación en el panel. No se eligió un proveedor, frecuencia de envío ni se contrataron servicios en nombre del usuario.

Los textos institucionales son borradores preparados para revisión local. La activación pública exige completar los datos y marcar su revisión. No se presupone jurisdicción ni se declara cumplimiento legal automático. Como referencia de estructura se consultó la guía de información por capas de la AEPD: https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/6-el-deber-de-informacion . Esa referencia no determina qué legislación corresponde al proyecto.

La página de cookies describe la implementación actual sin analítica publicitaria ni reproductores incrustados. No se instaló un banner de consentimiento sin servicios que lo requieran. Si se incorporan tecnologías nuevas, deben revisarse el inventario y los controles antes de activarlas.

## Comprobaciones

236 pruebas aprobadas, incluidos los controles de visibilidad, dependencias, origen de las solicitudes y rechazo de cambios concurrentes. Compilaciones pública e institucional completadas. Las siete rutas institucionales existen solo en `dist-local`, con noindex; están ausentes de `dist` y del sitemap público. Guardado real del panel y vista de suscripción desactivada comprobados en el navegador. Los envíos reales de correo, la confirmación y la baja no pueden probarse hasta configurar el proveedor.
