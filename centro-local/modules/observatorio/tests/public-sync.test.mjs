import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  applyPublicSync,
  planPublicSync,
  serializePublicSyncPlan,
} from '../lib/public-sync.mjs';

const SOURCE_OLD = 'src-existente';
const SOURCE_NEW = 'src-nueva';

function publicProcess(id, overrides = {}) {
  return {
    schema_version: 2,
    macroevento_id: id,
    slug: id,
    titulo: `Proceso ${id}`,
    sintesis: 'Síntesis anterior.',
    estado_seguimiento: 'en_seguimiento',
    publicacion: {
      estado: 'publicado',
      publicado_el: '2026-07-01',
      actualizado_el: '2026-07-01',
    },
    progreso_publico: {
      etapa: 'publicado',
      proximo_paso: 'Mantener seguimiento.',
      hitos_completados: ['Análisis publicado'],
    },
    clasificacion: {
      tema_principal_id: null,
      tema_secundario_ids: [],
      subtema_ids: [],
      geografia: {
        alcance: 'regional',
        region_ids: [],
        subregion_ids: [],
        pais_ids: [],
        espacio_ids: [],
      },
      actor_ids: [],
      etiqueta_ids: [],
    },
    que_esta_ocurriendo: 'Síntesis anterior.',
    por_que_importa: 'Contexto editorial preservado.',
    claves_estructurales: ['Clave preservada'],
    valoraciones: {
      relevancia_geopolitica: 4,
      atencion_mediatica: 2,
      brecha: 2,
      confianza: 'media',
      incertidumbre: 3,
    },
    senales: [{
      senal_id: 'senal-anterior',
      fecha: '2026-07-01',
      titulo: 'Señal anterior',
      resumen: 'Evidencia preservada.',
      fuente_ids: [SOURCE_OLD],
      estado_verificacion: 'verificada',
    }],
    cronologia: [{ fecha: '2026-07-01', titulo: 'Hito preservado' }],
    fuente_ids: [SOURCE_OLD],
    recurso_visual_ids: ['mapa-preservado'],
    macroevento_relacionado_ids: [],
    indicadores_seguimiento: ['Indicador anterior'],
    escenarios: { base: '', adverso: '', transformador: '' },
    ...overrides,
  };
}

function packageData(processes, sources = []) {
  return {
    formato: 'memo-geopolitico-publico',
    schema_version: 2,
    generado_el: '2026-07-01',
    procesos: processes,
    fuentes: sources,
    recursos_visuales: [{ recurso_visual_id: 'mapa-preservado', titulo: 'Mapa' }],
    catalogos: { temas: [], subtemas: [], actores: [] },
  };
}

function fixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-public-sync-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const centerRoot = path.join(root, 'centro-local');
  const siteRoot = path.join(root, 'site');
  const backupsDir = path.join(centerRoot, 'data', 'backups');
  const publicFile = path.join(siteRoot, 'src', 'data', 'public', 'observatorio.json');
  fs.mkdirSync(path.dirname(publicFile), { recursive: true });
  fs.writeFileSync(path.join(siteRoot, 'package.json'), '{}\n');

  const oldSource = {
    fuente_id: SOURCE_OLD,
    medio: 'Fuente anterior',
    titulo: 'Evidencia anterior',
    url: 'https://example.com/old',
    estado_verificacion: 'verificada',
  };
  const current = packageData([publicProcess('existente')], [oldSource]);
  fs.writeFileSync(publicFile, `${JSON.stringify(current, null, 2)}\n`);

  const generatedExisting = publicProcess('existente', {
    titulo: 'Proceso existente actualizado',
    sintesis: 'Síntesis canónica actualizada.',
    que_esta_ocurriendo: 'Síntesis canónica actualizada.',
    por_que_importa: '',
    claves_estructurales: [],
    cronologia: [],
    recurso_visual_ids: [],
    publicacion: {
      estado: 'borrador',
      publicado_el: null,
      actualizado_el: '2026-08-23',
    },
    progreso_publico: {
      etapa: 'borrador',
      proximo_paso: 'Completar documentación.',
      hitos_completados: ['Expediente abierto y clasificado'],
    },
    senales: [{
      senal_id: 'senal-nueva',
      fecha: '2026-08-22',
      titulo: 'Señal nueva',
      resumen: 'Evidencia nueva.',
      fuente_ids: [SOURCE_NEW],
      estado_verificacion: 'verificada',
    }],
    fuente_ids: [SOURCE_NEW],
  });
  const generatedNew = publicProcess('nuevo', {
    titulo: 'Proceso nuevo',
    publicacion: { estado: 'borrador', publicado_el: null, actualizado_el: '2026-08-23' },
    progreso_publico: {
      etapa: 'borrador',
      proximo_paso: 'Completar documentación.',
      hitos_completados: ['Expediente abierto y clasificado'],
    },
    por_que_importa: '',
    claves_estructurales: [],
    senales: [],
    cronologia: [],
    fuente_ids: [],
    recurso_visual_ids: [],
  });
  const newSource = {
    fuente_id: SOURCE_NEW,
    medio: 'Fuente nueva',
    titulo: 'Evidencia nueva',
    url: 'https://example.com/new',
    estado_verificacion: 'verificada',
  };
  const generated = packageData([generatedExisting, generatedNew], [newSource]);
  generated.generado_el = '2026-08-23';
  generated.recursos_visuales = [];

  return {
    centerRoot,
    siteRoot,
    backupsDir,
    publicFile,
    current,
    generated,
    common: {
      centerRoot,
      siteRoot,
      backupsDir,
      data: { macroeventos: [] },
      taxonomy: {},
      buildPublicPackage: () => structuredClone(generated),
      assertProjection: () => ({ valid: true, errors: [], warnings: [] }),
      generatedAt: '2026-08-23',
    },
  };
}

test('planifica altas y actualizaciones sin degradar el estado público ni borrar evidencia', async (context) => {
  const data = fixture(context);
  const plan = await planPublicSync(data.common);

  assert.equal(plan.status, 'ready');
  assert.equal(plan.operation, 'sincronizar');
  assert.deepEqual(plan.counts, {
    before: 1,
    after: 2,
    created: 1,
    updated: 1,
    unchanged: 0,
    sources_before: 1,
    sources_after: 2,
  });
  assert.deepEqual(plan.created.map((item) => item.macroevento_id), ['nuevo']);
  assert.deepEqual(plan.updated.map((item) => item.macroevento_id), ['existente']);
  assert.equal(plan.safety.publication_states_preserved, true);
  assert.equal(plan.safety.git_executed, false);
  assert.equal(plan.safety.deploy_executed, false);

  const candidate = JSON.parse(plan._candidate.toString('utf8'));
  const existing = candidate.procesos.find((item) => item.macroevento_id === 'existente');
  assert.equal(existing.titulo, 'Proceso existente actualizado');
  assert.equal(existing.publicacion.estado, 'publicado');
  assert.equal(existing.publicacion.publicado_el, '2026-07-01');
  assert.equal(existing.publicacion.actualizado_el, '2026-08-23');
  assert.equal(existing.progreso_publico.etapa, 'publicado');
  assert.equal(existing.por_que_importa, 'Contexto editorial preservado.');
  assert.deepEqual(existing.claves_estructurales, ['Clave preservada']);
  assert.deepEqual(existing.cronologia, [{ fecha: '2026-07-01', titulo: 'Hito preservado' }]);
  assert.deepEqual(existing.recurso_visual_ids, ['mapa-preservado']);
  assert.deepEqual(existing.senales.map((item) => item.senal_id), ['senal-anterior', 'senal-nueva']);
  assert.deepEqual(existing.fuente_ids, [SOURCE_OLD, SOURCE_NEW]);
  assert.deepEqual(candidate.fuentes.map((item) => item.fuente_id), [SOURCE_OLD, SOURCE_NEW]);
  assert.deepEqual(candidate.recursos_visuales.map((item) => item.recurso_visual_id), ['mapa-preservado']);
  assert.equal(serializePublicSyncPlan(plan)._candidate, undefined);
});

test('aplica con plan vigente, crea respaldo y verifica la escritura', async (context) => {
  const data = fixture(context);
  const plan = await planPublicSync(data.common);
  const result = await applyPublicSync({
    ...data.common,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    appliedAt: '2026-08-23T07:30:00.000Z',
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.reused, false);
  assert.ok(fs.existsSync(result.backup.file));
  assert.ok(fs.existsSync(result.backup.manifest_file));
  assert.deepEqual(JSON.parse(fs.readFileSync(result.backup.file, 'utf8')), data.current);
  const written = JSON.parse(fs.readFileSync(data.publicFile, 'utf8'));
  assert.equal(written.procesos.length, 2);
  assert.equal(written.procesos[0].publicacion.estado, 'publicado');
});

test('bloquea planes obsoletos y eliminaciones automáticas', async (context) => {
  const data = fixture(context);
  const stale = await applyPublicSync({
    ...data.common,
    expectedPlanId: 'plan-anterior',
    confirmed: true,
  });
  assert.equal(stale.status, 'blocked');
  assert.equal(stale.blocks[0].code, 'public-sync-plan-stale');

  const currentWithExtra = packageData([
    publicProcess('existente'),
    publicProcess('no-debe-borrarse'),
  ], data.current.fuentes);
  fs.writeFileSync(data.publicFile, `${JSON.stringify(currentWithExtra, null, 2)}\n`);
  const blocked = await planPublicSync(data.common);
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.blocks[0].code, 'public-process-removal-blocked');
});
