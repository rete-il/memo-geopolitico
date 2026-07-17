# 12. Build, preview y Netlify

## 12.1 Configuración actual de Astro

```js
export default defineConfig({
  site: 'https://memogeopolitico.com',
  vite: { plugins: [tailwindcss()] },
});
```

No se configura adapter; la salida observada es estática.

## 12.2 Artefacto de producción

`npm run build` crea `dist/`. Netlify debería publicar esa carpeta.

Configuración mínima prevista:

| Campo | Valor |
|---|---|
| Base directory | raíz del proyecto |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node | versión compatible con `>=22.12.0` |

## 12.3 Configuración recomendada en `netlify.toml`

Ejemplo para la fase de publicación:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Frame-Options = "SAMEORIGIN"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

La Content Security Policy requiere inventariar Google Fonts, unpkg y CARTO antes de fijarla.

## 12.4 Bloqueadores antes de desplegar

- `robots.txt` bloquea todo el sitio.
- `/default-og.png` no existe.
- dos enlaces del Header terminan en 404.
- `/ensayos/` está vacío.
- `/profundidad/indo-pacifico/` es placeholder.
- Ko-fi usa `tu_usuario`.
- iconos faltan fuera de portada.
- no existe 404 personalizada.
- no se verificó dominio, HTTPS, DNS ni configuración de Netlify.

## 12.5 Previsualización de deploy

Una vez conectado un repositorio, usar Deploy Previews de Netlify para cada pull request. El control mínimo debería abrir:

- `/`;
- `/directorio/`;
- `/ensayos/`;
- un ensayo;
- una profundidad;
- una URL inexistente;
- viewport de escritorio y móvil.

## 12.6 Contenido temporal y frecuencia de build

Como “Hoy/Ayer” y el TTL del mapa se calculan en build, la frecuencia de despliegue afecta la exactitud de la portada. Opciones:

- reconstruir cada vez que se publica o cambia una alerta;
- ejecutar un build programado diario;
- mover el cálculo de tiempo al cliente;
- introducir una fuente dinámica/API en una fase posterior.

## 12.7 Versionado de Node

Además de `engines`, conviene agregar uno de estos mecanismos:

- `.nvmrc`;
- `.node-version`;
- `NODE_VERSION` en Netlify.

Así se evita que desarrollo y producción usen runtimes diferentes.
