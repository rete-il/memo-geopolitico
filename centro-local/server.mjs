import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectDataHealth } from './lib/health.mjs';
import { ModuleManager } from './lib/module-manager.mjs';
import { paths } from './lib/paths.mjs';

const HOST = '127.0.0.1';
const DEFAULT_PORT = 4322;
const VERSION = '0.2.3';
const entryFile = fileURLToPath(import.meta.url);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function securityHeaders(res, options = {}) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self'; style-src 'self'${options.allowInlineStyles ? " 'unsafe-inline'" : ''}; img-src 'self' data: blob:; connect-src 'self' http://127.0.0.1:4323 http://127.0.0.1:4324; frame-src 'self' http://127.0.0.1:4323 http://127.0.0.1:4324; object-src 'none'; base-uri 'self'; form-action 'self'`,
  );
}

function sendJson(res, status, value) {
  const body = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  securityHeaders(res);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function localRequest(req) {
  const remote = req.socket.remoteAddress || '';
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) return false;
  try {
    const hostname = new URL(`http://${req.headers.host || ''}`).hostname;
    return ['127.0.0.1', 'localhost', '[::1]'].includes(hostname);
  } catch {
    return false;
  }
}

function existingStaticFile(root, requestPath, fallback = null) {
  let relative;
  try {
    relative = decodeURIComponent(requestPath).replace(/^\/+/, '');
  } catch {
    return null;
  }
  if (!relative && fallback) relative = fallback;
  if (!relative || relative.includes('\0')) return null;
  const candidate = path.resolve(root, relative);
  const boundary = `${path.resolve(root)}${path.sep}`;
  if (candidate !== path.resolve(root) && !candidate.startsWith(boundary)) return null;
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return null;
  return candidate;
}

function sendFile(res, file, options = {}) {
  if (!file) {
    sendJson(res, 404, { error: 'No encontrado.' });
    return;
  }
  const body = fs.readFileSync(file);
  securityHeaders(res, options);
  res.writeHead(200, {
    'Content-Type': contentTypes[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': path.extname(file) === '.html' ? 'no-store' : 'no-cache',
  });
  res.end(body);
}

function openBrowser(url) {
  const command = process.platform === 'win32'
    ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin'
      ? ['open', [url]]
      : ['xdg-open', [url]];
  const child = spawn(command[0], command[1], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
}

export function createCentroServer(options = {}) {
  const moduleManager = options.moduleManager || new ModuleManager();
  const port = Number(options.port || DEFAULT_PORT);
  const server = http.createServer(async (req, res) => {
    try {
      if (!localRequest(req)) {
        sendJson(res, 403, { error: 'El Centro solo acepta solicitudes locales.' });
        return;
      }
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (req.method === 'GET' && url.pathname === '/api/health') {
        sendJson(res, 200, { ok: true, version: VERSION, host: HOST });
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/status') {
        const [modules, data] = await Promise.all([
          moduleManager.status(),
          Promise.resolve(collectDataHealth()),
        ]);
        sendJson(res, 200, { ok: data.ok, version: VERSION, modules, data });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/modules/retry') {
        const results = await moduleManager.startAll();
        sendJson(res, results.every((item) => item.ok) ? 200 : 502, { results });
        return;
      }
      if (req.method === 'GET' && url.pathname.startsWith('/modules/medios/')) {
        const relative = url.pathname.slice('/modules/medios/'.length);
        sendFile(res, existingStaticFile(paths.mediaRoot, relative, 'index.html'), {
          allowInlineStyles: true,
        });
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendJson(res, 405, { error: 'Método no permitido.' });
        return;
      }
      const relative = url.pathname === '/' ? 'index.html' : url.pathname;
      sendFile(res, existingStaticFile(paths.publicRoot, relative));
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });

  server.moduleManager = moduleManager;
  server.startModules = () => moduleManager.startAll();
  server.stopModules = () => moduleManager.close();
  server.centroPort = port;
  return server;
}

export function checkInstallation() {
  const required = [
    paths.observatorioData,
    paths.taxonomyData,
    paths.mediaDerived,
    paths.mediaExcel,
    paths.workflowData,
    paths.workflowState,
  ];
  const missing = required.filter((file) => !fs.existsSync(file));
  const data = collectDataHealth();
  return {
    ok: missing.length === 0 && data.ok,
    version: VERSION,
    host: HOST,
    center_root: paths.centerRoot,
    site_root: paths.siteRoot,
    configuration_required: false,
    missing: missing.map((file) => path.relative(paths.centerRoot, file)),
    data,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--check')) {
    const report = checkInstallation();
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }

  const server = createCentroServer();
  const close = () => {
    server.stopModules();
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);

  server.listen(DEFAULT_PORT, HOST, async () => {
    const url = `http://${HOST}:${DEFAULT_PORT}`;
    console.log(`Centro local integrado: ${url}`);
    const results = await server.startModules();
    results.forEach((item) => {
      console.log(`${item.ok ? 'OK' : 'ERROR'} · ${item.id}${item.error ? ` · ${item.error}` : ''}`);
    });
    if (args.has('--open')) openBrowser(url);
  });
}

if (path.resolve(process.argv[1] || '') === path.resolve(entryFile)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
