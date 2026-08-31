# Auditoría de vacíos geopolíticos de la arquitectura de macroeventos rectores

**Fecha de auditoría:** 2026-08-31

**Fecha de corte interno:** 2026-08-31

**Rama de integración:** `beta`

**Estado:** propuesta editorial pendiente de aprobación

**Objeto:** evaluar si la arquitectura existente permite construir, en una fase posterior, el macroevento rector «Acoplamiento de conflictos regionales y riesgo de confrontación sistémica mundial»

**Exclusiones:** esta auditoría no crea macroeventos, no modifica expedientes, análisis ni datos del Observatorio, no actualiza la proyección pública y no autoriza la creación del rector mundial.

## 1. Resumen ejecutivo

La arquitectura actual ofrece una base amplia, pero todavía no suficiente, para construir con rigor el futuro rector mundial. El problema no es la falta general de regiones ni la ausencia de un título para cada gran potencia. El problema principal es funcional: los rectores existentes describen guerras, alianzas, corredores, producción militar, minerales y actores bisagra, pero no integran de forma comparable los **umbrales nucleares, la degradación del control de armamentos, las garantías extendidas, la proliferación y los mecanismos de comunicación de crisis**. Sin esa capa, un análisis mundial podría sumar conflictos convencionales sin medir correctamente el salto entre acoplamiento regional y confrontación sistémica.

La auditoría confirma **10 macroeventos rectores** en el árbol de trabajo actual. Cinco existen en el último commit de `beta`; otros cinco están presentes en cambios preexistentes no confirmados del usuario. Estos últimos se consideran evidencia de la arquitectura actual porque tienen ficha canónica completa, fuentes, señales y, en cuatro casos, expediente editorial dedicado; su situación de Git se conserva como limitación de procedencia, no como motivo para excluirlos.

Hallazgos principales:

- **Un vacío crítico:** gobernanza nuclear, escalada y control de armamentos. Se recomienda preparar un rector integrador propio antes del rector mundial, sujeto a decisión editorial.
- **Dos vacíos importantes:** fragmentación económica-financiera-monetaria y Sahel/África occidental. El primero reúne un mecanismo sistémico ausente y es candidato fuerte a rector. El segundo corrige una discontinuidad geográfica y causal africana; merece una fase breve de delimitación antes de decidir si será rector o ampliación estructurada.
- **Cuatro vacíos parciales:** tecnología/ciber/IA; India y Asia meridional; península coreana; clima-agua-seguridad alimentaria. Deben cubrirse mediante ampliaciones y subprocesos, no mediante rectores inmediatos.
- **Seguimientos subordinados:** espacio exterior y salud global. El espacio es crítico como dependencia de mando, alerta, navegación e inteligencia, pero por ahora su valor explicativo se obtiene mejor como dominio transversal de nuclear, remilitarización e Indo-Pacífico. Salud global queda fuera salvo evidencia concreta de propagación sistémica.
- **Cobertura suficiente o falsa ausencia:** Medio Oriente general, América Latina en términos de competencia hemisférica y conectividad, cables submarinos, Ártico logístico, Asia Central/Cáucaso y corredores marítimos. Requieren mantenimiento o ampliación focalizada, no nuevos rectores generales.

La arquitectura no debería crecer de manera indiscriminada. Antes del rector mundial se propone: (1) aprobar y construir la función nuclear; (2) ampliar transversalmente tecnología/ciber/espacio; (3) delimitar fragmentación financiera; (4) reforzar India-Corea dentro de Indo-Pacífico y Rusia–Ucrania; (5) ejecutar un preestudio Sahel–África occidental; y (6) probar explícitamente los mecanismos de acoplamiento, contención y desacoplamiento.

**Nivel de confianza global:** medio-alto para el diagnóstico de cobertura interna; medio para las decisiones de creación, porque cinco rectores aún forman parte de trabajo no confirmado y porque los candidatos no fueron investigados con profundidad equivalente a un nuevo macroevento.

## 2. Metodología y trazabilidad

### 2.1 Fuentes internas

Se inspeccionaron, sin modificarlos:

- `centro-local/modules/observatorio/data/macroeventos.json`, fuente canónica local: 50 macroeventos, 10 marcados como rectores, 5 expedientes editoriales y 1 importación de candidatos;
- fichas, relaciones, señales, fuentes, escenarios, indicadores, advertencias y estados de verificación de los 10 rectores;
- publicaciones de `src/content/publicaciones/publicadas/` para comprobar análisis publicados;
- exportaciones documentales existentes en `notion-export/`, usadas solo como contraste y no como fuente canónica;
- documentación de flujo, rama y seguridad editorial del repositorio.

La fotografía auditada corresponde al árbol de trabajo de `beta`, no exclusivamente a `HEAD`. En `HEAD` hay 5 rectores: corredores, Turquía, Sudán, Medio Oriente y Rusia–Ucrania. En el árbol actual hay además África central/minerales, remilitarización, hemisferio occidental, derechas transnacionales e Indo-Pacífico. La auditoría no atribuye autoría ni aprobación a esos cambios y no los incorpora a ningún commit.

### 2.2 Evidencia externa selectiva

La investigación externa se limitó a decidir si un vacío era real y material:

- SIPRI identifica modernización en los nueve Estados con armas nucleares y debilitamiento del control de armamentos, lo que respalda una función nuclear integradora y no solo menciones regionales ([SIPRI Yearbook 2025](https://www.sipri.org/media/press-release/2025/nuclear-risks-grow-new-arms-race-looms-new-sipri-yearbook-out-now), [capítulo de fuerzas nucleares](https://www.sipri.org/yearbook/2025/06)).
- El FMI documenta que la fragmentación geoeconómica introduce fricciones en pagos, monedas y flujos; la evidencia disponible también muestra interdependencia persistente, por lo que no debe confundirse diversificación con ruptura monetaria ([FMI, pagos transfronterizos](https://www.imf.org/en/publications/wp/issues/2025/08/29/payment-frictions-capital-flows-and-exchange-rates-569917), [FMI, alineamiento y monedas globales](https://www.elibrary.imf.org/view/journals/001/2024/189/article-A001-en.xml)).
- La ONU adoptó un informe final sobre seguridad de las tecnologías de información y comunicación, evidencia de que el ciberespacio tiene reglas y mecanismos propios, aunque eso no demuestra que necesite un rector separado ([ONU, OEWG 2021–2025](https://digitallibrary.un.org/record/4084927?ln=en&v=pdf)).
- El informe anual de Exteriores de India registra desenganche parcial y reactivación de mecanismos India–China, evidencia de competencia y contención simultáneas ([Ministerio de Asuntos Exteriores de India, informe 2024](https://www.mea.gov.in/Images/CPV/140725MEAAnnualReport2024English.pdf)).
- Un informe de la ONU confirma continuidad de los programas nuclear y misilístico norcoreanos en 2025; la autonomía material coreana es real, aunque su acoplamiento sistémico sigue mejor capturado dentro del Indo-Pacífico y Rusia–Ucrania ([ONU, S/2025/340](https://digitallibrary.un.org/record/4083743/files/S_2025_340-EN.pdf)).
- La salida efectiva de Burkina Faso, Mali y Níger de ECOWAS prueba una ruptura institucional regional, pero los arreglos transitorios también muestran continuidad funcional y espacio para mediación ([ECOWAS, retirada](https://www.ecowas.int/burkina-faso-mali-and-nigers-withdrawal-from-ecowas-is-now-a-reality/), [ECOWAS, modalidades posteriores](https://www.ecowas.int/extraordinary-session-of-the-ecowas-council-of-ministers-on-the-contingency-plan-and-modalities-on-the-withdrawal-of-burkina-faso-republics-of-mali-and-niger-from-ecowas-holds-in-accra/)).

### 2.3 Prueba aplicada

Cada candidato se evaluó separando:

1. **Cobertura documental:** presencia de ficha, señales, fuentes, relaciones, análisis y expediente.
2. **Importancia geopolítica:** capacidad causal, persistencia, actores, propagación y escenarios.
3. **Urgencia coyuntural:** proximidad temporal de incidentes, sin usar volumen noticioso como sustituto de relevancia.
4. **Adicionalidad:** explicación que no pueda obtenerse ampliando un rector existente.
5. **Delimitación:** mecanismo y límites suficientemente claros para evitar un contenedor ilimitado.
6. **Evidencia contraria:** razones por las que el candidato no debería convertirse en rector.

Las clasificaciones son diagnósticos de cobertura, no decisiones aprobadas.

## 3. Inventario confirmado de macroeventos rectores

Los 10 registros tienen horizonte plurianual y análisis estructurado en la ficha canónica. «Análisis» distingue publicación autónoma disponible de análisis interno en ficha. «Expediente» se considera dedicado cuando el rector es el primer proceso del expediente editorial.

| ID | Título | Estado / verificación | Corte | Regiones principales | Mecanismo rector | Relaciones | Análisis / expediente | Desarrollo e incertidumbres |
|---|---|---|---|---|---|---|---|---|
| `corredores-alternativos-redes-logisticas-redundantes` | Reconfiguración de la conectividad global mediante corredores alternativos y redes redundantes | revisión / parcial | 2026-08-28 | global, Asia Central, Sudeste Asiático, Medio Oriente, África austral, América Latina, Ártico | diversificación material de rutas y reducción de cuellos de botella | 16 procesos | análisis publicado; sin expediente dedicado | alto; duda sobre operación real, financiación e interoperabilidad |
| `turquia-potencia-bisagra-reordenamiento-regional` | Consolidación de Turquía como potencia bisagra multidimensional en el reordenamiento regional | revisión / parcial | 2026-08-21 | Medio Oriente, Europa, Asia Central, Cuerno de África | combinación de alianza occidental, autonomía, defensa, energía, logística y mediación | 10 procesos | análisis publicado; sin expediente dedicado | medio-alto; duda sobre coherencia, restricciones económicas y sustitución de funciones estadounidenses |
| `sudan-guerra-civil-regionalizacion-mar-rojo` | Regionalización de la guerra civil en Sudán y disputa por el orden del mar Rojo y el Cuerno de África | revisión / parcial | 2026-08-28 | Sudán, Cuerno, mar Rojo, Medio Oriente, Europa oriental | fragmentación estatal, economías de guerra, patrocinio externo y propagación regional | 14 procesos | análisis publicado; sin expediente dedicado | alto; datos humanitarios heterogéneos y apoyos externos desiguales |
| `medio-oriente-acuerdos-abraham-guerra-regionalizada` | De los Acuerdos de Abraham a la guerra regionalizada: Israel, Irán, Palestina y los Estados del Golfo | revisión / verificado | 2026-08-29 | Golfo, Levante, mar Rojo, Mediterráneo | superposición de normalización, guerra regional, cuestión palestina y autonomía del Golfo | 11 procesos | análisis publicado; sin expediente dedicado | alto; agencia local, heterogeneidad del Golfo y control no uniforme de aliados iraníes |
| `rusia-ucrania-redes-seguridad-sostenimiento` | Guerra Rusia–Ucrania y reconfiguración de redes internacionales de seguridad y sostenimiento | revisión / parcial | 2026-08-30 | Europa, Rusia, Ucrania, mar Negro, Báltico y conexiones globales | institucionalización de apoyo militar, producción, sanciones, logística y seguridad | 7 procesos | análisis publicado; sin expediente dedicado | alto; no confundir redes con bloques homogéneos ni sumar señales duplicadas |
| `africa-central-minerales-criticos-cadenas-tecnologicas` | Competencia por minerales críticos y reorganización de las cadenas tecnológicas en África central | borrador / parcial | 2026-08-30 | África central y austral, Grandes Lagos, global | conexión entre extracción, procesamiento, energía, corredores, trazabilidad y demanda tecnológica/militar | 6 procesos | análisis interno/exportable; expediente dedicado en borrador | medio-alto; anuncios frente a capacidad industrial, trazabilidad y causalidad recursos-violencia |
| `remilitarizacion-industrial-cadenas-estrategicas-bloques` | Remilitarización industrial y formación de cadenas estratégicas de bloques | borrador / parcial | 2026-08-30 | global, Europa, Norteamérica, Asia-Pacífico, Eurasia, Medio Oriente | conversión de demanda de seguridad en capacidad industrial persistente | 10 procesos | análisis interno/exportable; expediente dedicado en borrador | medio-alto; contratos frente a entregas, comparabilidad del gasto y dependencias cruzadas |
| `estados-unidos-reordenamiento-hemisferio-occidental` | Reordenamiento estratégico del hemisferio occidental bajo el nacionalismo estadounidense | borrador / parcial | 2026-08-30 | Norteamérica, Ártico, Centroamérica, Caribe, América Latina | integración de comercio, frontera, defensa continental, recursos e infraestructura | 9 procesos | análisis interno/exportable; expediente dedicado en borrador | medio-alto; continuidad pospresidencial, resistencia regional y ejecución material |
| `derechas-transnacionales-reconfiguracion-america-latina` | Articulación transnacional de las derechas y reconfiguración política de América Latina | borrador / parcial | 2026-08-30 | América Latina, Caribe, Norteamérica, Iberoamérica | circulación de marcos, redes, asesores y repertorios con prueba de coordinación y efecto | 7 procesos | análisis interno/exportable; expediente dedicado en borrador | medio; sesgo Argentina-Brasil, financiación opaca y causalidad digital |
| `indo-pacifico-taiwan-reconfiguracion-seguridad` | Reconfiguración del Indo-Pacífico y riesgo de confrontación en torno a Taiwán | borrador / parcial | 2026-08-31 | Asia oriental y meridional, Sudeste Asiático, Oceanía, global | espiral de seguridad y resiliencia que conecta fuerzas, bases, tecnología, cadenas y crisis | 10 procesos | análisis interno/exportable; expediente dedicado en borrador | alto; intención china, intervención aliada, ciber/espacio y acoplamiento con Corea/Rusia |

### Lectura del inventario

- Los rectores más maduros documentalmente son Medio Oriente, Rusia–Ucrania, corredores, Sudán y Turquía; solo Medio Oriente figura verificado.
- Los cinco rectores más recientes tienen mejor formalización de refutación, niveles e incertidumbres, pero siguen en borrador y pertenecen a cambios previos no confirmados.
- La arquitectura está más desarrollada en seguridad, conectividad, producción y competencia por recursos que en finanzas, gobernanza nuclear, desescalada y resiliencia institucional.
- «Análisis disponible» no equivale a verificación plena: nueve de diez rectores permanecen con verificación parcial.

## 4. Mapa geográfico de cobertura

| Espacio | Nivel | Mecanismos cubiertos | Vacío residual |
|---|---|---|---|
| Norteamérica | alto | defensa continental, comercio, industria, alianzas | propagación financiera y garantías nucleares |
| América Central | medio | Panamá, frontera, presión estadounidense, logística | fragilidad, seguridad y agencia subregional comparada |
| Caribe | medio-bajo | hemisferio y redes políticas | islas, energía, clima, seguridad marítima y finanzas ilícitas poco desarrollados |
| América del Sur | medio-alto | China/EE. UU., Brasil implícito, Chancay, minerales, redes políticas | Atlántico Sur, defensa y autonomía brasileña fragmentados |
| Europa | alto | Rusia–Ucrania, OTAN, industria, corredores | control de armas, disuasión y política de salida |
| Rusia / espacio postsoviético | alto | guerra, sanciones, redes, logística | Asia Central no rusa y Cáucaso fuera de corredores |
| Cáucaso | medio | Corredor Medio y bisagra turca | seguridad regional y mediación más allá de conectividad |
| Asia Central | medio | corredores, Rusia, China, Turquía | agua, seguridad y autonomía regional |
| Medio Oriente | alto | guerra regionalizada, Golfo, Turquía, Irán, rutas | no existe vacío general; mantener nuclear regional dentro de capa global |
| Norte de África | bajo-medio | Egipto/Mar Rojo y Marruecos/Sahel | Argelia, Libia y Magreb como sistema |
| Sahel | bajo | Marruecos conector y desborde sudanés indirecto | fragmentación institucional, AES-ECOWAS, seguridad y costas del Golfo de Guinea |
| África occidental | bajo | conexiones hemisféricas/minerales marginales | Nigeria, ECOWAS, Estados costeros, yihadismo, comercio y rutas |
| África central | alto | minerales, Grandes Lagos, Lobito, Sudán adyacente | gobernanza regional no mineral |
| África oriental / Cuerno | alto | Sudán, puertos, Turquía, corredores | Etiopía-Eritrea-Somalia más allá de accesos y patrocinio |
| África austral | medio-alto | Lobito, minerales, rutas alternativas | Sudáfrica y política marítima/financiera regional |
| Asia meridional | medio | India en Indo-Pacífico, IMEC, INSTC, Myanmar, pacto Turquía-Saudí-Pakistán | India–Pakistán, riesgo nuclear y Océano Índico no integrados |
| Sudeste Asiático | medio-alto | ASEAN, Malaca, Myanmar, Taiwán, rutas | conflictos internos y autonomía marítima desigual |
| Asia oriental | alto | Taiwán, China, Japón, Coreas, semiconductores | península coreana aún subordinada y nuclear incompleta |
| Indo-Pacífico | alto | alianzas, coerción, tecnología, logística | India/Corea requieren indicadores propios |
| Ártico | medio | Ruta Marítima del Norte y hemisferio | militarización, gobernanza y clima más allá de la ruta |
| Espacios marítimos globales | alto | Hormuz, Bab el-Mandeb, Suez, Malaca, mar Negro, cables y puertos | escalada naval y derecho marítimo comparado |
| Antártida | fuera de alcance | sin mecanismo demostrado para el objetivo | mantener fuera salvo señales de militarización o ruptura del régimen |

La distribución no exige simetría. El vacío Sahel–África occidental importa porque interrumpe la cadena causal entre Magreb, Cuerno, Atlántico, migración, redes de seguridad y competencia externa; la baja cobertura antártica no afecta hoy al futuro rector.

## 5. Mapa temático y funcional

| Función | Cobertura | Diagnóstico |
|---|---|---|
| Guerra convencional | alta | Rusia–Ucrania, Medio Oriente, Sudán, Taiwán |
| Disuasión nuclear / proliferación / control de armas | baja-fragmentaria | aparece por teatros, sin función integradora ni régimen global |
| Ciberespacio / IA | media-baja | presentes en Indo-Pacífico y remilitarización; faltan atribución, escalada y continuidad civil |
| Semiconductores | media-alta | Indo-Pacífico, cadenas tecnológicas y remilitarización |
| Espacio / satélites | baja | señalado como incertidumbre, no sistematizado |
| Cables / infraestructura crítica | media-alta | proceso específico y relaciones suficientes; falta integrar sabotaje con crisis militar |
| Minerales críticos | alta | rector africano, Lobito y cadenas industriales |
| Energía | alta regional | Medio Oriente, Turquía, corredores y hemisferio |
| Agua | baja | casi ausente como mecanismo comparable |
| Seguridad alimentaria | media-baja | Sudán y mar Negro; no integrada como propagación global |
| Clima como amplificador | baja | Ártico, logística y fragilidad, sin indicadores transversales |
| Industria militar | alta | rector global y conexiones regionales |
| Comercio y sanciones | media | Rusia–Ucrania, hemisferio, tecnología; falta propagación cruzada |
| Moneda, pagos, deuda y finanzas | baja | economías de guerra y financiación de proyectos, no arquitectura sistémica |
| Cadenas de suministro | alta | corredores, minerales, industria, Taiwán |
| Migración y desplazamiento | media | Sudán y hemisferio; Sahel/Caribe incompletos |
| Desinformación e influencia | media | derechas transnacionales; falta comparación interestatal global |
| Organizaciones internacionales / erosión normativa | media-baja | presentes como actores, raramente como mecanismo rector |
| Fragilidad estatal / actores armados / mercenarios | media-alta | Sudán, RDC y Medio Oriente; Sahel queda débil |
| Salud global | fuera de alcance actual | no hay relevancia sistémica demostrada en el inventario |

## 6. Mapa de mecanismos sistémicos

| Mecanismo | Cobertura | Rectores principales | Observación |
|---|---|---|---|
| Formación de alianzas y bloques flexibles | alta | Rusia–Ucrania, Indo-Pacífico, remilitarización | buena cautela contra bloques homogéneos |
| Actores bisagra | alta | Turquía, corredores, hemisferio | India y Golfo aparecen, pero sin comparación sistemática |
| Acoplamiento de teatros | media | Rusia–Ucrania, Indo-Pacífico, Medio Oriente, Sudán | existe como hipótesis, no como protocolo transversal |
| Transferencia de armas / movilización industrial | alta | remilitarización, Rusia–Ucrania, Turquía | buena base |
| Coerción económica / dependencia tecnológica | media-alta | Indo-Pacífico, hemisferio, Rusia–Ucrania | pagos, reservas y deuda incompletos |
| Vulnerabilidad logística | alta | corredores y procesos marítimos | una de las fortalezas de la arquitectura |
| Propagación financiera | baja | dispersa | vacío importante |
| Escalada nuclear | baja | menciones regionales | vacío crítico |
| Dilemas de seguridad / errores de cálculo | media | Indo-Pacífico y Medio Oriente | falta comparación interteatros |
| Competencia por recursos | alta | África central, corredores, hemisferio | agua y alimentos quedan rezagados |
| Regionalización de guerras civiles | alta | Sudán y Medio Oriente | Sahel no cubierto |
| Intervención indirecta | alta | Sudán, Medio Oriente, Rusia–Ucrania | distinguir apoyo de control es una fortaleza |
| Fragmentación institucional | media-baja | Sudán y redes políticas | ECOWAS/AES, ONU y regímenes de armas incompletos |
| Contención / mediación / desescalada | media-baja | Turquía, Golfo, Sudán, Indo-Pacífico | menor desarrollo que la escalada |
| Desacoplamiento de crisis | baja | aparece como evidencia contraria, sin indicadores comunes | debe incorporarse antes del rector mundial |
| Resiliencia | media | corredores, Taiwán, industria | buena base material; débil en finanzas e instituciones |
| Reversión de tendencias | media | rectores recientes tienen escenarios de reversión | no está uniformado en los rectores anteriores |

## 7. Vacío crítico

### Gobernanza nuclear, escalada y control de armamentos

**Clasificación:** vacío crítico.

**Relevancia:** alta.

**Confianza:** alta en la existencia del vacío; media-alta en la recomendación de rector.

La dimensión nuclear aparece en Taiwán, Corea, India-Pakistán, Rusia–Ucrania e Israel-Irán, pero cada referencia pertenece a una lógica regional. Falta una capa que compare: modernización de arsenales; posturas y alerta; armas no estratégicas; garantías extendidas; proliferación; degradación de tratados; sistemas de mando, control y alerta; efectos de ciber, IA y espacio; comunicación estratégica; señales de empleo limitado; y medidas de reducción de riesgo.

Este vacío impide distinguir tres fenómenos que el futuro rector mundial no puede mezclar: (a) múltiples guerras convencionales simultáneas; (b) acoplamiento operativo entre teatros; y (c) degradación de umbrales nucleares capaz de transformar una crisis regional en confrontación sistémica.

**Razones para crear un rector:** mecanismo sistémico claro; horizonte plurianual; nueve Estados con armas nucleares y numerosos aliados bajo garantías; señales observables; relación directa con cuatro o más rectores; escenarios e indicadores propios; y adicionalidad que no se obtiene ampliando un solo teatro.

**Razones para no crearlo:** riesgo de convertirse en un inventario de arsenales; parte de los datos es clasificada; puede duplicar los teatros; y «riesgo nuclear mundial» sería un límite demasiado amplio. Para superar esas objeciones, el objeto debe ser **la transformación de la gobernanza y los umbrales de escalada**, no las capacidades nacionales en general. Las señales operativas permanecen en los teatros propietarios; el rector integrador registra cambios de segundo orden.

**Recomendación:** preparar, para aprobación, un rector provisionalmente titulado «Erosión del control de armamentos y reconfiguración de la disuasión nuclear multipolar». No crearlo en esta auditoría.

## 8. Vacíos importantes

### 8.1 Fragmentación económica, financiera y monetaria

**Clasificación:** vacío importante.

**Relevancia:** alta.

**Confianza:** media-alta.

Sanciones, financiación de corredores, controles tecnológicos y comercio aparecen en varios rectores, pero no se modelan los canales de pagos, reservas, deuda, liquidez, seguros, compensación, monedas de facturación, controles de capital y propagación financiera. El futuro rector mundial necesita saber si una crisis militar se transmite por redes financieras, si la diversificación reduce vulnerabilidad o si crea nuevas concentraciones.

La evidencia contraria es importante: el dólar, las redes bancarias y la interdependencia persisten; BRICS, comercio en monedas nacionales o nuevas plataformas no prueban por sí solos «desdolarización» ni dos sistemas cerrados. El rector candidato debe medir **fragmentación y redundancia financiera**, no anunciar el fin de una moneda de reserva.

**Recomendación:** candidato fuerte a rector propio, después de una fase de delimitación. Alternativa mínima: subproceso transversal compartido por Rusia–Ucrania, hemisferio, corredores y remilitarización. Si la investigación no demuestra propagación y decisiones comunes más allá de sanciones aisladas, conservarlo como subproceso.

### 8.2 Sahel y África occidental

**Clasificación:** vacío importante.

**Relevancia:** media-alta para el sistema, alta para equilibrio geográfico y mecanismos de fragilidad.

**Confianza:** media.

La arquitectura cubre bien África central y oriental, pero deja una discontinuidad en Sahel/África occidental. Marruecos como conector no sustituye el análisis de AES–ECOWAS, juntas, violencia yihadista, redes rusas, retirada occidental, presión sobre Estados costeros, Nigeria, migración y corredores. La salida de tres Estados de ECOWAS proporciona un mecanismo institucional observable, no solo una acumulación de crisis nacionales.

Razones para no crear un rector inmediato: «Sahel» puede ser un contenedor geográfico; las trayectorias nacionales son distintas; la etiqueta de competencia Rusia-Occidente puede ocultar agencia local; y la relación con una confrontación mundial es indirecta. La prueba previa debe demostrar que fragmentación institucional, redes de seguridad y propagación hacia costas funcionan como sistema regional persistente.

**Recomendación:** abrir un preestudio delimitado. Crear rector solo si se confirma el mecanismo «reconfiguración del orden regional de seguridad entre AES, ECOWAS y Estados costeros». Si no, ampliar `marruecos-estado-conector`, los procesos de África oriental y los mecanismos de mercenarios/fragilidad como subprocesos conectados.

## 9. Vacíos parciales y seguimientos subordinados

### 9.1 Tecnología, ciberespacio e inteligencia artificial

**Clasificación:** vacío parcial.

**Decisión propuesta:** ampliar, no crear rector por ahora.

Semiconductores, controles de exportación, empresas tecnológicas y doble uso están bien representados por Indo-Pacífico, remilitarización y minerales. Faltan infraestructura de nube, plataformas, soberanía digital, atribución cibernética, preposicionamiento, umbrales de respuesta, riesgo sobre sistemas civiles y el vínculo IA-mando militar.

Un rector tecnológico global duplicaría tres procesos y tendría límites causales imprecisos. La alternativa mínima es una matriz transversal tecnología–ciber–IA compartida por Indo-Pacífico, remilitarización, nuclear, cables y hemisferio, con señales propietarias en cada proceso.

### 9.2 India y Asia meridional

**Clasificación:** vacío parcial.

**Decisión propuesta:** ampliar Indo-Pacífico y corredores; crear subproceso India–Pakistán/nuclear.

India ya aparece en Indo-Pacífico, Quad, IMEC, INSTC, Myanmar, corredores, industria y minerales. Lo que falta no es «India» como actor, sino la interacción entre autonomía estratégica, frontera con China, rivalidad nuclear con Pakistán, puertos y Océano Índico. Un rector nacional duplicaría corredores y alianzas. Deben añadirse indicadores propios para India–China, India–Pakistán, postura nuclear, adquisiciones rusas, cooperación con EE. UU. y conducta en crisis.

### 9.3 Península coreana

**Clasificación:** vacío parcial.

**Decisión propuesta:** subproceso reforzado dentro de Indo-Pacífico, con vínculo explícito a Rusia–Ucrania y al futuro rector nuclear.

Corea del Norte, Corea del Sur, Japón, Rusia y EE. UU. ya están presentes. Falta una ficha propietaria que evite que Corea aparezca solo como proveedor de armas o teatro auxiliar de Taiwán. Su autonomía material es alta, pero el mecanismo sistémico se explica mejor mediante tres relaciones existentes: arquitectura regional de seguridad, redes de sostenimiento ruso y escalada nuclear. Solo debería emanciparse como rector si desarrolla una dinámica plurianual que no pueda explicarse por esas tres capas.

### 9.4 Clima, agua y seguridad alimentaria

**Clasificación:** vacío parcial / seguimiento subordinado.

**Decisión propuesta:** crear indicadores amplificadores, no rector.

Sudán, mar Negro, Ártico, migración y corredores contienen piezas útiles. Falta una matriz de transmisión: shock físico → precios/producción → capacidad estatal/migración → conflicto o cooperación. La causalidad es condicional y multicausal; un rector separado correría el riesgo de atribuir conflictos al clima sin mecanismo demostrado. Debe añadirse solo donde el impacto modifique capacidades, rutas, alianzas o estabilidad.

### 9.5 Espacio exterior

**Clasificación:** seguimiento subordinado.

**Decisión propuesta:** subproceso transversal de dependencia espacial.

Satélites, navegación, observación, alerta y comunicaciones son habilitadores críticos, pero la cobertura requerida puede obtenerse integrándolos en nuclear, Indo-Pacífico y remilitarización. Un rector sería justificable solo si la competencia por normas, constelaciones, sistemas antisatélite y servicios privados genera decisiones y escaladas autónomas, no simplemente soporte para conflictos terrestres.

## 10. Falsas ausencias y cobertura suficiente

### Medio Oriente

**Cobertura suficiente.** El rector existente integra Israel–Irán, Palestina, Golfo, Siria, Irak, Líbano, Yemen, presencia estadounidense, energía, estrechos, mar Rojo y Turquía. Crear otro rector general duplicaría su función. La gobernanza nuclear debe conectarse desde una capa mundial, sin reemplazar la ficha Israel–Irán.

### América Latina más allá de las redes ideológicas

**Falsa ausencia parcial.** La región está cubierta por el rector hemisférico, derechas transnacionales, Chancay, Panamá, corredores, minerales y vínculos con China/Estados Unidos. No hace falta un rector general latinoamericano. Sí conviene ampliar agencia brasileña, Atlántico Sur, energía, integración regional y respuestas divergentes a Washington y Pekín.

### Cables submarinos e infraestructura crítica

**Falsa ausencia.** Existe un proceso específico relacionado con remilitarización, Indo-Pacífico y hemisferio. Lo pendiente es integrar indicadores de sabotaje, reparación, redundancia y escalada, no crear rector.

### Ártico

**Cobertura suficiente para el objetivo actual.** Ruta Marítima del Norte y hemisferio cubren logística y competencia. La militarización puede ampliarse, pero no bloquea el rector mundial.

### Asia Central y Cáucaso

**Cobertura suficiente con límites.** Corredor Medio, ferrocarril China–Kirguistán–Uzbekistán, INSTC, Turquía y Rusia cubren conectividad y actores bisagra. Seguridad, agua y política doméstica quedan subordinadas salvo cambio material.

### Espacios marítimos

**Cobertura suficiente.** Hormuz–Bab el-Mandeb–Suez, Malaca, mar Negro, Panamá, puertos africanos, cables y corredores forman una red robusta. La ausencia es analítica —comparar escalada naval, seguros y derecho marítimo—, no arquitectónica.

## 11. Matriz de decisión

| Candidato | Problema cubierto | Cobertura actual | Vacío real | Relevancia | Solapamiento | Fuentes | Alternativa mínima | Recomendación | Prioridad | Confianza |
|---|---|---|---|---|---|---|---|---|---|---|
| Gobernanza nuclear y control de armas | umbrales, proliferación, garantías y escalada | dispersa en 4–5 rectores | falta integración global y mecanismos de contención | alta | medio | suficientes | matriz común dentro de rectores | **crear rector**, previa aprobación | crítica | alta |
| Fragmentación financiera y monetaria | sanciones, pagos, reservas, deuda, seguros y propagación | dispersa y superficial | no existe arquitectura financiera sistémica | alta | medio con corredores/Rusia | suficientes | subproceso transversal | **delimitar para crear**; degradar a subproceso si no prueba adicionalidad | alta | media-alta |
| Sahel–África occidental | fragmentación institucional, seguridad y propagación costera | baja e indirecta | discontinuidad regional y causal | media-alta | medio con Sudán/Marruecos | parciales-suficientes | ampliar procesos africanos | **preestudiar**; crear solo con mecanismo regional | alta | media |
| Tecnología, ciber e IA | dependencia digital y escalada | Indo-Pacífico, industria, cables | nube, atribución, IA y umbrales | alta | alto | suficientes | matriz/subprocesos | **ampliar** | alta | alta |
| India y Asia meridional | autonomía, China, Pakistán, nuclear y océano | Indo-Pacífico y corredores | rivalidad India–Pakistán y Océano Índico | alta | alto | suficientes | subproceso con indicadores propios | **ampliar** | alta | media-alta |
| Península coreana | nuclear, misiles, Rusia, China y alianzas | Indo-Pacífico/Rusia | agencia coreana insuficientemente visible | alta | alto | suficientes | ficha subordinada con triple vínculo | **crear subproceso** | alta | alta |
| Clima, agua y alimentos | amplificación de fragilidad y shocks | Sudán, mar Negro, Ártico | causalidad transversal no sistematizada | media | alto | suficientes | indicadores amplificadores | **seguir** | media | media-alta |
| Espacio exterior | dependencia satelital y escalada | menciones en Indo-Pacífico/industria | no hay indicadores comunes | alta funcional, media autónoma | alto | parciales | subproceso transversal | **seguir** | media | media |
| América Latina estratégica | China, EE. UU., Brasil, energía e infraestructura | hemisferio, derechas, corredores | Brasil/Atlántico Sur parciales | media-alta | muy alto | suficientes | ampliar hemisferio y corredores | **ampliar** | media | alta |
| Medio Oriente general | guerra regionalizada | rector integral existente | ninguno general; solo mantenimiento | alta | duplicación total | suficientes | ampliar fichas existentes | **descartar nuevo rector** | baja | alta |
| Ártico integral | rutas, clima, militarización | ruta norte y hemisferio | seguridad no logística | media | alto | suficientes | ampliar indicadores | **seguir** | baja | media |
| Salud global | propagación sanitaria | ausente | no se demuestra vínculo necesario | baja para objetivo | bajo | suficientes si surge señal | vigilancia por excepción | **fuera de alcance** | baja | alta |
| Antártida | gobernanza polar | ausente | sin mecanismo relevante demostrado | baja | bajo | parciales | vigilancia | **descartar** | baja | alta |

## 12. Recomendaciones priorizadas

### Prioridad crítica

1. Aprobar o rechazar la preparación del rector nuclear integrador.
2. Definir un protocolo transversal de acoplamiento con cinco pruebas: causalidad, simultaneidad operativa, transferencia de recursos, cambio de postura y efecto sobre umbrales.
3. Añadir indicadores de contención, mediación, comunicación y desacoplamiento a la misma altura que los de escalada.

### Prioridad alta

4. Delimitar fragmentación financiera con una prueba explícita contra la narrativa de desdolarización automática.
5. Ampliar Indo-Pacífico con subprocesos India–Pakistán/Océano Índico y península coreana.
6. Incorporar tecnología–ciber–IA–espacio como matriz transversal, conservando la propiedad de señales en cada rector.
7. Ejecutar un preestudio Sahel–África occidental centrado en AES–ECOWAS–Estados costeros, no en una lista de golpes o atentados.

### Prioridad media

8. Añadir Brasil, Atlántico Sur, integración y energía al rector hemisférico sin crear «América Latina» como contenedor.
9. Incorporar clima, agua y alimentos solo mediante cadenas causales verificables.
10. Homogeneizar escenarios de reversión y criterios de falsación en los cinco rectores más antiguos.

## 13. Rectores que deberían ampliarse

- **Indo-Pacífico:** India–Pakistán, Océano Índico, Corea, ciber, espacio, nuclear y mecanismos de crisis; mantener Taiwán como nodo, no causa única.
- **Remilitarización industrial:** IA, nube, software, electrónica, espacio comercial, cuellos de botella y reparación/reposición.
- **Rusia–Ucrania:** sanciones secundarias, pagos, cooperación con Corea del Norte, control de armas y evidencia de desacoplamiento.
- **Hemisferio occidental:** Brasil, Caribe, Atlántico Sur, energía y respuestas regionales diferenciadas.
- **Sudán:** relaciones con Sahel y África central solo cuando existan flujos demostrables; no absorber África occidental.
- **Corredores alternativos:** seguros, financiación, monedas de pago y cables; no convertir infraestructura anunciada en resiliencia efectiva.
- **Medio Oriente:** mantener la cobertura actual y conectar la capa nuclear global; no crear un segundo rector general.

## 14. Nuevos rectores eventualmente necesarios

### Recomendado

**Erosión del control de armamentos y reconfiguración de la disuasión nuclear multipolar.** Debe construirse antes del rector mundial. Límites: cambios en normas, posturas, garantías, mando/alerta y umbrales; no catálogo de cada arma ni sustituto de teatros regionales.

### Recomendación condicionada

**Fragmentación y redundancia de la arquitectura económica-financiera internacional.** Crear solo si la fase de delimitación prueba mecanismos comunes entre sanciones, pagos, reservas, deuda, seguros y controles. Debe admitir continuidad e interdependencia como escenario base o de reversión.

### Candidato sujeto a preestudio

**Reconfiguración del orden regional de seguridad en Sahel y África occidental.** Crear solo si se verifica articulación persistente entre AES, ECOWAS, Estados costeros, redes armadas, patrocinio externo y corredores. Si la evidencia permanece nacional y fragmentada, usar subprocesos.

## 15. Candidatos descartados como rectores en esta fase

- **India como potencia:** actor amplio no equivale a mecanismo; ampliar Indo-Pacífico y corredores.
- **Península coreana:** autonomía material real, pero adicionalidad insuficiente frente a Indo-Pacífico + Rusia–Ucrania + nuclear.
- **Tecnología/ciber/IA global:** límites excesivos y alta duplicación; usar matriz transversal.
- **Espacio exterior:** habilitador crítico, todavía subordinado a conflictos y disuasión.
- **Clima/agua/alimentos:** amplificadores multicausales; exigir cadena causal por teatro.
- **América Latina general:** ya cubierta por varios mecanismos; el título regional agregaría amplitud, no explicación.
- **Medio Oriente general:** duplicaría un rector verificado y suficientemente amplio.
- **Ártico general:** cobertura logística y hemisférica suficiente para el objetivo inmediato.
- **Salud global y Antártida:** fuera de alcance sin señal sistémica demostrable.

## 16. Riesgos de duplicación

1. Contar una misma transferencia de armas en Rusia–Ucrania, remilitarización, Corea e Indo-Pacífico como cuatro señales independientes.
2. Usar «bloque» para alianzas, transacciones, dependencias y afinidades distintas.
3. Duplicar sanciones y controles entre tecnología, finanzas, hemisferio y Rusia–Ucrania.
4. Absorber India, Corea o Turquía en el rector mundial en vez de conservar su agencia y causalidad propia.
5. Transformar simultaneidad de crisis en acoplamiento sin flujo causal u operativo.
6. Contar proyectos de infraestructura como resiliencia antes de operación, interoperabilidad y demanda.
7. Crear rectores por dominios —ciber, espacio, clima— que repitan señales propietarias de teatros.

Mitigación propuesta: una señal tiene un proceso propietario; los rectores transversales registran solo efectos de segundo orden, cambios de régimen o dependencias cruzadas. Toda elevación debe citar el vínculo causal y una hipótesis de refutación.

## 17. Sesgos y desequilibrios detectados

- **Sesgo geográfico:** fuerte densidad en Medio Oriente, Turquía, corredores y África central/oriental; baja densidad en Sahel, África occidental, Caribe y Asia meridional continental.
- **Sesgo funcional:** infraestructura, recursos, producción y conflicto están mejor documentados que finanzas, normas, mediación, desescalada y reversión.
- **Sesgo de observabilidad:** contratos, obras, ejercicios y declaraciones son más fáciles de registrar que intención, mando, financiación opaca, ciberoperaciones o efectos distributivos.
- **Sesgo occidental potencial:** varias hipótesis parten de respuestas de EE. UU./UE/OTAN. Las fichas recientes corrigen parcialmente el problema al reconocer agencia de Estados de tránsito, Golfo, ASEAN, Turquía y actores africanos.
- **Sesgo de fuentes:** la búsqueda de equilibrio no debe igualar fuentes oficiales, propaganda y análisis sin evaluar trazabilidad. Las fuentes primarias prueban políticas declaradas, no resultados; las fuentes regionales aportan agencia, no quedan exentas de control de calidad.
- **Sesgo coyuntural:** el inventario reciente puede sobrerrepresentar crisis activas y anuncios de 2026. La prueba plurianual y los escenarios de reversión deben mantenerse.
- **Sesgo ideológico:** el rector de derechas reconoce heterogeneidad, pero su cobertura regional y de familias políticas es desigual; no debe convertirse en sustituto de la política exterior latinoamericana.
- **Sesgo de escalada:** hay más indicadores de deterioro que de mediación, contención y desacoplamiento. Este desequilibrio podría predeterminar el futuro rector mundial hacia una tesis alarmista.

## 18. Limitaciones

- La auditoría utiliza el árbol de trabajo actual, que contiene cambios ajenos no confirmados. No evalúa si esos cambios serán finalmente aceptados o revertidos por el usuario.
- Cinco rectores están en borrador y nueve tienen verificación parcial; la presencia documental no prueba igual madurez empírica.
- La investigación externa fue selectiva y no equivale a construir los candidatos.
- Datos de arsenales, mando, ciber, espacio, inteligencia y financiación clandestina son incompletos o clasificados.
- Las taxonomías internas usan regiones y temas con granularidad desigual; la ausencia de una etiqueta no siempre indica ausencia causal.
- No se realizó una evaluación cuantitativa de cobertura de fuentes por idioma. El sesgo lingüístico se infiere de la arquitectura y debe medirse en la fase de cada candidato.
- La fecha de corte es una fotografía; recomendaciones sobre urgencia pueden cambiar antes que la importancia estructural.

## 19. Decisiones editoriales requeridas

Ninguna de las siguientes decisiones queda aprobada por este documento:

1. ¿Autorizar la preparación del rector nuclear integrador?
2. ¿Autorizar una fase de delimitación para fragmentación financiera y monetaria?
3. ¿Autorizar un preestudio Sahel–África occidental y con qué umbral de creación?
4. ¿Aprobar que India y Corea se desarrollen como subprocesos dentro de Indo-Pacífico, no como rectores?
5. ¿Aprobar una matriz transversal tecnología–ciber–IA–espacio sin rector autónomo?
6. ¿Aprobar la regla de propiedad única de señales y efectos de segundo orden para evitar duplicación?
7. ¿Confirmar como parte de la arquitectura los cinco rectores que hoy existen solo en cambios preexistentes no confirmados?
8. ¿Exigir que todos los rectores anteriores incorporen escenarios de reversión y métricas de desescalada antes del rector mundial?

## 20. Orden recomendado antes del rector mundial

1. Resolver el estatus editorial de los cinco rectores presentes en el árbol de trabajo pero no en `HEAD`.
2. Construir y verificar la capa de gobernanza nuclear y control de armas, si se aprueba.
3. Añadir subprocesos India–Pakistán/Océano Índico y península coreana a Indo-Pacífico.
4. Implantar la matriz tecnología–ciber–IA–espacio en Indo-Pacífico, remilitarización, nuclear y cables.
5. Delimitar y decidir fragmentación financiera.
6. Ejecutar el preestudio Sahel–África occidental y decidir rector frente a ampliación.
7. Añadir indicadores comunes de acoplamiento, propagación, contención, desacoplamiento y reversión.
8. Auditar duplicaciones de señales y relaciones entre todos los rectores.
9. Solo entonces diseñar el rector «Acoplamiento de conflictos regionales y riesgo de confrontación sistémica mundial», con límites explícitos y sin absorber los procesos propietarios.

## 21. Registro de integración y controles

Esta auditoría crea únicamente este documento. No se editaron datos canónicos, análisis, expedientes, publicaciones, herramientas, navegación, proyección pública ni configuración de despliegue. No se creó ningún macroevento, expediente ficticio o vista web. El archivo se identifica como propuesta pendiente y separa hallazgos internos, evidencia externa, inferencias y recomendaciones.

Controles requeridos al cierre:

- comprobar existencia y formato Markdown;
- validar que los 10 IDs y títulos coinciden con el Observatorio actual;
- confirmar que el recuento de rectores permanece en 10 antes y después;
- confirmar que no cambió ningún archivo de datos o contenido por causa de la auditoría;
- revisar el diff exacto del documento;
- confirmar rama `beta`, ausencia de cambios en `main`, ausencia de merge y ausencia de despliegue;
- no incluir cambios preexistentes, exportaciones, cachés, dependencias ni archivos temporales en una eventual integración selectiva.

**Cierre editorial:** detenerse aquí. No crear los rectores recomendados ni el rector mundial hasta recibir aprobación explícita.
