#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn, exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const PREVIEW_HOST = '127.0.0.1';
const PREVIEW_PORT = 4323;
const ASTRO_HOST = '127.0.0.1';
const ASTRO_PORT = 4321;
const previewUrl = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;
const astroUrl = `http://${ASTRO_HOST}:${ASTRO_PORT}`;

const shouldOpen = process.argv.includes('--open');
let astroChild = null;
let shuttingDown = false;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(600);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

function waitForPort(host, port, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      if (await isPortOpen(host, port)) {
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error(`No se pudo iniciar el servidor en ${host}:${port}.`));
        return;
      }
      setTimeout(check, 350);
    };
    check();
  });
}

function startAstro() {
  const npmArgs = [
    'run',
    'dev',
    '--',
    '--host',
    ASTRO_HOST,
    '--port',
    String(ASTRO_PORT),
  ];

  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // npm.cmd es un script por lotes. Node 22 puede devolver spawn EINVAL
      // cuando se intenta ejecutarlo directamente con shell: false.
      const commandShell = process.env.ComSpec || 'cmd.exe';
      const command = `npm ${npmArgs.join(' ')}`;

      astroChild = spawn(commandShell, ['/d', '/s', '/c', command], {
        cwd: process.cwd(),
        stdio: 'inherit',
        windowsHide: false,
        env: { ...process.env, BROWSER: 'none' },
      });
    } else {
      astroChild = spawn('npm', npmArgs, {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: { ...process.env, BROWSER: 'none' },
      });
    }

    astroChild.once('spawn', resolve);
    astroChild.once('error', reject);
    astroChild.once('exit', (code, signal) => {
      if (!shuttingDown && code !== 0) {
        console.error(
          `Astro se detuvo (código ${code ?? '—'}, señal ${signal ?? '—'}).`,
        );
      }
    });
  });
}

function openBrowser(url) {
  const quoted = `"${url}"`;
  let command;
  if (process.platform === 'win32') command = `start "" ${quoted}`;
  else if (process.platform === 'darwin') command = `open ${quoted}`;
  else command = `xdg-open ${quoted}`;

  exec(command, (error) => {
    if (error) {
      console.warn(`No se pudo abrir el navegador automáticamente. Abrí ${url}`);
    }
  });
}

function safeFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const relative = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
  const resolved = path.resolve(publicDir, relative);
  if (!resolved.startsWith(publicDir)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  const filePath = safeFilePath(req.url || '/');
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Solicitud inválida');
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    let target = filePath;
    if (!statError && stat.isDirectory()) target = path.join(filePath, 'index.html');

    fs.readFile(target, (readError, content) => {
      if (readError) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('No encontrado');
        return;
      }

      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(content);
    });
  });
});

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nCerrando vista responsive…');
  if (astroChild && !astroChild.killed) {
    if (process.platform === 'win32' && astroChild.pid) {
      spawn(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/s', '/c', `taskkill /PID ${astroChild.pid} /T /F >NUL 2>&1`],
        { windowsHide: true, stdio: 'ignore' },
      );
    } else {
      astroChild.kill('SIGTERM');
    }
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

try {
  const astroAlreadyRunning = await isPortOpen(ASTRO_HOST, ASTRO_PORT);
  if (!astroAlreadyRunning) {
    console.log(`Iniciando Astro en ${astroUrl}…`);
    await startAstro();
    await waitForPort(ASTRO_HOST, ASTRO_PORT);
  } else {
    console.log(`Astro ya está activo en ${astroUrl}.`);
  }

  server.listen(PREVIEW_PORT, PREVIEW_HOST, () => {
    console.log(`Vista responsive: ${previewUrl}`);
    console.log('Presioná Ctrl+C para cerrar.');
    if (shouldOpen) openBrowser(previewUrl);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  shutdown();
}
