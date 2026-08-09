import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadPublicExpedientStates } from '../lib/public-expedients.mjs';

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, 'utf8');
}

test('reproduce los estados públicos efectivos sin modificar macroeventos', (context) => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-public-states-'));
  context.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));

  write(path.join(projectRoot, 'src/data/public/observatorio.json'), JSON.stringify({
    procesos: [
      { macroevento_id: 'rail-baltica', publicacion: { estado: 'borrador', actualizado_el: '2026-07-23' } },
      { macroevento_id: 'land-bridge', publicacion: { estado: 'en_revision', actualizado_el: '2026-07-23' } },
    ],
  }));
  write(path.join(projectRoot, 'src/content/publicaciones/_preview/rail.md'), `---
post_id: "rail"
publicacion:
  estado: "en_revision"
  actualizado_el: "2026-07-25"
macroevento_principal_id: "rail-baltica"
macroevento_secundario_ids: []
---
`);
  write(path.join(projectRoot, 'src/content/publicaciones/publicadas/rail.md'), `---
post_id: "rail"
publicacion:
  estado: "publicado"
  actualizado_el: "2026-07-26"
macroevento_principal_id: "rail-baltica"
macroevento_secundario_ids: []
---
`);

  const snapshot = loadPublicExpedientStates(projectRoot);
  assert.equal(snapshot.available, true);
  assert.equal(snapshot.by_event['rail-baltica'].estado, 'publicado');
  assert.equal(snapshot.by_event['rail-baltica'].actualizado_el, '2026-07-23');
  assert.equal(snapshot.by_event['land-bridge'].estado, 'en_revision');
  assert.equal(snapshot.process_by_event['rail-baltica'].macroevento_id, 'rail-baltica');
  assert.deepEqual(snapshot.warnings, []);
});

test('degrada de forma segura cuando el sitio público no está disponible', () => {
  const snapshot = loadPublicExpedientStates(path.join(os.tmpdir(), 'memo-public-states-inexistente'));
  assert.equal(snapshot.available, false);
  assert.deepEqual(snapshot.by_event, {});
  assert.deepEqual(snapshot.process_by_event, {});
  assert.deepEqual(snapshot.warnings, []);
});
