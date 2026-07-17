# 14. Resolución de problemas

## El sitio no arranca

1. Confirmar que la terminal está en la raíz.
2. Ejecutar `node -v`; debe cumplir `>=22.12.0`.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev`.
5. Si el puerto 4321 está ocupado, Astro ofrecerá otro; usar la URL indicada.

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

Después ejecutar un nuevo build. La ventana temporal no cambia por sí sola en `dist`.

## El enlace “Para profundizar” devuelve 404

El campo `vinculo` debe coincidir exactamente con el nombre del archivo en `src/content/profundidad`, sin `.md`.

Ejemplo:

```yaml
vinculo: 'nato-ankara2026'
```

requiere:

```text
src/content/profundidad/nato-ankara2026.md
```

## Faltan iconos en artículos o directorio

La librería Phosphor se carga solamente en `src/pages/index.astro`. Es una limitación conocida. La solución estructural es cargar iconos globalmente o empaquetarlos, no duplicar un `<script>` arbitrariamente en cada página.

## La previsualización social no muestra imagen

`Layout.astro` usa `/default-og.png`, pero el archivo no existe en la instantánea. Crear un recurso válido en `public/` y verificar URL absoluta.

## `/ensayos/` se ve vacío

La página de paginación está incompleta y no renderiza `page.data`. Los ensayos individuales sí existen.

## “Para profundizar” o “Análisis a fondo” del header no abre una sección

Esos enlaces apuntan a rutas todavía no implementadas. No confundirlos con los vínculos dentro de tarjetas, que usan `/profundidad/<slug>` y `/ensayos/<id>`.

## El directorio muestra “No se pudo cargar el conjunto de datos”

Verificar que:

- `src/data/medios.json` es JSON válido;
- tiene `records` como array;
- `directorio.astro` serializa `window.MEDIA_DASHBOARD_DATA`;
- `/js/directorio.js` se copia desde `public/js`.

## Los filtros del directorio muestran cero resultados al abrir una URL compartida

Eliminar query parameters y volver a probar. La versión actual no valida valores ni claves de orden recibidas por URL.

## Excel y web muestran datos distintos

La web usa `src/data/medios.json`; la descarga usa `public/data/Medios_Geopolitica.xlsx`. No hay sincronización automática incluida. Actualizar ambos mediante el proceso externo vigente o, preferentemente, implementar el generador propuesto.

## “Hoy” o “Ayer” están desactualizados

Las etiquetas se calculan al construir. Ejecutar y desplegar un build nuevo o cambiar la lógica a tiempo de cliente.

## Netlify publica, pero buscadores no encuentran el sitio

Revisar `robots.txt`: actualmente contiene `Disallow: /`.
