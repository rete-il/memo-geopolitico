# 13. SEO, accesibilidad y rendimiento

## 13.1 SEO

### Implementado

- idioma español;
- título y description básicos;
- canonical absoluto;
- Open Graph y Twitter Card;
- URL de sitio configurada.

### Riesgos

| Hallazgo | Impacto | Prioridad |
|---|---|---|
| `robots.txt` bloquea `/` | Ninguna página será indexada | Crítica antes del lanzamiento |
| `default-og.png` ausente | Preview social rota | Alta |
| Profundidad usa metadata genérica | Títulos/descripciones incorrectos | Alta |
| `og:type` siempre `website` | Semántica de artículos incompleta | Media |
| Sin sitemap ni RSS | Descubrimiento limitado | Media |
| Sin datos estructurados | Menor riqueza semántica | Media |
| Slugs con guiones bajos | Legibilidad menor | Baja antes de publicar; alta si se cambia después |
| Página de archivo vacía | Ruta indexable sin valor | Alta |

### Recomendaciones

- crear componente `Seo.astro` o ampliar Layout;
- añadir `article:published_time`, `article:author`, `og:locale`;
- usar `name` para metadatos Twitter;
- generar sitemap y feed;
- definir canonical y redirects para slugs;
- crear imagen social por defecto y por artículo.

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
- pocas dependencias de runtime;
- contenido principal renderizado en HTML;
- directorio filtra en cliente solo 92 filas;
- build rápido en la comprobación.

### Riesgos

- Google Fonts, Phosphor, Leaflet, MarkerCluster y tiles requieren red externa;
- la portada carga todos los scripts cartográficos de inmediato;
- no hay precarga ni fallback local;
- `medios.json` completo se serializa en HTML y luego el script renderiza la tabla;
- `directorio.astro` incluye CSS extenso en la página;
- no hay mediciones de Core Web Vitals;
- mapa y fonts pueden provocar cambios visuales o demoras.

### Recomendaciones

- empaquetar dependencias críticas;
- cargar mapa de forma diferida con placeholder estable;
- usar fuentes locales o reducir variantes;
- extraer y minificar CSS del directorio mediante el pipeline;
- evaluar virtualización solo si el dataset crece significativamente;
- ejecutar Lighthouse en preview y deploy.

## 13.4 Seguridad y privacidad

- `escapeHtml` y `safeUrl` son buenas defensas en el directorio.
- Los enlaces externos usan `noopener noreferrer` en varias vistas.
- Falta CSP y cabeceras de seguridad.
- Los CDNs no usan SRI.
- Los tiles del mapa y Google Fonts reciben solicitudes del navegador del visitante.
- La exportación CSV debería prevenir spreadsheet formula injection si los datos dejan de ser plenamente confiables.
