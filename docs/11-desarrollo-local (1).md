# 11. Desarrollo local

## 11.1 Requisitos

- Node.js `>=22.12.0` según `package.json`.
- npm.
- VS Code recomendado.

La comprobación del propietario se realizó con Node `v24.18.0` y npm `9.8.1`.

## 11.2 Instalación

Desde la raíz del proyecto:

```powershell
npm install
```

Resultado comprobado: dependencias actualizadas, 211 paquetes auditados y 0 vulnerabilidades informadas.

## 11.3 Servidor de desarrollo

```powershell
npm run dev
```

Ruta local habitual:

```text
http://localhost:4321/
```

Astro observa cambios en archivos y actualiza la vista.

## 11.4 Build

```powershell
npm run build
```

Resultado comprobado:

- modo `static`;
- salida en `dist/`;
- 9 páginas generadas;
- build completado correctamente.

## 11.5 Preview de producción

```powershell
npm run preview
```

`preview` sirve el contenido de `dist`. Debe ejecutarse después de un build reciente.

## 11.6 Scripts disponibles

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro"
}
```

No existe `check`; por eso `npm run check` devuelve `Missing script: "check"`.

## 11.7 Flujo diario recomendado

1. `git pull` o actualizar la copia de trabajo.
2. `npm install` si cambió el lockfile.
3. `npm run dev`.
4. editar contenido o código;
5. revisar portada, ruta afectada y directorio;
6. detener servidor con `Ctrl+C`;
7. `npm run build`;
8. `npm run preview`;
9. revisar consola y enlaces;
10. confirmar cambios en Git.

## 11.8 Scripts a añadir en la fase de reacondicionamiento

```json
{
  "check": "astro check",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "lint": "eslint .",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "validate:data": "tsx scripts/validate-data.ts"
}
```

La selección final de herramientas debe fijarse antes de modificar `package.json`.

## 11.9 No editar

- `dist/`;
- `.astro/`;
- `node_modules/`;
- archivos minificados o generados.

Los cambios deben hacerse en `src/`, `public/` o configuración fuente.
