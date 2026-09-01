# Auditoría transversal y preparación de la arquitectura de macroeventos rectores

**Fecha:** 2026-08-31

**Fecha de corte:** 2026-08-31

**Revalidación integral:** 2026-09-01

**Rama examinada:** `beta`

**Decisión:** **ARQUITECTURA LISTA PARA EL RECTOR MUNDIAL**

**Objeto:** puerta editorial previa al eventual rector «Acoplamiento de conflictos regionales y riesgo de confrontación sistémica mundial»
**Exclusiones:** no crea ese rector ni otro macroevento; no publica, no despliega y no modifica `main`.

## 1. Resumen ejecutivo

La arquitectura contiene **11 rectores**, incluida la capa nuclear añadida en el árbol de trabajo, y ofrece cobertura sustantiva suficiente para estudiar un futuro acoplamiento mundial. Todos tienen ficha canónica, escenarios base/adverso/transformador, indicadores, señales con fuentes y una pieza analítica publicada o de vista editorial. Las 87 señales rectoras tienen fuente, estado verificado y un ID único dentro del inventario auditado; las 139 entradas de fuentes no presentan IDs repetidos.

La intervención autorizada el 1 de septiembre cerró el bloqueo de arquitectura de datos. Los 30 vínculos heredados entre rectores se representan ahora como objetos con tipo, mecanismo, dirección, reciprocidad, evidencia, revisión, justificación y condición de refutación. Las 214 señales del corpus —87 pertenecientes a rectores— declaran un `propietario_macroevento_id` único; 26 usos de segundo orden se registran por referencia y no por copia. Los campos planos se conservan temporalmente sólo por compatibilidad.

La migración clasificó 4 relaciones como relacionadas, 18 como amplificadoras, 1 como contenedora, 5 como contextuales y 2 como coincidentes. Las cuatro relaciones contextuales/coincidentes sin señal causal asignada hacen explícita la ausencia de causalidad demostrada; no son vacíos encubiertos. La proyección pública expone tipo y mecanismo, pero omite justificación y estado editorial internos.

## 2. Metodología

Se contrastaron la fuente canónica, la proyección pública, las publicaciones, los expedientes editoriales, las exportaciones derivadas, la documentación y Git. Se distinguió incompletitud estructural de incertidumbre legítima. Las pruebas automatizadas contaron identidades, vínculos, señales, fuentes y estados; la revisión editorial aplicó adicionalidad, delimitación, mecanismo causal, evidencia contraria y condiciones de refutación. Las afirmaciones externas ya verificadas en la auditoría de vacíos del mismo corte se conservaron como antecedente y no se reabrió investigación coyuntural.

## 3. Estado de Git y procedencia

- Rama activa confirmada: `beta`; `HEAD` en `f08db0a`, un commit por delante de `origin/beta`.
- `main` local permanece en `f537790` y no fue cambiado ni fusionado.
- El árbol de trabajo ya contenía, antes de esta auditoría, cambios canónicos y derivados extensos: nuevos rectores, proyección pública, catálogo de medios, pruebas, componentes, eliminaciones regenerables de `_preview`, exportaciones `notion-export/` y dos herramientas de exportación.
- Los seis rectores más recientes —África central, remilitarización, hemisferio occidental, derechas transnacionales, Indo-Pacífico y nuclear— son trabajo preexistente sin confirmar y no se atribuyen a este informe.
- `.pnpm-store/`, cachés, dependencias, respaldos y archivos temporales quedan excluidos.
- Cambio propio de esta auditoría: únicamente este informe canónico.

## 4. Fuentes canónicas y derivadas

| Función | Ubicación | Tratamiento |
|---|---|---|
| Fichas, señales, fuentes, relaciones y expedientes editoriales | `centro-local/modules/observatorio/data/macroeventos.json` | fuente canónica |
| Análisis publicados | `src/content/publicaciones/publicadas/` | fuente editorial de publicación |
| Análisis en desarrollo | `src/content/publicaciones/_preview/`, regenerada desde `centro-local/data/publicaciones/borradores/` | vista editorial derivada |
| Proyección pública saneada | `src/data/public/observatorio.json` | derivada mediante sincronización |
| Vista editorial local | `local-preview/` | derivada e ignorada |
| Exportaciones documentales | `notion-export/expedientes/` y `notion-export/produccion/` | derivadas |
| Sincronización | `npm run sync:local -- --config local-sources.json` | regenera proyecciones |
| Validación integral | `npm run qa` | pruebas, datos, tipos, builds y validación |

No se corrigió manualmente ninguna copia derivada.

## 5. Inventario definitivo e integridad

“Expediente” distingue el expediente editorial dedicado del expediente/ficha pública. Los cinco rectores anteriores al subsistema de expedientes carecen de expediente editorial dedicado, pero tienen ficha canónica y expediente público completo; la excepción es explícita y no bloquea por sí sola. Los seis recientes tienen expediente editorial dedicado y análisis de vista editorial.

| ID abreviado | Estado / verificación | Corte | Ficha | Análisis | Expediente | Señales / fuentes | Resultado |
|---|---|---:|---|---|---|---:|---|
| `corredores-alternativos-redes-logisticas-redundantes` | revisión / parcial | 2026-08-28 | completa | publicado | público; excepción histórica | 6 / 7 | íntegro |
| `turquia-potencia-bisagra-reordenamiento-regional` | revisión / parcial | 2026-08-21 | completa | publicado | público; excepción histórica | 4 / 7 | íntegro |
| `sudan-guerra-civil-regionalizacion-mar-rojo` | revisión / parcial | 2026-08-28 | completa | publicado | público; excepción histórica | 6 / 10 | íntegro |
| `medio-oriente-acuerdos-abraham-guerra-regionalizada` | revisión / verificado | 2026-08-29 | completa | publicado | público; excepción histórica | 5 / 14 | íntegro |
| `rusia-ucrania-redes-seguridad-sostenimiento` | revisión / parcial | 2026-08-30 | completa | publicado | público; excepción histórica | 6 / 9 | íntegro |
| `africa-central-minerales-criticos-cadenas-tecnologicas` | borrador / parcial | 2026-08-30 | completa | editorial | `exp-africa-central-minerales-criticos-20260830` | 8 / 7 | íntegro |
| `remilitarizacion-industrial-cadenas-estrategicas-bloques` | borrador / parcial | 2026-08-30 | completa | editorial | `exp-remilitarizacion-industrial-20260830` | 10 / 16 | íntegro |
| `estados-unidos-reordenamiento-hemisferio-occidental` | borrador / parcial | 2026-08-30 | completa | editorial | `exp-estados-unidos-hemisferio-20260830` | 10 / 16 | íntegro |
| `derechas-transnacionales-reconfiguracion-america-latina` | borrador / parcial | 2026-08-30 | completa | editorial | `exp-derechas-transnacionales-america-latina-20260830` | 8 / 20 | íntegro |
| `indo-pacifico-taiwan-reconfiguracion-seguridad` | borrador / parcial | 2026-08-31 | completa | editorial | `exp-indo-pacifico-taiwan-20260831` | 12 / 17 | íntegro |
| `erosion-control-armamentos-disuasion-nuclear-multipolar` | borrador / parcial | 2026-08-31 | completa | editorial | `exp-erosion-control-armamentos-nuclear-20260831` | 12 / 16 | íntegro |

Los 11 IDs son únicos y estables. Todos contienen descripción causal, actores e intereses, tres escenarios, indicadores, evaluación e incertidumbres. Remilitarización, hemisferio occidental, derechas transnacionales, Indo-Pacífico y nuclear añaden un escenario explícito de reversión; en los seis rectores restantes la reversión está distribuida entre el escenario transformador, los indicadores y los factores de contención, con comparabilidad desigual pero sin ausencia temática total.

## 6. Auditoría de señales y política de propiedad única

Resultado cuantitativo: **87 señales**, 0 IDs duplicados, 0 señales sin fuentes, 0 señales sin estado verificado. No se detectó duplicación exacta inequívoca entre rectores. Sí existen hechos o publicaciones compartidos que son usos transversales legítimos —por ejemplo Rusia–Corea del Norte, el informe militar anual sobre China y la verificación del OIEA en Irán— y señales relacionadas pero distintas por mecanismo.

Política implementada en la intervención del 1 de septiembre:

1. Cada señal tiene un solo `propietario_macroevento_id`, definido por el proceso donde ocurre el hecho y se interpreta su mecanismo primario.
2. Otros rectores usan `referencias_senal` con `senal_id`, `tipo_uso` (`relacionada`, `amplificadora`, `contenedora`, `contextual`, `coincidente`) y `efecto_segundo_orden`; no copian la señal.
3. Fecha, actores o mecanismo distintos justifican señales separadas; semejanza textual no basta para consolidar.
4. Una consolidación conserva alias, propietarios anteriores, fecha, motivo y responsable editorial.
5. Una señal analítica transversal debe identificarse como síntesis y apuntar a evidencias primarias; no puede simular un hecho nuevo.
6. El validador bloquea dos propietarios, referencias huérfanas y copias exactas; advierte similitud semántica para decisión humana.

Clasificación observada: duplicación exacta 0; duplicación semántica crítica 0; relacionadas pero distintas, presentes; uso transversal legítimo, presente; coincidencia sin causalidad, representada explícitamente por el tipo `coincidente`; propiedad ambigua, 0 tras exigir y validar el campo de propietario único.

## 7. Auditoría de fuentes

En los rectores hay **139 entradas**, 0 IDs duplicados y 4 URLs reutilizadas. Tres reutilizaciones mantienen título y fecha compatibles; la del OIEA sobre Irán usa una página viva con fechas distintas y debe conservarse como referencia compartida, no como dos publicaciones independientes. No se eliminó ninguna fuente.

Las cuatro URLs compartidas corresponden a: tratado Rusia–Corea del Norte; Development Road iraquí; informe anual estadounidense sobre China; y página de verificación del OIEA sobre Irán. La reutilización es legítima, pero una futura capa de catálogo debería separar `recurso_fuente` global de su uso editorial por rector.

No hay señales rectoras sin fuente verificable. Existe dependencia apreciable de fuentes oficiales en nuclear y de agencias/medios anglófonos en varios rectores; se compensa parcialmente con organismos multilaterales, centros regionales y fuentes en español, portugués, turco, chino, ruso, árabe, persa, hebreo, italiano, francés y alemán. Advertencia no bloqueante: profundizar diversidad africana, surasiática y coreana y registrar contradicciones en un campo específico.

## 8. Auditoría de relaciones

Los **30 vínculos rector–rector** fueron migrados sin crear reciprocidad ficticia. Las relaciones amplificadoras y contenedoras conservan dirección `origen_destino`; las relacionadas, contextuales y coincidentes usan un único objeto bidireccional con reciprocidad explícita. Cada vínculo diferencia mecanismo causal, interacción contextual o mera coincidencia.

El contrato implementado exige `id`, `origen_id`, `destino_id`, `tipo`, `mecanismo`, `evidencia_senal_ids`, `direccion`, `reciprocidad`, `estado_revision`, `justificacion` y `condicion_refutacion`. El validador bloquea extremos inexistentes, autorrelaciones, tipos inválidos, mecanismos incompletos, evidencia huérfana, doble propiedad y referencias transversales hacia señales propias.

## 9. Matriz transversal de mecanismos

Escala: **P** propietario principal; **A** cobertura alta; **M** media; **B** baja; **—** no material. Los rectores relacionados se indican por abreviatura: COR corredores, TUR Turquía, SUD Sudán, MO Medio Oriente, RU Rusia–Ucrania, MIN minerales, REM remilitarización, EUA hemisferio, DER derechas, IP Indo-Pacífico, NUC nuclear.

| Mecanismo | Propietario principal | Relacionados | Cobertura | Señales / vacío / duplicación |
|---|---|---|---|---|
| Alianzas | IP | RU, NUC, MO, TUR | A | garantías y redes; falta tipado causal |
| Actores bisagra | TUR | COR, MO, RU, IP | A | señales propias; riesgo de sobreatribuir mediación |
| Movilización industrial | REM | RU, IP, TUR, NUC | A | contratos/entregas; evitar copiar gasto |
| Minerales críticos | MIN | REM, IP, EUA, COR | A | extracción/procesamiento; buena propiedad |
| Energía | MO | TUR, COR, RU, EUA | A | rutas y coerción; propiedad por hecho |
| Corredores | COR | TUR, MIN, EUA, IP, RU | A | alta densidad; mayor riesgo de duplicación |
| Sanciones | RU | MO, EUA, REM, COR | M | falta capa financiera comparada |
| Pagos y finanzas | sin propietario | RU, COR, EUA, MO | B | vacío transversal delimitado |
| Tecnología | IP | REM, MIN, EUA, NUC | A | dependencias compartidas; falta capa explícita |
| Semiconductores | IP | REM, MIN | A | señales suficientes |
| Inteligencia artificial | REM | IP, NUC | M | falta adopción, mando y falsos positivos |
| Ciberespacio | IP | RU, NUC, EUA | M | faltan atribución y preposicionamiento comparables |
| Espacio exterior | NUC | IP, REM, RU | M | faltan dependencia privada y reversión |
| Infraestructura crítica | COR | IP, EUA, NUC, RU | A | cables/puertos; riesgo de conexión temática |
| Disuasión nuclear | NUC | IP, RU, MO, EUA | A | integrada |
| Proliferación | NUC | MO, IP, TUR | A | integrada con latencia y garantías |
| Actores armados no estatales | MO | SUD, TUR, RU | A | propiedad regional clara |
| Coerción económica | EUA | RU, IP, MO, COR | M | falta transmisión financiera |
| Guerra de información | DER | RU, EUA, IP | M | falta distinción coordinación/coincidencia |
| Fragilidad estatal | SUD | MO, MIN | A | Sahel insuficiente |
| Migración | EUA | SUD, MO | M | Sahel/costas incompletos |
| Seguridad alimentaria | SUD | RU, MO, COR | M | falta indicador común |
| Escalada | NUC | MO, RU, IP, SUD | A | vocabulario común definido abajo |
| Propagación | RU | MO, SUD, COR, NUC | A | comparable con cautela |
| Contención | NUC | MO, TUR, IP, RU | M | mecanismos presentes, no tipados |
| Mediación | TUR | MO, SUD, RU | A | distinguir oferta de resultado |
| Desacoplamiento | NUC | RU, IP, MO | M | indicadores nuevos, sin contrato global |
| Reversión | NUC | REM, COR, RU, MO | M | desigual fuera de nuclear |

## 10. Indicadores comunes

Se adopta como vocabulario editorial, sin puntuación automática:

- **Acoplamiento:** coordinación operativa; capacidades transferidas por otra guerra; represalia interteatros; activación de defensa; logística/inteligencia/financiación compartida; simultaneidad planificada; decisión conjunta verificable.
- **Propagación:** nuevos actores; extensión geográfica; rutas interrumpidas; transmisión financiera; proliferación tecnológica/militar; regionalización; expansión de sanciones.
- **Contención:** comunicación militar; mediación con resultado; límites operativos; acuerdos parciales; no activación de alianzas; separación deliberada; transparencia/notificación.
- **Desacoplamiento:** menor apoyo externo; negociaciones separadas; restablecimiento de comercio/comunicación; neutralidad activa; divergencia aliada; rechazo explícito a vincular crisis.
- **Reversión:** desmovilización; reducción sostenida de presupuestos excepcionales; restauración de tratados; retirada; reapertura de cadenas; reinstitucionalización; caída sostenida de señales.

Interpretación: se exige un conjunto de señales independientes, secuencia temporal y mecanismo; no se suman menciones. Falsos positivos principales: simultaneidad no planificada, ejercicios rutinarios, retórica, memorandos sin ejecución, reapertura puntual, mediación ofrecida sin efecto, reducción presupuestaria nominal y divergencia táctica presentada como ruptura.

## 11. Delimitación económico-financiera

Las seis hipótesis siguen abiertas, pero la evidencia interna favorece **diversificación parcial dentro de un sistema todavía integrado**: sanciones y controles crean rutas de pagos, facturación y financiación alternativas; la persistencia del dólar, la liquidez, la compensación, los seguros y la interdependencia bancaria limitan una narrativa de ruptura completa. Las redes alternativas reducen exposición a sanciones específicas y crean concentración, opacidad, liquidez y riesgo jurisdiccional.

Prueba de adicionalidad: hay mecanismo común y capacidad de propagación; existen señales dispersas, pero no todavía inventario propio suficiente; puede delimitarse por pagos, reservas, facturación, liquidez, deuda, seguros, activos y financiación de corredores; persistiría más allá de una sanción; una ampliación en varios rectores duplicaría el mecanismo.

**Decisión:** **crear capa transversal y mantener seguimiento**, no crear rector en esta tarea. Criterio para reconsiderar rector: señales propias en al menos tres teatros, persistencia multianual y prueba de que pagos/liquidez/seguros explican propagación mejor que los propietarios regionales.

## 12. Preestudio Sahel–África occidental

AES–ECOWAS constituye una fractura institucional material; juntas, violencia yihadista, apoyos externos, recursos, migración, puertos y propagación hacia Estados costeros forman un sistema regional. Sin embargo, “Sahel” aún agrupa trayectorias nacionales distintas; la competencia externa no debe desplazar agencia local y la conexión con riesgo sistémico mundial sigue mediada por migración, recursos, corredores y seguridad marítima.

**Decisión:** **crear subproceso regional y mantener preobservación**, no rector. Debe poseer señales sobre AES–ECOWAS, Nigeria, Estados costeros, violencia transfronteriza y mecanismos de contención; solo se relacionará con Magreb, Sudán o África central cuando haya flujos demostrables.

## 13. India–Pakistán y océano Índico

La rivalidad nuclear India–Pakistán, el triángulo con China, autonomía india, Rusia, cooperación estadounidense, Quad, Pakistán–China, vínculo con Turquía/Golfo, puertos y corredores están presentes entre NUC, IP, TUR y COR. La cobertura marítima y de mecanismos de crisis es menor que la de capacidades y alineamientos.

**Estado:** suficiente para no crear rector nuevo, pero requiere una ampliación controlada posterior con indicadores de crisis India–Pakistán, desconflicción, puertos del Índico y transmisión hacia garantías/alerta nuclear. No bloquea por contenido; sí depende del nuevo modelo de relaciones para evitar doble atribución.

## 14. Península coreana

NUC e IP cubren programa nuclear, misiles, China, alianza EE. UU.–Corea del Sur, Japón, garantías y debate nuclear; RU e IP comparten evidencia sobre Corea del Norte–Rusia. El acoplamiento con Taiwán debe tratarse como hipótesis, no hecho.

**Estado:** suficiente para no crear rector nuevo. Falta tipar la transferencia Rusia–Corea, los mecanismos de crisis y las condiciones que separarían o acoplarían una crisis coreana con Taiwán.

## 15. Tecnología, ciberespacio, IA y espacio

Se adopta una capa transversal, no un rector. IP posee semiconductores, nube/plataformas y coerción tecnológica; REM, doble uso e IA industrial; NUC, mando, alerta, espacio y ambigüedad multidominio; COR/cables, infraestructura crítica; EUA y RU, proveedores, sanciones y ciberconflicto. Cada señal operativa queda en su teatro; la capa solo describe dependencias compartidas.

Vacíos: atribución cibernética comparable, preposicionamiento, continuidad civil, dependencia de proveedores privados, navegación/observación, antisatélite, supervisión de IA y umbrales de respuesta. Deben incorporarse como campos/relaciones transversales tras la migración, sin crear un rector tecnológico global.

## 16. Comparación de evaluaciones

Las escalas 1–5 de impacto, probabilidad, alcance, persistencia, propagación, subcobertura, incertidumbre, urgencia y cobertura observada están presentes. Confianza combina categorías narrativas. No se halló un error mecánico que justifique recalcular todo. Riesgos: impacto 5 no equivale a probabilidad 5; incertidumbre alta requiere pregunta y plan de verificación; cobertura observada no es relevancia; rectores globales no reciben automáticamente mayor puntuación. La futura validación debe exigir justificación narrativa y registrar contradicciones sin forzar uniformidad.

## 17. Confrontación de interpretaciones

| Interpretación | Evidencia favorable | Evidencia contraria / omisión | Refutación | Confianza |
|---|---|---|---|---|
| Bipolaridad | centralidad EE. UU.–China | Rusia, India, Turquía, Golfo y actores regionales conservan agencia | coordinación estable de dos bloques exhaustivos | media-baja |
| Multipolaridad flexible | redes superpuestas y bisagras | asimetría material y garantías estadounidenses | alineamientos rígidos sostenidos | media-alta |
| Bloques | alianzas, industria, sanciones | dependencias cruzadas y coaliciones variables | cadenas y voto convergen de modo persistente | media |
| Acoplamiento de guerras | transferencias, logística y sanciones compartidas | muchas crisis coexisten sin decisión conjunta | ausencia prolongada de represalia/recursos interteatros | media |
| Fragmentación económica | controles y redes alternativas | dólar, liquidez y banca integradas | sustitución durable y multilateral de nodos centrales | media |
| Remilitarización ofensiva | capacidad y despliegues | reposición y disuasión defensiva | producción cae tras reponer inventarios | media |
| Rivalidad global | alianzas y coerción | agencia local explica resultados | variación local independiente de grandes potencias | media |
| Deterioro irreversible | erosión normativa | salvaguardias, canales y acuerdos parciales | restauración verificable sostenida | media-baja |
| Riesgo creciente | simultaneidad y ambigüedad | mayor redundancia y gestión de crisis | menos incidentes y mejor comunicación sostenida | media |

## 18. Sesgos y desequilibrios

Persisten sesgos anglófono, institucional/oficial, securitario y de disponibilidad; África occidental, Asia meridional y Corea tienen menos fuentes locales; finanzas, agua, alimentos y mecanismos de salida están por debajo de guerra, corredores e industria. La agencia regional está mejor tratada en Turquía, Sudán y Medio Oriente que en Sahel. Las incertidumbres están documentadas y no son por sí mismas bloqueo.

## 19. Correcciones aplicadas

- Se consolidó en este informe el inventario de 11 rectores y la excepción de expedientes históricos.
- Se formalizó la política de propiedad única de señales.
- Se creó la matriz transversal de 28 mecanismos.
- Se definió el vocabulario común y sus falsos positivos.
- Se emitieron decisiones delimitadas para finanzas y Sahel y evaluaciones para India–Pakistán, Corea y tecnología.
- Se incorporó a la fuente canónica la propiedad única de las 214 señales del corpus.
- Se migraron y clasificaron editorialmente las 30 relaciones rector–rector.
- Se registraron 26 referencias de segundo orden sin duplicar señales.
- Se actualizaron normalización, validadores, proyección pública, tipos, UI, pruebas y exportaciones documentales.
- Se recuperaron seis análisis editoriales derivados desde la caché local verificada después de detectar que el sincronizador antiguo no reconocía su formato; la excepción queda documentada y no alteró sus contenidos.

## 20. Pendientes no bloqueantes

1. Sustituir en una migración posterior los campos planos heredados cuando ningún consumidor dependa de ellos.
2. Añadir justificación narrativa de evaluaciones donde sólo hay números.
3. Profundizar fuentes locales de África occidental, Asia meridional y Corea.
4. Actualizar el sincronizador editorial para reconocer directamente el formato moderno de los análisis en desarrollo y eliminar la dependencia excepcional de recuperación desde caché.

## 21. Riesgos para el rector mundial

Los riesgos principales quedan controlados por el contrato: `Coincidente` y `Contextual` impiden inferir causalidad; la propiedad única evita doble conteo; dirección y reciprocidad evitan simetrías inventadas; evidencia y refutación mantienen trazabilidad. Persisten riesgos interpretativos normales —sobrerrepresentar seguridad, confundir impacto con probabilidad o subestimar agencia regional—, pero están documentados y no impiden iniciar el rector mundial.

## 22. Decisión de preparación

# ARQUITECTURA LISTA PARA EL RECTOR MUNDIAL

La identidad de los 11 rectores es estable; la capa nuclear, India–Pakistán, Corea y el dominio tecnología–ciber–IA–espacio tienen cobertura suficiente; finanzas y Sahel cuentan con decisiones delimitadas; no quedan duplicaciones críticas; las señales tienen propiedad única; y las relaciones poseen representación y validación canónicas. La arquitectura puede ahora sostener el diseño del rector mundial sin confundir simultaneidad, contexto y causalidad.

## 23. Justificación y advertencias no bloqueantes

Advertencias no bloqueantes: cinco excepciones históricas de expediente editorial; seis rectores en borrador; diversidad regional desigual; cuatro URLs compartidas; reversión menos explícita en seis rectores; falta de justificación narrativa uniforme de puntuaciones; y sincronizador editorial antiguo incompatible con los seis análisis recientes, recuperados sin pérdida desde caché verificada.

## 24. Próximo paso autorizado

Solicitar autorización expresa para crear el macroevento rector «Acoplamiento de conflictos regionales y riesgo de confrontación sistémica mundial». Esta auditoría no lo crea y se detiene en la decisión de preparación.

## 25. Rutas de examen local

Sitio y vista editorial: `http://localhost:4321/` mediante `npm run dev` o `npm run dev:editorial`. Dashboard público: `http://localhost:4321/observatorio/dashboard/`. Dashboard canónico autónomo: `http://127.0.0.1:4323/` desde `centro-local/modules/observatorio` con su comando `npm run open`.

Para cada ID de la tabla: expediente/ficha en `http://localhost:4321/observatorio/<ID>/`. Los análisis publicados usan `http://localhost:4321/publicaciones/<slug>/`; los seis análisis en desarrollo aparecen en esas mismas rutas únicamente con `npm run dev:editorial`. Slugs editoriales: `africa-central-minerales-criticos-cadenas-tecnologicas`, `remilitarizacion-industrial-cadenas-estrategicas-bloques`, `estados-unidos-reordenamiento-hemisferio-occidental`, `derechas-transnacionales-reconfiguracion-america-latina`, `indo-pacifico-taiwan-reconfiguracion-seguridad` y `erosion-control-armamentos-disuasion-nuclear-multipolar`.

Rutas exactas de análisis:

| Rector | Análisis en localhost |
|---|---|
| Corredores | `http://localhost:4321/publicaciones/corredores-alternativos-redes-logisticas-redundantes-2026/` |
| Turquía | `http://localhost:4321/publicaciones/turquia-potencia-bisagra-reordenamiento-regional-2026/` |
| Sudán | `http://localhost:4321/publicaciones/sudan-guerra-civil-regionalizacion-mar-rojo-2026/` |
| Medio Oriente | `http://localhost:4321/publicaciones/medio-oriente-acuerdos-abraham-guerra-regionalizada-2026/` |
| Rusia–Ucrania | `http://localhost:4321/publicaciones/rusia-ucrania-redes-seguridad-sostenimiento-2026/` |
| África central | `http://localhost:4321/publicaciones/africa-central-minerales-criticos-cadenas-tecnologicas/` (editorial) |
| Remilitarización | `http://localhost:4321/publicaciones/remilitarizacion-industrial-cadenas-estrategicas-bloques/` (editorial) |
| Hemisferio occidental | `http://localhost:4321/publicaciones/estados-unidos-reordenamiento-hemisferio-occidental/` (editorial) |
| Derechas transnacionales | `http://localhost:4321/publicaciones/derechas-transnacionales-reconfiguracion-america-latina/` (editorial) |
| Indo-Pacífico | `http://localhost:4321/publicaciones/indo-pacifico-taiwan-reconfiguracion-seguridad/` (editorial) |
| Nuclear | `http://localhost:4321/publicaciones/erosion-control-armamentos-disuasion-nuclear-multipolar/` (editorial) |

## 26. Confirmaciones de alcance

- No se creó el rector mundial ni ningún rector nuevo.
- No se modificó ni fusionó `main`.
- No se hizo push, publicación ni despliegue.
- La decisión y este informe quedan exclusivamente en el árbol de trabajo de `beta`.
- Los cambios preexistentes del usuario se conservaron sin descarte, reversión, borrado ni atribución a esta auditoría.

## 27. Validaciones ejecutadas

- Pruebas automatizadas: **211 aprobadas, 0 fallidas**.
- Validación de datos: producción, publicaciones, medios y vista local válidos; las advertencias editoriales existentes no son errores de esquema.
- Comprobación de tipos Astro: **0 errores, 0 advertencias, 49 sugerencias** en código y copias/respaldos preexistentes.
- Build público: **488 páginas**.
- Build editorial: **494 páginas**, incluidas las seis rutas de análisis en desarrollo.
- Validación de build: **51 expedientes**, 51 páginas metodológicas, 51 filas de procesos y **0 enlaces internos rotos**.
- QA visual: 11 tarjetas rectoras; ficha nuclear con señales, fuentes, escenarios, indicadores y advertencia; dashboard de consulta sin controles de edición; ninguna coincidencia de marcadores internos; sin desbordamiento horizontal a 1280 × 720 ni 390 × 844; 0 errores o advertencias del navegador.
- La ejecución por `npm run qa` no fue utilizable directamente porque la instalación global de npm apunta a un `npm-cli.js` inexistente. La misma secuencia se reprodujo el 1 de septiembre contra las dependencias locales instaladas, con telemetría desactivada y sin descargas.
