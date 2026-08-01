import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { moduleDefinitions } from './paths.mjs';

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function probe(definition) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 800);
  try {
    const response = await fetch(definition.healthUrl, {
      signal: controller.signal,
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export class ModuleManager {
  constructor(definitions = moduleDefinitions) {
    this.definitions = definitions;
    this.children = new Map();
    this.logs = new Map();
    this.startedHere = new Set();
  }

  appendLog(id, chunk) {
    const current = this.logs.get(id) || '';
    this.logs.set(id, `${current}${chunk}`.slice(-8000));
  }

  async start(id) {
    const definition = this.definitions[id];
    if (!definition) throw new Error(`Módulo desconocido: ${id}`);
    if (await probe(definition)) {
      return { id, ok: true, running: true, reused: !this.startedHere.has(id), url: definition.url };
    }

    const serverFile = path.join(definition.root, 'server.mjs');
    if (!fs.existsSync(serverFile)) {
      return { id, ok: false, running: false, error: 'No se encontró server.mjs.', url: definition.url };
    }

    const previous = this.children.get(id);
    if (previous && previous.exitCode === null) previous.kill();

    const child = spawn(process.execPath, ['server.mjs'], {
      cwd: definition.root,
      env: { ...process.env, ...definition.env },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    this.children.set(id, child);
    this.startedHere.add(id);
    this.logs.set(id, '');
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => this.appendLog(id, chunk));
    child.stderr.on('data', (chunk) => this.appendLog(id, chunk));
    child.on('exit', () => {
      if (this.children.get(id) === child) this.children.delete(id);
    });

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await delay(150);
      if (await probe(definition)) {
        return { id, ok: true, running: true, reused: false, url: definition.url };
      }
      if (child.exitCode !== null) break;
    }

    return {
      id,
      ok: false,
      running: false,
      url: definition.url,
      error: this.logs.get(id)?.trim() || 'El servidor del módulo no respondió.',
    };
  }

  async startAll() {
    return Promise.all(Object.keys(this.definitions).map((id) => this.start(id)));
  }

  async status() {
    const entries = await Promise.all(
      Object.values(this.definitions).map(async (definition) => ({
        id: definition.id,
        label: definition.label,
        url: definition.url,
        running: await probe(definition),
        managed: this.startedHere.has(definition.id),
        log: this.logs.get(definition.id) || '',
      })),
    );
    return Object.fromEntries(entries.map((item) => [item.id, item]));
  }

  close() {
    for (const [id, child] of this.children.entries()) {
      if (child.exitCode === null) child.kill();
      this.children.delete(id);
    }
  }
}
