import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { transform } from '@astrojs/compiler-rs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { groupRectorProcesses } from '../src/lib/process-relations.ts';

const require = createRequire(import.meta.url);
const pageSource = fs.readFileSync(new URL('../src/pages/observatorio/rectores/index.astro', import.meta.url), 'utf8');
const process = (id, overrides = {}) => ({
  macroevento_id: id, slug: id, titulo: id,
  por_que_importa: 'Síntesis del proceso.', es_macroevento_rector: false,
  macroevento_rector_id: null, macroevento_rector_ids: [], macroevento_relacionado_ids: [], relaciones_tipadas: [],
  publicacion: { estado: 'publicado', actualizado_el: '2026-10-01' },
  ...overrides,
});

function sample() {
  const sectorRelation = { relacion_id: 'rel-sector', origen_id: 'rector', destino_id: 'sector-externo', tipo: 'relacionada', mecanismo: 'El acceso tecnológico modifica los proveedores del sector.' };
  const rectorRelation = { relacion_id: 'rel-otro-rector', origen_id: 'otro-rector', destino_id: 'rector', tipo: 'contextual', mecanismo: 'El procesamiento aporta contexto sobre la diversificación.' };
  const root = process('rector', {
    es_macroevento_rector: true,
    macroevento_relacionado_ids: ['sector-externo', 'hijo-uno'],
    relaciones_tipadas: [sectorRelation, rectorRelation,
      { relacion_id: 'solo-tipo', origen_id: 'rector', destino_id: 'sin-dependencia', tipo: 'subordinada', mecanismo: 'No establece dependencia por sí sola.' }],
  });
  const all = [root,
    process('hijo-uno', { macroevento_rector_ids: ['rector'] }),
    process('hijo-dos', { macroevento_rector_id: 'rector' }),
    process('sector-externo', { macroevento_rector_ids: ['otro-rector'], relaciones_tipadas: [sectorRelation] }),
    process('otro-rector', { es_macroevento_rector: true, relaciones_tipadas: [rectorRelation] }),
    process('vinculo-entrante', { macroevento_relacionado_ids: ['rector'] }),
    process('sin-dependencia'),
  ];
  return { root, all };
}

test('las tarjetas separan dependencias explícitas de vínculos salientes, entrantes y entre rectores', () => {
  const { root, all } = sample();
  const before = JSON.stringify(all);
  const groups = groupRectorProcesses(root, all);
  assert.deepEqual(groups.complementaries.map(item => item.macroevento_id).sort(), ['hijo-dos', 'hijo-uno']);
  assert.deepEqual(groups.transversals.map(item => item.process.macroevento_id), ['otro-rector', 'sector-externo', 'vinculo-entrante']);
  assert.equal(groups.transversals.find(item => item.process.macroevento_id === 'sector-externo').relations.length, 1, 'La copia de una relación en ambos extremos no duplica su presentación.');
  assert.ok(!groups.complementaries.some(item => item.macroevento_id === 'sin-dependencia'), 'Un tipo de relación no crea una dependencia editorial.');
  assert.equal(JSON.stringify(all), before, 'La presentación no cambia propiedad ni jerarquía.');
});

async function renderCards(processes) {
  // Render the page's actual card template and grouping. Substitute only the
  // surrounding layout and data services to keep this an isolated UI test.
  let source = pageSource.replace(/import\s[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/g, '');
  source = source.replace(/^---\r?\n/, `---\nconst { compareProcessRelevance, editorialPreviewEnabled, processes, effectiveEditorialState, relatedPublicationForProcess, getPublicationEntries, editorialStageLabel, formatDate, humanize, groupRectorProcesses } = Astro.props;\n`)
    .replaceAll('<SiteLayout', '<div').replaceAll('</SiteLayout>', '</div>')
    .replaceAll('<PageTitle>', '<h1>').replaceAll('</PageTitle>', '</h1>')
    .replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<script>[\s\S]*?<\/script>/g, '');
  return renderAstro(source, {
    processes, groupRectorProcesses, compareProcessRelevance: () => 0,
    editorialPreviewEnabled: false,
    effectiveEditorialState: process => process.publicacion.estado,
    relatedPublicationForProcess: () => undefined,
    getPublicationEntries: async () => [{ data: { macroevento_principal_id: 'rector', slug: 'analisis-rector', publicacion: { estado: 'publicado' } } }],
    editorialStageLabel: value => value,
    formatDate: value => value,
    humanize: value => value.charAt(0).toUpperCase() + value.slice(1),
  });
}

async function renderAstro(source, props) {
  const compiled = await transform(source, {
    filename: 'rector-card-test.astro',
    internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href,
    resolvePath: specifier => specifier,
    resultScopedSlot: true,
  });
  assert.deepEqual(compiled.diagnostics.filter(item => item.severity === 'error'), []);
  const code = ts.transpileModule(compiled.code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const { default: component } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const container = await AstroContainer.create();
  return container.renderToString(component, { props });
}

test('el HTML de la tarjeta muestra contadores separados, enlaces y mecanismos sin presentar otros rectores como hijos', async () => {
  const { all } = sample();
  const html = await renderCards(all);
  const card = html.match(/<article[^>]*data-rector-id="rector"[^>]*>([\s\S]*?)<\/article>/)?.[1];
  assert.ok(card, 'Se renderiza la tarjeta del rector solicitado.');
  assert.match(card, /2 procesos complementarios/);
  assert.match(card, /3 procesos relacionados/);
  assert.match(card, /href="\/publicaciones\/analisis-rector\/"/);
  const children = card.match(/<ol[^>]*data-complementary-list[^>]*>([\s\S]*?)<\/ol>/)?.[1];
  const related = card.match(/<ul[^>]*data-transversal-list[^>]*>([\s\S]*?)<\/ul>/)?.[1];
  assert.match(children, /href="\/observatorio\/hijo-uno\/"/);
  assert.match(children, /href="\/observatorio\/hijo-dos\/"/);
  assert.doesNotMatch(children, /otro-rector|sector-externo|vinculo-entrante/);
  assert.doesNotMatch(related, /hijo-uno|hijo-dos|sin-dependencia/);
  assert.match(related, /href="\/observatorio\/otro-rector\/"/);
  assert.match(related, /Macroevento rector relacionado/);
  assert.match(related, /Contextual\./);
  assert.match(related, /El procesamiento aporta contexto sobre la diversificación\./);
  assert.match(related, /href="\/observatorio\/sector-externo\/"/);
  assert.match(related, /Relacionada\./);
  assert.match(related, /El acceso tecnológico modifica los proveedores del sector\./);
  assert.equal((card.match(/<details\b/g) || []).length, 2);
  assert.equal((card.match(/<summary\b/g) || []).length, 2, 'Ambos despliegues utilizan controles nativos accesibles.');
});

test('Escape cierra cada lista abierta, actualiza su etiqueta y devuelve foco al resumen', () => {
  function disclosure(name) {
    const listeners = {};
    const label = { textContent: '' };
    const summary = { focused: false, focus() { this.focused = true; } };
    return {
      open: true, listeners, label, summary,
      dataset: { openLabel: `Cerrar ${name}`, closedLabel: `Ver ${name}` },
      querySelector: selector => selector === 'summary' ? summary : label,
      addEventListener: (name, callback) => { listeners[name] = callback; },
    };
  }
  const disclosures = [disclosure('procesos complementarios'), disclosure('relaciones transversales')];
  const script = pageSource.match(/<script>([\s\S]*?)<\/script>/)[1];
  const compiled = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { document: { querySelectorAll: () => disclosures } });
  for (const details of disclosures) {
    assert.equal(details.label.textContent, details.dataset.openLabel);
    details.listeners.keydown({ key: 'Tab' });
    assert.equal(details.open, true);
    const event = { key: 'Escape', prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
    details.listeners.keydown(event);
    assert.equal(details.open, false);
    assert.equal(details.label.textContent, details.dataset.closedLabel);
    assert.equal(details.summary.focused, true);
    assert.ok(event.prevented && event.stopped);
  }
});

test('una señal trasladada conserva el ancla antigua en la referencia y enlaza a su único propietario', async () => {
  const source = fs.readFileSync(new URL('../src/pages/observatorio/[slug].astro', import.meta.url), 'utf8');
  const resolution = source.slice(source.indexOf('const signalIndex = new Map('), source.indexOf('\n---', source.indexOf('const signalIndex = new Map(')));
  const list = source.match(/<ul class="referenced-signal-list">[\s\S]*?<\/ul>/)[0];
  const fragment = `---\nconst { processes, process, sourceById, humanize, signalHref } = Astro.props;\n${resolution}\n---\n${list}`;
  const signal = { senal_id: 'senal-trasladada', titulo: 'Evidencia migrada', fuente_ids: ['fuente-unica'] };
  const root = process('rector', { senales: [], referencias_senal: [{ senal_id: signal.senal_id, tipo_uso: 'contextual', efecto_segundo_orden: 'Efecto sobre el rector.' }] });
  const child = process('hijo', { senales: [signal], macroevento_rector_ids: ['rector'] });
  const { signalHref } = await import('../tools/lib/navigation-policy.mjs');
  const props = {
    process: root, processes: [root, child], signalHref, humanize: value => value,
    sourceById: new Map([['fuente-unica', { url: 'https://example.org/evidencia', medio: 'Fuente conservada' }]]),
  };
  const html = await renderAstro(fragment, props);
  assert.match(html, /<li id="senal-trasladada">/, 'El enlace publicado al ID antiguo sigue encontrando una referencia.');
  assert.match(html, /href="\/observatorio\/hijo\/#senal-trasladada"/, 'La referencia conduce a la nueva ubicación de la evidencia.');
  assert.match(html, /Propietario: hijo/);
  assert.match(html, /href="https:\/\/example.org\/evidencia"/);
  assert.equal(root.senales.length, 0, 'La referencia no vuelve a duplicar la señal trasladada.');
  const own = { ...root, senales: [signal] };
  const ownHtml = await renderAstro(fragment, { ...props, process: own, processes: [own] });
  assert.doesNotMatch(ownHtml, /id="senal-trasladada"/, 'Si la cronología propia ya contiene el ancla, la referencia no duplica el ID.');
});
