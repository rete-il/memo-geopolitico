# Workflow Editorial Dashboard

Dashboard local autónomo para documentar y seguir el proceso completo desde una propuesta de macroevento hasta un archivo Markdown definitivo.

## Qué incluye

- diagrama visual de 13 etapas agrupadas en 4 fases;
- detalle de entradas, acciones, salidas, responsables y puertas de control;
- seguimiento de múltiples documentos;
- estados por etapa, notas y rutas de artefactos;
- dos casos piloto: Corredor de Lobito e IMEC;
- validación local;
- guardado atómico y backups;
- exportación JSON;
- exportación de `FLUJO_EDITORIAL.md` con diagrama Mermaid y estado de documentos.

## Inicio

Desde esta carpeta:

```powershell
npm run open
```

La aplicación se abre en:

```text
http://127.0.0.1:4324
```

También puede iniciarse sin abrir el navegador:

```powershell
npm start
```

## Validación

```powershell
npm run check
```

## Archivos principales

```text
workflow-editorial-dashboard/
├── server.mjs
├── package.json
├── data/
│   ├── workflow.json
│   └── state.json
├── backups/
└── public/
    ├── index.html
    ├── app.js
    └── styles.css
```

## Persistencia

- `data/workflow.json` define el contrato del proceso.
- `data/state.json` contiene los documentos y sus avances.
- Cada guardado crea una copia previa en `backups/`.
- El dashboard no se conecta a Memo Geopolítico ni al Observatorio.

## Alcance

Esta versión documenta y administra el flujo. No genera artículos ni copia archivos a `src/content`. La integración con el Observatorio reformado se definirá después de validar el circuito con documentos reales.
