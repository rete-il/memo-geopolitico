import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { transform } from '@astrojs/compiler-rs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { buildPublicPackage, validatePublicPackage } from '../tools/lib/public-export.mjs';

const keys = ['impacto', 'probabilidad', 'alcance', 'persistencia'];
function fixture() {
  const evaluation = { impacto: 5, probabilidad: 4, alcance: 5, persistencia: 5, propagacion: 5, subcobertura: 2, incertidumbre: 3, urgencia: 3, cobertura_observada: 4, confianza: 'media' };
  const source = { id: 'fuente-verificada', medio: 'Medio de prueba', titulo: 'Documento consultado', fecha: '2026-09-20', idioma: 'es', tipo: 'noticia', url: 'https://example.org/documento', estado_verificacion: 'verificada' };
  const event = {
    id: 'proceso-con-fundamento', titulo: 'Proceso de prueba', descripcion: 'Proceso con documentación.',
    fecha_corte: '2026-10-01', regiones: ['Global'], categoria: 'comercio_finanzas_sanciones',
    estado_evaluacion: 'asignada', evaluacion: evaluation, fuentes: [source], senales: [],
    fundamento_evaluacion: {
      schema_version: 1, fecha: '2026-10-01', caracter: 'editorial_provisional', alcance: 'Alcance definido.',
      evaluacion_referenciada: structuredClone(evaluation), confianza_justificacion: 'Confianza limitada por la muestra.',
      relevancia: { resumen: 'Importancia estructural.', dimensiones: keys.map(clave => ({ clave, valor: evaluation[clave], justificacion: `Evidencia sobre ${clave}.`, fuente_ids: [source.id], nota_interna: 'No pública' })) },
      atencion: {
        resumen: 'Cobertura alta observada.', periodo: { desde: '2026-09-01', hasta: '2026-10-01' },
        seleccion: 'Muestra dirigida, no exhaustiva.', criterios: [{ criterio: 'Continuidad', observacion: 'Cobertura fechada.', nota_interna: 'No pública' }],
        muestra: [{ fuente_id: source.id, origen_editorial: 'Redacción original', funcion: 'Noticia', observacion: 'Cobertura comprobada.', url: 'https://example.org/no-proyectar' }],
        exclusiones: ['Comunicados oficiales no cuentan como periodismo.'],
      },
      brecha: 'Diferencia editorial provisional.', limites: ['No mide audiencias.'], condiciones_revision: ['Revisar si cambia la cobertura.'],
      otras_dimensiones: [{ clave: 'urgencia', valor: 3, justificacion: 'Uso interno.' }], nota_interna: 'No pública',
    },
  };
  return { actualizado: '2026-10-01', macroeventos: [event] };
}
const project = (data, options = {}) => buildPublicPackage(data, {}, { includeUnpublished: true, includeInternal: false, ...options });

test('publica las justificaciones verificadas sin snapshot, puntuaciones internas ni campos arbitrarios', () => {
  const data = fixture();
  const result = project(data);
  const process = result.procesos[0];
  const basis = process.fundamento_evaluacion;
  assert.ok(basis);
  assert.deepEqual(process.valoraciones, { relevancia_geopolitica: 4.8, atencion_mediatica: 4, brecha: .8, confianza: 'media', incertidumbre: 3 });
  assert.equal(basis.otras_dimensiones, undefined);
  assert.equal(basis.evaluacion_referenciada, undefined);
  assert.doesNotMatch(JSON.stringify(basis), /nota_interna|No pública|no-proyectar/);
  assert.equal(validatePublicPackage(result, { allowDevelopment: true }).valid, true);
  basis.relevancia.dimensiones[0].fuente_ids.push('adicion');
  assert.equal(data.macroeventos[0].fundamento_evaluacion.relevancia.dimensiones[0].fuente_ids.length, 1);
});

test('no publica fundamento antiguo si cambia cualquier puntuación, confianza o estado de evaluación', () => {
  for (const key of Object.keys(fixture().macroeventos[0].evaluacion)) {
    const data = fixture();
    const event = data.macroeventos[0];
    event.evaluacion[key] = key === 'confianza' ? 'alta' : event.evaluacion[key] === 5 ? 4 : 5;
    assert.equal(project(data).procesos[0].fundamento_evaluacion, undefined, key);
  }
  for (const state of ['no_asignada', 'parcial']) {
    const data = fixture();
    data.macroeventos[0].estado_evaluacion = state;
    assert.equal(project(data).procesos[0].fundamento_evaluacion, undefined);
  }
});

test('fuentes pendientes, desconocidas o ajenas impiden proyectar la justificación incluso en vista interna', () => {
  for (const mode of ['pendiente', 'desconocida', 'ajena', 'url-insegura']) {
    const data = fixture();
    const event = data.macroeventos[0];
    if (mode === 'pendiente') event.fuentes[0].estado_verificacion = 'pendiente';
    if (mode === 'desconocida') event.fundamento_evaluacion.relevancia.dimensiones[0].fuente_ids.push('desconocida');
    if (mode === 'ajena') {
      data.macroeventos.unshift({ id: 'otro', titulo: 'Otro', descripcion: 'Otro proceso', fuentes: [{ ...event.fuentes[0], id: 'fuente-ajena' }] });
      event.fundamento_evaluacion.atencion.muestra[0].fuente_id = 'fuente-ajena';
    }
    if (mode === 'url-insegura') event.fuentes[0].url = 'javascript:alert(1)';
    for (const includeInternal of [false, true]) {
      assert.equal(project(data, { includeInternal }).procesos.find(item => item.macroevento_id === event.id).fundamento_evaluacion, undefined, `${mode}, interna=${includeInternal}`);
    }
  }
});

test('rechaza fechas inválidas, documentos fuera de ventana y diferencias entre justificación y valor activo', () => {
  const mutations = [
    event => { event.fundamento_evaluacion.fecha = '2026-02-30'; },
    event => { event.fundamento_evaluacion.atencion.periodo.hasta = '2026-10-02'; },
    event => { event.fuentes[0].fecha = '2026-08-31'; },
    event => { event.fundamento_evaluacion.relevancia.dimensiones[0].valor = 4; },
    event => { event.fundamento_evaluacion.relevancia.dimensiones[1].clave = 'impacto'; },
  ];
  for (const mutate of mutations) {
    const data = fixture(); mutate(data.macroeventos[0]);
    assert.equal(project(data).procesos[0].fundamento_evaluacion, undefined);
  }
  const result = project(fixture());
  result.procesos[0].fundamento_evaluacion.atencion.muestra[0].fuente_id = 'inexistente';
  assert.equal(validatePublicPackage(result, { allowDevelopment: true }).valid, false);
});

const require = createRequire(import.meta.url);
let component;
async function renderEvidence(process, sources) {
  if (!component) {
    const file = fs.readFileSync(new URL('../src/components/RatingEvidence.astro', import.meta.url), 'utf8');
    const source = file.replace(/import\s[^\n]+\r?\n/g, '').replace(/^---\r?\n/, '---\nconst { formatDate } = Astro.props;\n').replace(/<style>[\s\S]*?<\/style>/g, '');
    const compiled = await transform(source, { filename: 'rating-evidence-test.astro', internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href, resolvePath: specifier => specifier, resultScopedSlot: true });
    assert.deepEqual(compiled.diagnostics.filter(item => item.severity === 'error'), []);
    const code = ts.transpileModule(compiled.code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    component = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
  }
  const container = await AstroContainer.create();
  return container.renderToString(component, { props: { process, sourceById: new Map(sources.map(source => [source.fuente_id, source])), formatDate: value => value } });
}

test('el HTML expone fecha, dimensiones, muestra atribuida, enlaces, confianza y límites; escapa el texto', async () => {
  const data = fixture();
  data.macroeventos[0].fundamento_evaluacion.relevancia.dimensiones[0].justificacion += ' <script>no ejecutar</script>';
  const result = project(data);
  const html = await renderEvidence(result.procesos[0], result.fuentes);
  for (const text of ['4,8 sobre 5', '4,0 sobre 5', '+0,8', '2026-10-01', '2026-09-01', '(5 + 4 + 5 + 5)', 'Redacción original', 'Confianza editorial: media', 'No mide audiencias.', 'Revisar si cambia la cobertura.']) assert.ok(html.includes(text), text);
  assert.match(html, /href="https:\/\/example.org\/documento"/);
  assert.match(html, /&lt;script&gt;no ejecutar&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|no-proyectar|No pública|Uso interno/);
  const noBasis = { ...result.procesos[0], fundamento_evaluacion: undefined };
  assert.doesNotMatch(await renderEvidence(noBasis, result.fuentes), /data-evaluation-evidence|Alcance y fecha/);
});

test('las cifras renderizadas pertenecen a cada proceso y no se heredan del rector', async () => {
  const data = fixture();
  const event = data.macroeventos[0];
  for (const key of keys) event.evaluacion[key] = 3;
  event.evaluacion.cobertura_observada = 2;
  event.fundamento_evaluacion.evaluacion_referenciada = structuredClone(event.evaluacion);
  event.fundamento_evaluacion.relevancia.dimensiones.forEach(item => { item.valor = 3; });
  const result = project(data);
  const html = await renderEvidence(result.procesos[0], result.fuentes);
  assert.match(html, /3,0 sobre 5/);
  assert.match(html, /2,0 sobre 5/);
  assert.match(html, /Brecha: \+1,0/);
  assert.doesNotMatch(html, /4,8 sobre 5|\+0,8/);
});
