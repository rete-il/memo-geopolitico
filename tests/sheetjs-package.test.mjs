import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const vendor = path.join(root, 'centro-local/vendor');
const provenance = JSON.parse(fs.readFileSync(path.join(vendor, 'xlsx-0.20.3.integrity.json'), 'utf8'));
const tarball = path.join(vendor, provenance.file);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

test('la copia oficial de SheetJS conserva su tamaño e integridad registrados', () => {
  const bytes = fs.readFileSync(tarball);
  assert.equal(bytes.length, provenance.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), provenance.sha256);
  assert.equal(`sha512-${createHash('sha512').update(bytes).digest('base64')}`, provenance.integrity);
});

test('sitio y Centro local usan la misma copia fijada de SheetJS', () => {
  for (const directory of [root, path.join(root, 'centro-local')]) {
    const manifest = readJson(path.join(directory, 'package.json'));
    const lock = readJson(path.join(directory, 'package-lock.json'));
    const reference = manifest.dependencies.xlsx;
    assert.ok(reference.startsWith('file:'), 'La dependencia debe resolverse desde el paquete conservado');
    assert.equal(path.resolve(directory, reference.slice(5)), tarball);
    assert.equal(lock.packages[''].dependencies.xlsx, reference);
    assert.equal(lock.packages['node_modules/xlsx'].resolved, reference);
    assert.equal(lock.packages['node_modules/xlsx'].version, provenance.version);
    assert.equal(lock.packages['node_modules/xlsx'].integrity, provenance.integrity);
    const installed = createRequire(path.join(directory, 'package.json'))('xlsx');
    assert.equal(installed.version, provenance.version);
  }
});
