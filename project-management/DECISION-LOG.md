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

## Plantilla para nueva decisión

```markdown
| DEC-XXX | AAAA-MM-DD | Propuesta/Aprobada/Reemplazada | Decisión | Consecuencia |
```

Para decisiones complejas usar [`templates/adr.md`](./templates/adr.md) y enlazar el archivo desde esta tabla.
