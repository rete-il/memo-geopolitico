# Documentación técnica — Memo Geopolítico

**Versión documental:** 1.0  
**Fecha del relevamiento:** 16 de julio de 2026  
**Estado del producto:** desarrollo local, sin publicación pública  
**Stack relevado:** Astro 7.0.7, Tailwind CSS 4.3.2, TypeScript, JavaScript, Nanostores y Netlify como plataforma prevista

## Propósito

Esta carpeta documenta el sitio **tal como está construido en la instantánea analizada**. No describe todavía una arquitectura ideal ni presupone que las recomendaciones ya fueron implementadas.

La documentación diferencia cinco estados:

| Marca | Significado |
|---|---|
| **Implementado** | Existe en el código y fue comprobado en la ejecución o el build. |
| **Prototipo** | Existe como representación visual o datos de muestra, pero no como módulo editorial completo. |
| **Pendiente** | Está anunciado, enlazado o esbozado, pero no implementado. |
| **Riesgo** | Puede causar errores, inconsistencias, problemas de accesibilidad o fallas de publicación. |
| **Deuda técnica** | Funciona actualmente, pero dificulta mantenimiento, pruebas o escalabilidad. |

## Evidencia técnica disponible

- Node.js usado por el propietario: `v24.18.0`.
- npm usado por el propietario: `9.8.1`.
- `npm install`: correcto, 211 paquetes auditados y 0 vulnerabilidades informadas.
- `npm run dev`: correcto en `http://localhost:4321/`.
- `npm run build`: correcto; salida `static`, carpeta `dist/`, 9 páginas generadas.
- `npm run preview`: correcto en `http://localhost:4321/`.
- `npm run check`: no existe como script; no representa una falla del build, sino una validación todavía no configurada.

![Portada actual en escritorio](./assets/portada-desktop.png)

## Índice de lectura recomendado

1. [Visión y alcance](./01-vision-y-alcance.md)
2. [Arquitectura actual](./02-arquitectura-actual.md)
3. [Estructura del proyecto](./03-estructura-del-proyecto.md)
4. [Rutas y navegación](./04-rutas-y-navegacion.md)
5. [Modelo editorial](./05-modelo-editorial.md)
6. [Contenido Markdown](./06-contenido-markdown.md)
7. [Datos JSON y Excel](./07-datos-json-y-excel.md)
8. [Componentes, layouts y páginas](./08-componentes-layouts-y-paginas.md)
9. [Estilos y sistema visual](./09-estilos-y-sistema-visual.md)
10. [JavaScript, estado e interactividad](./10-javascript-estado-e-interactividad.md)
11. [Desarrollo local](./11-desarrollo-local.md)
12. [Build, preview y Netlify](./12-build-preview-y-netlify.md)
13. [SEO, accesibilidad y rendimiento](./13-seo-accesibilidad-y-rendimiento.md)
14. [Resolución de problemas](./14-resolucion-de-problemas.md)
15. [Deuda técnica priorizada](./15-deuda-tecnica.md)
16. [Plan de modularización](./16-plan-de-modularizacion.md)
17. [Checklist de publicación](./17-checklist-publicacion.md)
18. [Inventario de archivos](./18-anexo-inventario.md)

## Alcance de esta versión

Esta versión cubre código, configuración, contenido, rutas, datos, interacción, estilos, build y riesgos iniciales. Quedan pendientes de comprobación empírica:

- comportamiento en móvil real o viewport aproximado de `390 × 844 px`;
- pruebas en Safari, Firefox y navegadores móviles;
- resultados de Lighthouse y auditorías automatizadas;
- consola del navegador durante todas las rutas;
- configuración efectiva del repositorio y de Netlify, porque no se incluyeron `.git`, `netlify.toml` ni una URL desplegada;
- política editorial definitiva de cada sección.

## Regla de mantenimiento documental

Toda modificación estructural debe actualizar, como mínimo:

- el mapa de rutas;
- el contrato de contenido o datos afectado;
- la ficha del componente modificado;
- el registro de deuda técnica;
- el checklist de publicación cuando cambie el proceso de despliegue.
