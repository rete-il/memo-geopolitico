# 20. Registro de verificación de producción

## 20.1 Finalidad

Este registro conserva qué se comprobó, con qué evidencia y qué queda pendiente. Debe actualizarse después de cambios de infraestructura o auditorías relevantes.

## 20.2 Registro del 17 de julio de 2026

| Comprobación | Resultado | Evidencia | Estado |
|---|---|---|---|
| Dependencias locales | 211 paquetes; 0 vulnerabilidades informadas | `evidencia-dev.png` | Verificado |
| Servidor local | Astro 7.0.7 en localhost:4321 | `evidencia-dev.png` | Verificado |
| Build local | 9 páginas, salida `static` | `evidencia-build.png` | Verificado |
| Preview local | Astro preview operativo | `evidencia-preview.png` | Verificado |
| Validación `check` | script ausente | `evidencia-check-sin-script.png` | Limitación conocida |
| Configuración Netlify | build `npm run build`, publish `dist` | `netlify-build-settings.png` | Verificado |
| Published deploy | `main@9b2b70d`, 13 s de build | `netlify-published-deploy.png` | Verificado |
| Dominio principal | `memogeopolitico.com` | `netlify-production-domains.png` | Verificado |
| Redirección `www` | automática al principal | `netlify-production-domains.png` | Verificado |
| HTTPS | habilitado, Let’s Encrypt | `netlify-https-certificate.png` | Verificado |
| Beta | alias con DNS pendiente | `netlify-production-domains.png` | Inactivo por decisión |

## 20.3 Verificaciones funcionales disponibles

Las capturas visuales muestran correctamente:

- portada de escritorio;
- un artículo de profundidad;
- un ensayo individual;
- build y preview locales.

Los enlaces de las tarjetas de alertas y ensayos fueron indicados por el propietario como correctos. La columna “Fricción vs. narrativa” fue declarada como prototipo.

## 20.4 Verificaciones pendientes

| Área | Prueba pendiente | Herramienta sugerida |
|---|---|---|
| Rutas | códigos HTTP y redirecciones | Playwright, curl o crawler |
| Enlaces | enlaces internos y externos rotos | Linkinator o script propio |
| Móvil | 390 × 844 y dispositivos reales | DevTools + móvil |
| Accesibilidad | teclado, axe y lector de pantalla | axe, Lighthouse, NVDA/VoiceOver |
| Rendimiento | Core Web Vitals | Lighthouse / PageSpeed Insights |
| SEO | robots, sitemap, canonical, OG | navegador + validadores |
| Seguridad | cabeceras, CSP, caché | DevTools / SecurityHeaders |
| Consola | errores en cada ruta | DevTools / Playwright |
| Directorio | filtros, modal, CSV, Excel | pruebas funcionales |
| Mapa | carga de tiles y sincronización | prueba de red y teclado |

## 20.5 Plantilla para futuras verificaciones

```markdown
## AAAA-MM-DD — <versión o commit>

- Responsable:
- Entorno:
- Rama:
- Commit:
- Deploy ID/permalink:
- Build:
- Pruebas ejecutadas:
- Resultado:
- Incidencias:
- Rollback disponible:
- Evidencia adjunta:
```

## 20.6 Criterio de cierre de una publicación

Una publicación se considera validada cuando:

1. el deploy es `Published`;
2. el commit coincide con el esperado;
3. build y pruebas pasan;
4. rutas principales responden;
5. no hay errores de consola;
6. navegación móvil es utilizable;
7. metadata y assets sociales existen;
8. HTTPS y dominio permanecen correctos;
9. existe rollback;
10. se actualiza este registro.
