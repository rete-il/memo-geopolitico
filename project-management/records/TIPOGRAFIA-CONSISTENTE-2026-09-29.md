# Tipografía consistente del sitio

Solicitud: unificar fuentes y formatos y retirar los puntos finales de los títulos de página. Aplicado a todas las plantillas del sitio; sin despliegue a beta ni producción.

## Cambios

- `PageTitle.astro` concentra el H1 de las 27 plantillas. Ninguna página define tamaños propios de H1, tampoco en móvil.
- `global.css` define la escala compartida de página, sección, tarjeta, subsección y entradilla. Los títulos editoriales usan Georgia; la interfaz usa la tipografía del sistema. Se eliminó la referencia a Inter, que no se distribuía con el sitio.
- Títulos de página: tamaño adaptable entre 36 y 68 px con tamaño de texto raíz predeterminado, peso 500, interlineado 1.08 y espaciado -0.03em. Los títulos largos pueden ocupar varias líneas sin recorte.
- Secciones y tarjetas comparten tamaños e interlineado 1.2. Los antetítulos de Inicio y Opinión reutilizan la misma regla global. Las entradillas usan sans y la misma escala; los artículos conservan serif en el cuerpo de lectura.
- Retirados los puntos finales de los títulos estáticos. No se alteró la puntuación de citas, fuentes, preguntas ni datos editoriales.
- Plugin común de Markdown: omite un H1 que duplica el título de portada y conserva los demás como H2. Corrige las dos publicaciones que repetían título. La cronología independiente usa H2, mientras que las cronologías dentro de un expediente conservan H3.
- Nueva validación del HTML compilado, incluida en QA: un H1 no vacío por página, componente compartido y ausencia de punto de cierre. Archivo de verificación de Google excluido por no ser página de contenido.

## Verificación

- Compilación institucional: 803 páginas con título válido; 2.947 anclas internas sin destinos rotos.
- Compilación pública: 796 páginas con título válido; 2.923 anclas internas sin destinos rotos.
- Ocho pruebas de renderizado y navegación aprobadas. Revisión de tipos: cero errores y cero advertencias.
- Comprobación de estilos calculados en escritorio: misma familia, tamaño, peso, interlineado y espaciado en Inicio, Contacto, Acerca de, Opinión, Publicaciones, artículo, expediente, lectura de opinión, dashboard, nota metodológica y taxonomía.
- Comprobación móvil a 390 px en diez páginas representativas: sin desbordamientos de página ni de títulos. Revisión visual adicional a 768 px.
- `dist` y `dist-local` regenerados para los servidores locales de los puertos 8765 y 8766. Se conservan todos los indicadores de visibilidad pública.

## Mantenimiento

La escala se ajusta en `src/styles/global.css`; cada nuevo título de página se renderiza con `PageTitle`. El criterio se documentó en SPEC-007. Para revisar una compilación: `node tools/validate-typography.mjs dist-local` (o `dist`).
