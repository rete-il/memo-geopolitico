import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { createCentroServer } from '../server.mjs';

class FakeManager {
  async status() {
    return {
      observatorio: { id: 'observatorio', running: true },
      workflow: { id: 'workflow', running: true },
    };
  }
  async startAll() {
    return [{ id: 'observatorio', ok: true }, { id: 'workflow', ok: true }];
  }
  close() {}
}

async function withServer(run) {
  const server = createCentroServer({ moduleManager: new FakeManager() });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`, address.port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('sirve la portada y el estado desde 127.0.0.1', async () => {
  await withServer(async (base) => {
    const home = await fetch(base);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Centro local/);

    const status = await fetch(`${base}/api/status`);
    assert.equal(status.status, 200);
    const payload = await status.json();
    assert.equal(payload.version, '0.2.3');
    assert.equal(payload.modules.observatorio.running, true);
  });
});

test('sirve Medios desde la instalación integrada', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/modules/medios/index.html`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-security-policy'), /style-src 'self' 'unsafe-inline'/);
    assert.match(await response.text(), /Directorio de medios geopolíticos/);
  });
});

test('mantiene una política de estilos estricta en la carcasa principal', async () => {
  await withServer(async (base) => {
    const response = await fetch(base);
    assert.match(response.headers.get('content-security-policy'), /style-src 'self';/);
    assert.doesNotMatch(response.headers.get('content-security-policy'), /style-src 'self' 'unsafe-inline'/);
  });
});

test('rechaza solicitudes con un host externo', async () => {
  await withServer(async (_base, port) => {
    const status = await new Promise((resolve, reject) => {
      const request = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/api/health',
        headers: { Host: 'example.com' },
      }, (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      });
      request.on('error', reject);
      request.end();
    });
    assert.equal(status, 403);
  });
});

test('no expone archivos fuera de las raíces estáticas', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/modules/medios/%2e%2e%2fREADME.md`);
    assert.equal(response.status, 404);
  });
});
