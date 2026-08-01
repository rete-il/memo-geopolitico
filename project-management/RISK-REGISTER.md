# Registro de riesgos, incidencias y dependencias

## Escala

- Probabilidad: Baja / Media / Alta.
- Impacto: Bajo / Medio / Alto / Crítico.
- Estado: Abierto / Mitigado / Aceptado / Cerrado.

| ID | Tipo | Riesgo o incidencia | Prob. | Impacto | Mitigación | Estado |
|---|---|---|---|---|---|---|
| R-001 | Alcance | El proyecto crece antes de estabilizar fundamentos | Alta | Alto | Releases secuenciales y control de cambios | Abierto |
| R-002 | Documentación | `docs/` queda desfasado respecto del código | Media | Alto | Definition of Done exige actualización documental | Abierto |
| R-003 | Navegación | Cambios de slugs rompen enlaces publicados | Media | Crítico | Redirects antes de modificar URL | Abierto |
| R-004 | Indicadores | Fricción vs. Narrativa parece una métrica objetiva | Alta | Alto | Metodología, fuentes, confianza y rótulo experimental | Abierto |
| R-005 | Datos | Páginas regionales quedan obsoletas | Alta | Alto | Fecha de actualización, responsable y cadencia | Abierto |
| R-006 | UX | Menú regional se vuelve demasiado extenso | Media | Alto | Taxonomía limitada, acordeones y búsqueda posterior | Abierto |
| R-007 | A11Y | Drawer, mega-menú o mapa no son operables por teclado | Media | Alto | Patrones accesibles y pruebas desde Beta 1 | Abierto |
| R-008 | Rendimiento | Mapa, iconos y scripts degradan Core Web Vitals | Media | Alto | Carga diferida, fallback y presupuesto Lighthouse | Abierto |
| R-009 | Operaciones | No existe URL beta pública permanente | Baja | Medio | Preview local y Deploy Previews puntuales | Aceptado |
| R-010 | Directorio | Refactor grande introduce regresiones | Alta | Alto | Extraer lógica pura y añadir pruebas antes de UI | Abierto |
| R-011 | Mantenimiento | Excel y JSON divergen | Alta | Alto | Definir fuente canónica y pipeline | Abierto |
| R-012 | Seguridad | Cabeceras o CSP rompen recursos externos | Media | Alto | Introducción incremental y pruebas en preview | Abierto |

## Incidencias activas

Registrar aquí problemas inesperados que bloqueen el release. Toda incidencia debe referenciar un work item o generar uno nuevo.

| ID | Fecha | Descripción | Work item | Responsable | Estado |
|---|---|---|---|---|---|
| — | — | Sin incidencias registradas | — | — | — |

## Dependencias externas

- Netlify para build y publicación.
- Proveedor DNS del dominio.
- Leaflet y tiles del mapa.
- Fuentes e iconografía externas mientras no se empaqueten.
- Disponibilidad y calidad de fuentes editoriales para indicadores y páginas regionales.
