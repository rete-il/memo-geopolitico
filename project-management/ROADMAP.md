# Roadmap maestro

> Archivo generado desde `data/releases.json` y `data/work-items.json`.

| Secuencia | Release | Objetivo | Avance | Estado |
|---:|---|---|---:|---|
| 0 | Beta 0 — Baseline, seguridad y control | Consolidar documentación, rama de trabajo, reproducibilidad y correcciones P0/P1 antes del refactor visual. | 72% | Actual |
| 1 | Beta 1 — Fundamentos y sistema de diseño | Crear contratos, tokens, componentes UI y shell de sitio reutilizable. | 0% | Planificada |
| 2 | Beta 2 — Navegación, menú y regiones | Implementar arquitectura regional, menú hamburguesa, mega-menú y páginas regionales dinámicas. | 0% | Planificada |
| 3 | Beta 3 — Monitor y Fricción vs. Narrativa | Convertir la columna prototipada en un módulo editorial trazable e integrar mapa, alertas y regiones. | 0% | Planificada |
| 4 | Beta 4 — Experiencia editorial | Normalizar análisis, ensayos, fuentes, metadatos, navegación relacionada y lectura extensa. | 0% | Planificada |
| 5 | Beta 5 — Directorio modular | Separar presentación, lógica y datos del Directorio y mejorar filtros, móvil y accesibilidad. | 0% | Planificada |
| 6 | Beta 6 — QA, rendimiento y preparación de release | Cerrar calidad, accesibilidad, seguridad, rendimiento y documentación antes de fusionar a main. | 0% | Planificada |
| 99 | Futuro — Capacidades posteriores | Funciones no bloqueantes para el reacondicionamiento inicial. | 0% | Planificada |

## Beta 0 — Baseline, seguridad y control

**Objetivo:** Consolidar documentación, rama de trabajo, reproducibilidad y correcciones P0/P1 antes del refactor visual.  
**Fecha objetivo:** TBD  
**Avance:** 72%

### Criterios de salida

- [ ] Rama beta confirmada y vinculada a origin/beta.
- [ ] Build reproducible con versión de Node documentada.
- [ ] Rutas críticas, SEO básico y assets sociales corregidos.
- [ ] astro check disponible y sin errores bloqueantes.
- [ ] Baseline visual y técnico registrado.

### Work items

| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |
|---|---|---|---|---|---|
| PM-001 | PM | P0 | ✓ Terminada | S | Separar documentación del estado actual y documentación de proyecto |
| PM-002 | PM | P0 | ✓ Terminada | M | Crear sistema dinámico de project management |
| PM-003 | OPS | P0 | ✓ Terminada | XS | Confirmar rama beta local y upstream origin/beta |
| PM-004 | PM | P0 | ✓ Terminada | XS | Integrar project-management/ en la rama beta |
| DOC-001 | DOC | P0 | ✓ Terminada | S | Incorporar documentación técnica v2 al repositorio |
| OPS-001 | OPS | P0 | ✓ Terminada | S | Registrar baseline de Netlify y producción |
| OPS-002 | OPS | P1 | ◉ Lista | XS | Versionar Node con .nvmrc o .node-version |
| OPS-003 | OPS | P1 | ◉ Lista | S | Versionar configuración Netlify en netlify.toml |
| QA-001 | QA | P0 | ✓ Terminada | S | Agregar astro check y dependencias necesarias |
| FIX-001 | FIX | P0 | ✓ Terminada | S | Corregir rutas inexistentes del encabezado |
| FIX-002 | FIX | P0 | ✓ Terminada | M | Completar el índice /ensayos/ |
| FIX-003 | FIX | P0 | ◉ Lista | S | Retirar o normalizar placeholder Indo-Pacífico |
| FIX-004 | FIX | P0 | ◉ Lista | XS | Corregir o retirar CTA Ko-fi provisional |
| SEO-001 | SEO | P1 | ◉ Lista | S | Crear default-og.png y validar Open Graph |
| SEO-002 | SEO | P1 | ◉ Lista | M | Publicar robots.txt seguro y sitemap |
| UX-001 | UX | P1 | ◉ Lista | S | Crear página 404 coherente con la marca |
| A11Y-001 | A11Y | P1 | ○ Propuesta | M | Registrar auditoría de teclado, contraste y headings |
| UI-001 | FIX | P1 | ◉ Lista | S | Cargar iconografía globalmente o empaquetarla |
| PMAPP-001 | PMAPP | P0 | ✓ Terminada | S | Definir arquitectura del dashboard local |
| PMAPP-002 | PMAPP | P0 | ✓ Terminada | M | Crear servidor local restringido a 127.0.0.1 |
| PMAPP-003 | PMAPP | P0 | ✓ Terminada | M | Implementar lectura y resumen de datos canónicos |
| PMAPP-004 | PMAPP | P0 | ✓ Terminada | L | Implementar editor de work items |
| PMAPP-005 | PMAPP | P0 | ✓ Terminada | M | Implementar validación y dependencias circulares |
| PMAPP-006 | PMAPP | P0 | ✓ Terminada | S | Integrar regeneración automática de Markdown |
| PMAPP-007 | PMAPP | P0 | ✓ Terminada | M | Implementar releases y registro de actividad |
| PMAPP-008 | PMAPP | P0 | ✓ Terminada | S | Implementar copias de seguridad locales |
| PMAPP-009 | PMAPP | P0 | ✓ Terminada | S | Validar dashboard local en Windows y documentar resultados |
| QA-004 | QA | P1 | ✓ Terminada | M | Reducir hints de Astro Check |

## Beta 1 — Fundamentos y sistema de diseño

**Objetivo:** Crear contratos, tokens, componentes UI y shell de sitio reutilizable.  
**Fecha objetivo:** TBD  
**Avance:** 0%

### Criterios de salida

- [ ] Tokens visuales centralizados.
- [ ] Componentes base documentados y accesibles.
- [ ] Layout, header y SEO desacoplados.
- [ ] Tipos principales y validaciones incorporados.

### Work items

| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |
|---|---|---|---|---|---|
| IA-001 | UX | P0 | ◉ Lista | M | Aprobar arquitectura editorial Monitor/Análisis/Ensayos/Directorio/Regiones |
| DS-001 | REF | P1 | ○ Propuesta | L | Centralizar tokens de color, espacio, tipografía y capas |
| DS-002 | REF | P1 | ○ Propuesta | M | Definir escala tipográfica editorial e interfaz |
| DS-003 | FEAT | P1 | ○ Propuesta | L | Crear Container, Button, Badge, Card y SectionHeader |
| DS-004 | FEAT | P1 | ○ Propuesta | L | Crear Drawer, Modal, Tooltip y estados de interfaz |
| REF-001 | REF | P1 | ○ Propuesta | L | Extraer SiteHeader, SiteFooter y Seo |
| TYPE-001 | REF | P1 | ○ Propuesta | L | Crear contratos TypeScript para contenido, mapa, monitor y directorio |
| DATA-001 | REF | P1 | ○ Propuesta | L | Validar JSON y frontmatter con esquemas |
| A11Y-002 | A11Y | P1 | ○ Propuesta | M | Definir patrones de foco, teclado y reduced motion |

## Beta 2 — Navegación, menú y regiones

**Objetivo:** Implementar arquitectura regional, menú hamburguesa, mega-menú y páginas regionales dinámicas.  
**Fecha objetivo:** TBD  
**Avance:** 0%

### Criterios de salida

- [ ] Taxonomía regional aprobada y centralizada.
- [ ] Menú móvil accesible y mega-menú de escritorio funcional.
- [ ] Rutas regionales generadas dinámicamente.
- [ ] Al menos una página funcional por macroregión.
- [ ] Datos e interpretación editorial claramente diferenciados.

### Work items

| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |
|---|---|---|---|---|---|
| REG-001 | FEAT | P0 | ○ Propuesta | L | Aprobar taxonomía de regiones, subregiones y teatros |
| REG-002 | REF | P0 | ○ Propuesta | M | Crear fuente central src/config/regions.ts |
| REG-003 | FEAT | P0 | ○ Propuesta | L | Crear índice /regiones/ y rutas dinámicas |
| REG-004 | FEAT | P0 | ○ Propuesta | XL | Crear plantilla regional con datos e interpretación separados |
| NAV-001 | FEAT | P0 | ○ Propuesta | L | Implementar menú hamburguesa móvil accesible |
| NAV-002 | FEAT | P1 | ○ Propuesta | L | Implementar mega-menú regional de escritorio |
| NAV-003 | FEAT | P1 | ○ Propuesta | M | Crear acordeones regionales y estado activo |
| NAV-004 | FEAT | P1 | ○ Propuesta | M | Crear breadcrumbs compartidos |
| REG-005 | CONTENT | P1 | ○ Propuesta | XL | Crear contenido mínimo para Europa y subregiones prioritarias |
| REG-006 | CONTENT | P1 | ○ Propuesta | XL | Crear contenido mínimo para África y subregiones prioritarias |
| REG-007 | CONTENT | P2 | ○ Propuesta | XL | Crear páginas base para Asia, Américas y Oceanía |
| REG-008 | CONTENT | P2 | ○ Propuesta | L | Crear teatros transregionales iniciales |

## Beta 3 — Monitor y Fricción vs. Narrativa

**Objetivo:** Convertir la columna prototipada en un módulo editorial trazable e integrar mapa, alertas y regiones.  
**Fecha objetivo:** TBD  
**Avance:** 0%

### Criterios de salida

- [ ] Modelo y metodología publicados.
- [ ] Datos manuales con fuentes, confianza y fecha de actualización.
- [ ] Panel responsive y accesible.
- [ ] Alternativa textual al mapa.
- [ ] Prototipo reemplazado por datos reales o rotulado como experimental.

### Work items

| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |
|---|---|---|---|---|---|
| FRIC-001 | FEAT | P0 | ○ Propuesta | L | Aprobar metodología, umbrales y vocabulario |
| FRIC-002 | DATA | P0 | ○ Propuesta | M | Crear modelo de datos con fuentes, confianza y actualización |
| FRIC-003 | CONTENT | P0 | ○ Propuesta | XL | Crear dataset editorial inicial real |
| FRIC-004 | FEAT | P0 | ○ Propuesta | XL | Implementar panel y tarjetas responsive |
| FRIC-005 | A11Y | P1 | ○ Propuesta | M | Añadir representación textual de barras y estados |
| FRIC-006 | CONTENT | P0 | ○ Propuesta | L | Publicar página de metodología del indicador |
| HOME-001 | UX | P1 | ○ Propuesta | XL | Rediseñar jerarquía de portada |
| MAP-001 | REF | P1 | ○ Propuesta | XL | Conectar mapa con regiones, alertas y contenido |
| MAP-002 | FEAT | P2 | ○ Propuesta | L | Añadir filtros por región, severidad, tipo y periodo |
| MAP-003 | A11Y | P1 | ○ Propuesta | L | Crear alternativa textual y vista lista móvil |

## Beta 4 — Experiencia editorial

**Objetivo:** Normalizar análisis, ensayos, fuentes, metadatos, navegación relacionada y lectura extensa.  
**Fecha objetivo:** TBD  
**Avance:** 0%

### Criterios de salida

- [ ] Índices de análisis y ensayos completos.
- [ ] Plantillas editoriales compartidas.
- [ ] Índice de contenidos, fuentes y relacionados.
- [ ] Metadatos y JSON-LD validados.
- [ ] Lectura móvil y escritorio aprobada.

### Work items

| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |
|---|---|---|---|---|---|
| ED-001 | REF | P1 | ○ Propuesta | L | Normalizar modelo de análisis y ensayo |
| ED-002 | FEAT | P1 | ○ Propuesta | M | Crear ArticleHeader y MetadataRow compartidos |
| ED-003 | FEAT | P2 | ○ Propuesta | M | Crear índice de contenidos y anclas |
| ED-004 | FEAT | P1 | ○ Propuesta | L | Crear fuentes, notas y contenido relacionado |
| ED-005 | SEO | P1 | ○ Propuesta | L | Implementar canonical, Open Graph y JSON-LD por artículo |
| ED-006 | UX | P1 | ○ Propuesta | M | Diseñar lectura responsive y ancho editorial |
| ED-007 | FEAT | P2 | ○ Propuesta | M | Crear navegación anterior/siguiente y compartir |
| TRUST-001 | CONTENT | P1 | ○ Propuesta | XL | Crear Acerca de, Política editorial, Uso de IA y Correcciones |

## Beta 5 — Directorio modular

**Objetivo:** Separar presentación, lógica y datos del Directorio y mejorar filtros, móvil y accesibilidad.  
**Fecha objetivo:** TBD  
**Avance:** 0%

### Criterios de salida

- [ ] Página monolítica descompuesta.
- [ ] Filtros compartibles mediante URL.
- [ ] Tabla y tarjetas móviles equivalentes.
- [ ] Estados vacíos, error y carga definidos.
- [ ] Exportación y modal cubiertos por pruebas.

### Work items

| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |
|---|---|---|---|---|---|
| DIR-001 | REF | P0 | ○ Propuesta | L | Definir arquitectura modular y contratos |
| DIR-002 | REF | P0 | ○ Propuesta | XL | Extraer filtros, orden y paginación a módulos puros |
| DIR-003 | REF | P0 | ○ Propuesta | XL | Separar toolbar, filtros, KPIs, tabla y modal |
| DIR-004 | FEAT | P1 | ○ Propuesta | L | Persistir filtros en URL |
| DIR-005 | UX | P1 | ○ Propuesta | M | Crear filtros activos y estados vacíos/error |
| DIR-006 | UX | P1 | ○ Propuesta | L | Crear tarjetas móviles equivalentes a la tabla |
| DIR-007 | A11Y | P1 | ○ Propuesta | M | Corregir modal, foco y navegación por teclado |
| DIR-008 | DATA | P1 | ○ Propuesta | XL | Definir fuente canónica Excel/JSON y pipeline de validación |
| DIR-009 | QA | P1 | ○ Propuesta | L | Probar filtros, URL, exportación y modal |

## Beta 6 — QA, rendimiento y preparación de release

**Objetivo:** Cerrar calidad, accesibilidad, seguridad, rendimiento y documentación antes de fusionar a main.  
**Fecha objetivo:** TBD  
**Avance:** 0%

### Criterios de salida

- [ ] CI y pruebas automatizadas activas.
- [ ] Lighthouse y presupuestos de rendimiento aceptados.
- [ ] Cabeceras y política de seguridad revisadas.
- [ ] Smoke test de producción definido.
- [ ] Checklist de release aprobado y rollback documentado.

### Work items

| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |
|---|---|---|---|---|---|
| QA-002 | QA | P1 | ○ Propuesta | L | Agregar lint, format y pruebas unitarias |
| QA-003 | QA | P1 | ○ Propuesta | XL | Agregar Playwright para rutas y flujos críticos |
| CI-001 | OPS | P1 | ○ Propuesta | L | Configurar CI en pull requests a beta y main |
| PERF-001 | PERF | P1 | ○ Propuesta | L | Definir presupuesto Lighthouse y optimizar carga |
| SEC-001 | SEC | P1 | ○ Propuesta | L | Versionar cabeceras y evaluar CSP |
| SEO-003 | SEO | P1 | ○ Propuesta | M | Validar sitemap, robots, canonicals y previews sociales |
| A11Y-003 | A11Y | P1 | ○ Propuesta | L | Ejecutar auditoría WCAG de rutas críticas |
| OPS-004 | OPS | P0 | ○ Propuesta | M | Crear smoke test y procedimiento de rollback |
| DOC-002 | DOC | P0 | ○ Propuesta | L | Actualizar docs/ al estado implementado |
| REL-001 | PM | P0 | ○ Propuesta | S | Aprobar merge beta → main |

## Futuro — Capacidades posteriores

**Objetivo:** Funciones no bloqueantes para el reacondicionamiento inicial.  
**Fecha objetivo:** Sin compromiso  
**Avance:** 0%

### Criterios de salida

- Sin criterios comprometidos.

### Work items

| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |
|---|---|---|---|---|---|
| SEARCH-001 | FEAT | P2 | ○ Propuesta | L | Preparar metadatos para búsqueda global |
| SEARCH-002 | FEAT | P3 | ○ Propuesta | XL | Implementar búsqueda transversal |
| SUB-001 | FEAT | P3 | – Postergada | L | Evaluar newsletter y alertas temáticas |
| AUTO-001 | FEAT | P3 | – Postergada | XL | Evaluar automatización de atención mediática |

