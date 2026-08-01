import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
const backupDir = path.join(__dirname, 'backups');
const workflowPath = path.join(dataDir, 'workflow.json');
const statePath = path.join(dataDir, 'state.json');
const port = Number(process.env.PORT || 4324);
const host = '127.0.0.1';
const args = new Set(process.argv.slice(2));

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const workflow = readJson(workflowPath);
const stageIds = new Set(workflow.stages.map((stage) => stage.id));
const statusIds = new Set(workflow.status_options.map((item) => item.id));
const typeIds = new Set(workflow.document_types.map((item) => item.id));

function validateState(state) {
  const errors = [];
  const warnings = [];
  if (!state || !Array.isArray(state.documents)) {
    errors.push('El estado debe contener documents como array.');
    return { valid: false, errors, warnings };
  }
  const ids = new Set();
  state.documents.forEach((doc, index) => {
    const prefix = `Documento ${index + 1}`;
    if (!doc.id || !/^[a-z0-9-]+$/.test(doc.id)) errors.push(`${prefix}: ID inválido.`);
    if (ids.has(doc.id)) errors.push(`${prefix}: ID duplicado ${doc.id}.`);
    ids.add(doc.id);
    if (!doc.title?.trim()) errors.push(`${prefix}: falta título.`);
    if (!typeIds.has(doc.document_type)) errors.push(`${prefix}: tipo documental inválido.`);
    if (!doc.stages || typeof doc.stages !== 'object') {
      errors.push(`${prefix}: faltan etapas.`);
      return;
    }
    stageIds.forEach((stageId) => {
      const step = doc.stages[stageId];
      if (!step) errors.push(`${prefix}: falta la etapa ${stageId}.`);
      else if (!statusIds.has(step.status)) errors.push(`${prefix}: estado inválido en ${stageId}.`);
    });
    Object.keys(doc.stages).forEach((stageId) => {
      if (!stageIds.has(stageId)) warnings.push(`${prefix}: etapa desconocida ${stageId}.`);
    });
  });
  return { valid: errors.length === 0, errors, warnings };
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function backupCurrent(reason = 'save') {
  fs.mkdirSync(backupDir, { recursive: true });
  if (!fs.existsSync(statePath)) return null;
  const dest = path.join(backupDir, `state-${timestamp()}-${reason}.json`);
  fs.copyFileSync(statePath, dest);
  const files = fs.readdirSync(backupDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .reverse();
  files.slice(30).forEach((name) => fs.unlinkSync(path.join(backupDir, name)));
  return path.basename(dest);
}

function writeJsonAtomic(file, data) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

function listBackups() {
  fs.mkdirSync(backupDir, { recursive: true });
  return fs.readdirSync(backupDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const stat = fs.statSync(path.join(backupDir, name));
      return { name, size: stat.size, modified_at: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.modified_at.localeCompare(a.modified_at));
}

function escapeMd(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
}

function buildMarkdown(state) {
  const statusLabel = Object.fromEntries(workflow.status_options.map((s) => [s.id, s.label]));
  const typeLabel = Object.fromEntries(workflow.document_types.map((s) => [s.id, s.label]));
  const lines = [
    `# ${workflow.title}`,
    '',
    workflow.description,
    '',
    '```mermaid',
    'flowchart TD',
    ...workflow.stages.map((stage, index) => {
      const current = `S${stage.number}["${stage.number}. ${stage.title.replace(/"/g, "'")}"]`;
      const next = workflow.stages[index + 1];
      return next ? `  ${current} --> S${next.number}` : `  ${current}`;
    }),
    '```',
    '',
    '## Etapas',
    ''
  ];
  workflow.phases.forEach((phase) => {
    lines.push(`### ${phase.number}. ${phase.title}`, '', phase.purpose, '');
    workflow.stages.filter((s) => s.phase === phase.id).forEach((stage) => {
      lines.push(`#### ${stage.number}. ${stage.title}`, '', stage.summary, '', `**Entrada:** ${stage.inputs.join('; ')}.`, '', `**Salida:** ${stage.outputs.join('; ')}.`, '', `**Puerta:** ${stage.gate}`, '');
    });
  });
  lines.push('## Estado de documentos', '', '| Documento | Tipo | Progreso | Etapa actual |', '|---|---|---:|---|');
  state.documents.forEach((doc) => {
    const applicable = workflow.stages.filter((stage) => doc.stages[stage.id]?.status !== 'not_applicable');
    const done = applicable.filter((stage) => doc.stages[stage.id]?.status === 'done').length;
    const progress = applicable.length ? Math.round((done / applicable.length) * 100) : 0;
    const current = workflow.stages.find((stage) => ['in_progress', 'blocked'].includes(doc.stages[stage.id]?.status)) || workflow.stages.find((stage) => doc.stages[stage.id]?.status !== 'done') || workflow.stages.at(-1);
    lines.push(`| ${escapeMd(doc.title)} | ${escapeMd(typeLabel[doc.document_type] || doc.document_type)} | ${progress}% | ${escapeMd(current.title)} |`);
  });
  lines.push('');
  state.documents.forEach((doc) => {
    lines.push(`### ${doc.title}`, '', `- **ID:** \`${doc.id}\``, `- **Tipo:** ${typeLabel[doc.document_type] || doc.document_type}`, `- **Notas:** ${doc.notes || '—'}`, '', '| Etapa | Estado | Nota | Artefacto |', '|---|---|---|---|');
    workflow.stages.forEach((stage) => {
      const step = doc.stages[stage.id];
      lines.push(`| ${stage.number}. ${escapeMd(stage.title)} | ${escapeMd(statusLabel[step.status] || step.status)} | ${escapeMd(step.note || '—')} | ${escapeMd(step.artifact || '—')} |`);
    });
    lines.push('');
  });
  return `${lines.join('\n')}\n`;
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';
}

function sendJson(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) reject(new Error('Payload demasiado grande.'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
    if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
      const state = readJson(statePath);
      return sendJson(res, 200, { workflow, state, validation: validateState(state), backups: listBackups() });
    }
    if (req.method === 'POST' && url.pathname === '/api/validate') {
      const state = JSON.parse(await readBody(req));
      return sendJson(res, 200, validateState(state));
    }
    if (req.method === 'PUT' && url.pathname === '/api/state') {
      const state = JSON.parse(await readBody(req));
      const validation = validateState(state);
      if (!validation.valid) return sendJson(res, 422, validation);
      backupCurrent('save');
      state.updated_at = new Date().toISOString();
      writeJsonAtomic(statePath, state);
      return sendJson(res, 200, { ok: true, updated_at: state.updated_at, backups: listBackups(), validation });
    }
    if (req.method === 'GET' && url.pathname === '/api/export') {
      const body = fs.readFileSync(statePath);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="workflow-state.json"' });
      return res.end(body);
    }
    if (req.method === 'GET' && url.pathname === '/api/export-markdown') {
      const body = buildMarkdown(readJson(statePath));
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': 'attachment; filename="FLUJO_EDITORIAL.md"' });
      return res.end(body);
    }
    if (req.method === 'GET' && url.pathname === '/api/backups') return sendJson(res, 200, { backups: listBackups() });
    if (req.method === 'POST' && url.pathname === '/api/restore') {
      const payload = JSON.parse(await readBody(req));
      const name = path.basename(String(payload.name || ''));
      const file = path.join(backupDir, name);
      if (!name.endsWith('.json') || !fs.existsSync(file)) return sendJson(res, 404, { error: 'Backup no encontrado.' });
      const restored = readJson(file);
      const validation = validateState(restored);
      if (!validation.valid) return sendJson(res, 422, validation);
      backupCurrent('before-restore');
      restored.updated_at = new Date().toISOString();
      writeJsonAtomic(statePath, restored);
      return sendJson(res, 200, { ok: true, validation, state: restored, backups: listBackups() });
    }

    let relative = decodeURIComponent(url.pathname);
    if (relative === '/') relative = '/index.html';
    const file = path.normalize(path.join(publicDir, relative));
    if (!file.startsWith(publicDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    const body = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': contentType(file), 'Content-Length': body.length });
    res.end(body);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

if (args.has('--check')) {
  const state = readJson(statePath);
  const result = validateState(state);
  console.log(JSON.stringify({ workflow_stages: workflow.stages.length, documents: state.documents.length, ...result }, null, 2));
  process.exit(result.valid ? 0 : 1);
}

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  console.log(`Workflow Editorial Dashboard: ${url}`);
  if (args.has('--open')) {
    const command = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    const child = spawn(command[0], command[1], { detached: true, stdio: 'ignore' });
    child.unref();
  }
});
