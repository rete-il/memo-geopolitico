# Migración controlada de monitores al Observatorio

## Objetivo

Migrar los tres monitores actuales al modelo de casos geopolíticos sin romper:

- la portada;
- la columna derecha;
- la administración local de monitores;
- el build estático de Astro.

## Estrategia de coexistencia

### Sistema actual

`src/data/monitores.json` sigue siendo la fuente pública durante esta etapa.

No se modifica su estructura ni el componente `PanelDerecho.astro`.

### Sistema nuevo

Los nuevos archivos se agregan en:

```text
src/data/observatorio/
```

Los tres casos se crean como:

```text
estado_publicacion: borrador
estado_datos: incompleto
```

Por lo tanto, todavía no alimentan la portada ni generan páginas públicas.

## Qué se migró

Se conservaron sin reinterpretación:

- ID;
- nombre del teatro;
- nivel de escalada heredado;
- porcentaje de cobertura heredado;
- clasificación heredada;
- insight;
- fecha de actualización;
- fuente única, cuando exista.

Los valores anteriores quedan dentro de `migracion.datos_legacy`. No se presentan como índices nuevos.

## Qué falta completar

Para cada caso:

1. confirmar la categoría y la región;
2. definir el período de cobertura;
3. reunir métricas específicas;
4. documentar la muestra de medios;
5. puntuar las siete dimensiones de relevancia;
6. calcular relevancia, atención y brecha;
7. agregar fuentes;
8. agregar el primer corte histórico;
9. pasar `estado_datos` a `completo`;
10. decidir si queda publicado o destacado.

## Validación

Ejecutar:

```powershell
node .\project-management\tools\validate-observatorio.mjs
```

En esta etapa, los tres borradores deben producir advertencias por datos incompletos, pero ningún error.

## Criterio de salida de la migración

La migración termina cuando:

- los tres casos tienen datos completos;
- el validador no emite errores;
- las nuevas tarjetas leen el modelo del Observatorio;
- el dashboard administra los casos nuevos;
- `monitores.json` deja de ser necesario;
- la portada y las páginas estáticas pasan las validaciones de Astro.
