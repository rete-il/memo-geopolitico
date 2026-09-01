import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeSignalReference,
  normalizeTypedRelation,
  validateTransversalContract,
} from '../centro-local/modules/observatorio/lib/transversal-contract.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const target = path.join(root, 'centro-local', 'modules', 'observatorio', 'data', 'macroeventos.json');
const data = JSON.parse(fs.readFileSync(target, 'utf8'));
const rectors = data.macroeventos.filter((event) => event.es_macroevento_rector);
const rectorIds = new Set(rectors.map((event) => event.id));
const byId = new Map(data.macroeventos.map((event) => [event.id, event]));

const TYPES = {
  'corredores-alternativos-redes-logisticas-redundantes>turquia-potencia-bisagra-reordenamiento-regional': ['relacionada', 'La centralidad logística turca depende de corredores que compiten, convergen o desvían flujos entre Asia, Medio Oriente y Europa.'],
  'sudan-guerra-civil-regionalizacion-mar-rojo>turquia-potencia-bisagra-reordenamiento-regional': ['relacionada', 'La proyección turca en el Cuerno de África interactúa con la regionalización de Sudán mediante seguridad marítima, mediación y acceso logístico.'],
  'sudan-guerra-civil-regionalizacion-mar-rojo>corredores-alternativos-redes-logisticas-redundantes': ['amplificadora', 'La inseguridad del mar Rojo eleva costos y demanda de rutas redundantes, mientras la disponibilidad de alternativas modifica la propagación del choque.'],
  'rusia-ucrania-redes-seguridad-sostenimiento>turquia-potencia-bisagra-reordenamiento-regional': ['contenedora', 'La aplicación turca de Montreux y su interlocución simultánea limitan parte de la expansión naval sin separar por completo el teatro.'],
  'rusia-ucrania-redes-seguridad-sostenimiento>sudan-guerra-civil-regionalizacion-mar-rojo': ['amplificadora', 'Redes de sostenimiento, oro y acceso al mar Rojo trasladan recursos e incentivos entre la guerra europea y actores presentes en Sudán.'],
  'rusia-ucrania-redes-seguridad-sostenimiento>corredores-alternativos-redes-logisticas-redundantes': ['amplificadora', 'La guerra y las sanciones aceleran desvíos comerciales, energéticos y logísticos hacia corredores alternativos.'],
  'africa-central-minerales-criticos-cadenas-tecnologicas>corredores-alternativos-redes-logisticas-redundantes': ['amplificadora', 'La salida y el procesamiento de minerales dependen de financiación, energía y corredores como Lobito, que redistribuyen dependencias.'],
  'africa-central-minerales-criticos-cadenas-tecnologicas>rusia-ucrania-redes-seguridad-sostenimiento': ['contextual', 'Ambos procesos inciden en seguridad de suministro y competencia estratégica, pero no se presume transferencia causal directa sin evidencia adicional.'],
  'remilitarizacion-industrial-cadenas-estrategicas-bloques>rusia-ucrania-redes-seguridad-sostenimiento': ['amplificadora', 'La demanda de la guerra acelera contratos, capacidad productiva y compromisos presupuestarios que prolongan las redes de sostenimiento.'],
  'remilitarizacion-industrial-cadenas-estrategicas-bloques>africa-central-minerales-criticos-cadenas-tecnologicas': ['amplificadora', 'La expansión industrial militar aumenta la demanda segura de minerales y refuerza políticas de trazabilidad, procesamiento y diversificación.'],
  'remilitarizacion-industrial-cadenas-estrategicas-bloques>corredores-alternativos-redes-logisticas-redundantes': ['amplificadora', 'La movilización industrial convierte transporte, puertos y redundancia logística en insumos de seguridad y producción.'],
  'estados-unidos-reordenamiento-hemisferio-occidental>corredores-alternativos-redes-logisticas-redundantes': ['amplificadora', 'La presión sobre puertos, canales y cadenas hemisféricas reorienta financiación y selección de corredores.'],
  'estados-unidos-reordenamiento-hemisferio-occidental>africa-central-minerales-criticos-cadenas-tecnologicas': ['relacionada', 'La política hemisférica de cadenas críticas forma parte de una diversificación más amplia frente a la concentración minera y de refinado africana y china.'],
  'estados-unidos-reordenamiento-hemisferio-occidental>remilitarizacion-industrial-cadenas-estrategicas-bloques': ['amplificadora', 'La integración estadounidense de comercio, industria y seguridad extiende criterios de defensa a proveedores y cadenas hemisféricas.'],
  'estados-unidos-reordenamiento-hemisferio-occidental>rusia-ucrania-redes-seguridad-sostenimiento': ['contextual', 'Las sanciones y la competencia con Rusia comparten instrumentos económicos, pero sus efectos hemisféricos conservan causalidad propia.'],
  'derechas-transnacionales-reconfiguracion-america-latina>estados-unidos-reordenamiento-hemisferio-occidental': ['amplificadora', 'Redes políticas y marcos discursivos facilitan apoyos selectivos a prioridades hemisféricas, sin producir un bloque uniforme.'],
  'derechas-transnacionales-reconfiguracion-america-latina>africa-central-minerales-criticos-cadenas-tecnologicas': ['coincidente', 'La simultaneidad temática sobre recursos y China no demuestra coordinación ni transferencia causal entre ambos procesos.'],
  'derechas-transnacionales-reconfiguracion-america-latina>remilitarizacion-industrial-cadenas-estrategicas-bloques': ['contextual', 'Los discursos de seguridad pueden legitimar gasto y cooperación, pero la movilización industrial responde también a amenazas y capacidades independientes.'],
  'derechas-transnacionales-reconfiguracion-america-latina>rusia-ucrania-redes-seguridad-sostenimiento': ['contextual', 'La circulación política y la guerra de información afectan posiciones sobre ayuda y sanciones, sin fusionar las dinámicas partidarias con el teatro militar.'],
  'indo-pacifico-taiwan-reconfiguracion-seguridad>remilitarizacion-industrial-cadenas-estrategicas-bloques': ['amplificadora', 'Alianzas, negación y resiliencia del Indo-Pacífico sostienen demanda de producción, coproducción y tecnologías de doble uso.'],
  'indo-pacifico-taiwan-reconfiguracion-seguridad>africa-central-minerales-criticos-cadenas-tecnologicas': ['amplificadora', 'Semiconductores, baterías y defensa conectan la resiliencia tecnológica asiática con extracción y refinado de minerales africanos.'],
  'indo-pacifico-taiwan-reconfiguracion-seguridad>rusia-ucrania-redes-seguridad-sostenimiento': ['amplificadora', 'La cooperación Rusia–Corea del Norte transfiere capacidades y recursos entre teatros sin convertirlos automáticamente en una guerra única.'],
  'indo-pacifico-taiwan-reconfiguracion-seguridad>estados-unidos-reordenamiento-hemisferio-occidental': ['relacionada', 'La competencia con China conecta controles tecnológicos y cadenas resilientes del Indo-Pacífico con políticas de preeminencia y suministro hemisférico.'],
  'indo-pacifico-taiwan-reconfiguracion-seguridad>corredores-alternativos-redes-logisticas-redundantes': ['amplificadora', 'La vulnerabilidad de estrechos y accesos marítimos impulsa dispersión portuaria y corredores terrestres alternativos.'],
  'erosion-control-armamentos-disuasion-nuclear-multipolar>rusia-ucrania-redes-seguridad-sostenimiento': ['amplificadora', 'La erosión de límites y la doctrina nuclear comprimen la gestión de escalada y condicionan apoyo, despliegues y garantías en Europa.'],
  'erosion-control-armamentos-disuasion-nuclear-multipolar>indo-pacifico-taiwan-reconfiguracion-seguridad': ['amplificadora', 'Garantías extendidas, doble capacidad y modernización conectan crisis regionales asiáticas con cálculos nucleares de varias potencias.'],
  'erosion-control-armamentos-disuasion-nuclear-multipolar>remilitarizacion-industrial-cadenas-estrategicas-bloques': ['amplificadora', 'La modernización nuclear y multidominio sostiene demanda industrial y ambigüedad entre capacidades convencionales y estratégicas.'],
  'erosion-control-armamentos-disuasion-nuclear-multipolar>medio-oriente-acuerdos-abraham-guerra-regionalizada': ['amplificadora', 'La incertidumbre sobre Irán, garantías y defensa misilística transmite riesgo de proliferación y escalada al orden regional.'],
  'erosion-control-armamentos-disuasion-nuclear-multipolar>estados-unidos-reordenamiento-hemisferio-occidental': ['contextual', 'Defensa continental, alerta y garantías comparten infraestructura estratégica, pero no toda coerción hemisférica posee mecanismo nuclear.'],
  'erosion-control-armamentos-disuasion-nuclear-multipolar>africa-central-minerales-criticos-cadenas-tecnologicas': ['coincidente', 'La dependencia material de cadenas críticas es relevante para capacidades estratégicas, pero la coincidencia no prueba acoplamiento operativo.'],
};

const EVIDENCE = {
  'corredores-alternativos-redes-logisticas-redundantes>turquia-potencia-bisagra-reordenamiento-regional': 'sig-rector-corredores-iraq-gobernanza-20240507',
  'sudan-guerra-civil-regionalizacion-mar-rojo>turquia-potencia-bisagra-reordenamiento-regional': 'sig-sudan-guerra-civil-regionalizacion-mar-rojo-internacionalizacion-20260417',
  'sudan-guerra-civil-regionalizacion-mar-rojo>corredores-alternativos-redes-logisticas-redundantes': 'sig-sudan-guerra-civil-regionalizacion-mar-rojo-desplazamiento-hambre-20260824',
  'rusia-ucrania-redes-seguridad-sostenimiento>turquia-potencia-bisagra-reordenamiento-regional': 'sig-rector-rusia-ucrania-contencion-turquia-20220829',
  'rusia-ucrania-redes-seguridad-sostenimiento>sudan-guerra-civil-regionalizacion-mar-rojo': 'sig-rector-rusia-ucrania-adaptacion-trigo-20240222',
  'rusia-ucrania-redes-seguridad-sostenimiento>corredores-alternativos-redes-logisticas-redundantes': 'sig-rector-rusia-ucrania-adaptacion-trigo-20240222',
  'africa-central-minerales-criticos-cadenas-tecnologicas>corredores-alternativos-redes-logisticas-redundantes': 'sig-africa-central-lobito-financiacion-zambia-2026',
  'remilitarizacion-industrial-cadenas-estrategicas-bloques>rusia-ucrania-redes-seguridad-sostenimiento': 'sig-remilitarizacion-rusia-economia-guerra',
  'remilitarizacion-industrial-cadenas-estrategicas-bloques>africa-central-minerales-criticos-cadenas-tecnologicas': 'sig-remilitarizacion-nato-produccion-2025',
  'remilitarizacion-industrial-cadenas-estrategicas-bloques>corredores-alternativos-redes-logisticas-redundantes': 'sig-remilitarizacion-nato-produccion-2025',
  'estados-unidos-reordenamiento-hemisferio-occidental>corredores-alternativos-redes-logisticas-redundantes': 'sig-hemisferio-panama-puertos-2025',
  'estados-unidos-reordenamiento-hemisferio-occidental>africa-central-minerales-criticos-cadenas-tecnologicas': 'sig-hemisferio-nss-preeminencia-2025',
  'estados-unidos-reordenamiento-hemisferio-occidental>remilitarizacion-industrial-cadenas-estrategicas-bloques': 'sig-hemisferio-trade-policy-2025',
  'derechas-transnacionales-reconfiguracion-america-latina>estados-unidos-reordenamiento-hemisferio-occidental': 'sig-derechas-cpac-infraestructura-2024',
  'derechas-transnacionales-reconfiguracion-america-latina>remilitarizacion-industrial-cadenas-estrategicas-bloques': 'sig-derechas-milei-nodo-cpac-2024',
  'derechas-transnacionales-reconfiguracion-america-latina>rusia-ucrania-redes-seguridad-sostenimiento': 'sig-derechas-difusion-sin-integracion-2025',
  'indo-pacifico-taiwan-reconfiguracion-seguridad>remilitarizacion-industrial-cadenas-estrategicas-bloques': 'sig-indo-pacifico-aukus-industrial',
  'indo-pacifico-taiwan-reconfiguracion-seguridad>africa-central-minerales-criticos-cadenas-tecnologicas': 'sig-indo-pacifico-chips-controles-2024',
  'indo-pacifico-taiwan-reconfiguracion-seguridad>rusia-ucrania-redes-seguridad-sostenimiento': 'sig-indo-pacifico-corea-acoplamiento',
  'indo-pacifico-taiwan-reconfiguracion-seguridad>estados-unidos-reordenamiento-hemisferio-occidental': 'sig-indo-pacifico-chips-controles-2024',
  'indo-pacifico-taiwan-reconfiguracion-seguridad>corredores-alternativos-redes-logisticas-redundantes': 'sig-indo-pacifico-interdependencia',
  'erosion-control-armamentos-disuasion-nuclear-multipolar>rusia-ucrania-redes-seguridad-sostenimiento': 'sig-nuclear-rusia-doctrina-2024',
  'erosion-control-armamentos-disuasion-nuclear-multipolar>indo-pacifico-taiwan-reconfiguracion-seguridad': 'sig-nuclear-garantias-proliferacion-latente',
  'erosion-control-armamentos-disuasion-nuclear-multipolar>remilitarizacion-industrial-cadenas-estrategicas-bloques': 'sig-nuclear-dualidad-integracion',
  'erosion-control-armamentos-disuasion-nuclear-multipolar>medio-oriente-acuerdos-abraham-guerra-regionalizada': 'sig-nuclear-iran-verificacion-2026',
  'erosion-control-armamentos-disuasion-nuclear-multipolar>estados-unidos-reordenamiento-hemisferio-occidental': 'sig-nuclear-comunicacion-riesgo',
};

for (const event of data.macroeventos) {
  event.senales = (event.senales || []).map((signal) => ({
    ...signal,
    propietario_macroevento_id: event.id,
  }));
  event.referencias_senal = [];
}

const relations = [];
for (const origin of rectors) {
  for (const destinationId of origin.macroevento_relacionado_ids || []) {
    if (!rectorIds.has(destinationId)) continue;
    const destination = byId.get(destinationId);
    const key = `${origin.id}>${destinationId}`;
    const definition = TYPES[key];
    if (!definition) throw new Error(`Falta clasificación editorial para ${key}`);
    const [type, mechanism] = definition;
    const evidenceId = EVIDENCE[key];
    const evidence = evidenceId
      ? (origin.senales || []).find((signal) => signal.id === evidenceId)
      : null;
    if (evidenceId && !evidence) throw new Error(`Evidencia editorial inexistente para ${key}: ${evidenceId}`);
    const symmetric = ['relacionada', 'contextual', 'coincidente'].includes(type);
    const relation = normalizeTypedRelation({
      id: `rel-${origin.id}-${destinationId}`,
      origen_id: origin.id,
      destino_id: destinationId,
      tipo: type,
      mecanismo: mechanism,
      evidencia_senal_ids: evidence ? [evidence.id] : [],
      direccion: symmetric ? 'bidireccional' : 'origen_destino',
      reciprocidad: symmetric,
      estado_revision: 'revisada',
      justificacion: `Clasificación conservadora del vínculo heredado entre «${origin.titulo}» y «${destination.titulo}»; distingue mecanismo de simultaneidad.`,
      condicion_refutacion: 'Se revisará o retirará si la evidencia deja de mostrar el mecanismo descrito o si sólo permanece simultaneidad temática.',
    }, relations.length);
    relations.push(relation);
    if (evidence) {
      destination.referencias_senal.push(normalizeSignalReference({
        senal_id: evidence.id,
        tipo_uso: type === 'subordinada' ? 'relacionada' : type,
        efecto_segundo_orden: mechanism,
      }));
    }
  }
}

data.relaciones_macroeventos = relations;
data.actualizado = '2026-09-01';
data.notas = `${String(data.notas || '').trim()}\nContrato transversal incorporado el 2026-09-01: propiedad única de señales, referencias de segundo orden y relaciones tipadas.`.trim();

const validation = validateTransversalContract(data);
if (!validation.valid) throw new Error(validation.errors.join('\n'));
if (relations.length !== 30) throw new Error(`Se esperaban 30 relaciones rector–rector y se generaron ${relations.length}.`);

fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ relaciones: relations.length, senales: [...data.macroeventos].flatMap((event) => event.senales || []).length, referencias: data.macroeventos.reduce((sum, event) => sum + (event.referencias_senal || []).length, 0) }, null, 2));
