# 17. Checklist de publicación y actualización

Esta lista se usa para el primer lanzamiento y para cada actualización de producción.

## Estado de infraestructura al 17 de julio de 2026

- [x] Build command: `npm run build`.
- [x] Publish directory: `dist`.
- [x] Base directory: raíz `/`.
- [x] Rama de producción: `main`.
- [x] Published deploy exitoso.
- [x] Dominio principal: `memogeopolitico.com`.
- [x] `www` redirige al dominio principal.
- [x] HTTPS habilitado con Let’s Encrypt.
- [x] Node 24 indicado por el commit de despliegue.
- [ ] Confirmar en una nueva copia del repositorio el archivo o variable que fija Node.
- [ ] Cambiar logs de deploy a privados si no se requiere acceso público.
- [ ] Versionar configuración en `netlify.toml`.

## Contenido

- [x] No quedan textos de muestra, dominios ficticios ni identificadores placeholder.
- [x] La URL pública de Ko-fi fue validada.
- [x] El sistema de apoyo puede activarse y desactivarse desde configuración.
- [x] El sistema permanece desactivado inicialmente en producción.
- [ ] Todas las alertas tienen profundidad válida.
- [ ] Fechas, autores, títulos y descripciones son correctos.
- [ ] Los artículos tienen fuentes revisadas y enlaces válidos.
- [ ] `/ensayos/` ofrece un índice útil.
- [ ] `/profundidad/` ofrece un índice útil o la navegación no lo promete.
- [ ] Prototipos están etiquetados explícitamente.

## Navegación

- [ ] Todos los enlaces del Header responden correctamente.
- [ ] `/profundizar` fue creado o reemplazado.
- [ ] `/analisis` fue creado o reemplazado.
- [ ] El logo vuelve a inicio.
- [ ] Existe menú móvil.
- [ ] Estado activo coincide con la sección.
- [ ] Existe página 404.

## Datos

- [ ] Excel y JSON fueron generados/sincronizados en la misma revisión.
- [ ] `total_fuentes` coincide con `records.length`.
- [ ] IDs son únicos.
- [ ] URLs y puntuaciones son válidas.
- [ ] Exportación CSV no crea fórmulas ejecutables.

## SEO

- [ ] `public/robots.txt` existe y permite indexación.
- [ ] El archivo publicado no contiene `Disallow: /`.
- [ ] Canonical usa `https://memogeopolitico.com`.
- [ ] Existe `public/default-og.png`.
- [ ] Cada artículo tiene título y description específicos.
- [ ] Sitemap se genera y responde.
- [ ] RSS se genera si se decide ofrecerlo.
- [ ] No se indexan páginas vacías o de prueba.
- [ ] Search Console recibe el sitemap.

## Accesibilidad

- [ ] Navegación completa por teclado.
- [ ] Orden de headings correcto.
- [ ] Dialog atrapa y restaura foco.
- [ ] Contraste verificado en ambos temas.
- [ ] Zoom 200 % no rompe funciones.
- [ ] Portada y directorio funcionan a 390 px.
- [ ] Mapa tiene alternativa no visual.

## Técnica

- [ ] `npm ci` o `npm install` termina correctamente.
- [ ] `npm run check` termina correctamente.
- [ ] `npm run build` termina sin errores.
- [ ] `npm run preview` revisado.
- [ ] Pruebas automáticas pasan.
- [ ] Consola del navegador sin errores.
- [ ] Dependencias auditadas.
- [ ] No se publican archivos fuera de `dist` por error conceptual.

## Netlify antes de fusionar a `main`

- [ ] Deploy Preview generado.
- [ ] Commit y rama correctos.
- [ ] Diferencias visuales revisadas.
- [ ] Build log sin errores nuevos.
- [ ] Assets esperados visibles en Deploy file browser.
- [ ] No hay secretos o datos sensibles en logs.

## Netlify después de publicar

- [ ] El deploy aparece como `Published`.
- [ ] El published deploy corresponde al commit esperado.
- [ ] Dominio principal abre la versión nueva.
- [ ] `www` redirige al dominio principal.
- [ ] HTTPS permanece activo.
- [ ] Smoke test de rutas completado.
- [ ] Se conserva un deploy anterior apto para rollback.

## Smoke test de rutas

- [ ] `/`
- [ ] `/directorio/`
- [ ] `/ensayos/`
- [ ] ensayo individual
- [ ] `/profundidad/` si existe
- [ ] profundidad individual
- [ ] URL inexistente
- [ ] `/robots.txt`
- [ ] sitemap
- [ ] `/default-og.png`
- [ ] descarga Excel
- [ ] exportación CSV
- [ ] mapa y sincronización con alertas

## Evidencia que debe conservarse

- captura del resumen de deploy;
- ID o commit publicado;
- resultado de build y tests;
- capturas de desktop y móvil;
- reporte Lighthouse;
- fecha y responsable de la publicación;
- cambios de DNS, certificado o aliases.
