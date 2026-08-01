# QA de Fase 1 integrada

## Validación automática

Desde `D:\Memo geopolitico\centro-local`:

```powershell
npm run check
```

La validación debe confirmar:

- estructura fija sin configuración manual;
- Observatorio con 17 macroeventos y 314 temas;
- Excel canónico con 93 medios;
- vista actual de Medios con 92 registros;
- Flujo editorial con 13 etapas;
- servidor principal limitado a `127.0.0.1`;
- rechazo de recorridos de ruta fuera del Centro;
- ausencia de controles Git o publicación automática.

## Revisión visual manual

1. Ejecutar `INICIAR-CENTRO.cmd`.
2. Confirmar que se abre `http://127.0.0.1:4322`.
3. Revisar Inicio a 1440 px, 1024 px, 768 px y 390 px.
4. Entrar a Observatorio, Medios y Flujo editorial desde la barra lateral.
5. Confirmar que los módulos aparecen dentro de la misma ventana.
6. Probar `Tab`, `Shift+Tab`, foco visible y `Escape` en el menú móvil.
7. Verificar scroll horizontal y vertical en los tres módulos.
8. Confirmar que cerrar el Centro con `Ctrl+C` detiene también los módulos iniciados por él.

## Prueba controlada de persistencia

No modificar datos reales solo para probar. Durante la primera revisión:

- abrir y consultar los tres módulos;
- comprobar que los conteos coinciden;
- no pulsar Guardar si no existe un cambio editorial real.

Las escrituras y backups propios de Observatorio y Flujo editorial ya conservan su comportamiento previo.

## Fuera de esta QA

No ejecutar todavía:

- sincronización con el sitio Astro;
- `git add`;
- commit;
- push;
- merge a `main`.
