# 15. Deuda técnica priorizada

## 15.1 Escala

- **P0:** bloquea publicación o causa ruta rota visible.
- **P1:** riesgo alto de mantenimiento, SEO, accesibilidad o datos.
- **P2:** mejora necesaria para escalar.
- **P3:** optimización o refinamiento.

## 15.2 Backlog

| ID | Prioridad | Área | Hallazgo | Impacto | Esfuerzo estimado |
|---|---|---|---|---|---|
| DT-001 | P0 | Navegación | `/profundizar` y `/analisis` no existen | 404 desde navegación principal | Bajo/medio |
| DT-002 | P0 | Indexación | `robots.txt` bloquea todo | Sitio invisible para buscadores | Bajo |
| DT-003 | P0 | Contenido | `/ensayos/` está vacío | Sección principal incompleta | Medio |
| DT-004 | P0 | Contenido | `indo-pacifico.md` es placeholder fuera de colección | Página inconsistente y potencialmente pública | Bajo |
| DT-005 | P0 | Conversión | Ko-fi usa `tu_usuario` | Enlace inválido/ajeno | Bajo |
| DT-006 | P1 | Assets | Falta `default-og.png` | Previews sociales rotas | Bajo |
| DT-007 | P1 | UI | Phosphor se carga solo en portada | Iconos ausentes en otras rutas | Bajo/medio |
| DT-008 | P1 | Responsive | Header no tiene menú móvil | Navegación puede desbordar | Medio |
| DT-009 | P1 | SEO | Profundidad no pasa metadata al Layout | Metadata genérica | Bajo |
| DT-010 | P1 | Datos | Excel y JSON sin sincronización | Divergencia de fuente de verdad | Medio/alto |
| DT-011 | P1 | QA | Sin `astro check`, lint, tests o CI | Regresiones no detectadas | Medio |
| DT-012 | P1 | Accesibilidad | Modal sin focus trap/retorno de foco | Navegación de teclado incompleta | Medio |
| DT-013 | P1 | Semántica | Header usa `<h1>` en todas las páginas | Jerarquía de headings deficiente | Bajo |
| DT-014 | P1 | Temporalidad | Fechas relativas y TTL congelados por build | Información potencialmente obsoleta | Medio |
| DT-015 | P1 | Dependencias | Leaflet e iconos por CDN sin fallback/SRI | Fallo externo afecta funciones | Medio |
| DT-016 | P2 | Arquitectura | `directorio.astro` tiene 985 líneas | Alto costo de cambio | Alto |
| DT-017 | P2 | Arquitectura | `directorio.js` tiene 602 líneas y no es TS | Tipado y pruebas limitados | Alto |
| DT-018 | P2 | Tipado | Props y Leaflet usan `any` | Errores en runtime | Medio |
| DT-019 | P2 | Design system | Tokens duplicados en CSS, TS y templates | Inconsistencia visual | Medio |
| DT-020 | P2 | Configuración | Tailwind definido en CSS y config legacy | Dos fuentes de verdad | Bajo |
| DT-021 | P2 | Contenido | Slugs mezclan guiones y guiones bajos | Convención inestable | Medio antes de publicar |
| DT-022 | P2 | Datos | JSON de catalizadores, escenarios y fricción sin consumidores | Código/datos huérfanos | Bajo |
| DT-023 | P2 | Docs | README sigue siendo starter | Onboarding deficiente | Bajo |
| DT-024 | P2 | SEO | Sin sitemap, RSS, JSON-LD ni 404 | Descubrimiento y UX incompletos | Medio |
| DT-025 | P2 | Editorial | Severidad y monitor sin metodología publicada | Credibilidad difícil de auditar | Medio |
| DT-026 | P3 | UX | Lista de alertas oculta scrollbar | Menor descubribilidad | Bajo |
| DT-027 | P3 | Contenido | Sin navegación entre artículos | Menor exploración | Bajo/medio |
| DT-028 | P3 | Limpieza | `index.html` legado y `time.ts` no usado | Confusión y superficie innecesaria | Bajo |

## 15.3 Riesgos que no deben “arreglarse” sin decisión

- Cambiar slugs puede romper enlaces futuros; definir política y redirects primero.
- Eliminar `index.html` puede perder referencia de diseño; archivarlo antes.
- Unificar Excel/JSON exige decidir quién edita y cuál es la fuente canónica.
- Mover cálculo temporal al cliente cambia SEO y comportamiento sin JavaScript.
- Sustituir CDNs puede aumentar bundle; medir antes y después.

## 15.4 Definition of Done para deuda

Una deuda se cierra cuando:

- el código está implementado;
- existe prueba o procedimiento de verificación;
- documentación actualizada;
- no rompe rutas o datos;
- se verificó build y preview;
- si afecta UI, se comparó desktop y móvil.
