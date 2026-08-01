# Project Charter

## 1. Nombre

**Memo Geopolítico — Reacondicionamiento, modularización y expansión regional**

## 2. Propósito

Transformar el sitio actual en una plataforma editorial y de monitoreo geopolítico modular, accesible, trazable y escalable, sin interrumpir la producción estable.

## 3. Objetivos

1. Corregir incidencias visibles y riesgos de producción.
2. Crear un sistema visual y técnico reutilizable.
3. Implementar navegación responsive con menú hamburguesa y acceso regional.
4. Crear páginas de regiones, subregiones y teatros estratégicos.
5. Convertir “Fricción vs. Narrativa” en un módulo editorial real, metodológicamente transparente.
6. Mejorar artículos, ensayos, mapa y Directorio.
7. Incorporar pruebas, accesibilidad, SEO, seguridad y proceso de release.

## 4. Alcance incluido

- Arquitectura de información.
- Design system y componentes.
- Navegación desktop/mobile.
- Taxonomía y páginas regionales.
- Monitor, mapa y Fricción vs. Narrativa.
- Experiencia editorial.
- Refactor del Directorio.
- Transparencia editorial.
- QA, CI, rendimiento y release.

## 5. Fuera de alcance inicial

- Automatización integral de atención mediática.
- Personalización por usuario.
- Aplicaciones móviles nativas.
- Sistema de cuentas o favoritos.
- CMS externo, salvo decisión posterior.
- Búsqueda global completa antes de normalizar metadatos.

## 6. Restricciones

- `main` debe permanecer estable hasta la aprobación de release.
- El desarrollo se integra en `beta`.
- `beta.memogeopolitico.com` no está activo por decisión de costos.
- Los indicadores editoriales no deben presentarse como métricas objetivas sin metodología, fuentes y nivel de confianza.
- Las nuevas rutas deben preservar enlaces publicados mediante redirects cuando corresponda.

## 7. Principios

- **Estado actual y futuro separados:** `docs/` frente a `project-management/`.
- **Fuente única de verdad:** taxonomías, tokens y contratos centralizados.
- **Accesibilidad por diseño:** teclado, foco, contraste y alternativa textual.
- **Progresive enhancement:** el contenido esencial no depende exclusivamente de JavaScript.
- **Transparencia editorial:** datos, interpretación, fuentes y metodología diferenciados.
- **Cambios verificables:** commits pequeños, criterios de aceptación y rollback.

## 8. Criterio de éxito

El proyecto se considera listo para producción cuando las puertas de calidad de Beta 6 están aprobadas y el merge `beta → main` puede realizarse con riesgo controlado y rollback probado.
