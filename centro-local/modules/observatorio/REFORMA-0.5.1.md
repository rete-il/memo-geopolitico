# Reforma 0.5.1

Fecha: 2026-07-23

## Objetivo

Corregir incompatibilidades detectadas al analizar el primer lote real de 15 candidatos generado por ChatGPT.

## Cambios

- El analizador deja de truncar la respuesta a 30.000 caracteres y admite hasta 5.000.000.
- Las URLs con forma `[https://…](https://…)` se convierten en URLs directas antes de validar y guardar.
- Las localizaciones de señales admiten tanto objetos estructurados como nombres en texto.

## Alcance

No cambia el contrato `observatorio-candidatos` versión 1, el esquema editorial v2 ni los datos activos.
