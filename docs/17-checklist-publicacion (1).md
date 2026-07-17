# 17. Checklist de publicación

## Contenido

- [ ] No hay textos “Tu contenido aquí”, `ejemplo.com` ni `tu_usuario`.
- [ ] Todas las alertas tienen profundidad válida.
- [ ] Fechas, autores, títulos y descripciones son correctos.
- [ ] Los artículos tienen fuentes revisadas y enlaces válidos.
- [ ] `/ensayos/` y `/profundidad/` ofrecen índices útiles.

## Navegación

- [ ] Todos los enlaces del Header responden 200.
- [ ] El logo vuelve a inicio.
- [ ] Existe menú móvil.
- [ ] Estado activo coincide con la sección.
- [ ] Existe página 404.

## Datos

- [ ] Excel y JSON fueron generados/sincronizados en la misma revisión.
- [ ] `total_fuentes` coincide con `records.length`.
- [ ] IDs son únicos.
- [ ] URLs y puntuaciones son válidas.
- [ ] Prototipos están claramente etiquetados o retirados.

## SEO

- [ ] `robots.txt` permite indexación en producción.
- [ ] Canonical usa el dominio definitivo.
- [ ] Existe `default-og.png`.
- [ ] Cada artículo tiene título y description específicos.
- [ ] Sitemap y RSS se generan.
- [ ] No se indexan páginas vacías o de prueba.

## Accesibilidad

- [ ] Navegación completa por teclado.
- [ ] Orden de headings correcto.
- [ ] Dialog atrapa y restaura foco.
- [ ] Contraste verificado en ambos temas.
- [ ] Zoom 200 % no rompe funciones.
- [ ] Portada y directorio funcionan a 390 px.

## Técnica

- [ ] `npm ci` o `npm install` termina correctamente.
- [ ] `npm run check` termina correctamente.
- [ ] `npm run build` termina sin errores.
- [ ] `npm run preview` revisado.
- [ ] Pruebas automáticas pasan.
- [ ] Consola del navegador sin errores.
- [ ] Dependencias auditadas.

## Netlify

- [ ] Build command: `npm run build`.
- [ ] Publish directory: `dist`.
- [ ] Versión de Node fijada.
- [ ] Deploy Preview revisado.
- [ ] Dominio, HTTPS y DNS correctos.
- [ ] Cabeceras de seguridad configuradas.
- [ ] Redirecciones creadas si cambian slugs.

## Smoke test de rutas

- [ ] `/`
- [ ] `/directorio/`
- [ ] `/ensayos/`
- [ ] ensayo individual
- [ ] `/profundidad/`
- [ ] profundidad individual
- [ ] URL inexistente
- [ ] descarga Excel
- [ ] exportación CSV
- [ ] mapa y sincronización con alertas
