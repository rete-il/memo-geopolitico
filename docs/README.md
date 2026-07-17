# Documentación técnica — Memo Geopolítico

**Versión documental:** 2.0  
**Fecha del relevamiento inicial:** 16 de julio de 2026  
**Actualización de producción:** 17 de julio de 2026  
**Estado del producto:** publicado en producción  
**URL canónica:** `https://memogeopolitico.com`  
**Stack relevado:** Astro 7.0.7, Tailwind CSS 4.3.2, TypeScript, JavaScript, Nanostores y Netlify

## Propósito

Esta carpeta documenta el sitio **tal como está construido en la instantánea de código analizada** y separa esa instantánea del estado comprobado en Netlify. No supone que las recomendaciones ya fueron implementadas.

La documentación diferencia seis estados:

| Marca | Significado |
|---|---|
| **Implementado** | Existe en el código y fue comprobado en desarrollo, build o preview. |
| **Verificado en producción** | Existe evidencia de Netlify o del dominio publicado. |
| **Prototipo** | Existe visualmente o con datos de muestra, pero no como módulo editorial completo. |
| **Pendiente** | Está anunciado, enlazado o esbozado, pero no implementado. |
| **Riesgo** | Puede causar errores, inconsistencias, problemas de accesibilidad, SEO o publicación. |
| **Deuda técnica** | Funciona actualmente, pero dificulta mantenimiento, pruebas o escalabilidad. |

## Evidencia técnica disponible

### Entorno local

- Node.js usado por el propietario: `v24.18.0`.
- npm usado por el propietario: `9.8.1`.
- `npm install`: correcto, 211 paquetes auditados y 0 vulnerabilidades informadas.
- `npm run dev`: correcto en `http://localhost:4321/`.
- `npm run build`: correcto; salida `static`, carpeta `dist/`, 9 páginas generadas.
- `npm run preview`: correcto en `http://localhost:4321/`.
- `npm run check`: no existe como script; no representa una falla del build, sino una validación aún no configurada.

### Producción

- Proyecto Netlify: `memo-geopolitico`.
- Published deploy desde la rama `main`.
- Commit documentado: `9b2b70d`.
- Build: 13 segundos; deploy total: 14 segundos.
- 16 archivos nuevos enviados; 9 páginas generadas y 7 assets modificados.
- Todas las fases del deploy figuran como `Complete`.
- Dominio principal: `memogeopolitico.com`.
- `www.memogeopolitico.com` redirige al dominio principal.
- HTTPS habilitado mediante certificado Let’s Encrypt administrado por Netlify.
- `beta.memogeopolitico.com` permanece como alias inactivo con verificación DNS pendiente por decisión operativa.

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
19. [Entorno de producción y Netlify](./19-entorno-produccion-netlify.md)
20. [Registro de verificación de producción](./20-registro-verificacion-produccion.md)

## Alcance de esta versión

La versión 2.0 cubre:

- código, configuración, contenido, rutas, datos, interacción y estilos;
- build y preview locales;
- configuración efectiva de build en Netlify;
- rama y commit del published deploy;
- dominios de producción, redirección `www` y certificado TLS;
- diferencias conocidas entre la instantánea entregada y el repositorio desplegado;
- riesgos de producción y procedimiento de rollback.

Quedan pendientes de comprobación empírica o automatizada:

- viewport móvil real o aproximado de `390 × 844 px`;
- Safari, Firefox y navegadores móviles;
- Lighthouse y Core Web Vitals;
- consola y red del navegador en todas las rutas;
- respuesta HTTP real de rutas inexistentes, `robots.txt`, sitemap y assets sociales;
- cabeceras de seguridad efectivamente servidas;
- política editorial definitiva de cada sección.

## Regla de mantenimiento documental

Toda modificación estructural debe actualizar, como mínimo:

- el mapa de rutas;
- el contrato de contenido o datos afectado;
- la ficha del componente modificado;
- el registro de deuda técnica;
- el checklist de publicación;
- el registro de producción cuando cambien dominio, rama, runtime, build o plataforma.
