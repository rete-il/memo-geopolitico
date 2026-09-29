import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const catalog = JSON.parse(fs.readFileSync(new URL('src/data/opinion/lecturas.json', root)));
const observatory = JSON.parse(fs.readFileSync(new URL('src/data/public/observatorio.json', root)));

test('las entrevistas tienen atribución y relaciones con análisis y fuentes existentes', () => {
  const interviews = catalog.filter(reading => reading.formato === 'entrevista');
  assert.equal(interviews.length, 4);
  for (const reading of interviews) {
    assert.ok(reading.entrevistador);
    assert.ok(reading.origen.fecha_emision <= reading.origen.fecha);
    assert.ok(reading.nota_revision.includes('nota escrita'));
    const source = observatory.fuentes.find(item => item.url === reading.origen.url);
    assert.equal(source?.media_id, 'periodismo-puro');
    for (const relation of reading.relacionados) {
      const [, section, slug] = relation.url.split('/');
      if (section === 'publicaciones') {
        const article = new URL(`src/content/publicaciones/publicadas/${slug}.md`, root);
        assert.ok(fs.existsSync(article), relation.url);
      } else if (section === 'observatorio') {
        const process = observatory.procesos.find(item => item.slug === slug);
        assert.ok(process?.fuente_ids.includes(source.fuente_id), relation.url);
      } else {
        assert.fail(`Relación no reconocida: ${relation.url}`);
      }
    }
  }
});
