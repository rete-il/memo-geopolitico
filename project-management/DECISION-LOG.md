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
## Plantilla para nueva decisión

```markdown
| DEC-XXX | AAAA-MM-DD | Propuesta/Aprobada/Reemplazada | Decisión | Consecuencia |
```

Para decisiones complejas usar [`templates/adr.md`](./templates/adr.md) y enlazar el archivo desde esta tabla.
