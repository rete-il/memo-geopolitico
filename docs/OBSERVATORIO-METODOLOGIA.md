# Observatorio de relevancia geopolítica y atención mediática

## 1. Propósito

El observatorio identifica casos capaces de modificar relaciones de poder, rutas, dependencias, seguridad, capacidades estratégicas o estabilidad internacional, y compara esa relevancia con la atención que reciben en una muestra documentada de medios.

No es un servicio de noticias en tiempo real. Es un instrumento editorial de seguimiento macrogeopolítico, actualizado algunas veces por semana y publicado como sitio estático.

## 2. Unidad de análisis

La unidad de análisis se denomina **caso geopolítico**. Puede ser:

- un conflicto o una crisis de seguridad;
- una infraestructura estratégica;
- una transformación del comercio, la energía o los recursos;
- una decisión diplomática o institucional;
- una tecnología o red crítica;
- un fenómeno sanitario, demográfico o climático con consecuencias internacionales.

Un caso no entra por ser noticioso. Entra cuando tiene capacidad verificable o razonablemente fundada para modificar el tablero geopolítico.

## 3. Categorías iniciales

La primera versión utilizará una taxonomía cerrada de tres categorías:

1. `seguridad_conflicto`
2. `infraestructura_estrategica`
3. `comercio_energia_recursos`

Las categorías de diplomacia, tecnología, salud, demografía y clima podrán incorporarse después de validar el modelo inicial.

## 4. Criterios de admisión

Un caso debería cumplir al menos tres de los siguientes criterios:

- afecta a más de un Estado o territorio;
- modifica una ruta, dependencia o capacidad estratégica;
- altera seguridad, comercio, energía, recursos o movilidad;
- involucra una población, infraestructura o activo significativo;
- tiene efectos persistentes;
- puede propagarse regionalmente;
- provoca respuestas institucionales verificables;
- involucra actores con capacidad material de ejecución;
- presenta una brecha relevante entre su importancia y su cobertura.

## 5. Índice de relevancia geopolítica

Todos los casos se evalúan mediante siete dimensiones comunes, puntuadas de 0 a 5.

| Dimensión | Peso |
|---|---:|
| Criticidad estratégica | 20% |
| Alcance geográfico | 15% |
| Población, territorio o activos afectados | 15% |
| Persistencia temporal | 15% |
| Capacidad de propagación regional | 15% |
| Dificultad de reversión | 10% |
| Capacidad de los actores involucrados | 10% |

Cálculo:

`relevancia = suma((puntuación / 5) × peso)`

El resultado se expresa de 0 a 100.

### Escala orientativa

- 0–19: relevancia limitada
- 20–39: relevancia baja
- 40–59: relevancia media
- 60–79: relevancia alta
- 80–100: relevancia crítica

El índice es una herramienta editorial documentada, no una medida científica exacta.

## 6. Métricas específicas por categoría

### Seguridad y conflicto

- víctimas;
- heridos;
- desplazados;
- refugiados;
- población afectada;
- duración;
- intensidad;
- extensión territorial.

### Infraestructura estratégica

- inversión estimada;
- capacidad;
- longitud;
- países conectados;
- nodos o puertos involucrados;
- estado de ejecución;
- fecha prevista de operación;
- rutas que evita o complementa;
- dependencias que crea o reduce.

### Comercio, energía y recursos

- volumen económico afectado;
- sectores críticos;
- capacidad energética;
- reservas o producción;
- países dependientes;
- rutas de transporte;
- alternativas disponibles;
- duración esperada de la alteración.

Las métricas específicas explican el caso, pero no se comparan directamente entre categorías.

## 7. Índice de atención mediática

La atención se calcula para un período explícito y una muestra definida de medios.

Variables iniciales:

| Variable | Peso |
|---|---:|
| Participación del caso en los artículos geopolíticos de la muestra | 50% |
| Porcentaje de medios de la muestra que cubrieron el caso | 25% |
| Presencia relativa en titulares o posiciones destacadas | 15% |
| Persistencia de la cobertura dentro del período | 10% |

Cada variable se normaliza de 0 a 100.

Cálculo:

`atencion = 0,50 × participación + 0,25 × amplitud + 0,15 × prominencia + 0,10 × persistencia`

La ficha debe publicar:

- período analizado;
- cantidad de medios;
- cantidad de artículos;
- criterios de selección de la muestra;
- fecha del corte editorial.

## 8. Brecha de atención

Cálculo:

`brecha = atencion − relevancia`

Clasificación inicial:

- `subcubierto`: brecha menor o igual a −20;
- `cobertura_proporcional`: brecha entre −19 y +19;
- `sobrecubierto`: brecha mayor o igual a +20.

Los umbrales podrán recalibrarse después de acumular suficientes casos y cortes históricos.

## 9. Temporalidad

Debe distinguirse entre:

- datos acumulados desde el inicio del caso;
- métricas del último período de cobertura;
- fecha del corte editorial.

Cada actualización agrega un corte histórico. No debe sobrescribir completamente el anterior.

Frecuencia editorial recomendada:

- dos o tres revisiones semanales;
- actualización extraordinaria solo cuando exista un cambio estructural relevante.

## 10. Estados editoriales

- `borrador`: visible solo en el dashboard;
- `publicado`: aparece en `/observatorio/`;
- `destacado`: aparece también en la portada;
- `archivado`: conserva su página histórica, pero sale de las vistas activas.

## 11. Arquitectura pública

- `/observatorio/`: comparación general;
- `/observatorio/[id]/`: ficha individual;
- portada: entre tres y cinco casos destacados.

La portada resume. La ficha individual explica. La página general compara.

## 12. Transparencia y fuentes

Cada cifra debe poder vincularse con una o más fuentes.

Cuando el dato no sea exacto, debe admitir calificadores como:

- al menos;
- aproximadamente;
- estimado;
- rango;
- sin verificación independiente.

La ficha debe separar:

- datos;
- interpretación editorial;
- metodología;
- fuentes.

## 13. Principios de diseño

- evitar falsa precisión;
- mostrar siempre fecha y período;
- no mezclar datos acumulados con cobertura reciente sin explicarlo;
- privilegiar comparaciones comprensibles;
- no convertir la portada en un tablero saturado;
- mantener toda la publicación compatible con generación estática en Astro.
