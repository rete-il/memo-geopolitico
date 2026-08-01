const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const d = (meaning, contribution, questions, avoid, example = '') => ({ meaning, contribution, questions, avoid, example });

const HELP = {
  'event-identification': d(
    'Define qué proceso se observa, cómo se identifica y en qué estado editorial se encuentra.',
    'Evita duplicados, fija el corte temporal y permite filtrar el macroevento de forma consistente.',
    ['¿El título nombra un proceso y no solo una noticia?', '¿La región y la categoría reflejan el alcance real?', '¿El estado de verificación coincide con la evidencia disponible?'],
    'Mezclar aquí conclusiones analíticas extensas o presentar como verificado lo que aún está en revisión.'
  ),
  'event-title': d(
    'Nombre estable y descriptivo del macroevento.',
    'Permite reconocer el proceso en rankings, filtros, matrices y expedientes.',
    ['¿Se entiende sin abrir la ficha?', '¿Describe una dinámica y no un titular coyuntural?', '¿Evita afirmar más de lo demostrado?'],
    'Títulos alarmistas, demasiado largos o atados a una sola fuente.',
    'Corredor de Lobito como plataforma occidental de minerales críticos y energía.'
  ),
  'event-id': d(
    'Identificador técnico único y estable.',
    'Conecta el macroevento con señales, fuentes, expedientes y futuras exportaciones.',
    ['¿Puede conservarse aunque cambie el título?', '¿Usa minúsculas, números y guiones?', '¿No existe ya otro ID igual?'],
    'Cambiarlo después de haber creado relaciones, salvo que también se revisen todas las referencias.',
    'corredor-lobito-minerales'
  ),
  'event-date': d(
    'Fecha hasta la cual fue revisada la ficha.',
    'Distingue la vigencia del análisis de la fecha de publicación de cada fuente.',
    ['¿Incluye la evidencia más reciente revisada?', '¿Debe actualizarse después de incorporar nuevas señales?'],
    'Usarla como fecha del inicio histórico del proceso o como fecha automática sin revisión real.'
  ),
  'event-type': d(
    'Clasifica la naturaleza temporal del fenómeno: puntual, recurrente, emergente, en maduración o estructural.',
    'Orienta el horizonte, los indicadores y el tipo de documento editorial que puede derivarse.',
    ['¿Es un episodio aislado o una dinámica persistente?', '¿Está naciendo, madurando o ya estructura comportamientos?', '¿Puede reaparecer periódicamente?'],
    'Elegir “estructural” solo porque el tema sea importante.'
  ),
  'event-status': d(
    'Etapa del trabajo editorial sobre la ficha.',
    'Separa material inicial, en revisión, validado o archivado.',
    ['¿La ficha fue revisada por una persona?', '¿Persisten campos críticos incompletos?', '¿Debe seguir activa en el Observatorio?'],
    'Confundir estado editorial con verificación factual.'
  ),
  'event-verification': d(
    'Grado general de respaldo de la ficha completa.',
    'Resume si las afirmaciones principales cuentan con evidencia suficiente y revisada.',
    ['¿Las fuentes respaldan las afirmaciones centrales?', '¿Hay contradicciones sin resolver?', '¿La verificación cubre todo el macroevento o solo algunas señales?'],
    'Marcar “verificado” porque exista una fuente confiable sobre un aspecto parcial.'
  ),
  'event-category': d(
    'Familia analítica interna principal del macroevento.',
    'Facilita comparación, filtros y lectura transversal del Observatorio.',
    ['¿Cuál es la dimensión dominante: seguridad, infraestructura, comercio, gobernanza, clima o tecnología?', '¿La categoría describe el núcleo y no todos los temas secundarios?'],
    'Crear categorías nuevas para cada caso o confundir categoría interna con etiqueta pública.'
  ),
  'event-regions': d(
    'Regiones afectadas o directamente implicadas.',
    'Permite analizar alcance geográfico y detectar subcobertura regional.',
    ['¿Qué regiones participan directamente?', '¿Cuáles reciben impactos secundarios relevantes?', '¿El alcance es nacional, subregional o transregional?'],
    'Agregar regiones solo porque una potencia externa intervenga diplomáticamente.'
  ),
  'event-themes': d(
    'Temas internos de detección vinculados al macroevento.',
    'Conectan la ficha con una taxonomía amplia y estable para búsqueda, comparación y seguimiento.',
    ['¿Qué temas explican el proceso?', '¿Cuáles son centrales y cuáles accesorios?', '¿Cada tema seleccionado aparece realmente en la ficha?'],
    'Seleccionar muchos temas para “cubrir todo” o conservar propuestas de IA sin revisión.'
  ),
  'event-theme-origin': d(
    'Indica quién propuso la clasificación temática.',
    'Hace visible la trazabilidad entre propuesta automática, decisión humana o trabajo mixto.',
    ['¿Los temas fueron sugeridos por IA?', '¿Fueron creados o corregidos por el editor?', '¿Hubo una combinación de ambos?'],
    'Marcar “humano” cuando solo se aceptó una propuesta automática sin revisarla.'
  ),
  'event-theme-review': d(
    'Estado de revisión humana de los temas internos.',
    'Evita tratar una clasificación propuesta como clasificación editorial aprobada.',
    ['¿Se comprobó el nombre de cada tema?', '¿Se eliminaron temas irrelevantes?', '¿Faltan temas centrales?'],
    'Cambiar a revisada sin contrastar la taxonomía.'
  ),
  'event-theme-reviewed': d(
    'Fecha de la última revisión temática humana.',
    'Permite saber cuándo se validó la clasificación y cuándo podría necesitar actualización.',
    ['¿La fecha corresponde a una revisión efectiva?', '¿Se modificaron temas después de esa fecha?'],
    'Completarla automáticamente sin intervención editorial.'
  ),
  'event-theme-version': d(
    'Versión de la taxonomía con la que se guardaron los temas.',
    'Permite detectar incompatibilidades cuando la taxonomía evoluciona.',
    ['¿La ficha usa la versión actual?', '¿Debe migrarse alguna selección antigua?'],
    'Editar el número manualmente sin ejecutar una migración real.'
  ),
  'event-process': d(
    'Explica la dinámica estructural, sus actores, intereses, indicadores y vocabulario de seguimiento.',
    'Convierte una colección de noticias en un objeto analítico actualizable.',
    ['¿Qué está cambiando?', '¿Quién impulsa, bloquea o aprovecha el proceso?', '¿Qué indicadores mostrarían avance, estancamiento o reversión?'],
    'Redactar una cronología sin mecanismo causal ni criterios de seguimiento.'
  ),
  'event-description': d(
    'Síntesis del mecanismo central del macroevento.',
    'Delimita qué pertenece al proceso y qué queda fuera.',
    ['¿Cuál es la transformación principal?', '¿Qué conecta los episodios observados?', '¿Por qué merece seguimiento de mediano o largo plazo?'],
    'Copiar una introducción de fuente o convertir la descripción en una conclusión definitiva.'
  ),
  'event-actors': d(
    'Actores con capacidad, intereses o exposición relevante.',
    'Ayuda a mapear alianzas, dependencias, beneficiarios y posibles bloqueadores.',
    ['¿Quién decide?', '¿Quién financia o ejecuta?', '¿Quién puede perder poder, rentas o autonomía?', '¿Qué actores locales suelen quedar fuera del relato?'],
    'Listar países u organizaciones sin explicar su relación con el proceso.'
  ),
  'event-interests': d(
    'Objetivos materiales, políticos, estratégicos o normativos en disputa.',
    'Permite interpretar conductas más allá de declaraciones públicas.',
    ['¿Qué recursos, rutas, normas o capacidades están en juego?', '¿Qué intenta asegurar cada actor?', '¿Existen intereses contradictorios dentro de un mismo actor?'],
    'Atribuir intenciones no documentadas como si fueran hechos.'
  ),
  'event-indicators': d(
    'Variables observables que permiten actualizar el macroevento.',
    'Transforman el análisis en un sistema de seguimiento y alerta temprana.',
    ['¿Qué dato cambiaría la evaluación?', '¿Qué hitos financieros, regulatorios, militares o sociales conviene vigilar?', '¿Puede verificarse periódicamente?'],
    'Usar conceptos vagos como “tensión creciente” sin una señal observable.'
  ),
  'event-keywords': d(
    'Términos útiles para búsqueda y recuperación interna.',
    'Mejoran la localización de fuentes y la relación con otros casos.',
    ['¿Qué nombres, siglas, proyectos y conceptos aparecen en búsquedas reales?', '¿Incluye variantes lingüísticas relevantes?'],
    'Repetir actores o temas sin aportar términos de búsqueda adicionales.'
  ),
  'event-horizon': d(
    'Ventana temporal y escenarios plausibles del proceso.',
    'Obliga a pensar condiciones, bifurcaciones e indicadores en vez de proyectar una sola trayectoria.',
    ['¿En qué plazo podrían observarse cambios significativos?', '¿Qué condiciones sostienen cada escenario?', '¿Qué hechos obligarían a revisarlo?'],
    'Tratar escenarios como predicciones o asignar plazos sin relación con decisiones reales.'
  ),
  'event-hmin': d(
    'Plazo mínimo en el que podrían aparecer efectos estructurales observables.',
    'Evita confundir movimientos inmediatos con transformación consolidada.',
    ['¿Cuál es el primer hito realista?', '¿Depende de financiación, construcción, elecciones o regulación?'],
    'Usar un año por defecto sin justificarlo.'
  ),
  'event-hmax': d(
    'Plazo máximo útil para el seguimiento actual.',
    'Delimita hasta dónde los escenarios conservan valor analítico.',
    ['¿Cuándo crecería demasiado la incertidumbre?', '¿Qué ciclos de inversión o política cubre?'],
    'Extender el horizonte para hacer parecer más importante el macroevento.'
  ),
  'event-base': d(
    'Trayectoria más plausible si las tendencias actuales continúan sin ruptura mayor.',
    'Proporciona una referencia para comparar señales futuras.',
    ['¿Qué ocurre si se cumplen los compromisos principales?', '¿Qué limitaciones persisten aun sin crisis?', '¿Qué indicadores confirmarían esta trayectoria?'],
    'Presentarlo como pronóstico seguro o como escenario ideal.'
  ),
  'event-adverse': d(
    'Trayectoria de deterioro plausible, no necesariamente la peor imaginable.',
    'Expone vulnerabilidades, cuellos de botella y riesgos de ejecución.',
    ['¿Qué puede fallar?', '¿Qué actor podría bloquear el proceso?', '¿Qué efectos distributivos generarían rechazo?'],
    'Acumular catástrofes desconectadas o usar lenguaje alarmista.'
  ),
  'event-transform': d(
    'Trayectoria que altera la estructura del problema o genera efectos cualitativamente nuevos.',
    'Ayuda a detectar oportunidades, cambios de régimen y consecuencias de segundo orden.',
    ['¿Qué combinación produciría un cambio cualitativo?', '¿Qué capacidades nuevas aparecerían?', '¿Quién ganaría o perdería centralidad?'],
    'Confundir “transformador” con “optimista”.'
  ),
  'event-evaluation': d(
    'Valoración editorial comparativa en escala 1–5.',
    'Permite ordenar macroeventos y visualizar la diferencia entre relevancia y cobertura.',
    ['¿La puntuación es coherente con casos similares?', '¿Qué evidencia justifica cada valor?', '¿Cambió algún criterio desde la última revisión?'],
    'Puntuar por intuición sin una nota explicativa o usar la escala como medición científica.'
  ),
  'score-impact': d('Magnitud potencial de las consecuencias.', 'Distingue procesos con efectos marginales de aquellos capaces de alterar recursos, seguridad o gobernanza.', ['¿Cuántas dimensiones puede afectar?', '¿Qué costos o beneficios produciría?', '¿Los efectos serían reversibles?'], 'Confundir impacto con probabilidad.'),
  'score-prob': d('Plausibilidad de que el proceso avance de forma significativa.', 'Modera escenarios importantes pero poco probables.', ['¿Qué compromisos ya existen?', '¿Qué obstáculos pueden impedirlo?', '¿Qué evidencia contradice la trayectoria?'], 'Usar certeza subjetiva o tratar anuncios como ejecución.'),
  'score-reach': d('Extensión geográfica y número de actores expuestos.', 'Diferencia efectos locales, regionales y sistémicos.', ['¿A cuántos países o redes alcanza?', '¿Existen impactos indirectos transregionales?'], 'Puntuar alto solo porque intervenga una gran potencia.'),
  'score-persistence': d('Duración probable de los efectos una vez producidos.', 'Prioriza cambios difíciles de revertir.', ['¿Quedan infraestructuras, normas o dependencias duraderas?', '¿Cuánto costaría revertirlas?'], 'Confundir duración del debate mediático con persistencia real.'),
  'score-spread': d('Capacidad del proceso para propagarse entre regiones, sectores o actores.', 'Captura efectos de contagio y encadenamientos.', ['¿Puede replicarse?', '¿Activa respuestas en otros corredores, alianzas o mercados?'], 'Duplicar el alcance geográfico sin considerar mecanismos de propagación.'),
  'score-gap': d('Grado de subcobertura respecto de la relevancia estimada.', 'Identifica procesos importantes que reciben poca atención.', ['¿La cobertura es escasa, episódica o dependiente de agencias?', '¿Faltan perspectivas locales o especializadas?'], 'Puntuar según preferencias personales o confundir cobertura crítica con ausencia de cobertura.'),
  'score-uncertainty': d('Nivel de desconocimiento, contradicción o dependencia de supuestos.', 'Hace visible cuánto puede cambiar la evaluación.', ['¿Qué datos faltan?', '¿Las fuentes discrepan?', '¿Qué parte depende de anuncios o fuentes anónimas?'], 'Usar incertidumbre como sinónimo de riesgo.'),
  'score-urgency': d('Necesidad temporal de revisar, investigar o publicar.', 'Ayuda a asignar atención editorial sin confundir urgencia con importancia.', ['¿Hay una decisión o hito próximo?', '¿La evidencia puede perder vigencia rápidamente?', '¿Una demora reduce el valor del análisis?'], 'Puntuar alto solo porque el tema esté en las noticias.'),
  'score-coverage': d('Nivel de atención mediática observada.', 'Sirve como contraparte para calcular el gap editorial.', ['¿Cuántos medios cubren el proceso?', '¿La cobertura es original o replica agencias?', '¿Hay continuidad temporal?'], 'Evaluar solo el volumen sin considerar diversidad y profundidad.'),
  'score-confidence': d('Confianza editorial en la evaluación agregada.', 'Comunica la solidez del juicio sin ocultar límites.', ['¿La evidencia es diversa y verificable?', '¿Las puntuaciones descansan en fuentes primarias?', '¿Persisten contradicciones?'], 'Asignar confianza alta por prestigio de una sola fuente.'),
  'event-signals': d(
    'Cambios fechados y observables que modifican o actualizan el macroevento.',
    'Vinculan el proceso estructural con evidencia concreta y permiten seguir su evolución.',
    ['¿Qué cambió?', '¿Cuándo ocurrió?', '¿Qué fuente lo respalda?', '¿La señal confirma, debilita o matiza la hipótesis?'],
    'Convertir cada artículo en una señal o redactar señales más amplias que la evidencia.'
  ),
  'event-sources': d(
    'Publicaciones y documentos utilizados como evidencia.',
    'Permiten trazabilidad, verificación humana y evaluación de diversidad.',
    ['¿Qué afirmación concreta respalda?', '¿Es primaria, analítica, local o de agencia?', '¿Requiere corroboración?', '¿El enlace y la fecha fueron comprobados?'],
    'Cargar referencias no leídas o considerar una fuente oficial como verificación independiente.'
  ),
  'event-diversity': d(
    'Composición de la evidencia por medios, regiones, familias y perspectivas.',
    'Revela dependencia de una agencia, sesgos geográficos y vacíos epistemológicos.',
    ['¿Hay más de un medio real?', '¿Existen fuentes locales, primarias y analíticas?', '¿Las fuentes aportan perspectivas distintas o repiten el mismo despacho?'],
    'Tratar diversidad numérica como garantía automática de calidad.'
  ),
  'exp-identification': d(
    'Define el documento editorial que se intentará producir.',
    'Transforma evidencia del Observatorio en un encargo delimitado y revisable.',
    ['¿Qué tipo de documento corresponde?', '¿La pregunta y la tesis caben en la extensión?', '¿El estado refleja el avance real?'],
    'Abrir un expediente sin pregunta clara o marcarlo listo antes de revisar la evidencia.'
  ),
  'exp-id': d('Identificador estable del expediente.', 'Conecta el encargo, sus fuentes y los archivos descargados.', ['¿Es único?', '¿Puede conservarse durante todo el ciclo editorial?'], 'Cambiarlo después de exportar encargos sin actualizar referencias.'),
  'exp-type': d(
    'Formato editorial previsto: Movimiento, Foco o Dossier.',
    'Determina profundidad, extensión, suficiencia documental y estructura del encargo.',
    ['¿Se trata de un cambio puntual que merece seguimiento?', '¿Es un proceso estructural?', '¿Requiere un análisis autónomo y extenso?'],
    'Elegir Foco o Dossier solo para aumentar extensión.'
  ),
  'exp-status': d(
    'Etapa del expediente dentro del flujo editorial.',
    'Distingue evidencia pendiente, encargo exportado, borrador recibido, revisión y aprobación.',
    ['¿Qué acción ya ocurrió realmente?', '¿El encargo fue descargado?', '¿Existe ya un borrador recibido?'],
    'Usar “publicado” o “aprobado” sin QA y aprobación humana.'
  ),
  'exp-length': d(
    'Extensión orientativa del futuro documento.',
    'Ayuda a ajustar alcance, número de argumentos y necesidad de evidencia.',
    ['¿La pregunta puede responderse en esa extensión?', '¿Hay evidencia suficiente para sostenerla?', '¿Debe recortarse o dividirse?'],
    'Rellenar palabras con contexto no respaldado.'
  ),
  'exp-title': d(
    'Título provisional del documento.',
    'Orienta la investigación sin convertirse todavía en título definitivo.',
    ['¿Expresa el problema central?', '¿Evita prometer una conclusión no demostrada?', '¿Resulta comprensible fuera del Observatorio?'],
    'Usar lenguaje promocional, categórico o excesivamente técnico.'
  ),
  'exp-question': d(
    'Pregunta que el documento debe responder.',
    'Delimita la búsqueda y permite decidir qué evidencia es pertinente.',
    ['¿Incluye objeto, mecanismo y relevancia?', '¿Puede responderse con evidencia verificable?', '¿Evita acumular varias preguntas distintas?'],
    'Plantear una pregunta cuya respuesta ya esté asumida en términos absolutos.'
  ),
  'exp-thesis': d(
    'Interpretación provisional que organizará el texto.',
    'Define qué afirmaciones necesitan respaldo y qué contradicciones deben examinarse.',
    ['¿Qué está cambiando y por qué?', '¿Qué condiciones sostienen la interpretación?', '¿Qué evidencia podría refutarla o matizarla?'],
    'Tratarla como conclusión cerrada antes de completar la investigación.'
  ),
  'exp-events': d(
    'Macroeventos que aportan contexto y evidencia al expediente.',
    'Permiten combinar procesos relacionados sin perder trazabilidad.',
    ['¿Cada macroevento es necesario para responder la pregunta?', '¿Existe solapamiento o dispersión?', '¿Conviene mantener un piloto con un solo caso?'],
    'Agregar macroeventos para ampliar artificialmente el alcance.'
  ),
  'exp-signals': d(
    'Señales concretas que el futuro documento puede utilizar.',
    'Aporta actualidad verificable dentro de un análisis estructural.',
    ['¿La señal fue revisada?', '¿Respalda una parte relevante de la tesis?', '¿Está vinculada con la fuente correcta?'],
    'Seleccionar señales pendientes o redundantes.'
  ),
  'exp-sources': d(
    'Fuentes verificadas autorizadas para el encargo.',
    'Limita el material que ChatGPT puede usar y reduce invenciones.',
    ['¿La fuente fue abierta y leída?', '¿Qué afirmación respalda?', '¿Aporta diversidad o solo replica una agencia?', '¿Falta una fuente primaria o local?'],
    'Autorizar una fuente solo por reputación o porque aparece en una lista automática.'
  ),
  'exp-classification': d(
    'Metadatos públicos previstos para organizar el documento en el sitio.',
    'Facilitan navegación por geografía, tema y proceso sin exponer la taxonomía interna completa.',
    ['¿Las etiquetas son pocas, estables y comprensibles?', '¿Distinguen lugar, tema y proceso?', '¿Coinciden con el vocabulario público aprobado?'],
    'Copiar todos los temas internos o crear slugs sin revisar el esquema del sitio.'
  ),
  'exp-geographies': d('Geografías públicas asociadas al documento.', 'Permiten navegación territorial y páginas regionales.', ['¿Qué lugares son objeto central?', '¿Qué escalas regionales son realmente útiles?'], 'Agregar países mencionados solo como actores externos.'),
  'exp-topics': d('Temas públicos principales.', 'Ayudan al lector a encontrar documentos por materia.', ['¿Cuáles son los dos a cinco temas dominantes?', '¿Son comprensibles fuera del equipo editorial?'], 'Usar sinónimos duplicados o categorías demasiado estrechas.'),
  'exp-processes': d('Procesos estructurales que atraviesan el documento.', 'Conectan casos distintos mediante dinámicas comparables.', ['¿Qué mecanismo de largo plazo representa el caso?', '¿Puede aplicarse a otros documentos?'], 'Confundir proceso con actor, lugar o sector.'),
  'exp-uncertainties': d(
    'Límites, hechos no cerrados y afirmaciones que deben conservar cautela.',
    'Evita que el encargo convierta hipótesis o anuncios en certezas.',
    ['¿Qué no sabemos?', '¿Qué depende de fuentes anónimas o compromisos futuros?', '¿Qué afirmación podría cambiar pronto?'],
    'Usar frases genéricas como “la situación es incierta” sin indicar el punto concreto.'
  ),
  'exp-related': d(
    'Referencias editoriales a otros documentos pertinentes.',
    'Ayudan a contextualizar y evitar duplicación de análisis.',
    ['¿Existe realmente el documento?', '¿La relación aporta contexto o continuidad temática?', '¿El identificador fue validado?'],
    'Crear Dossiers ficticios o tratar referencias provisionales como rutas definitivas.'
  ),
  'exp-diversity': d(
    'Resumen de la variedad de fuentes seleccionadas para el expediente.',
    'Permite detectar dependencia de un medio, una región o una perspectiva antes de redactar.',
    ['¿Cuántos medios únicos hay?', '¿Existen fuentes primarias, locales y analíticas?', '¿Alguna fuente reproduce a otra?'],
    'Aumentar la cantidad con duplicados o confundir diversidad con neutralidad.'
  ),
  'exp-sufficiency': d(
    'Puerta editorial orientativa que compara el expediente con mínimos documentales.',
    'Indica si conviene investigar más antes de preparar un encargo de redacción.',
    ['¿Qué criterio falta?', '¿El vacío es cuantitativo o temático?', '¿Una excepción editorial puede justificarse?'],
    'Tratar el resultado como certificación automática o ignorar vacíos temáticos porque se alcanzó un número.'
  ),
  'exp-output': d(
    'Genera encargos que luego se ejecutan en ChatGPT.',
    'Separa la investigación, la redacción y la descarga del archivo para que cada acción sea explícita.',
    ['¿Necesitás ampliar evidencia o redactar?', '¿El encargo apareció en el panel?', '¿El nombre del archivo es claro antes de descargar?'],
    'Confundir el encargo descargado con el artículo final. El dashboard no llama a ChatGPT ni redacta por sí mismo.'
  ),
  'exp-filename': d(
    'Nombre editable del archivo que contiene el encargo.',
    'Permite reconocer si se trata de investigación o redacción y vincularlo con el expediente.',
    ['¿Incluye el ID del expediente?', '¿Distingue investigación de redacción?', '¿Termina en .md?'],
    'Usar nombres genéricos como documento.md o confundirlo con el nombre del futuro artículo.'
  ),
};

const FIELD_BINDINGS = [
  ['#e-title', 'event-title'], ['#e-id', 'event-id'], ['#e-date', 'event-date'], ['#e-type', 'event-type'],
  ['#e-status', 'event-status'], ['#e-verification', 'event-verification'], ['#e-category', 'event-category'],
  ['#e-regions', 'event-regions'], ['#e-theme-search', 'event-themes'], ['#e-theme-origin', 'event-theme-origin'],
  ['#e-theme-review', 'event-theme-review'], ['#e-theme-reviewed', 'event-theme-reviewed'], ['#e-theme-version', 'event-theme-version'],
  ['#e-description', 'event-description'], ['#e-actors', 'event-actors'], ['#e-interests', 'event-interests'],
  ['#e-indicators', 'event-indicators'], ['#e-keywords', 'event-keywords'], ['#e-hmin', 'event-hmin'], ['#e-hmax', 'event-hmax'],
  ['#e-base', 'event-base'], ['#e-adverse', 'event-adverse'], ['#e-transform', 'event-transform'],
  ['#s-impact', 'score-impact'], ['#s-prob', 'score-prob'], ['#s-reach', 'score-reach'], ['#s-persistence', 'score-persistence'],
  ['#s-spread', 'score-spread'], ['#s-gap', 'score-gap'], ['#s-uncertainty', 'score-uncertainty'],
  ['#s-urgency', 'score-urgency'], ['#s-coverage', 'score-coverage'], ['#s-confidence', 'score-confidence'],
  ['#x-id', 'exp-id'], ['#x-doc-type', 'exp-type'], ['#x-editor-status', 'exp-status'], ['#x-length', 'exp-length'],
  ['#x-title', 'exp-title'], ['#x-question', 'exp-question'], ['#x-thesis', 'exp-thesis'],
  ['#x-geographies', 'exp-geographies'], ['#x-topics', 'exp-topics'], ['#x-processes', 'exp-processes'],
  ['#x-uncertainties', 'exp-uncertainties'], ['#x-related', 'exp-related'], ['#prompt-filename', 'exp-filename'],
];

const SECTION_BINDINGS = [
  ['#e-title', 'event-identification'], ['#e-description', 'event-process'], ['#e-hmin', 'event-horizon'],
  ['#s-impact', 'event-evaluation'], ['#add-signal', 'event-signals'], ['#add-source', 'event-sources'],
  ['#event-diversity', 'event-diversity'], ['#x-id', 'exp-identification'], ['#x-event-options', 'exp-events'],
  ['#x-signal-options', 'exp-signals'], ['#x-source-options', 'exp-sources'], ['#x-geographies', 'exp-classification'],
  ['#exp-diversity', 'exp-diversity'], ['#exp-sufficiency', 'exp-sufficiency'], ['#chatgpt-briefs', 'exp-output'],
];

let currentTrigger = null;
let currentKey = '';
let pinned = false;
let hideTimer = null;
let suppressFocusOpen = false;
let suppressOpenUntil = 0;

// Parche 0.2.2.2: al ocultarse el popover, el puntero puede quedar sobre
// otro icono de ayuda situado debajo. Algunos navegadores disparan entonces
// un nuevo pointerenter y parecen "reabrir" el panel. Este breve bloqueo
// afecta solo a aperturas automáticas por hover/foco; el clic intencional
// continúa funcionando.
function suppressAutomaticOpen(milliseconds = 500) {
  suppressOpenUntil = Math.max(suppressOpenUntil, performance.now() + milliseconds);
}

function automaticOpenIsSuppressed() {
  return suppressFocusOpen || performance.now() < suppressOpenUntil;
}

function buttonFor(key, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'help-trigger';
  button.textContent = 'ⓘ';
  button.dataset.helpKey = key;
  button.setAttribute('aria-label', `Ayuda: ${label}`);
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', 'context-help');
  button.setAttribute('aria-expanded', 'false');
  return button;
}

function attachField(selector, key) {
  const control = document.querySelector(selector);
  const definition = HELP[key];
  if (!control || !definition) return;
  const field = control.closest('.field');
  const label = field?.querySelector(':scope > span');
  if (!label || label.querySelector('.help-trigger')) return;
  const title = label.textContent.trim();
  label.classList.add('field-label-with-help');
  label.append(buttonFor(key, title));
}

function attachSection(anchorSelector, key) {
  const anchor = document.querySelector(anchorSelector);
  const definition = HELP[key];
  if (!anchor || !definition) return;
  const fieldset = anchor.matches('fieldset') ? anchor : anchor.closest('fieldset');
  const legend = fieldset?.querySelector(':scope > legend');
  if (!legend || legend.querySelector('.help-trigger')) return;
  const title = legend.textContent.trim();
  legend.classList.add('legend-with-help');
  legend.append(buttonFor(key, title));
}

function section(title, value) {
  if (!value) return '';
  return `<section><h4>${esc(title)}</h4><p>${esc(value)}</p></section>`;
}

function questions(items = []) {
  if (!items.length) return '';
  return `<section><h4>Preguntas orientadoras</h4><ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></section>`;
}

function render(key, compact) {
  const definition = HELP[key];
  if (!definition) return;
  const title = document.querySelector(`[data-help-key="${key}"]`)?.getAttribute('aria-label')?.replace(/^Ayuda:\s*/, '') || 'Orientación del campo';
  document.querySelector('#context-help-title').textContent = title;
  const body = document.querySelector('#context-help-body');
  if (compact) {
    body.innerHTML = `${section('Qué significa', definition.meaning)}${section('Por qué importa', definition.contribution)}<p class="context-help-hint">Hacé clic en el icono para fijar la ayuda y ver preguntas, ejemplo y errores a evitar.</p>`;
    return;
  }
  body.innerHTML = `${section('Qué significa', definition.meaning)}${section('Por qué importa', definition.contribution)}${questions(definition.questions)}${section('Ejemplo', definition.example)}${section('Evitar', definition.avoid)}`;
}

function isOpen(popover) {
  try { return popover.matches(':popover-open'); } catch { return !popover.hidden; }
}

function openPopover(popover) {
  if (typeof popover.showPopover === 'function') {
    if (!isOpen(popover)) popover.showPopover();
  } else {
    popover.hidden = false;
  }
}

function hidePopover(popover) {
  if (typeof popover.hidePopover === 'function') {
    if (isOpen(popover)) popover.hidePopover();
  } else {
    popover.hidden = true;
  }
}

function positionPopover() {
  const popover = document.querySelector('#context-help');
  if (!currentTrigger || !isOpen(popover)) return;
  const triggerRect = currentTrigger.getBoundingClientRect();
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  const gap = 10;
  let left = triggerRect.right + gap;
  if (left + width > window.innerWidth - 12) left = triggerRect.left - width - gap;
  if (left < 12) left = Math.min(Math.max(12, triggerRect.left), window.innerWidth - width - 12);
  let top = triggerRect.top - 8;
  if (top + height > window.innerHeight - 12) top = window.innerHeight - height - 12;
  if (top < 12) top = 12;
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function setExpanded(trigger, value) {
  trigger?.setAttribute('aria-expanded', value ? 'true' : 'false');
}

function showHelp(trigger, key, shouldPin) {
  clearTimeout(hideTimer);
  if (currentTrigger && currentTrigger !== trigger) setExpanded(currentTrigger, false);
  currentTrigger = trigger;
  currentKey = key;
  pinned = shouldPin;
  render(key, !shouldPin);
  const popover = document.querySelector('#context-help');
  openPopover(popover);
  setExpanded(trigger, true);
  requestAnimationFrame(positionPopover);
}

export function closeContextHelp(returnFocus = false) {
  clearTimeout(hideTimer);
  const trigger = currentTrigger;
  const popover = document.querySelector('#context-help');

  // Bloquea la reapertura automática causada por el foco devuelto o por un
  // pointerenter sobre un icono que queda debajo del popover recién cerrado.
  suppressAutomaticOpen();

  if (popover) hidePopover(popover);
  setExpanded(trigger, false);
  currentTrigger = null;
  currentKey = '';
  pinned = false;

  if (returnFocus && trigger?.isConnected) {
    suppressFocusOpen = true;
    try {
      trigger.focus({ preventScroll: true });
    } catch {
      trigger.focus();
    }
    // Dos frames cubren navegadores que difieren el evento de foco.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      suppressFocusOpen = false;
    }));
  }
}

function scheduleClose() {
  clearTimeout(hideTimer);
  if (pinned) return;
  hideTimer = setTimeout(() => closeContextHelp(false), 140);
}

export function initContextHelp() {
  FIELD_BINDINGS.forEach(([selector, key]) => attachField(selector, key));
  SECTION_BINDINGS.forEach(([selector, key]) => attachSection(selector, key));

  document.querySelectorAll('.help-trigger').forEach((trigger) => {
    const key = trigger.dataset.helpKey;
    trigger.addEventListener('pointerenter', () => {
      if (automaticOpenIsSuppressed()) return;
      showHelp(trigger, key, false);
    });
    trigger.addEventListener('pointerleave', scheduleClose);
    trigger.addEventListener('focus', () => {
      if (automaticOpenIsSuppressed()) return;
      showHelp(trigger, key, false);
    });
    trigger.addEventListener('blur', scheduleClose);
    trigger.addEventListener('pointerdown', (event) => event.stopPropagation());
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const samePinned = currentTrigger === trigger && pinned;
      if (samePinned) closeContextHelp(true);
      else showHelp(trigger, key, true);
    });
  });

  const popover = document.querySelector('#context-help');
  const close = document.querySelector('#close-context-help');
  popover.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  popover.addEventListener('pointerleave', scheduleClose);
  close.addEventListener('pointerdown', (event) => event.stopPropagation());
  close.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeContextHelp(true);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen(popover)) {
      event.preventDefault();
      closeContextHelp(true);
    }
  }, true);

  document.addEventListener('pointerdown', (event) => {
    if (!pinned || !isOpen(popover)) return;
    if (popover.contains(event.target) || currentTrigger?.contains(event.target)) return;
    closeContextHelp(false);
  }, true);

  document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('close', () => closeContextHelp(false)));
  window.addEventListener('resize', positionPopover);
  document.addEventListener('scroll', positionPopover, true);
  console.info('[Observatorio] Ayuda contextual: parche 0.2.2.2 activo');
}
