# Reforma funcional 0.2.1

## Origen

La versión se preparó a partir de la copia local utilizada en el piloto del **Corredor de Lobito**. Preserva:

- dos fuentes Reuters verificadas;
- dos señales revisadas y vinculadas con la fuente correcta;
- las observaciones editoriales incorporadas;
- el expediente `exp-2026-07-20-001`;
- los 14 macroeventos y el catálogo de 92 medios.

## Problemas detectados durante el piloto

1. La lista numérica de temas internos no era comprensible ni revisable.
2. El editor de fuentes no permitía abrir la URL sin salir de la ventana.
3. La interfaz permitía generar un Foco extenso con evidencia todavía insuficiente.
4. No se diferenciaba entre un prompt para investigar y un prompt para redactar.
5. `Failed to fetch` no explicaba que el servidor Node se había detenido.
6. El frontmatter del borrador utilizaba prematuramente `publishedAt`.

## Soluciones implementadas

### Temas internos

- selector buscable por nombre;
- chips de temas seleccionados;
- agrupación por las 17 áreas de la taxonomía;
- validación de que cada ID exista;
- metadatos de origen y revisión temática.

### Fuentes

- botón **Abrir fuente ↗**;
- botón **Copiar URL**;
- desactivación automática cuando la URL HTTPS es inválida.

### Servidor local

- indicador visible `Servidor conectado` / `Servidor desconectado`;
- comprobación periódica de `/api/health`;
- mensaje persistente cuando no se puede guardar;
- conservación del estado no guardado en la pestaña.

### Suficiencia documental

El expediente muestra una lista explícita de criterios y distingue:

```text
Insuficiente para el borrador definitivo
Suficiente para preparar un borrador
```

La evaluación tiene en cuenta cantidad y diversidad de fuentes, además de señales e incertidumbres.

### Dos salidas

```text
Generar plan de investigación
Generar borrador Markdown
```

El plan de investigación pide matriz de vacíos, fuentes candidatas, búsquedas concretas y criterio de cierre. El borrador puede generarse con evidencia insuficiente solo después de una confirmación explícita.

### Frontmatter provisional

El encargo de borrador utiliza:

```yaml
draftedAt: AAAA-MM-DD
status: draft
relatedEditorialRefs:
```

No afirma que el archivo esté publicado ni que las referencias coincidan todavía con el esquema definitivo de Astro.

## QA ejecutado

- `node --check server.mjs`;
- `node --check public/app.js`;
- `npm run check`;
- prueba real de `GET /api/health` y `GET /api/bootstrap`;
- guardado real mediante `PUT /api/data` sobre la copia de trabajo;
- prueba visual e interactiva simulada en escritorio, tablet y teléfono;
- selector de 17 temas del caso Lobito;
- botones de URL habilitados con URL válida;
- evaluación del expediente Lobito como insuficiente;
- generación de plan de investigación;
- confirmación antes de generar un borrador incompleto;
- verificación de `draftedAt` y `relatedEditorialRefs`.

## Resultado de validación

```text
schema_version: 2
macroeventos: 14
expedientes: 1
señales: 26
fuentes: 20
catálogo de medios: 92
valid: true
errors: 0
warnings: 0
```
