# Centro local integrado de Memo Geopolítico

Versión integrada del Centro local con publicación segura, actualización corta del proceso y QA final en la **versión 0.10.0**.

Este paquete crea un único espacio de trabajo bajo:

```text
D:\Memo geopolitico\centro-local
```

No es un selector de instalaciones externas. Observatorio, Medios y Flujo editorial están incluidos dentro del Centro y se abren desde una sola interfaz.

## Qué resuelve

- un único procedimiento de inicio;
- una sola navegación visible;
- acceso a los tres módulos sin cambiar de carpeta en VS Code;
- datos de trabajo contenidos bajo `centro-local`;
- indicadores de salud del Observatorio, Medios y Flujo editorial;
- servidor restringido a `127.0.0.1`;
- separación del sitio público y del build de Netlify.

## Qué no hace todavía

- no unifica los formularios internos de los módulos;
- no modifica el Excel maestro; sus derivados se regeneran deliberadamente
  desde la raíz del proyecto;
- no ejecuta el QA del sitio sin confirmación humana explícita de la revisión responsive y de interacción;
- no realiza operaciones Git;
- no se comunica con ChatGPT ni con servicios externos.

Estas capacidades corresponden a las siguientes fases del documento funcional aprobado.

## Estructura

```text
centro-local\
├─ data\
│  ├─ medios\                         Excel maestro vigente
│  ├─ sesiones\                       estado de cada encargo editorial
│  ├─ paquetes\                       paquetes de revisión exportados
│  ├─ aplicaciones\                   transacciones de borradores canónicos
│  ├─ integraciones\                  transacciones de vista editorial local
│  ├─ promociones\                    transacciones de publicación local
│  ├─ actualizaciones-proceso\        transacciones de la ruta corta del proceso
│  ├─ publicaciones\borradores\       borradores canónicos aprobados
│  └─ backups\                        respaldos reversibles de aplicaciones, integraciones y publicaciones
├─ modules\
│  ├─ observatorio\                   Observatorio local v0.10.0
│  ├─ medios\                         dashboard de Medios
│  └─ flujo-editorial\                seguimiento editorial
├─ public\                             carcasa y navegación común
├─ lib\                                salud, rutas fijas e inicio de módulos
├─ tests\
├─ INICIAR-CENTRO.cmd
└─ server.mjs
```

Las rutas son relativas a la ubicación del Centro. Por eso no existe una primera configuración ni se piden carpetas externas.

## Uso habitual

1. Abrir `D:\Memo geopolitico` en VS Code.
2. Ejecutar `centro-local\INICIAR-CENTRO.cmd`.
3. Trabajar desde `http://127.0.0.1:4322`.
4. Detener el Centro con `Ctrl+C` en su terminal.

El inicio prepara internamente:

- Centro: `127.0.0.1:4322`;
- Observatorio: `127.0.0.1:4323`;
- Flujo editorial: `127.0.0.1:4324`.

El usuario no necesita abrir ni recordar esos puertos internos.

## Persistencia

- Observatorio guarda en `modules\observatorio\data\macroeventos.json` y crea sus backups.
- Flujo editorial guarda en `modules\flujo-editorial\data\state.json` y crea sus backups.
- El Excel vigente está en `data\medios\Medios_Matriz_Geopolitica_Navegacion_actualizado.xlsx`.
- Los análisis aprobados se aplican como borradores canónicos en `data\publicaciones\borradores`, fuera de `src` y del build público.
- Cada aplicación controlada registra su transacción en `data\aplicaciones` y su respaldo en `data\backups\aplicaciones`.
- Cada integración local registra su transacción en `data\integraciones` y su respaldo en `data\backups\integraciones`.
- La Fase 8 copia el borrador canónico aprobado a `src\content\publicaciones\_preview` para verlo en el sitio editorial local. Solo actualiza `src\data\public\observatorio.json` cuando la propuesta de seguimiento aprobada contiene diferencias.
- La Fase 9 crea o actualiza deliberadamente `src\content\publicaciones\publicadas\<slug>.md` después de comprobar el preview, las identidades, las fuentes y la ausencia de marcadores editoriales internos. Registra la operación en `data\promociones` y el respaldo en `data\backups\publicaciones`.
- La ruta **Actualizar proceso en evolución** modifica únicamente `src\data\public\observatorio.json`, conserva la aprobación del Markdown, valida el paquete público completo antes y después de escribir y registra backup en `data\backups\actualizaciones-proceso`.
- El control de sincronización del Observatorio se habilita automáticamente solo cuando los macroeventos guardados contienen identificadores nuevos para `src\data\public\observatorio.json`. Las actualizaciones de procesos existentes no lo activan. Al ejecutarlo, presenta primero un plan, conserva los estados editoriales, bloquea eliminaciones automáticas, exige confirmación y registra el respaldo en `data\backups\sincronizacion-observatorio`. No ejecuta Git ni despliegue.
- El dashboard de Medios, el Observatorio y el sitio público comparten una
  derivación de 93 registros generada desde el Excel maestro. Para
  resincronizarlos se ejecuta `npm run sync:media` desde la raíz del proyecto.

## Límites de seguridad

- Todos los servidores escuchan únicamente en `127.0.0.1`.
- El Centro no contiene claves API ni realiza cargas externas.
- Astro y Netlify no consumen la carpeta `centro-local`.
- La aplicación local exige plan verificado, confirmación explícita, escritura atómica y backup reversible.
- La integración local vuelve a validar identidad, hashes y destinos antes de escribir; bloquea cambios concurrentes y permite rollback mientras los archivos no hayan derivado.
- La vista editorial requiere que el usuario inicie Astro manualmente en modo `preview`; la ruta pública de producción no recibe el nuevo análisis.
- La publicación local exige fecha, plan previo y confirmación conjunta de revisión editorial, factual y visual. Incorpora el Markdown al próximo build de producción local, pero no ejecuta Git, GitHub ni despliegue.
- Una publicación o actualización no se considera completa si la validación canónica falla. El panel distingue señales verificadas de señales exportables y mantiene separados `analysis_revision` y `process_revision`.
- El QA final ejecuta pruebas, validación de datos, comprobaciones y builds únicamente después de que el usuario confirme escritorio, tablet, móvil, teclado, foco y persistencia. El estado `Listo para sincronizar` no ejecuta Git.
- Nada se sincroniza ni se publica sin una acción manual posterior del usuario.
