# QA del Observatorio v0.4.0

Fecha: 2026-07-23

## Validación estructural

Ejecutado:

```text
node --check server.mjs
node --check public/app.js
node --check public/context-help.js
npm run check
```

Resultado:

```text
schema_version: 2
macroeventos: 14
expedientes: 1
señales: 27
publicaciones: 22
catálogo: 92
valid: true
errors: 0
warnings: 0
```

También se comprobó que los 229 atributos `id` del HTML son únicos.

## Integridad de datos

Los archivos siguientes conservan el mismo SHA-256 que el ZIP local recibido:

- `data/macroeventos.json`;
- `data/catalogo-medios.json`;
- `data/taxonomia-temas.json`;
- `data/config.json`.

No se incorporaron fuentes ni datos de prueba al entregable.

## Servidor y endpoints

Se inició el servidor en un puerto temporal y se verificó:

- `GET /api/health` devuelve `version: 0.4.0`;
- `GET /api/bootstrap` devuelve 14 macroeventos, 1 expediente y 92 fichas;
- la validación editorial y la del catálogo son válidas;
- `index.html` contiene la búsqueda del ranking y el diálogo de alta asistida;
- `app.js` contiene la navegación modal y el alta de catálogo.

## QA interactivo automatizado

La lógica real de la interfaz se ejecutó sobre el DOM completo con el mismo bootstrap local.

Comprobado:

- búsqueda por ID desde Ranking estratégico;
- contador y resultado del Corredor de Lobito;
- apertura del menú responsive;
- cambio de hamburguesa a `×`;
- fondo modal visible;
- contenido principal inerte;
- cierre por clic exterior;
- cierre por `Escape`;
- retorno del foco al botón;
- apertura y cierre del editor por clic exterior;
- selector del catálogo ordenado A–Z;
- estado sin coincidencias para Mining Weekly;
- apertura de alta asistida;
- precarga de nombre, dominio y familia;
- generación del encargo de investigación;
- aplicación de una respuesta JSON;
- preservación de la revisión humana sin confirmación automática.

Resultado: 27 comprobaciones aprobadas y 0 escrituras de datos.

## Persistencia del alta asistida

En una copia temporal, separada del entregable:

- el catálogo pasó de 92 a 93 fichas;
- el servidor preservó `revision_asistida`;
- la validación continuó siendo válida;
- se creó un backup `catalogo-medios-…-save.json`.

La copia temporal fue usada únicamente para QA.

## Limitación del entorno

No fue posible ejecutar Chromium porque el entorno no contiene un navegador compatible instalado. La estructura responsive y la interacción se comprobaron automáticamente, pero el control visual definitivo debe realizarse en Windows.

## QA local requerido en Windows

1. Ejecutar `npm run check`.
2. Ejecutar `npm run start`.
3. Recargar con `Ctrl+F5`.
4. Revisar escritorio a 100 %.
5. Revisar tablet `768 × 1024`.
6. Revisar teléfono `390 × 844`.
7. Abrir y cerrar el menú con `×`, `Escape` y clic exterior.
8. Confirmar que el fondo no abre una fila.
9. Abrir Lobito y cerrar la ficha mediante clic exterior.
10. Buscar Lobito desde Ranking estratégico.
11. Abrir Mining Weekly, buscarla en el catálogo y comprobar el alta asistida sin confirmarla.
12. Verificar que Cancelar no modifica el catálogo.
