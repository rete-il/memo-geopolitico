# Decision Log

Las decisiones se numeran de forma estable. No eliminar decisiones reemplazadas; marcar su estado.

| ID | Fecha | Estado | Decisión | Consecuencia principal |
|---|---|---|---|---|
| DEC-001 | 2026-07-17 | Aprobada | Separar `docs/` de `project-management/` | Estado actual y futuro no se confunden |
| DEC-002 | 2026-07-17 | Aprobada | Trabajar en `beta` y mantener `main` estable | Producción no recibe cambios prematuros |
| DEC-003 | 2026-07-17 | Aprobada | No activar `beta.memogeopolitico.com` por el momento | Pruebas mediante localhost y previews puntuales |
| DEC-004 | 2026-07-17 | Aprobada | Centralizar taxonomía regional | Menú, rutas, filtros y contenido comparten IDs |
| DEC-005 | 2026-07-17 | Aprobada | Menú hamburguesa en móvil y mega-menú regional en escritorio | Navegación adaptada al contexto de uso |
| DEC-006 | 2026-07-17 | Aprobada | Implementar Fricción vs. Narrativa primero como proceso editorial manual | Se valida el modelo antes de automatizarlo |
| DEC-007 | 2026-07-17 | Aprobada | Separar datos observados de interpretación editorial | Mayor transparencia y credibilidad |
| DEC-008 | 2026-07-17 | Aprobada | Usar JSON como fuente de verdad del dashboard de proyecto | Regeneración reproducible sin nuevas dependencias |
| DEC-009 | 2026-07-19 | Aprobada | Adoptar la arquitectura editorial Alertas, Focos y Dossiers | Cada tipo de contenido cumple una función diferenciada y dispone de su propio índice |
| DEC-010 | 2026-07-19 | Aprobada | Usar navegación principal `Inicio · Alertas · Focos · Dossiers · Acerca de` | Se unifica la nomenclatura pública del sitio |
| DEC-011 | 2026-07-19 | Aprobada | Situar un menú hamburguesa a la izquierda con `Regiones · Temas · Medios` | La exploración secundaria queda separada de la navegación editorial principal |
| DEC-012 | 2026-07-19 | Aprobada | Implementar una cabecera editorial de dos niveles con marca centrada | Se adopta una versión compacta del modelo visual de El País |
| DEC-013 | 2026-07-19 | Aprobada | Renombrar Directorio como Medios, manteniendo el título descriptivo de la página | El acceso del menú resulta más claro sin perder precisión interna |
| DEC-014 | 2026-07-19 | Aprobada | Consolidar la columna como `Relevancia vs. atención mediática` con valoración manual de 1 a 5 | GDELT queda como experimento y no como dependencia del producto |
| DEC-015 | 2026-07-19 | Aprobada | Mantener compatibilidad temporal con `/ensayos/`, `/profundidad/` y `/directorio/` | La migración de nombres no rompe enlaces existentes |
| DEC-016 | 2026-07-19 | Aprobada | Las tarjetas de Focos muestran un párrafo editorial completo, fecha de actualización y enlace explícito | Se evita el truncamiento y cada tarjeta funciona como unidad editorial autosuficiente |
| DEC-017 | 2026-07-19 | Aprobada | Mantener una herramienta responsive local con escritorio, tablet y teléfono simultáneos | El control visual multidispositivo se integra al flujo de QA sin publicar herramientas internas en Netlify |
| DEC-018 | 2026-07-21 | Aprobada | Mantener el Observatorio como aplicación local autónoma fuera del repositorio y del build de producción | Se preserva la separación entre herramienta editorial, sitio Astro y experimentos de datos |
| DEC-019 | 2026-07-21 | Aprobada | Separar el encargo de investigación del encargo de redacción y exigir revisión humana entre ambos | La búsqueda de evidencia, su verificación y la redacción dejan de formar una cadena automática |
| DEC-020 | 2026-07-21 | Aprobada | Definir la integración futura del Observatorio y la taxonomía pública después de completar un corpus piloto | La arquitectura del sitio se basará en documentos reales y en el esquema local de Astro, no en supuestos previos |
| DEC-021 | 2026-10-01 | Aplicada en la incorporación autorizada | Conservar las evaluaciones pendientes sin puntuación ni confianza y preservar los parámetros cualitativos explícitos de pronóstico | Las ausencias no se convierten en cifras ni probabilidades automáticas; las fichas sin evaluar no reciben posición numérica ni se ubican en la matriz. La evidencia, los estados y las reglas condicionales se conservan al guardar y proyectar. Ver [incorporación EE. UU.–China](records/INCORPORACION-EEUU-CHINA-2026-10-01.md). |
| DEC-022 | 2026-10-01 | Publicada con autorización del usuario | Conservar un fundamento editorial fechado por proceso y vinculado a la evaluación exacta que justifica | La proyección solo expone campos públicos respaldados por fuentes verificadas. Si cambian las notas o confianza, el fundamento anterior deja de presentarse como vigente. No se alteran la fórmula pública ni los estados de otros procesos. Tarea ED-EEUU-CHINA-EVALUACION-20261001; ver [evaluación EE. UU.–China](records/EVALUACION-EEUU-CHINA-2026-10-01.md). |

| DEC-023 | 2026-10-06 | Aprobada para revisión local | Adoptar la portada «Investigación y lectura», con lenguaje neutro, investigación y contraste de fuentes explícitos, y distribuir las cuatro imágenes editoriales en Inicio, Observatorio, Publicaciones y Acerca de | Revisar la implementación en localhost y VS Code antes de enviarla a GitHub. Las valoraciones requieren fundamento público válido y las imágenes se identifican como generadas con IA. Ver [portada editorial](records/PORTADA-EDITORIAL-2026-10-06.md). |

| DEC-024 | 2026-10-06 | Aplicada para revisión local | Centralizar la identidad visual y los parámetros generales, separar la portada y las rutas extensas del Observatorio en componentes tipados, y compartir las acciones por función | Color, escala, peso, espacios y controles se ajustan en tokens; selección de portada y diseño de imágenes tienen registros propios. Se preservan evidencia, contenido y recorridos. Ver [revisión visual y modular](records/REVISION-UI-MODULAR-2026-10-06.md). |

| DEC-025 | 2026-10-06 | Aplicada para revisión local | Incorporar imagen a Opinión y utilizar una misma política de presentación para las imágenes de las cinco páginas principales | Se elimina la variante mayor de Inicio. Recursos y parámetros de imagen tienen una autoridad única en `src/config/editorial-images.ts`, y el componente sólo recibe el recurso. Ver [revisión visual y modular](records/REVISION-UI-MODULAR-2026-10-06.md). |

| DEC-026 | 2026-10-06 | Aplicada para revisión local | Distinguir visualmente navegación y acciones en todas las plantillas, ampliar las imágenes a su columna y añadir Contacto al sistema ilustrado | La navegación editorial usa enlaces subrayados; las cajas se reservan para botones y controles nativos. El ancho fluido y la proporción 3:2 sustituyen las dimensiones pequeñas de DEC-025, con la misma autoridad de diseño para las seis páginas. Ver [revisión visual y modular](records/REVISION-UI-MODULAR-2026-10-06.md). |

| DEC-027 | 2026-10-07 | Propuesta preparada para revisión local | Destacar el bloque estructural como mapa editorial inmediatamente después de la presentación y explicar la relación entre rectores, expedientes y publicaciones | Los accesos conservan enlaces compartidos, los rectores se muestran dentro del Observatorio y los conteos describen el corpus disponible. Texto, orden y grupos se parametrizan en la configuración de portada; la paleta deriva de tokens. Ver [mapa editorial de portada](records/MAPA-EDITORIAL-PORTADA-2026-10-07.md). |

| DEC-028 | 2026-10-07 | Aplicada para revisión local | Sustituir la banda oscura del mapa por marfil con acento ocre e incorporar Macroeventos rectores a la navegación y a las cabeceras ilustradas compartidas | Barra, menú y pie usan la lista única; la sección activa elige la ruta más específica. Las siete imágenes conservan un único registro de diseño y los colores del mapa siguen parametrizados en tokens. Ver [unificación de Rectores](records/UNIFICACION-RECTORES-2026-10-07.md). |

## Plantilla para nueva decisión

```markdown
| DEC-XXX | AAAA-MM-DD | Propuesta/Aprobada/Reemplazada | Decisión | Consecuencia |
```

Para decisiones complejas usar [`templates/adr.md`](./templates/adr.md) y enlazar el archivo desde esta tabla.
