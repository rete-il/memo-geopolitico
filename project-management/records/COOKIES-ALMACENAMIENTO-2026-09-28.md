# Política de cookies y control de preferencias

Se completó la página `/cookies/` con el almacenamiento real del sitio y un control para eliminar la preferencia del Observatorio. Se mantiene el indicador institucional existente: disponible en revisión local, sin publicación en beta o producción.

## Funcionamiento

- Inventario central en `tools/lib/browser-storage-policy.mjs`: finalidad, tecnología, duración, clave y valores de la preferencia. La política y el Observatorio consumen el mismo módulo.
- La preferencia recuerda la vista lista/tarjetas. La página explica que se guarda en el navegador y que el código del sitio no la envía a un servidor. No se incorporaron cookies publicitarias, analítica ni un banner de aceptación.
- El componente `BrowserStorageControls.astro` muestra el estado actual, permite borrar únicamente la preferencia y comunica el resultado. La información técnica está plegada y el botón se desactiva si no hay una preferencia válida guardada o no se puede acceder al almacenamiento.
- La lectura y restauración no escriben datos. Cambiar de vista guarda la elección. El Observatorio conserva su funcionamiento si el navegador impide leer o escribir almacenamiento.
- Restablecer la preferencia no constituye un bloqueo permanente del almacenamiento: elegir una vista vuelve a guardarla. El texto lo explica. El control solo afecta a la dirección del sitio y al navegador desde los que se utiliza.

La referencia técnica consultada fue [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage): persistencia por origen, ausencia de vencimiento automático y posibles errores de acceso. El texto no declara una conclusión jurídica sobre consentimiento ni cumplimiento normativo.

## Verificación

- 16 pruebas aprobadas de almacenamiento, política institucional y presentación. Ocho cubren almacenamiento: conservación de claves ajenas, valores inválidos, acceso bloqueado, fallos de lectura/escritura, SSR y restauración real del script sin escritura.
- Astro: cero errores y advertencias; 56 avisos informativos previos.
- Compilaciones pública e institucional completadas. Validación de navegación: 2.923 y 2.947 anclas respectivamente, sin anclas rotas.
- Navegador en localhost: selección de tarjetas, persistencia tras recargar, reconocimiento en la política, borrado con confirmación y regreso a vista de lista. Una segunda visita a la política confirma que el Observatorio no recreó la preferencia durante la carga.
- Vista de 390 píxeles sin desbordamiento horizontal. Se preservó el estado inicial sin preferencia guardada después de la prueba.
