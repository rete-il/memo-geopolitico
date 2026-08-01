# Quality Gates

## Definition of Ready

Una tarea está lista cuando:

- tiene ID, tipo, prioridad, release y tamaño;
- describe un resultado verificable;
- tiene criterios de aceptación;
- las dependencias son explícitas;
- los datos, textos o decisiones necesarios están disponibles;
- el impacto en rutas, SEO, accesibilidad y responsive fue considerado.

## Definition of Done

Una tarea se cierra cuando:

- el código o contenido está implementado;
- cumple sus criterios de aceptación;
- `npm run check` y `npm run build` pasan cuando estén disponibles;
- se verificó la ruta o flujo afectado;
- no introduce errores de consola relevantes;
- se revisó teclado y foco si cambia interacción;
- se revisó móvil y escritorio si cambia UI;
- se actualizaron pruebas;
- se actualizó `docs/` si el sistema actual cambió;
- se actualizó el project management;
- existe plan de rollback si afecta producción.

## Puerta por pull request

- Alcance pequeño y comprensible.
- Sin archivos secretos o generados innecesarios.
- Build correcto.
- Criterios de aceptación comprobados.
- Capturas antes/después para UI.
- Cambios de URL acompañados por redirects.

## Puerta por release beta

- Todos los work items P0 del release están `done`.
- No hay bloqueos críticos sin decisión.
- Smoke test de rutas afectadas.
- Accesibilidad básica revisada.
- Documentación y decisión log actualizados.
- Riesgos residuales aceptados explícitamente.

## Puerta beta → main

- QA automatizada y manual aprobada.
- Lighthouse y rendimiento dentro de presupuesto acordado.
- SEO y metadatos validados.
- Navegación completa en móvil y escritorio.
- Indicadores con metodología y fuentes.
- Sin prototipos no rotulados como contenido real.
- Rollback probado o claramente ejecutable.
- Aprobación explícita del Product Owner.
