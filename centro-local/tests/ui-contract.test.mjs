import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { paths } from '../lib/paths.mjs';

const html = fs.readFileSync(`${paths.publicRoot}/index.html`, 'utf8');
const app = fs.readFileSync(`${paths.publicRoot}/app.js`, 'utf8');

test('la navegación común contiene los tres módulos', () => {
  assert.match(html, /data-view="observatorio"/);
  assert.match(html, /data-view="medios"/);
  assert.match(html, /data-view="workflow"/);
});

test('la interfaz no contiene un asistente de rutas', () => {
  assert.doesNotMatch(html, /Configuración local|Autocompletar rutas|Elegir carpeta/i);
  assert.doesNotMatch(app, /config\.local|picker|deriveKnownPaths/i);
});

test('los módulos se integran dentro de la misma ventana', () => {
  assert.match(html, /<iframe[^>]+id="frame-observatorio"/);
  assert.match(html, /<iframe[^>]+id="frame-medios"/);
  assert.match(html, /<iframe[^>]+id="frame-workflow"/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test('el Observatorio puede abrir análisis publicados en una pestaña nueva', () => {
  const observatorioFrame = html.match(/<iframe[^>]+id="frame-observatorio"[^>]*>/)?.[0] ?? '';

  assert.match(observatorioFrame, /sandbox="[^"]*\ballow-popups\b[^"]*"/);
  assert.match(observatorioFrame, /sandbox="[^"]*\ballow-popups-to-escape-sandbox\b[^"]*"/);
});

test('no hay controles de Git, sincronización o publicación automática', () => {
  assert.doesNotMatch(html, /git add|git push|hacer commit|publicar ahora/i);
  assert.doesNotMatch(app, /git add|git push|child_process|sync-local-data/i);
});

test('la navegación móvil declara controles accesibles', () => {
  assert.match(html, /aria-controls="sidebar"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /class="skip-link"/);
  assert.match(app, /event\.key === 'Escape'/);
});
