import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createCentroServer } from '../centro-local/server.mjs';

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-settings-test-'));
  const file = path.join(directory, 'features.json');
  const config = JSON.parse(fs.readFileSync(new URL('../src/config/features.json', import.meta.url), 'utf8'));
  for (const page of Object.values(config.institutional.pages)) page.enabledInProduction = false;
  fs.writeFileSync(file, JSON.stringify(config));
  const server = createCentroServer({ siteSettingsFile: file });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { file, base, read: async () => (await fetch(base + '/api/site-settings')).json(),
    request: (route, method, body, origin = base) => fetch(base + route, {
      method, headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
    }) };
}

test('el control local rechaza cambios externos, desactualizados o inválidos sin escribir', async t => {
  const f = await fixture(t);
  const current = await f.read();
  assert.equal((await f.request('/api/site-settings', 'PUT', current, 'https://example.org')).status, 403);
  assert.equal((await f.request('/api/site-settings', 'PUT', { ...current, revision: 'antigua' })).status, 409);
  const config = structuredClone(current.config);
  config.institutional.pages.suscripcion.enabledInProduction = true;
  config.institutional.subscription.signupUrl = 'javascript:alert(1)';
  assert.equal((await f.request('/api/site-settings', 'PUT', { ...current, config })).status, 400);
  assert.equal((await f.read()).revision, current.revision);
});

test('validar recalcula requisitos por página y nunca guarda los cambios del formulario', async t => {
  const f = await fixture(t);
  const current = await f.read();
  assert.equal(current.validation.valid, true);
  assert.equal(current.publicationRequirements.length, 0, 'funciones desactivadas no bloquean');
  const config = structuredClone(current.config);
  config.institutional.pages.suscripcion.enabledInProduction = true;
  config.institutional.subscription.provider = '';
  const response = await f.request('/api/site-settings/validate', 'POST', { ...current, config });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.validation.valid, false);
  assert.ok(result.blockers.suscripcion.includes('Completar proveedor del boletín'));
  assert.ok(result.publicationRequirements.every(item => item.pages.every(page => page.slug === 'suscripcion')));
  assert.equal((await f.read()).revision, current.revision);
  assert.equal((await f.read()).config.institutional.pages.suscripcion.enabledInProduction, false);
});

test('guardar persiste en el archivo aislado y devuelve exactamente el estado guardado', async t => {
  const f = await fixture(t);
  const current = await f.read();
  const config = structuredClone(current.config);
  config.institutional.pages.contacto.enabledInDevelopment = !config.institutional.pages.contacto.enabledInDevelopment;
  const response = await f.request('/api/site-settings', 'PUT', { ...current, config });
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.notEqual(saved.revision, current.revision);
  assert.deepEqual(saved.config, config);
  assert.deepEqual(JSON.parse(fs.readFileSync(f.file, 'utf8')), config);
  assert.deepEqual((await f.read()).config, config);
});
