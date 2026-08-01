# Centro local integrado de Memo Geopolítico

Versión **0.2.0** de la Fase 1 corregida.

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
- no actualiza automáticamente el Excel ni sus derivados;
- no ejecuta la sincronización del sitio;
- no ejecuta QA del sitio;
- no realiza operaciones Git;
- no se comunica con ChatGPT ni con servicios externos.

Estas capacidades corresponden a las siguientes fases del documento funcional aprobado.

## Estructura

```text
centro-local\
├─ data\
│  ├─ medios\                         Excel maestro vigente
│  ├─ sesiones\                       reservado para revisiones futuras
│  └─ backups\                        reservado para backups comunes futuros
├─ modules\
│  ├─ observatorio\                   Observatorio local v0.6.0
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
- El dashboard de Medios conserva por ahora su vista derivada de 92 registros. La integración editable del Excel corresponde a la Fase 3.

## Límites de seguridad

- Todos los servidores escuchan únicamente en `127.0.0.1`.
- El Centro no contiene claves API ni realiza cargas externas.
- Astro y Netlify no consumen la carpeta `centro-local`.
- Nada se sincroniza ni se publica sin una acción manual posterior del usuario.
