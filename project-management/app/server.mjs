#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn, spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const appDir = path.dirname(__filename);
const pmRoot = path.resolve(appDir, '..');
const repoRoot = path.resolve(pmRoot, '..');
const publicDir = path.join(appDir, 'public');
const dataDir = path.join(pmRoot, 'data');
const recordsDir = path.join(pmRoot, 'records');
const backupsDir = path.join(pmRoot, 'backups');
const generatorPath = path.join(pmRoot, 'tools', 'update-dashboard.mjs');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PM_DASHBOARD_PORT || 4322);
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_BACKUPS = 20;
const VERSION = '0.1.0';

const jsonFiles = {
  project: path.join(dataDir, 'project.json'),
  releases: path.join(dataDir, 'releases.json'),
  items: path.join(dataDir, 'work-items.json'),
};
const progressLogPath = path.join(recordsDir, 'PROGRESS-LOG.md');

function ensureDirectories() {
  fs.mkdirSync(backupsDir, { recursive: true });
  const ignorePath = path.join(backupsDir, '.gitignore');
  if (!fs.existsSync(ignorePath))
    fs.writeFileSync(ignorePath, '*\n!.gitignore\n', 'utf8');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readData() {
  return {
    project: readJson(jsonFiles.project),
    releases: readJson(jsonFiles.releases),
    items: readJson(jsonFiles.items),
  };
}

function safeText(value, max = 10000) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .slice(0, max);
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => safeText(v, 1000).trim()).filter(Boolean);
}

function normalizeItem(raw, existing = null) {
  const item = {
    id: safeText(raw.id ?? existing?.id, 40)
      .trim()
      .toUpperCase(),
    type: safeText(raw.type ?? existing?.type, 20)
      .trim()
      .toUpperCase(),
    epic: safeText(raw.epic ?? existing?.epic, 100).trim(),
    title: safeText(raw.title ?? existing?.title, 300).trim(),
    priority: safeText(raw.priority ?? existing?.priority, 5)
      .trim()
      .toUpperCase(),
    status: safeText(raw.status ?? existing?.status, 30).trim(),
    release: safeText(raw.release ?? existing?.release, 100).trim(),
    size: safeText(raw.size ?? existing?.size, 5)
      .trim()
      .toUpperCase(),
    owner: safeText(raw.owner ?? existing?.owner, 100).trim() || 'TBD',
    dependencies: normalizeStringArray(
      raw.dependencies ?? existing?.dependencies,
    ).map((v) => v.toUpperCase()),
    progress:
      raw.progress === '' || raw.progress === null || raw.progress === undefined
        ? null
        : Math.max(0, Math.min(100, Number(raw.progress))),
    acceptanceCriteria: normalizeStringArray(
      raw.acceptanceCriteria ?? existing?.acceptanceCriteria,
    ),
    notes: safeText(raw.notes ?? existing?.notes, 10000).trim(),
  };
  if (!['in_progress', 'review'].includes(item.status)) item.progress = null;
  if (item.status === 'done') item.progress = null;
  return item;
}

function validateData({ project, releases, items }) {
  const errors = [];
  const warnings = [];
  const statuses = new Set(project.statusVocabulary || []);
  const releaseIds = new Set(releases.map((r) => r.id));
  const itemIds = new Set();
  const priorities = new Set(['P0', 'P1', 'P2', 'P3']);
  const sizes = new Set(Object.keys(project.sizeWeights || {}));

  if (!project.workingBranch) errors.push('project.json: falta workingBranch.');
  if (!releaseIds.has(project.currentRelease))
    errors.push(
      `project.json: currentRelease desconocido (${project.currentRelease}).`,
    );

  for (const release of releases) {
    if (!release.id) errors.push('Release sin ID.');
    if (!release.name) errors.push(`${release.id || 'release'}: falta name.`);
    if (!Array.isArray(release.exitCriteria))
      warnings.push(`${release.id}: exitCriteria debería ser una lista.`);
  }

  for (const item of items) {
    if (!item.id) errors.push('Work item sin ID.');
    else if (itemIds.has(item.id)) errors.push(`ID duplicado: ${item.id}.`);
    itemIds.add(item.id);
    if (!/^[A-Z][A-Z0-9]*-[0-9]{3,}$/.test(item.id || ''))
      warnings.push(`${item.id || 'sin-id'}: formato de ID no convencional.`);
    if (!item.title) errors.push(`${item.id}: falta title.`);
    if (!statuses.has(item.status))
      errors.push(`${item.id}: estado desconocido (${item.status}).`);
    if (!releaseIds.has(item.release))
      errors.push(`${item.id}: release desconocido (${item.release}).`);
    if (!priorities.has(item.priority))
      errors.push(`${item.id}: prioridad desconocida (${item.priority}).`);
    if (!sizes.has(item.size))
      errors.push(`${item.id}: tamaño desconocido (${item.size}).`);
    if (item.status === 'in_progress' && !Number.isFinite(item.progress))
      errors.push(`${item.id}: in_progress requiere progress.`);
    if (item.status === 'review' && !Number.isFinite(item.progress))
      warnings.push(`${item.id}: review debería indicar progress.`);
    if (item.status === 'blocked' && !String(item.notes || '').trim())
      warnings.push(`${item.id}: bloqueada sin explicación en notes.`);
    if (item.status === 'done' && !(item.acceptanceCriteria || []).length)
      warnings.push(
        `${item.id}: terminada sin criterios de aceptación registrados.`,
      );
  }

  for (const item of items) {
    for (const dep of item.dependencies || []) {
      if (!itemIds.has(dep))
        errors.push(`${item.id}: dependencia inexistente (${dep}).`);
      if (dep === item.id)
        errors.push(`${item.id}: no puede depender de sí misma.`);
    }
  }

  const adjacency = new Map(items.map((i) => [i.id, i.dependencies || []]));
  const visiting = new Set();
  const visited = new Set();
  function detectCycle(id, pathStack) {
    if (visiting.has(id)) {
      const start = pathStack.indexOf(id);
      errors.push(
        `Dependencia circular: ${[...pathStack.slice(start), id].join(' → ')}.`,
      );
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    pathStack.push(id);
    for (const dep of adjacency.get(id) || [])
      if (adjacency.has(dep)) detectCycle(dep, pathStack);
    pathStack.pop();
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of adjacency.keys()) detectCycle(id, []);

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  };
}

function itemProgress(item) {
  if (item.status === 'done') return 100;
  if (item.status === 'review')
    return Number.isFinite(item.progress) ? item.progress : 90;
  if (item.status === 'in_progress')
    return Number.isFinite(item.progress) ? item.progress : 25;
  return 0;
}

function weightedProgress(project, list) {
  const total = list.reduce(
    (sum, item) => sum + (project.sizeWeights[item.size] || 0),
    0,
  );
  if (!total) return 0;
  const achieved = list.reduce((sum, item) => {
    const weight = project.sizeWeights[item.size] || 0;
    return sum + weight * itemProgress(item);
  }, 0);
  return Math.round(achieved / total);
}

function gitInfo() {
  const run = (args) =>
    execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
  try {
    return {
      available: true,
      branch: run(['branch', '--show-current']) || 'desconocida',
      status: run(['status', '--short']),
      lastCommit: run(['log', '-1', '--pretty=%h %s']),
    };
  } catch (error) {
    return {
      available: false,
      branch: 'no disponible',
      status: '',
      lastCommit: '',
      error: safeText(error.message, 500),
    };
  }
}

function parseRecentActivity(limit = 12) {
  if (!fs.existsSync(progressLogPath)) return [];
  const text = fs.readFileSync(progressLogPath, 'utf8');
  const parts = text
    .split(/^##\s+/m)
    .slice(1)
    .map((section) => {
      const [heading, ...rest] = section.split('\n');
      return {
        heading: heading.trim(),
        body: rest.join('\n').trim().slice(0, 1800),
      };
    });
  return parts.slice(-limit).reverse();
}

function buildState() {
  const data = readData();
  const validation = validateData(data);
  const { project, releases, items } = data;
  const counts = Object.fromEntries(
    (project.statusVocabulary || []).map((status) => [
      status,
      items.filter((i) => i.status === status).length,
    ]),
  );
  const scopedItems = items.filter((item) => item.release !== 'future');
  const releaseProgress = releases.map((release) => {
    const releaseItems = items.filter((item) => item.release === release.id);
    return {
      ...release,
      progress: weightedProgress(project, releaseItems),
      itemCount: releaseItems.length,
    };
  });
  return {
    server: { version: VERSION, host: HOST, port: PORT, localOnly: true },
    project,
    releases: releaseProgress,
    items,
    summary: {
      overallProgress: weightedProgress(project, scopedItems),
      total: items.length,
      counts,
      p0Open: items.filter(
        (i) => i.priority === 'P0' && !['done', 'deferred'].includes(i.status),
      ).length,
      blocked: items.filter((i) => i.status === 'blocked').length,
    },
    validation,
    git: gitInfo(),
    activity: parseRecentActivity(),
  };
}

function timestampFolder() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function createBackup(reason = 'save') {
  ensureDirectories();
  const folder = path.join(
    backupsDir,
    `${timestampFolder()}-${safeText(reason, 30).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
  );
  fs.mkdirSync(folder, { recursive: true });
  for (const file of Object.values(jsonFiles))
    if (fs.existsSync(file))
      fs.copyFileSync(file, path.join(folder, path.basename(file)));
  if (fs.existsSync(progressLogPath))
    fs.copyFileSync(
      progressLogPath,
      path.join(folder, path.basename(progressLogPath)),
    );
  const directories = fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      time: fs.statSync(path.join(backupsDir, entry.name)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);
  for (const old of directories.slice(MAX_BACKUPS))
    fs.rmSync(path.join(backupsDir, old.name), {
      recursive: true,
      force: true,
    });
  return folder;
}

function writeFileSafely(file, content) {
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temp, content, 'utf8');
  if (process.platform === 'win32' && fs.existsSync(file)) {
    const previous = `${file}.previous-${process.pid}-${Date.now()}`;
    fs.renameSync(file, previous);
    try {
      fs.renameSync(temp, file);
      fs.rmSync(previous, { force: true });
    } catch (error) {
      if (fs.existsSync(previous) && !fs.existsSync(file))
        fs.renameSync(previous, file);
      throw error;
    }
  } else {
    fs.renameSync(temp, file);
  }
}

function writeJsonSafely(file, value) {
  writeFileSafely(file, `${JSON.stringify(value, null, 2)}\n`);
}

function regenerateMarkdown() {
  if (!fs.existsSync(generatorPath))
    throw new Error('No se encontró tools/update-dashboard.mjs.');
  const result = spawnSync(process.execPath, [generatorPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error(
      (result.stderr || result.stdout || 'Falló la regeneración.').trim(),
    );
  return (result.stdout || '').trim();
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(
          Object.assign(
            new Error('El cuerpo de la solicitud es demasiado grande.'),
            { statusCode: 413 },
          ),
        );
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(Object.assign(new Error('JSON inválido.'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function mimeType(file) {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.json': 'application/json; charset=utf-8',
    }[ext] || 'application/octet-stream'
  );
}

function serveStatic(reqPath, res) {
  const relative = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
  const file = path.resolve(publicDir, relative);
  if (
    !file.startsWith(`${publicDir}${path.sep}`) &&
    file !== path.join(publicDir, 'index.html')
  )
    return false;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  res.writeHead(200, {
    'Content-Type': mimeType(file),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  });
  fs.createReadStream(file).pipe(res);
  return true;
}

async function handleApi(req, url, res) {
  if (req.method === 'GET' && url.pathname === '/api/state')
    return sendJson(res, 200, buildState());
  if (req.method === 'GET' && url.pathname === '/api/health')
    return sendJson(res, 200, { ok: true, version: VERSION });

  if (req.method === 'POST' && url.pathname === '/api/validate') {
    const state = buildState();
    return sendJson(res, state.validation.valid ? 200 : 422, {
      validation: state.validation,
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/regenerate') {
    const state = buildState();
    if (!state.validation.valid)
      return sendJson(res, 422, {
        error: 'Los datos contienen errores.',
        validation: state.validation,
      });
    const output = regenerateMarkdown();
    return sendJson(res, 200, { ok: true, output, state: buildState() });
  }

  if (req.method === 'POST' && url.pathname === '/api/work-items') {
    const body = await readBody(req);
    const data = readData();
    const item = normalizeItem(body);
    if (data.items.some((existing) => existing.id === item.id))
      return sendJson(res, 409, { error: `Ya existe ${item.id}.` });
    const proposed = { ...data, items: [...data.items, item] };
    const validation = validateData(proposed);
    if (!validation.valid)
      return sendJson(res, 422, {
        error: 'La tarea no supera la validación.',
        validation,
      });
    createBackup('create-item');
    writeJsonSafely(jsonFiles.items, proposed.items);
    regenerateMarkdown();
    return sendJson(res, 201, { ok: true, state: buildState() });
  }

  const itemMatch = url.pathname.match(/^\/api\/work-items\/([A-Z0-9-]+)$/i);
  if (req.method === 'PATCH' && itemMatch) {
    const body = await readBody(req);
    const data = readData();
    const index = data.items.findIndex(
      (item) => item.id === itemMatch[1].toUpperCase(),
    );
    if (index < 0) return sendJson(res, 404, { error: 'Tarea no encontrada.' });
    const updated = normalizeItem(body, data.items[index]);
    updated.id = data.items[index].id;
    const items = [...data.items];
    items[index] = updated;
    const proposed = { ...data, items };
    const validation = validateData(proposed);
    if (!validation.valid)
      return sendJson(res, 422, {
        error: 'Los cambios no superan la validación.',
        validation,
      });
    createBackup('update-item');
    writeJsonSafely(jsonFiles.items, items);
    regenerateMarkdown();
    return sendJson(res, 200, { ok: true, state: buildState() });
  }

  const releaseMatch = url.pathname.match(/^\/api\/releases\/([^/]+)$/);
  if (req.method === 'PATCH' && releaseMatch) {
    const body = await readBody(req);
    const data = readData();
    const index = data.releases.findIndex(
      (release) => release.id === releaseMatch[1],
    );
    if (index < 0)
      return sendJson(res, 404, { error: 'Release no encontrada.' });
    const updated = {
      ...data.releases[index],
      goal:
        body.goal === undefined
          ? data.releases[index].goal
          : safeText(body.goal, 2000).trim(),
      target:
        body.target === undefined
          ? data.releases[index].target
          : safeText(body.target, 100).trim(),
      exitCriteria:
        body.exitCriteria === undefined
          ? data.releases[index].exitCriteria
          : normalizeStringArray(body.exitCriteria),
    };
    const releases = [...data.releases];
    releases[index] = updated;
    const project = { ...data.project };
    if (body.makeCurrent === true) project.currentRelease = updated.id;
    const proposed = { project, releases, items: data.items };
    const validation = validateData(proposed);
    if (!validation.valid)
      return sendJson(res, 422, {
        error: 'Los cambios no superan la validación.',
        validation,
      });
    createBackup('update-release');
    writeJsonSafely(jsonFiles.releases, releases);
    writeJsonSafely(jsonFiles.project, project);
    regenerateMarkdown();
    return sendJson(res, 200, { ok: true, state: buildState() });
  }

  if (req.method === 'POST' && url.pathname === '/api/progress') {
    const body = await readBody(req);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '')
      ? body.date
      : new Date().toISOString().slice(0, 10);
    const title = safeText(body.title, 200).trim();
    if (!title)
      return sendJson(res, 422, {
        error: 'El título del registro es obligatorio.',
      });
    const sections = [
      ['Completado', normalizeStringArray(body.completed)],
      ['Validación', normalizeStringArray(body.validation)],
      ['Problemas o bloqueos', normalizeStringArray(body.issues)],
      ['Próximo trabajo', normalizeStringArray(body.next)],
    ];
    let entry = `\n## ${date} — ${title}\n\n`;
    for (const [heading, values] of sections) {
      if (!values.length) continue;
      entry += `### ${heading}\n\n${values.map((value) => `- ${value}`).join('\n')}\n\n`;
    }
    createBackup('progress-log');
    fs.appendFileSync(progressLogPath, entry, 'utf8');
    return sendJson(res, 201, { ok: true, state: buildState() });
  }

  return sendJson(res, 404, { error: 'Endpoint no encontrado.' });
}

ensureDirectories();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, url, res);
    if (serveStatic(url.pathname, res)) return;
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, {
      error: safeText(error.message || 'Error interno.', 2000),
    });
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`\nMemo Geopolítico — Project Dashboard v${VERSION}`);
  console.log(`Local: ${url}`);
  console.log('Cerrar: Ctrl+C\n');
  if (process.argv.includes('--open')) {
    const commands =
      process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : process.platform === 'darwin'
          ? ['open', [url]]
          : ['xdg-open', [url]];
    const child = spawn(commands[0], commands[1], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE')
    console.error(
      `El puerto ${PORT} ya está en uso. Cierra la instancia anterior o define PM_DASHBOARD_PORT.`,
    );
  else console.error(error);
  process.exit(1);
});
