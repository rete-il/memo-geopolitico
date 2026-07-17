# 01. Visión y alcance

## 1.1 Descripción funcional inferida

**Memo Geopolítico** es un sitio editorial y de inteligencia de fuentes abiertas que combina:

- alertas geopolíticas breves;
- visualización cartográfica de alertas recientes;
- artículos de profundización vinculados a las alertas;
- ensayos extensos;
- un directorio interactivo de medios y fuentes geopolíticas;
- módulos analíticos experimentales, como “Fricción vs. narrativa”.

La portada utiliza una arquitectura de tablero en tres columnas:

1. **Alertas y focos:** resumen editorial, región, fecha, severidad y vínculo a una pieza de profundidad.
2. **Termómetro global y análisis:** mapa de alertas más ensayos recientes.
3. **Fricción vs. narrativa:** prototipo de comparación entre escalada física y atención mediática.

## 1.2 Audiencias previsibles

La implementación actual es compatible con una audiencia interesada en geopolítica, periodismo, investigación, OSINT, análisis de medios y pensamiento crítico. No existe todavía autenticación, personalización ni segmentación de usuarios.

## 1.3 Capacidades actuales

| Capacidad | Estado | Observación |
|---|---|---|
| Portada editorial | Implementado y publicado | Renderiza alertas, mapa, ensayos recientes y panel derecho. |
| Alertas desde Markdown | Implementado | Dos alertas en la instantánea. |
| Relación alerta → profundidad | Implementado | Depende del campo manual `vinculo`. |
| Mapa Leaflet con clustering | Implementado | Datos filtrados a 14 días durante el build. |
| Ensayos desde Markdown | Implementado | Tres ensayos, con páginas individuales. |
| Archivo de ensayos | Pendiente | La ruta se genera, pero no renderiza tarjetas. |
| Artículos de profundidad | Implementado parcialmente | Dos páginas usan colección; una página Markdown es un placeholder fuera del modelo. |
| Directorio de medios | Implementado | Filtros, KPIs, gráficos CSS, tabla, modal, CSV, Excel y tema oscuro. |
| Fricción vs. narrativa | Prototipo | Datos estáticos; no hay flujo editorial, metodología ni actualización automática. |
| Catalizadores y escenarios | Pendiente | Existen archivos JSON no conectados a la interfaz. |
| Publicación en Netlify | Verificada | Dominio, published deploy, rama `main`, build y HTTPS documentados. |
| Alias beta | Inactivo por decisión | Registrado en Netlify, sin DNS verificado. No forma parte del entorno operativo. |

## 1.4 Entornos identificados

| Entorno | Dirección | Finalidad | Estado |
|---|---|---|---|
| Desarrollo | `http://localhost:4321/` mediante `npm run dev` | edición y recarga en caliente | Verificado |
| Preview local | `http://localhost:4321/` mediante `npm run preview` | validar el contenido de `dist/` | Verificado |
| Producción | `https://memogeopolitico.com` | sitio público | Verificado en Netlify |
| Dominio alternativo | `https://www.memogeopolitico.com` | redirección al dominio principal | Configurado |
| Subdominio Netlify | `https://memo-geopolitico.netlify.app` | dominio técnico del proyecto | Configurado |
| Beta | `beta.memogeopolitico.com` | reserva futura | Inactivo; DNS pendiente |

## 1.5 Límites actuales

- El sitio es **estático**. Las fechas relativas y la ventana temporal del mapa se recalculan únicamente al reconstruir el sitio.
- No existe CMS ni panel de administración.
- Los datos del directorio tienen dos representaciones —Excel y JSON— sin un generador incluido en la instantánea analizada.
- La navegación anuncia rutas que no existen.
- La experiencia móvil no fue validada visualmente y el encabezado no tiene menú adaptable.
- No existen pruebas automatizadas, validación `astro check`, lint ni CI documentada.
- El sitio ya está publicado: problemas antes clasificados como “pre-lanzamiento” deben tratarse ahora como incidencias de producción priorizadas.

## 1.6 Criterio de “terminado” para una función

Una función debería considerarse terminada solamente cuando:

1. tiene ruta o componente estable;
2. posee un contrato de datos tipado y validado;
3. funciona con teclado y viewport móvil;
4. gestiona estados vacío, error y carga cuando corresponda;
5. está incluida en build, pruebas y documentación;
6. no contiene URLs, usuarios o textos placeholder;
7. tiene propietario editorial o técnico y procedimiento de actualización;
8. fue verificada en un Deploy Preview o en producción sin errores de consola.
