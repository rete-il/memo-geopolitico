# 15. Deuda técnica priorizada

## 15.1 Escala

- **P0:** error visible o riesgo inmediato en producción.
- **P1:** riesgo alto de SEO, accesibilidad, seguridad, datos o mantenimiento.
- **P2:** mejora necesaria para escalar.
- **P3:** optimización o refinamiento.

## 15.2 Backlog

| ID | Prioridad | Área | Hallazgo | Impacto | Esfuerzo estimado |
|---|---|---|---|---|---|
| DT-001 | P0 | Navegación | `/profundizar` y `/analisis` no existen | 404 desde navegación principal publicada | Bajo/medio |
| DT-002 | P0 | Contenido | `/ensayos/` está vacío | Sección publicada sin contenido útil | Medio |
| DT-003 | P0 | Contenido | `indo-pacifico.md` es placeholder fuera de colección | Página pública inconsistente | Bajo |
| DT-004 | P0 | Conversión | Ko-fi usa `tu_usuario` | Enlace inválido o no operativo | Bajo |
| DT-005 | P1 | Indexación | `robots.txt` está fuera de `public/` y su contenido fuente bloquea todo | Política de rastreo ausente o peligrosa al copiar | Bajo |
| DT-006 | P1 | Assets | Falta `default-og.png` | Previews sociales rotas | Bajo |
| DT-007 | P1 | UI | Phosphor se carga solo en portada | Iconos ausentes en otras rutas | Bajo/medio |
| DT-008 | P1 | Responsive | Header no tiene menú móvil | Navegación puede desbordar | Medio |
| DT-009 | P1 | SEO | Profundidad no pasa metadata al Layout | Metadata genérica | Bajo |
| DT-010 | P1 | Datos | Excel y JSON sin sincronización | Divergencia de fuente de verdad | Medio/alto |
| DT-011 | P1 | QA | Sin `astro check`, lint, tests, crawler o CI documentada | Regresiones no detectadas | Medio |
| DT-012 | P1 | Accesibilidad | Modal sin focus trap/retorno de foco | Navegación de teclado incompleta | Medio |
| DT-013 | P1 | Semántica | Header usa `<h1>` en todas las páginas | Jerarquía de headings deficiente | Bajo |
| DT-014 | P1 | Temporalidad | Fechas relativas y TTL congelados por build | Información potencialmente obsoleta | Medio |
| DT-015 | P1 | Dependencias | Leaflet e iconos por CDN sin fallback/SRI | Fallo externo afecta funciones | Medio |
| DT-016 | P1 | Producción | Logs de deploy públicos | Exposición innecesaria de información de build | Bajo |
| DT-017 | P1 | Seguridad | Sin cabeceras versionadas ni CSP evaluada | Endurecimiento incompleto | Medio |
| DT-018 | P1 | Operación | Configuración Netlify principalmente en UI | Menor reproducibilidad y trazabilidad | Bajo/medio |
| DT-019 | P2 | Arquitectura | `directorio.astro` tiene 985 líneas | Alto costo de cambio | Alto |
| DT-020 | P2 | Arquitectura | `directorio.js` tiene 602 líneas y no es TS | Tipado y pruebas limitados | Alto |
| DT-021 | P2 | Tipado | Props y Leaflet usan `any` | Errores en runtime | Medio |
| DT-022 | P2 | Design system | Tokens duplicados en CSS, TS y templates | Inconsistencia visual | Medio |
| DT-023 | P2 | Configuración | Tailwind definido en CSS y config paralela | Dos fuentes de verdad | Bajo |
| DT-024 | P2 | Contenido | Slugs mezclan guiones y guiones bajos | Convención inestable; ya requiere redirects | Medio |
| DT-025 | P2 | Datos | JSON de catalizadores, escenarios y fricción sin consumidores | Código/datos huérfanos | Bajo |
| DT-026 | P2 | Docs | README raíz sigue siendo starter | Onboarding deficiente | Bajo |
| DT-027 | P2 | SEO | Sin sitemap, RSS, JSON-LD ni 404 | Descubrimiento y UX incompletos | Medio |
| DT-028 | P2 | Editorial | Severidad y monitor sin metodología publicada | Credibilidad difícil de auditar | Medio |
| DT-029 | P2 | Baseline | Snapshot local y commit desplegado no son idénticos | Inventario puede quedar desfasado | Bajo |
| DT-030 | P3 | UX | Lista de alertas oculta scrollbar | Menor descubribilidad | Bajo |
| DT-031 | P3 | Contenido | Sin navegación entre artículos | Menor exploración | Bajo/medio |
| DT-032 | P3 | Limpieza | `index.html` legado y `time.ts` no usado | Confusión y superficie innecesaria | Bajo |
| DT-033 | P3 | Dominio | Alias beta pendiente sin uso | Advertencia operativa y ruido documental | Bajo |

## 15.3 Cambios respecto de la versión 1.0

- La publicación ya no es pendiente: está verificada.
- La deuda de navegación y placeholders aumenta de urgencia porque es visible públicamente.
- El antiguo hallazgo “robots bloquea todo” se corrige: el archivo está fuera de `public/`, por lo que el riesgo real es **ausencia de política publicada** y bloqueo futuro si se copia sin editar.
- Se añaden reproducibilidad de Netlify, logs públicos, cabeceras y divergencia de baseline.

## 15.4 Riesgos que no deben resolverse sin decisión

- Cambiar slugs puede romper enlaces ya publicados; crear redirects primero.
- Eliminar `index.html` puede perder referencia de diseño; archivarlo antes.
- Unificar Excel/JSON exige decidir quién edita y cuál es la fuente canónica.
- Mover cálculo temporal al cliente cambia SEO y comportamiento sin JavaScript.
- Sustituir CDNs puede aumentar bundle; medir antes y después.
- HSTS con `includeSubDomains` no debe activarse mientras existan subdominios deliberadamente inactivos.

## 15.5 Definition of Done para deuda

Una deuda se cierra cuando:

- el código está implementado;
- existe prueba o procedimiento de verificación;
- la documentación está actualizada;
- no rompe rutas o datos;
- se verificó build y preview;
- se verificó Deploy Preview o published deploy;
- si afecta UI, se comparó desktop y móvil;
- si cambia URL, existe redirect y prueba HTTP.
