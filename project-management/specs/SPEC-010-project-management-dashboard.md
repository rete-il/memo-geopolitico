# SPEC-010 — Dashboard local de Project Management

## Estado

MVP implementado; pendiente de validación por el usuario.

## Objetivo

Proveer una interfaz local segura para mantener tareas, releases, avance y validaciones sin edición manual habitual de JSON y Markdown.

## Usuarios

- propietario y editor del proyecto;
- desarrolladores o diseñadores que trabajen en la rama `beta`.

## Alcance MVP

- resumen del proyecto;
- gestión de work items;
- gestión básica de releases;
- registro de actividad;
- validación estructural;
- regeneración documental;
- backup automático;
- lectura de estado Git.

## Fuera de alcance del MVP

- autenticación;
- publicación en Internet;
- GitHub API;
- commit o push automático;
- drag-and-drop Kanban;
- edición de riesgos y decisiones;
- trabajo multiusuario simultáneo.

## Requisitos funcionales

1. Debe leer los JSON canónicos existentes.
2. Debe conservar IDs y campos no editados.
3. Debe impedir guardar datos estructuralmente inválidos.
4. Debe crear una copia antes de cada escritura.
5. Debe regenerar los paneles Markdown después de guardar.
6. Debe mostrar la rama Git actual y advertir si no es `beta`.
7. Debe registrar actividad sin reemplazar entradas anteriores.

## Requisitos de seguridad

- escuchar solo en `127.0.0.1`;
- CSP restrictiva;
- límite de cuerpo de solicitud;
- rutas de escritura limitadas a `project-management/`;
- ausencia de ejecución de comandos arbitrarios;
- integración Git de solo lectura.

## Accesibilidad

- navegación mediante teclado;
- foco visible;
- formularios con etiquetas;
- diálogos nativos;
- estados acompañados por texto, no solo color;
- adaptación móvil;
- respeto de `prefers-reduced-motion`.

## Criterios de aceptación

- [ ] El dashboard inicia en Windows mediante el archivo `.cmd`.
- [ ] Lee los work items actuales sin alterar su contenido.
- [ ] Editar una tarea actualiza JSON y Markdown.
- [ ] Crear una tarea valida ID y dependencias.
- [ ] Una dependencia circular es rechazada.
- [ ] Se crea un backup antes de guardar.
- [ ] El registro de actividad se incorpora a `PROGRESS-LOG.md`.
- [ ] La rama `beta` se muestra como correcta.
- [ ] La interfaz funciona en escritorio y móvil.
