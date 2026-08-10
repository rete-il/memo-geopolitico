# Dashboard de medios geopolíticos

Dashboard estático y responsivo derivado del Excel maestro:

`..\..\data\medios\Medios_Matriz_Geopolitica_Navegacion_actualizado.xlsx`

La copia `data/Medios_Matriz_Geopolitica_Navegacion_corregido.xlsx` se conserva
como archivo descargable del dashboard y se reemplaza durante la sincronización.

## Publicación

1. Descomprima el paquete.
2. Suba **todo el contenido de esta carpeta** a su servidor, conservando la estructura.
3. Abra `index.html` desde el dominio o la carpeta donde lo publicó.

No requiere base de datos, PHP, Node.js ni bibliotecas externas. Funciona con HTML, CSS y JavaScript nativos.

## Funciones

- búsqueda de texto;
- filtros por región, familia, función epistemológica, perspectiva, confianza y estado;
- puntuación mínima;
- indicadores que se recalculan con los filtros;
- gráficos de distribución sin dependencias externas;
- ordenamiento y paginación;
- ficha completa de cada medio;
- exportación de los resultados filtrados a CSV;
- descarga del Excel original;
- tema claro/oscuro;
- filtros compartibles mediante la URL.

## Prueba local

Desde esta carpeta:

```bash
python tools/servidor_local.py
```

Luego abra:

`http://localhost:8000`

También se incluye `dashboard-standalone.html`, que contiene estilos, datos y aplicación en un único archivo.

## Actualizar el dashboard al cambiar el Excel

Desde la raíz de `D:\Memo geopolitico`, ejecute:

```powershell
npm run sync:media
```

El comando vuelve a generar:

- `data/medios.json`
- `data/medios-data.js`
- `dashboard-standalone.html`
- el catálogo del Observatorio
- el catálogo público del sitio
- la copia descargable del Excel

`tools/actualizar_datos.py` permanece como utilidad aislada del módulo, pero el
procedimiento normal es `npm run sync:media` para evitar divergencias.

## Estructura

```text
index.html
styles.css
app.js
favicon.svg
dashboard-standalone.html
data/
  medios.json
  medios-data.js
  Medios_Matriz_Geopolitica_Navegacion_corregido.xlsx
tools/
  actualizar_datos.py
  servidor_local.py
```

## Observación metodológica

Las puntuaciones no son una sentencia universal sobre una fuente. Deben interpretarse según el tipo de contenido, el tema, la evidencia disponible, el acceso institucional y la necesidad de corroboración.
