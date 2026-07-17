# 10. JavaScript, estado e interactividad

## 10.1 Portada: Nanostores

`src/store/mapStore.ts` expone:

```ts
export const activeAlertId = atom<string | null>(null);
```

Lo consumen `AlertCard.astro` y `MapaGlobal.astro`.

### Flujo

- hover sobre tarjeta → `activeAlertId` recibe slug;
- marcador mouseover/click → recibe ID;
- suscriptores agregan anillo y escala a la tarjeta;
- marcador o cluster recibe clase de pulso;
- mouseout/leave → valor `null`.

### Limitaciones

- no hay interacción equivalente en `focus`, `focusin` o teclado;
- click del marcador no navega al artículo;
- los tipos de alertas y marcadores son `any`;
- los listeners y suscripciones no se limpian, aceptable en páginas sin transiciones, pero deberá revisarse si se activan View Transitions;
- la animación usa `rgba(inherit, …)`, una expresión CSS no válida en `box-shadow`, aunque el efecto principal depende del borde `currentColor`.

## 10.2 Mapa

Dependencias globales:

- Leaflet 1.9.4;
- Leaflet.markercluster 1.5.3;
- tiles CARTO con atribución OpenStreetMap/CARTO.

La página incrusta datos en un `<script type="application/json">`. El cliente los parsea, ordena y crea marcadores.

No existe recuperación si:

- CDN no carga;
- `L` no está definido;
- tiles fallan;
- el payload tiene formato inválido.

## 10.3 Directorio: estado local

El estado incluye búsqueda, seis filtros categóricos, puntuación mínima, orden, dirección, página y tamaño de página.

### Funciones principales

| Función | Responsabilidad |
|---|---|
| `normalize` | búsqueda sin tildes y case-insensitive. |
| `escapeHtml` | evita insertar HTML desde datos. |
| `safeUrl` | permite solo HTTP/HTTPS. |
| `readUrl` / `updateUrl` | sincronización parcial con query string. |
| `getFiltered` | filtros y orden. |
| `renderKpis` | cinco indicadores. |
| `renderBars` | gráficos de barras CSS. |
| `renderDonut` | donuts por `conic-gradient`. |
| `renderTable` | paginación y filas. |
| `openModal` | ficha completa. |
| `exportCsv` | exportación de resultados filtrados. |
| `initTheme` | tema persistente. |

### Fortalezas

- código aislado en IIFE;
- sanitización de HTML y URLs;
- búsqueda normalizada;
- filtros compartibles mediante URL;
- debounce de búsqueda;
- estados vacío y error de dataset;
- CSV con BOM UTF-8;
- Escape y click de backdrop para cerrar modal.

### Riesgos

- contrato de datos no tipado;
- `rootEl` y elementos se asumen existentes;
- parámetros URL no se validan;
- `min=texto` puede producir `NaN`;
- `orden` puede contener una clave desconocida;
- página y tamaño no se preservan en URL;
- el modal no atrapa foco ni devuelve foco al botón de origen;
- las plantillas HTML son largas y difíciles de probar;
- la exportación CSV no mitiga fórmulas que comienzan con `=`, `+`, `-` o `@`;
- colores de gráficos están hardcodeados en JS;
- el archivo público no pasa por TypeScript.

## 10.4 Dependencias externas

La portada usa tres recursos CDN sin Subresource Integrity. La disponibilidad y el rendimiento del sitio dependen de terceros. Antes de publicación se debe decidir entre:

- instalar dependencias en npm y empaquetarlas con Vite;
- conservar CDN con versiones fijadas, SRI, fallback y política CSP compatible.

## 10.5 JavaScript no utilizado

`src/utils/time.ts` no tiene referencias. Puede ser una utilidad prevista o código obsoleto. No debe eliminarse hasta confirmar intención, pero conviene integrarlo o retirarlo.
