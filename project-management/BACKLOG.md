# Backlog

> Archivo generado. La fuente de verdad es `data/work-items.json`.

## Convenciones

- Estados: ○ Propuesta · ◉ Lista · ▶ En progreso · ⛔ Bloqueada · ◆ En revisión · ✓ Terminada · – Postergada
- Tamaños: XS, S, M, L, XL.
- Prioridades: P0 crítica, P1 alta, P2 media, P3 futura.

## Beta 0 — Baseline, seguridad y control

| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |
|---|---|---|---|---|---|---|---|---|
| DOC-001 | DOC | Baseline | P0 | ✓ Terminada | S | Rete | — | Incorporar documentación técnica v2 al repositorio |
| ED-008 | FEAT | Editorial | P0 | ◆ En revisión | L | Rete | IA-001 | Crear índices de Alertas, Focos y Dossiers |
| ED-009 | REF | Editorial | P0 | ◆ En revisión | L | Rete | ED-008 | Migrar Ensayos a Focos y Profundidad a Dossiers sin romper URLs |
| ED-011 | UX | Focos | P0 | ✓ Terminada | S | Rete | ED-008 | Recomponer tarjetas de Focos con resumen completo, fecha y enlace |
| FIX-001 | FIX | Navegación | P0 | ✓ Terminada | S | Rete | — | Corregir rutas inexistentes del encabezado |
| FIX-002 | FIX | Contenido | P0 | ✓ Terminada | M | Rete | — | Completar el índice /ensayos/ |
| FIX-003 | FIX | Contenido | P0 | ✓ Terminada | S | Rete | — | Retirar o normalizar placeholder Indo-Pacífico |
| FIX-004 | FIX | Conversión | P0 | ✓ Terminada | M | Rete | — | Configurar sistema modular de apoyo mediante Ko-fi |
| HOME-002 | UX | Portada | P0 | ✓ Terminada | S | Rete | IA-001 | Normalizar la nomenclatura editorial de la portada |
| IA-001 | UX | Arquitectura de información | P0 | ✓ Terminada | M | Rete | FIX-001 | Aprobar arquitectura editorial Alertas, Focos, Dossiers, Medios y exploración secundaria |
| NAV-001 | FEAT | Navegación | P0 | ◆ En revisión | L | Rete | FIX-001, IA-001 | Implementar cabecera editorial y menú hamburguesa izquierdo accesible |
| OPS-001 | OPS | Producción | P0 | ✓ Terminada | S | Rete | — | Registrar baseline de Netlify y producción |
| PM-001 | PM | Gestión | P0 | ✓ Terminada | S | Rete | — | Separar documentación del estado actual y documentación de proyecto |
| PM-002 | PM | Gestión | P0 | ✓ Terminada | M | Rete | PM-001 | Crear sistema dinámico de project management |
| PM-003 | OPS | Git | P0 | ✓ Terminada | XS | Rete | — | Confirmar rama beta local y upstream origin/beta |
| PM-004 | PM | Gestión | P0 | ✓ Terminada | XS | Rete | PM-002, PM-003 | Integrar project-management/ en la rama beta |
| PMAPP-001 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | S | Rete | — | Definir arquitectura del dashboard local |
| PMAPP-002 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | M | Rete | PMAPP-001 | Crear servidor local restringido a 127.0.0.1 |
| PMAPP-003 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | M | Rete | PMAPP-002 | Implementar lectura y resumen de datos canónicos |
| PMAPP-004 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | L | Rete | PMAPP-003 | Implementar editor de work items |
| PMAPP-005 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | M | Rete | PMAPP-003 | Implementar validación y dependencias circulares |
| PMAPP-006 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | S | Rete | PMAPP-004, PMAPP-005 | Integrar regeneración automática de Markdown |
| PMAPP-007 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | M | Rete | PMAPP-003 | Implementar releases y registro de actividad |
| PMAPP-008 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | S | Rete | PMAPP-002 | Implementar copias de seguridad locales |
| PMAPP-009 | PMAPP | Dashboard de gestión | P0 | ✓ Terminada | S | Rete | PMAPP-004, PMAPP-006, PMAPP-007, PMAPP-008 | Validar dashboard local en Windows y documentar resultados |
| QA-001 | QA | Validación | P0 | ✓ Terminada | S | Rete | — | Agregar astro check y dependencias necesarias |
| QA-005 | QA | Navegación editorial | P0 | ▶ En progreso | M | Rete | NAV-001, HOME-002, ED-008, ED-009, DIR-010 | Validar cabecera, índices, rutas heredadas y navegación por teclado |
| A11Y-001 | A11Y | Baseline | P1 | ○ Propuesta | M | TBD | — | Registrar auditoría de teclado, contraste y headings |
| DATA-002 | FEATURE | Datos y Monitoreo | P1 | ✓ Terminada | M | Rete | — | Administrar la columna Relevancia vs. atención mediática desde el dashboard |
| DATA-003 | PM | Gestión | P1 | ✓ Terminada | M | Rete | — | Definir el modelo editorial de relevancia geopolítica y atención mediática |
| DATA-004 | DATA | Relevancia vs. atención mediática | P1 | ✓ Terminada | M | Rete | DATA-002, ED-008 | Enlazar cada tarjeta activa con una página temática publicada |
| DIR-010 | UX | Medios | P1 | ◆ En revisión | S | Rete | NAV-001 | Renombrar Directorio como Medios y preservar la ruta anterior |
| ED-010 | CONTENT | Transparencia | P1 | ◆ En revisión | M | Rete | IA-001 | Crear la página Acerca de Memo Geopolítico |
| OPS-002 | OPS | Reproducibilidad | P1 | ◉ Lista | XS | TBD | — | Versionar Node con .nvmrc o .node-version |
| OPS-003 | OPS | Reproducibilidad | P1 | ◉ Lista | S | TBD | OPS-002 | Versionar configuración Netlify en netlify.toml |
| QA-004 | QA | Calidad Técnica | P1 | ✓ Terminada | M | Rete | QA-001 | Reducir hints de Astro Check |
| QA-006 | QA | Validación responsive | P1 | ✓ Terminada | M | Rete | QA-001 | Incorporar vista local simultánea de escritorio, tablet y teléfono |
| SEO-001 | SEO | Social | P1 | ◉ Lista | S | TBD | — | Crear default-og.png y validar Open Graph |
| SEO-002 | SEO | Indexación | P1 | ◉ Lista | M | TBD | OPS-003 | Publicar robots.txt seguro y sitemap |
| UI-001 | FIX | Iconos | P1 | ✓ Terminada | S | Rete | — | Cargar iconografía globalmente o empaquetarla |
| UX-001 | UX | Errores | P1 | ◉ Lista | S | TBD | — | Crear página 404 coherente con la marca |

## Beta 1 — Fundamentos y sistema de diseño

| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |
|---|---|---|---|---|---|---|---|---|
| A11Y-002 | A11Y | Componentes | P1 | ○ Propuesta | M | TBD | DS-003, A11Y-001 | Definir patrones de foco, teclado y reduced motion |
| DATA-001 | REF | Validación | P1 | ○ Propuesta | L | TBD | TYPE-001 | Validar JSON y frontmatter con esquemas |
| DS-001 | REF | Sistema de diseño | P1 | ○ Propuesta | L | TBD | IA-001 | Centralizar tokens de color, espacio, tipografía y capas |
| DS-002 | REF | Sistema de diseño | P1 | ○ Propuesta | M | TBD | DS-001 | Definir escala tipográfica editorial e interfaz |
| DS-003 | FEAT | Componentes UI | P1 | ○ Propuesta | L | TBD | DS-001 | Crear Container, Button, Badge, Card y SectionHeader |
| DS-004 | FEAT | Componentes UI | P1 | ○ Propuesta | L | TBD | DS-003 | Crear Drawer, Modal, Tooltip y estados de interfaz |
| REF-001 | REF | Shell | P1 | ○ Propuesta | L | TBD | DS-003, UI-001 | Extraer SiteHeader, SiteFooter y Seo |
| TYPE-001 | REF | Tipos | P1 | ○ Propuesta | L | TBD | QA-001 | Crear contratos TypeScript para contenido, mapa, monitor y directorio |

## Beta 2 — Navegación y exploración temática

| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |
|---|---|---|---|---|---|---|---|---|
| REG-001 | FEAT | Regiones | P0 | ○ Propuesta | L | TBD | IA-001 | Aprobar taxonomía de regiones, subregiones y teatros |
| REG-002 | REF | Regiones | P0 | ○ Propuesta | M | TBD | REG-001, TYPE-001 | Crear fuente central src/config/regions.ts |
| REG-003 | FEAT | Regiones | P0 | ○ Propuesta | L | TBD | REG-002 | Crear índice /regiones/ y rutas dinámicas |
| REG-004 | FEAT | Regiones | P0 | ○ Propuesta | XL | TBD | REG-003, DS-003 | Crear plantilla regional con datos e interpretación separados |
| NAV-002 | FEAT | Navegación | P1 | ○ Propuesta | L | TBD | REF-001, REG-002 | Implementar mega-menú regional de escritorio |
| NAV-003 | FEAT | Navegación | P1 | ○ Propuesta | M | TBD | NAV-001 | Crear acordeones regionales y estado activo |
| NAV-004 | FEAT | Navegación | P1 | ○ Propuesta | M | TBD | REG-003, DS-003 | Crear breadcrumbs compartidos |
| REG-005 | CONTENT | Regiones | P1 | ○ Propuesta | XL | TBD | REG-004 | Crear contenido mínimo para Europa y subregiones prioritarias |
| REG-006 | CONTENT | Regiones | P1 | ○ Propuesta | XL | TBD | REG-004 | Crear contenido mínimo para África y subregiones prioritarias |
| REG-007 | CONTENT | Regiones | P2 | ○ Propuesta | XL | TBD | REG-004 | Crear páginas base para Asia, Américas y Oceanía |
| REG-008 | CONTENT | Teatros | P2 | ○ Propuesta | L | TBD | REG-004 | Crear teatros transregionales iniciales |

## Beta 3 — Relevancia y atención mediática

| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |
|---|---|---|---|---|---|---|---|---|
| FRIC-001 | FEAT | Relevancia vs. atención mediática | P0 | ○ Propuesta | L | TBD | IA-001, REG-001 | Revisar criterios editoriales y escala de relevancia y atención |
| FRIC-002 | DATA | Relevancia vs. atención mediática | P0 | ○ Propuesta | M | TBD | FRIC-001, TYPE-001 | Evolucionar el modelo de datos con fuentes, confianza e historial |
| FRIC-003 | CONTENT | Relevancia vs. atención mediática | P0 | ○ Propuesta | XL | TBD | FRIC-002 | Ampliar el dataset editorial de relevancia y atención |
| FRIC-004 | FEAT | Relevancia vs. atención mediática | P0 | ○ Propuesta | XL | TBD | FRIC-002, DS-004 | Evolucionar el panel y las tarjetas responsive |
| FRIC-006 | CONTENT | Metodología | P0 | ○ Propuesta | L | TBD | FRIC-001 | Publicar nota metodológica del módulo editorial |
| FRIC-005 | A11Y | Relevancia vs. atención mediática | P1 | ○ Propuesta | M | TBD | FRIC-004 | Mantener representación textual de barras y estados |
| HOME-001 | UX | Portada | P1 | ○ Propuesta | XL | TBD | DS-003, FRIC-004 | Rediseñar jerarquía de portada |
| MAP-001 | REF | Mapa | P1 | ○ Propuesta | XL | TBD | REG-002, TYPE-001 | Conectar mapa con regiones, alertas y contenido |
| MAP-003 | A11Y | Mapa | P1 | ○ Propuesta | L | TBD | MAP-001 | Crear alternativa textual y vista lista móvil |
| OBS-001 | PMAPP | Observatorio editorial | P1 | ◆ En revisión | XL | Rete | DATA-003 | Consolidar el Observatorio autónomo de macroeventos y expedientes v0.3.0 |
| MAP-002 | FEAT | Mapa | P2 | ○ Propuesta | L | TBD | MAP-001 | Añadir filtros por región, severidad, tipo y periodo |

## Beta 4 — Alertas, Focos y Dossiers

| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |
|---|---|---|---|---|---|---|---|---|
| ED-001 | REF | Editorial | P1 | ○ Propuesta | L | TBD | DATA-001, IA-001 | Normalizar modelo de análisis y ensayo |
| ED-002 | FEAT | Editorial | P1 | ○ Propuesta | M | TBD | DS-003, ED-001 | Crear ArticleHeader y MetadataRow compartidos |
| ED-004 | FEAT | Editorial | P1 | ○ Propuesta | L | TBD | ED-001 | Crear fuentes, notas y contenido relacionado |
| ED-005 | SEO | Editorial | P1 | ○ Propuesta | L | TBD | SEO-001, ED-001 | Implementar canonical, Open Graph y JSON-LD por artículo |
| ED-006 | UX | Editorial | P1 | ○ Propuesta | M | TBD | DS-002, ED-002 | Diseñar lectura responsive y ancho editorial |
| OBS-002 | CONTENT | Piloto editorial | P1 | ▶ En progreso | L | Rete | OBS-001 | Completar el piloto del Corredor de Lobito hasta un Markdown publicable |
| TRUST-001 | CONTENT | Transparencia | P1 | ○ Propuesta | XL | TBD | IA-001 | Crear Acerca de, Política editorial, Uso de IA y Correcciones |
| ED-003 | FEAT | Editorial | P2 | ○ Propuesta | M | TBD | ED-001 | Crear índice de contenidos y anclas |
| ED-007 | FEAT | Editorial | P2 | ○ Propuesta | M | TBD | ED-004 | Crear navegación anterior/siguiente y compartir |
| OBS-004 | UX | Observatorio editorial | P2 | ○ Propuesta | S | Rete | OBS-001 | Diferenciar visualmente los estados Revisada y Verificada en Señales |
| OBS-005 | UX | Observatorio editorial | P2 | ○ Propuesta | M | Rete | OBS-001 | Administrar los tipos de advertencias, señales y fuentes como vocabularios controlados |

## Beta 5 — Medios

| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |
|---|---|---|---|---|---|---|---|---|
| DIR-001 | REF | Directorio | P0 | ○ Propuesta | L | TBD | TYPE-001, DS-003 | Definir arquitectura modular y contratos |
| DIR-002 | REF | Directorio | P0 | ○ Propuesta | XL | TBD | DIR-001 | Extraer filtros, orden y paginación a módulos puros |
| DIR-003 | REF | Directorio | P0 | ○ Propuesta | XL | TBD | DIR-001 | Separar toolbar, filtros, KPIs, tabla y modal |
| DIR-004 | FEAT | Directorio | P1 | ○ Propuesta | L | TBD | DIR-002 | Persistir filtros en URL |
| DIR-005 | UX | Directorio | P1 | ○ Propuesta | M | TBD | DIR-003 | Crear filtros activos y estados vacíos/error |
| DIR-006 | UX | Directorio | P1 | ○ Propuesta | L | TBD | DIR-003 | Crear tarjetas móviles equivalentes a la tabla |
| DIR-007 | A11Y | Directorio | P1 | ○ Propuesta | M | TBD | DIR-003, A11Y-002 | Corregir modal, foco y navegación por teclado |
| DIR-008 | DATA | Directorio | P1 | ○ Propuesta | XL | TBD | DATA-001 | Definir fuente canónica Excel/JSON y pipeline de validación |
| DIR-009 | QA | Directorio | P1 | ○ Propuesta | L | TBD | DIR-002, DIR-003, DIR-004, DIR-007 | Probar filtros, URL, exportación y modal |

## Beta 6 — QA, rendimiento y preparación de release

| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |
|---|---|---|---|---|---|---|---|---|
| DOC-002 | DOC | Entrega | P0 | ○ Propuesta | L | TBD | OPS-004 | Actualizar docs/ al estado implementado |
| OPS-004 | OPS | Release | P0 | ○ Propuesta | M | TBD | CI-001 | Crear smoke test y procedimiento de rollback |
| REL-001 | PM | Release | P0 | ○ Propuesta | S | TBD | QA-003, PERF-001, SEC-001, SEO-003, A11Y-003, DOC-002 | Aprobar merge beta → main |
| A11Y-003 | A11Y | Auditoría final | P1 | ○ Propuesta | L | TBD | NAV-001, FRIC-004, ED-006, DIR-007 | Ejecutar auditoría WCAG de rutas críticas |
| CI-001 | OPS | CI | P1 | ○ Propuesta | L | TBD | QA-002 | Configurar CI en pull requests a beta y main |
| PERF-001 | PERF | Rendimiento | P1 | ○ Propuesta | L | TBD | HOME-001, DIR-003 | Definir presupuesto Lighthouse y optimizar carga |
| QA-002 | QA | Automatización | P1 | ○ Propuesta | L | TBD | QA-001 | Agregar lint, format y pruebas unitarias |
| QA-003 | QA | E2E | P1 | ○ Propuesta | XL | TBD | QA-002 | Agregar Playwright para rutas y flujos críticos |
| SEC-001 | SEC | Seguridad | P1 | ○ Propuesta | L | TBD | OPS-003 | Versionar cabeceras y evaluar CSP |
| SEO-003 | SEO | Validación | P1 | ○ Propuesta | M | TBD | SEO-002, ED-005 | Validar sitemap, robots, canonicals y previews sociales |

## Futuro — Capacidades posteriores

| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |
|---|---|---|---|---|---|---|---|---|
| INFRA-001 | INFRA | Infraestructura y despliegue | P2 | ○ Propuesta | M | Rete | — | Configurar entorno beta para validación multidispositivo |
| OBS-003 | PM | Arquitectura editorial | P2 | – Postergada | M | Rete | OBS-002 | Definir la integración futura del Observatorio a partir del corpus piloto |
| SEARCH-001 | FEAT | Búsqueda | P2 | ○ Propuesta | L | TBD | ED-001, REG-002 | Preparar metadatos para búsqueda global |
| AUTO-001 | FEAT | Automatización | P3 | – Postergada | XL | TBD | FRIC-003, FRIC-006 | Evaluar automatización de atención mediática |
| SEARCH-002 | FEAT | Búsqueda | P3 | ○ Propuesta | XL | TBD | SEARCH-001 | Implementar búsqueda transversal |
| SUB-001 | FEAT | Suscripción | P3 | – Postergada | L | TBD | — | Evaluar newsletter y alertas temáticas |
