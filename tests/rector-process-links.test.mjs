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
  return renderAstroFile(new URL('../src/pages/observatorio/rectores/index.astro', import.meta.url), {}, {
    processes,
    publications: [{ data: {
      macroevento_principal_id: 'rector', macroevento_secundario_ids: [],
      slug: 'analisis-rector', publicacion: { estado: 'publicado', actualizado_el: '2026-10-01' },
    } }],
  });
}

// Compile the real route and its actual Astro component dependencies. Only
// page chrome and the public data/collection services are replaced. Grouping,
// state selection, labels, links, slots and templates use production modules.
async function compileAstroFile(fileUrl, services, cache = new Map()) {
  if (cache.has(fileUrl.href)) return cache.get(fileUrl.href);
  let source = fs.readFileSync(fileUrl, 'utf8')
    .replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<script>[\s\S]*?<\/script>/g, '');
  if (fileUrl.href.endsWith('/observatorio/rectores/index.astro')) {
    source = source
      .replace(/import (?:SiteLayout|PageTitle) from ['"][^'"]+['"];?\r?\n/g, '')
      .replaceAll('<SiteLayout', '<div').replaceAll('</SiteLayout>', '</div>')
      .replaceAll('<PageTitle>', '<h1>').replaceAll('</PageTitle>', '</h1>');
  }
  const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  const dataService = moduleUrl(`
    export const processes = ${JSON.stringify(services.processes || [])};
    export const editorialPreviewEnabled = false;
    export const sourceById = new Map(${JSON.stringify([...(services.sourceById || new Map())])});
  `);
  const collectionService = moduleUrl(`
    export async function getPublicationEntries() { return ${JSON.stringify(services.publications || [])}; }
  `);
  const resolvedImports = new Map();
  for (const match of source.matchAll(/import\s+(?:type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"];?/g)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) continue;
    let dependency = new URL(specifier, fileUrl);
    if (specifier.endsWith('.astro')) {
      resolvedImports.set(specifier, await compileAstroFile(dependency, services, cache));
    } else if (dependency.href.endsWith('/src/lib/data')) {
      resolvedImports.set(specifier, dataService);
    } else if (dependency.href.endsWith('/src/lib/publications')) {
      resolvedImports.set(specifier, collectionService);
    } else {
      if (!fs.existsSync(dependency) && fs.existsSync(new URL(`${dependency.href}.ts`))) {
        dependency = new URL(`${dependency.href}.ts`);
      }
      resolvedImports.set(specifier, dependency.href);
    }
  }
  const compiled = await transform(source, {
    filename: fileUrl.pathname,
    internalURL: pathToFileURL(require.resolve('astro/compiler-runtime')).href,
    resolvePath: specifier => resolvedImports.get(specifier) || specifier,
    resultScopedSlot: true,
  });
  assert.deepEqual(compiled.diagnostics.filter(item => item.severity === 'error'), []);
  const code = ts.transpileModule(compiled.code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText.replace(/(from\s+)(['"])([^'"]+)\2/g,
    (statement, prefix, quote, specifier) => `${prefix}${JSON.stringify(resolvedImports.get(specifier) || specifier)}`);
  const result = moduleUrl(code);
  cache.set(fileUrl.href, result);
  return result;
}

async function renderAstroFile(fileUrl, props, services) {
  const { default: component } = await import(await compileAstroFile(fileUrl, services));
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
  const componentUrl = new URL('../src/components/observatory/ProcessReferencedSignals.astro', import.meta.url);
  const signal = { senal_id: 'senal-trasladada', titulo: 'Evidencia migrada', fuente_ids: ['fuente-unica'] };
  const root = process('rector', { senales: [], referencias_senal: [{ senal_id: signal.senal_id, tipo_uso: 'contextual', efecto_segundo_orden: 'Efecto sobre el rector.' }] });
  const child = process('hijo', { senales: [signal], macroevento_rector_ids: ['rector'] });
  const services = {
    processes: [root, child],
    sourceById: new Map([['fuente-unica', { url: 'https://example.org/evidencia', medio: 'Fuente conservada' }]]),
  };
  const html = await renderAstroFile(componentUrl, { process: root }, services);
  assert.match(html, /<li id="senal-trasladada">/, 'El enlace publicado al ID antiguo sigue encontrando una referencia.');
  assert.match(html, /href="\/observatorio\/hijo\/#senal-trasladada"/, 'La referencia conduce a la nueva ubicación de la evidencia.');
  assert.match(html, /Propietario: hijo/);
  assert.match(html, /href="https:\/\/example.org\/evidencia"/);
  assert.equal(root.senales.length, 0, 'La referencia no vuelve a duplicar la señal trasladada.');
  const own = { ...root, senales: [signal] };
  const ownHtml = await renderAstroFile(componentUrl, { process: own }, { ...services, processes: [own] });
  assert.doesNotMatch(ownHtml, /id="senal-trasladada"/, 'Si la cronología propia ya contiene el ancla, la referencia no duplica el ID.');
});
