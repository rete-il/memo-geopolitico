# Notas de release

## Beta 0

**Estado:** Implementación editorial en revisión.

### Incluido

- Baseline técnico y documental.
- Sistema de project management y dashboard local.
- Administración de Relevancia vs. atención mediática.
- Arquitectura editorial Alertas, Focos y Dossiers.
- Cabecera editorial de dos niveles y menú hamburguesa izquierdo.
- Accesos públicos Inicio, Alertas, Focos, Dossiers, Acerca de y Medios.
- Compatibilidad temporal con Ensayos, Profundidad y Directorio.
- Tarjetas de Focos con párrafo completo, fecha de actualización y enlace.
- Responsive Preview v2 para escritorio, tablet y teléfono simultáneos.

### Validación realizada

- Astro Check y build aprobados en el paquete de implementación reconstruido.
- Portada revisada visualmente en localhost en tres viewports.
- Responsive Preview v2 ejecutado correctamente en Windows con Node 22.

### Pendiente antes del cierre

- Recorrido manual de todas las rutas nuevas y heredadas.
- Validación completa de teclado, Escape, trampa de foco y retorno de foco del menú.
- Revisión editorial de `/acerca-de/` y de los índices.
- Ejecución final de `npm run check`, `npm run build` y `git diff --check` en el repositorio instalado.
- Commit y push únicamente sobre `beta`.

### Riesgos conocidos

- La rama `beta` debe confirmarse antes de modificar archivos o hacer push.
- La URL beta pública permanece inactiva.
- Las fichas de Relevancia vs. atención mediática no sustituyen a Dossiers completos; son páginas contextuales de valoración editorial.

## Beta 4 — Compleción EE. UU.–China — 2026-10-01

**Estado:** integrada y validada en beta; review pendiente de revisión humana previa a un futuro pase a main.

- Cuatro expedientes y análisis propios: riesgos de IA, inversión saliente en tecnologías sensibles, bienes no sensibles y licencias de tierras raras.
- Tarjetas con complementarios y relaciones transversales diferenciados, enlaces explícitos, tipo y mecanismo; anclas compatibles para señales trasladadas.
- Cuatro traslados con propiedad única, cinco antecedentes nuevos, nueve fuentes nuevas y tres reverificadas. IA distingue diálogo informado de canal operativo, sin asignar puntuaciones ni probabilidades.
- Tres vínculos transversales conservados; sin incorporar Sahel ni alterar main o producción. La entrega beta y el futuro pase a main se registran como pasos separados.
- Detalles y comprobaciones: [COMPLECION-EEUU-CHINA-2026-10-01.md](COMPLECION-EEUU-CHINA-2026-10-01.md).
- Entrega de producto verificada: ac16472c1e1f2c57e4bbbcffdc5a3e4f5ecaf72f en origin/beta. QA: 326 pruebas, check/build público y editorial, datos, enlaces y revisión responsive aprobados. Main permanece en 5790d4a4c338e21d01820b64069b4249f76dc4a0.
