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
