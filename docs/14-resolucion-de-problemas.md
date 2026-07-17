# 14. Resolución de problemas

## El sitio no arranca localmente

1. Confirmar que la terminal está en la raíz.
2. Ejecutar `node -v`; debe cumplir `>=22.12.0`.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev`.
5. Si el puerto 4321 está ocupado, usar la URL que indique Astro.

## `npm run check` muestra “Missing script”

Es el comportamiento esperado en la versión actual. El script no está definido. Use `npm run` para ver comandos disponibles. Se añadirá validación en la modularización.

## El build falla al sincronizar contenido

Revisar el frontmatter contra `src/content.config.ts`:

- campo obligatorio ausente;
- severidad fuera del enum;
- fecha inválida;
- coordenadas con forma incorrecta;
- URL inválida dentro de `sources`.

## Una alerta aparece en la lista, pero no en el mapa

Comprobar:

- `en_mapa` no es `false`;
- la fecha está dentro de 14 días respecto del último build;
- coordenadas válidas;
- CDN de Leaflet cargó;
- consola sin error `L is not defined`.

Después ejecutar un nuevo build y deploy. La ventana temporal no cambia por sí sola en `dist`.

## El enlace “Para profundizar” devuelve 404

El campo `vinculo` debe coincidir exactamente con el nombre del archivo en `src/content/profundidad`, sin `.md`.

```yaml
vinculo: 'nato-ankara2026'
```

requiere:

```text
src/content/profundidad/nato-ankara2026.md
```

## Los enlaces principales “Para profundizar” o “Análisis a fondo” devuelven 404

No dependen del frontmatter. Están codificados en `Header.astro` como `/profundizar` y `/analisis`, pero esas rutas no existen. Corregir el header o crear las páginas correspondientes y verificar un Deploy Preview antes de publicar.

## Faltan iconos en artículos o directorio

La librería Phosphor se carga solamente en `src/pages/index.astro`. La solución estructural es cargar iconos globalmente o empaquetarlos, no duplicar un `<script>` arbitrariamente en cada página.

## La previsualización social no muestra imagen

`Layout.astro` usa `/default-og.png`, pero el archivo no existe en la instantánea. Crear el recurso en `public/default-og.png`, ejecutar build y comprobar que aparezca en el Deploy file browser.

## `/ensayos/` se ve vacío

La página de paginación no renderiza `page.data`. Los ensayos individuales sí existen.

## El directorio muestra “No se pudo cargar el conjunto de datos”

Verificar que:

- `src/data/medios.json` es JSON válido;
- tiene `records` como array;
- `directorio.astro` serializa `window.MEDIA_DASHBOARD_DATA`;
- `/js/directorio.js` se copia desde `public/js`.

## Los filtros del directorio muestran cero resultados al abrir una URL compartida

Eliminar query parameters y volver a probar. La versión actual no valida todos los valores ni claves de orden recibidas por URL.

## Excel y web muestran datos distintos

La web usa `src/data/medios.json`; la descarga usa `public/data/Medios_Geopolitica.xlsx`. No hay sincronización automática incluida. Actualizar ambos mediante el proceso externo vigente o implementar el generador propuesto.

## “Hoy” o “Ayer” están desactualizados

Las etiquetas se calculan al construir. Ejecutar y desplegar un build nuevo o cambiar la lógica a tiempo de cliente.

## Netlify informa deploy exitoso, pero el cambio no aparece

1. confirmar que el deploy es `Published`, no solo `Production deploy` sin publicar;
2. verificar que corresponde a la rama `main` y al commit esperado;
3. abrir el permalink del deploy;
4. limpiar caché del navegador o usar ventana privada;
5. revisar si el published deploy está bloqueado mediante `Lock to stop auto publishing`;
6. comprobar que el archivo modificado esté dentro de `dist`.

## Un archivo existe en el repositorio, pero devuelve 404 en producción

Netlify publica solo `dist`. En Astro, los assets estáticos deben estar en `public/` o ser generados por una página/integración. Archivos como `robots.txt` ubicados en la raíz no se copian automáticamente por la configuración observada.

## El certificado HTTPS muestra un dominio inactivo

El certificado puede incluir aliases configurados. En esta instalación, `beta.memogeopolitico.com` figura en el certificado aunque su DNS esté pendiente. Mientras no se use:

- mantenerlo documentado como inactivo; o
- retirarlo de `Production domains` si se desea eliminar la advertencia.

No pulsar “Renew certificate” como primera medida si `memogeopolitico.com` y `www` funcionan correctamente.

## El deploy de producción rompe el sitio

1. abrir `Deploys`;
2. elegir el último deploy exitoso anterior;
3. revisar su permalink;
4. usar `Publish deploy`;
5. si es necesario, bloquear auto-publishing temporalmente;
6. corregir en una rama y validar con Deploy Preview.

## Buscadores no encuentran el sitio

Revisar, en este orden:

1. que `/robots.txt` exista realmente en producción;
2. que no contenga `Disallow: /`;
3. que el sitemap exista y esté referenciado;
4. canonical correcto;
5. páginas sin `noindex` accidental;
6. Search Console y sitemap enviados;
7. esperar el proceso normal de rastreo e indexación.
