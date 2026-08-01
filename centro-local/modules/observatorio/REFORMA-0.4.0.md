# Reforma funcional 0.4.0

## Objetivo

Resolver los defectos detectados durante el QA local de la versión 0.3.0 y mejorar el trabajo con macroeventos y fuentes no catalogadas, sin modificar los datos editoriales recibidos ni integrar el Observatorio con GitHub.

## 1. Menú responsive

- El botón hamburguesa permanece visible y se transforma en `×`.
- El panel incorpora un fondo semitransparente.
- El contenido queda inerte mientras el menú está abierto.
- El fondo no recibe clics ni permite abrir una fila.
- El menú cierra con `Escape`, clic exterior, el botón `×` o la selección de una vista.
- Al cerrar mediante `Escape`, clic exterior o botón, el foco vuelve al control del menú.
- La navegación por tabulador queda contenida entre el botón de cierre y las opciones.

## 2. Diálogos

Todos los diálogos pueden cerrarse mediante:

- botón `×`;
- `Escape`;
- clic en el fondo exterior.

El clic exterior cierra únicamente el diálogo superior y no activa el contenido de fondo.

## 3. Búsqueda desde Ranking estratégico

La pantalla Resumen incorpora:

- búsqueda por título;
- búsqueda por ID del macroevento;
- búsqueda por ID o nombre de tema interno;
- filtro por tipo;
- filtro por estado;
- botón Limpiar;
- contador de resultados;
- estado vacío `No se encontraron macroeventos`.

Sin filtros se conservan los ocho macroeventos de mayor relevancia.

## 4. Selector del catálogo

- Los resultados se ordenan alfabéticamente.
- La búsqueda incluye ID, nombre, región, familia, función y perspectiva.
- Se informa el número de coincidencias.
- Cuando no hay coincidencias aparece `Crear fuente en el catálogo`.
- La interfaz habla de fuentes para incluir medios, instituciones y fuentes primarias.

## 5. Alta asistida de fuentes

El alta parte de la publicación activa y propone:

- nombre;
- dominio institucional;
- idioma;
- familia;
- función;
- tipo de control cuando puede deducirse del tipo de publicación;
- URL de referencia.

Cada campo conserva una condición:

- `verificado`;
- `propuesto`;
- `sin_determinar`.

Los campos sin evidencia pueden permanecer vacíos. Las puntuaciones cualitativas del catálogo no se completan automáticamente.

La interfaz puede generar un encargo de investigación para ChatGPT. La respuesta se pega como JSON y se aplica al formulario como propuesta; esto no sustituye la revisión humana.

Antes del alta se comprueban posibles duplicados por nombre y dominio. Para crear la ficha es obligatorio confirmar la revisión. El servidor:

1. valida el catálogo;
2. crea un backup;
3. guarda la nueva ficha;
4. conserva los estados y evidencias de la revisión asistida;
5. vincula la ficha con la publicación abierta.

La diversidad se recalcula al aplicar la publicación.

## 6. Terminología documental

La interfaz distingue:

- publicaciones: documentos registrados;
- fuentes únicas: medios o instituciones diferentes;
- fuentes catalogadas: fuentes únicas con ficha clasificatoria.

Esta distinción también se incorpora a los encargos de investigación y redacción.

## Datos preservados

Los cuatro archivos de `data/` son idénticos, byte por byte, a la versión local recibida:

- `data/macroeventos.json`;
- `data/catalogo-medios.json`;
- `data/taxonomia-temas.json`;
- `data/config.json`.

El esquema editorial continúa en v2.
