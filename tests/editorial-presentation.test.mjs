import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { synchronizeEditorialPresentation } from '../tools/lib/editorial-presentation.mjs';

test('una edición del artículo actualiza sus copias sin alterar señales ni borradores ajenos', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-presentation-'));
  const write = (name, text) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  };
  const read = name => fs.readFileSync(path.join(root, name), 'utf8');
  try {
    const source = 'src/content/publicaciones/publicadas/example.md';
    const draft = 'centro-local/data/publicaciones/borradores/example.md';
    const preview = 'src/content/publicaciones/_preview/example.md';
    const article = '---\nmacroevento_principal_id: example\nsubtitulo: "Pregunta, corregida"\nresumen: "Un resumen extenso y concreto."\npublicacion:\n  estado: publicado\n---\nTexto del artículo.\n';
    write(source, article);
    write(draft, article.replace('Pregunta, corregida','Pregunta anterior'));
    write(preview, article.replace('Pregunta, corregida','Pregunta anterior'));
    write('src/content/publicaciones/publicadas/other.md', '---\nresumen: Otro\n---\nBorrador independiente.');
    write('src/content/publicaciones/publicadas/older.md', article.replace('Pregunta, corregida', 'Pregunta histórica').replace('estado: publicado', 'estado: publicado\n  publicado_el: "2020-01-01"'));
    write(source, article.replace('estado: publicado', 'estado: publicado\n  publicado_el: "2026-01-01"'));
    const currentArticle = read(source);
    const publicFile = 'src/data/public/observatorio.json';
    write(publicFile, JSON.stringify({procesos:[{macroevento_id:'example',que_esta_ocurriendo:'Seguimiento con contenido propio',senales:[{id:'conservar'}]},{macroevento_id:'other',sintesis:'Otro'}]}));
    const localFile = 'centro-local/modules/observatorio/data/macroeventos.json';
    write(localFile, JSON.stringify({macroeventos:[{id:'example',hipotesis_principal:'Hipótesis independiente'}],expedientes_editoriales:[{estado:'publicado',macroevento_ids:['example']}]}));
    synchronizeEditorialPresentation(root);
    assert.equal(read(draft),currentArticle);
    assert.equal(read(preview),currentArticle);
    assert.match(read('src/content/publicaciones/publicadas/older.md'), /Pregunta histórica/);
    let data=JSON.parse(read(publicFile));
    assert.equal(data.procesos[0].pregunta_seguimiento,'Pregunta, corregida');
    assert.deepEqual(data.procesos[0].senales,[{id:'conservar'}]);
    assert.equal(data.procesos[0].que_esta_ocurriendo,'Seguimiento con contenido propio');
    assert.equal(data.procesos[1].sintesis,'Otro');
    assert.equal(JSON.parse(read(localFile)).macroeventos[0].hipotesis_principal,'Hipótesis independiente');
    assert.deepEqual(synchronizeEditorialPresentation(root),[]);
    write(source,currentArticle.replace('Pregunta, corregida','Pregunta corregida'));
    synchronizeEditorialPresentation(root);
    data=JSON.parse(read(publicFile));
    assert.equal(data.procesos[0].pregunta_seguimiento,'Pregunta corregida');
    assert.equal(JSON.parse(read(localFile)).expedientes_editoriales[0].pregunta_editorial,'Pregunta corregida');
    // A future publication joins automatically without configuration flags.
    write('src/content/publicaciones/publicadas/new.md', currentArticle.replace('example','other').replace('Pregunta, corregida','Pregunta nueva'));
    synchronizeEditorialPresentation(root);
    assert.equal(JSON.parse(read(publicFile)).procesos[1].pregunta_seguimiento,'Pregunta nueva');
  } finally {
    fs.rmSync(root,{recursive:true,force:true});
  }
});
