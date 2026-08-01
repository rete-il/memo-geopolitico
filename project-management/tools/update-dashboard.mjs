#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const dataDir = path.join(root, 'data');

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
const project = readJson('project.json');
const releases = readJson('releases.json');
const items = readJson('work-items.json');

const allowedStatuses = new Set(project.statusVocabulary);
const releaseIds = new Set(releases.map((r) => r.id));
const ids = new Set();
const errors = [];

for (const item of items) {
  if (!item.id || ids.has(item.id))
    errors.push(`ID faltante o duplicado: ${item.id}`);
  ids.add(item.id);
  if (!allowedStatuses.has(item.status))
    errors.push(`${item.id}: estado desconocido ${item.status}`);
  if (!releaseIds.has(item.release))
    errors.push(`${item.id}: release desconocido ${item.release}`);
  if (!project.sizeWeights[item.size])
    errors.push(`${item.id}: tamaño desconocido ${item.size}`);
  for (const dep of item.dependencies || []) {
    if (!items.some((i) => i.id === dep))
      errors.push(`${item.id}: dependencia inexistente ${dep}`);
  }
  if (
    item.status === 'in_progress' &&
    (item.progress === null || item.progress === undefined)
  ) {
    errors.push(`${item.id}: in_progress requiere progress`);
  }
}

if (errors.length) {
  console.error(
    'Errores de datos de project management:\n- ' + errors.join('\n- '),
  );
  process.exit(1);
}

const weight = (item) => project.sizeWeights[item.size];
const progressValue = (item) => {
  if (item.status === 'done') return 100;
  if (item.status === 'review') return item.progress ?? 90;
  if (item.status === 'in_progress') return item.progress ?? 25;
  return 0;
};
const weightedProgress = (list) => {
  const total = list.reduce((s, i) => s + weight(i), 0);
  if (!total) return 0;
  return Math.round(
    list.reduce((s, i) => s + weight(i) * progressValue(i), 0) / total,
  );
};

const statusLabel = {
  proposed: 'Propuesta',
  ready: 'Lista',
  in_progress: 'En progreso',
  blocked: 'Bloqueada',
  review: 'En revisión',
  done: 'Terminada',
  deferred: 'Postergada',
};
const statusIcon = {
  proposed: '○',
  ready: '◉',
  in_progress: '▶',
  blocked: '⛔',
  review: '◆',
  done: '✓',
  deferred: '–',
};
const bySequence = [...releases].sort((a, b) => a.sequence - b.sequence);
const byRelease = (id) => items.filter((i) => i.release === id);
const currentRelease = releases.find((r) => r.id === project.currentRelease);
const now = new Date().toISOString().slice(0, 10);

const overall = weightedProgress(items.filter((i) => i.release !== 'future'));
const counts = Object.fromEntries(
  project.statusVocabulary.map((s) => [
    s,
    items.filter((i) => i.status === s).length,
  ]),
);
const active = items.filter((i) =>
  ['in_progress', 'review', 'blocked'].includes(i.status),
);
const ready = items.filter((i) => i.status === 'ready');
const p0Open = items.filter(
  (i) => i.priority === 'P0' && i.status !== 'done' && i.status !== 'deferred',
);

let statusMd = `# Estado del proyecto\n\n`;
statusMd += `> Archivo generado. Editar \`data/*.json\` y ejecutar \`node project-management/tools/update-dashboard.mjs\`.\n\n`;
statusMd += `**Actualizado:** ${now}\n\n**Rama de trabajo:** \`${project.workingBranch}\`\n\n**Release actual:** ${currentRelease?.name ?? project.currentRelease}\n\n**Avance ponderado total:** **${overall}%**\n\n`;
statusMd += `## Resumen\n\n| Métrica | Valor |\n|---|---:|\n`;
statusMd += `| Total de work items | ${items.length} |\n| Terminados | ${counts.done} |\n| En progreso | ${counts.in_progress} |\n| En revisión | ${counts.review} |\n| Bloqueados | ${counts.blocked} |\n| Listos | ${counts.ready} |\n| P0 abiertos | ${p0Open.length} |\n\n`;
statusMd += `## Release actual\n\n**Objetivo:** ${currentRelease?.goal ?? ''}\n\n`;
const currentItems = byRelease(project.currentRelease);
statusMd += `**Avance del release:** ${weightedProgress(currentItems)}%\n\n`;
statusMd += `### Trabajo activo\n\n`;
if (!active.length)
  statusMd += `No hay tareas marcadas como en progreso, revisión o bloqueadas.\n\n`;
else {
  statusMd += `| ID | Estado | Trabajo | Responsable | Progreso |\n|---|---|---|---|---:|\n`;
  for (const i of active)
    statusMd += `| ${i.id} | ${statusIcon[i.status]} ${statusLabel[i.status]} | ${i.title} | ${i.owner} | ${progressValue(i)}% |\n`;
  statusMd += `\n`;
}
statusMd += `### Próximas tareas listas\n\n`;
statusMd += `| ID | Prioridad | Trabajo | Release | Dependencias |\n|---|---|---|---|---|\n`;
for (const i of ready.slice(0, 15))
  statusMd += `| ${i.id} | ${i.priority} | ${i.title} | ${i.release} | ${(i.dependencies || []).join(', ') || '—'} |\n`;
statusMd += `\n### P0 abiertos\n\n`;
statusMd += `| ID | Estado | Trabajo | Release |\n|---|---|---|---|\n`;
for (const i of p0Open)
  statusMd += `| ${i.id} | ${statusLabel[i.status]} | ${i.title} | ${i.release} |\n`;
statusMd += `\n## Cómo actualizar\n\n1. Editar \`data/work-items.json\`.\n2. Ejecutar el generador.\n3. Revisar cambios.\n4. Hacer commit en \`beta\`.\n`;
fs.writeFileSync(path.join(root, 'STATUS.md'), statusMd);

let roadmapMd = `# Roadmap maestro\n\n> Archivo generado desde \`data/releases.json\` y \`data/work-items.json\`.\n\n`;
roadmapMd += `| Secuencia | Release | Objetivo | Avance | Estado |\n|---:|---|---|---:|---|\n`;
for (const r of bySequence) {
  const list = byRelease(r.id);
  const pct = weightedProgress(list);
  const state =
    list.length && list.every((i) => i.status === 'done')
      ? 'Terminada'
      : r.id === project.currentRelease
        ? 'Actual'
        : r.sequence < (currentRelease?.sequence ?? 0)
          ? 'Parcial'
          : 'Planificada';
  roadmapMd += `| ${r.sequence} | ${r.name} | ${r.goal} | ${pct}% | ${state} |\n`;
}
roadmapMd += `\n`;
for (const r of bySequence) {
  const list = byRelease(r.id);
  roadmapMd += `## ${r.name}\n\n**Objetivo:** ${r.goal}  \n**Fecha objetivo:** ${r.target}  \n**Avance:** ${weightedProgress(list)}%\n\n`;
  roadmapMd += `### Criterios de salida\n\n`;
  if (r.exitCriteria.length)
    for (const c of r.exitCriteria) roadmapMd += `- [ ] ${c}\n`;
  else roadmapMd += `- Sin criterios comprometidos.\n`;
  roadmapMd += `\n### Work items\n\n| ID | Tipo | Prioridad | Estado | Tamaño | Trabajo |\n|---|---|---|---|---|---|\n`;
  for (const i of list)
    roadmapMd += `| ${i.id} | ${i.type} | ${i.priority} | ${statusIcon[i.status]} ${statusLabel[i.status]} | ${i.size} | ${i.title} |\n`;
  roadmapMd += `\n`;
}
fs.writeFileSync(path.join(root, 'ROADMAP.md'), roadmapMd);

let backlogMd = `# Backlog\n\n> Archivo generado. La fuente de verdad es \`data/work-items.json\`.\n\n`;
backlogMd += `## Convenciones\n\n- Estados: ${project.statusVocabulary.map((s) => `${statusIcon[s]} ${statusLabel[s]}`).join(' · ')}\n- Tamaños: XS, S, M, L, XL.\n- Prioridades: P0 crítica, P1 alta, P2 media, P3 futura.\n\n`;
for (const r of bySequence) {
  backlogMd += `## ${r.name}\n\n`;
  const list = byRelease(r.id).sort(
    (a, b) => a.priority.localeCompare(b.priority) || a.id.localeCompare(b.id),
  );
  backlogMd += `| ID | Tipo | Epic | Prioridad | Estado | Tamaño | Responsable | Dependencias | Trabajo |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const i of list)
    backlogMd += `| ${i.id} | ${i.type} | ${i.epic} | ${i.priority} | ${statusIcon[i.status]} ${statusLabel[i.status]} | ${i.size} | ${i.owner} | ${(i.dependencies || []).join(', ') || '—'} | ${i.title} |\n`;
  backlogMd += `\n`;
}
fs.writeFileSync(path.join(root, 'BACKLOG.md'), backlogMd);

project.lastUpdated = now;
fs.writeFileSync(
  path.join(dataDir, 'project.json'),
  JSON.stringify(project, null, 2) + '\n',
);
console.log(
  `Dashboard actualizado: ${items.length} work items, avance ${overall}%.`,
);
