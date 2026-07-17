# 13. SEO, accesibilidad y rendimiento

## 13.1 SEO

### Implementado

- idioma español;
- título y description básicos;
- canonical absoluto basado en `Astro.site`;
- Open Graph y Twitter Card;
- URL de sitio configurada como `https://memogeopolitico.com`;
- dominio `www` redirigido al dominio canónico;
- HTTPS operativo.

### Riesgos actuales

| Hallazgo | Impacto | Prioridad |
|---|---|---|
| `robots.txt` está fuera de `public/` | Puede no publicarse; no existe política de rastreo verificable | Alta |
| El contenido del archivo fuente dice `Disallow: /` | Si se mueve sin corregir, bloquearía todo el sitio | Crítica al implementar |
| `default-og.png` ausente | Preview social rota o 404 | Alta |
| Profundidad usa metadata genérica | Títulos/descripciones incorrectos | Alta |
| `og:type` siempre `website` | Semántica de artículos incompleta | Media |
| Sin sitemap ni RSS | Descubrimiento limitado | Media |
| Sin datos estructurados | Menor riqueza semántica | Media |
| Slugs con guiones bajos | Legibilidad menor; ya requieren redirects si cambian | Media |
| Página de archivo vacía | Ruta indexable sin valor | Alta |
| Dominio técnico Netlify disponible | Riesgo menor de duplicidad si canonical falla | Baja |

### Acción correcta para `robots.txt`

No copiar el archivo actual a `public/` sin editarlo. Crear `public/robots.txt` con una política de producción, por ejemplo:

```text
User-agent: *
Allow: /
Sitemap: https://memogeopolitico.com/sitemap-index.xml
```

Primero debe existir un sitemap real. Verificar después que el archivo quede dentro de `dist/` y responda desde el dominio.

### Recomendaciones

- crear componente `Seo.astro` o ampliar Layout;
- añadir `article:published_time`, `article:author`, `og:locale`;
- usar `name` para metadatos Twitter;
- generar sitemap y feed;
- definir canonical y redirects para slugs;
- crear imagen social por defecto y por artículo;
- añadir noindex a placeholders hasta retirarlos;
- registrar el sitio en Google Search Console y Bing Webmaster Tools después de corregir robots/sitemap.

## 13.2 Accesibilidad

### Fortalezas

- `lang="es"`;
- etiquetas asociadas a inputs del directorio;
- skip link en el directorio;
- foco visible en el directorio;
- `aria-live` para filtros y toast;
- botones reales para ordenar y paginar;
- `aria-label` en el vínculo “Para profundizar”.

### Problemas

- Header no se adapta a móvil ni ofrece control de menú.
- La marca usa `<h1>` además del título principal de la página.
- Iconos dependen de una librería ausente en varias rutas.
- Interacción mapa–tarjeta depende de hover/mouse.
- Marcadores no tienen alternativa de teclado explícita ni texto accesible.
- Modal no tiene focus trap ni restauración de foco.
- Scrollbar de alertas está oculto, reduciendo la señal de contenido adicional.
- Donuts y barras no tienen descripción semántica de gráfico, aunque la leyenda contiene datos.
- Tabla ancha exige scroll horizontal en móvil.
- No se comprobó contraste en tema oscuro ni zoom al 200 %.

### Prioridades

1. navegación móvil y jerarquía de headings;
2. dialog accesible;
3. foco de tarjetas y mapa;
4. pruebas de teclado;
5. auditoría de contraste y lector de pantalla.

## 13.3 Rendimiento

### Fortalezas

- salida estática;
- deploy pequeño: la evidencia indica aproximadamente 422,8 KB en el artefacto mostrado;
- pocas dependencias de runtime;
- contenido principal renderizado en HTML;
- directorio filtra en cliente un conjunto limitado de filas;
- build de producción de 13 segundos en la evidencia Netlify.

### Riesgos

- Google Fonts, Phosphor, Leaflet, MarkerCluster y tiles requieren red externa;
- la portada carga scripts cartográficos de inmediato;
- no hay precarga ni fallback local;
- `medios.json` completo se serializa en HTML y luego el script renderiza la tabla;
- `directorio.astro` incluye CSS extenso en la página;
- no hay mediciones de Core Web Vitals;
- mapa y fuentes pueden provocar cambios visuales o demoras.

### Recomendaciones

- ejecutar Lighthouse móvil y escritorio sobre el published deploy;
- medir LCP, CLS, INP y TTFB;
- empaquetar dependencias críticas cuando el beneficio esté medido;
- cargar mapa de forma diferida con placeholder estable;
- usar fuentes locales o reducir variantes;
- extraer y minificar CSS del directorio mediante el pipeline;
- definir presupuesto: JavaScript, CSS, imágenes y tiempo de interacción.

## 13.4 Seguridad y privacidad

### Situación observada

- HTTPS y certificado gestionado están activos.
- `escapeHtml` y `safeUrl` son buenas defensas en el directorio.
- Los enlaces externos usan `noopener noreferrer` en varias vistas.
- Los logs de deploy están configurados como públicos.
- No existe `netlify.toml` ni `_headers` en la instantánea para cabeceras de seguridad.
- Los CDNs no usan SRI.
- Los tiles del mapa y Google Fonts reciben solicitudes del navegador del visitante.

### Recomendaciones

- cambiar deploy log visibility a privado si no se necesita acceso público;
- añadir `X-Content-Type-Options`, `Referrer-Policy` y protección de framing;
- preparar CSP en modo `Report-Only` antes de imponerla;
- evaluar HSTS solo cuando todos los subdominios se sirvan correctamente por HTTPS;
- no aplicar `includeSubDomains` mientras `beta` u otros subdominios puedan permanecer inactivos;
- prevenir spreadsheet formula injection en la exportación CSV si los datos se vuelven editables por terceros;
- documentar terceros y privacidad: Google Fonts, CARTO, OpenStreetMap, unpkg y Ko-fi.

## 13.5 Validaciones pendientes en producción

- respuesta y contenido de `/robots.txt`;
- existencia de sitemap;
- estado de `/default-og.png`;
- metadata efectiva de cada tipo de página;
- cabeceras HTTP y caché;
- 404 real;
- Lighthouse y accesibilidad automatizada;
- pruebas con JavaScript deshabilitado, especialmente en el directorio y mapa.
