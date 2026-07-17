# SPEC-003 — Navegación responsive

**Estado:** Borrador  
**Release:** Beta 2  
**Work items:** NAV-001, NAV-002, NAV-003, NAV-004

## Objetivo

Crear una navegación clara para secciones editoriales y acceso directo a regiones y subregiones.

## Escritorio

- Navegación principal visible.
- “Regiones” abre mega-menú estructurado.
- Página activa claramente indicada.

## Móvil

- Botón hamburguesa.
- Drawer lateral o pantalla completa.
- Regiones como acordeones.
- Acceso a secciones institucionales.

## Accesibilidad

- `aria-expanded`, `aria-controls` y nombre accesible.
- Apertura y cierre por teclado.
- `Escape` cierra.
- Focus trap en drawer.
- Retorno de foco al botón.
- Bloqueo de scroll de fondo.

## Criterios de aceptación

- Funciona en 360, 390, 768, 1024 y 1440 px.
- No hay desbordes.
- Todas las opciones son alcanzables con teclado.
- La taxonomía proviene de la configuración central.
