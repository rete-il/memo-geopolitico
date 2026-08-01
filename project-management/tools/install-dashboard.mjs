#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const pmRoot = path.resolve(path.dirname(__filename), '..');
const dataDir = path.join(pmRoot, 'data');
const itemsPath = path.join(dataDir, 'work-items.json');
const projectPath = path.join(dataDir, 'project.json');
const readmePath = path.join(pmRoot, 'README.md');
const changelogPath = path.join(pmRoot, 'CHANGELOG.md');
const generatorPath = path.join(pmRoot, 'tools', 'update-dashboard.mjs');
const backupsDir = path.join(pmRoot, 'backups');

if (!fs.existsSync(itemsPath) || !fs.existsSync(projectPath)) {
  console.error('No se encontró project-management/data. Copia este paquete dentro de la raíz del proyecto.');
  process.exit(1);
}

fs.mkdirSync(backupsDir, { recursive: true });
const backupFolder = path.join(backupsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-install-dashboard`);
fs.mkdirSync(backupFolder, { recursive: true });
for (const file of [itemsPath, projectPath, readmePath, changelogPath]) {
  if (fs.existsSync(file)) fs.copyFileSync(file, path.join(backupFolder, path.basename(file)));
}

const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const release = project.currentRelease || 'beta-0-baseline';
const additions = [
  ['PMAPP-001','Definir arquitectura del dashboard local','done','S',[]],
  ['PMAPP-002','Crear servidor local restringido a 127.0.0.1','done','M',['PMAPP-001']],
  ['PMAPP-003','Implementar lectura y resumen de datos canónicos','done','M',['PMAPP-002']],
  ['PMAPP-004','Implementar editor de work items','done','L',['PMAPP-003']],
  ['PMAPP-005','Implementar validación y dependencias circulares','done','M',['PMAPP-003']],
  ['PMAPP-006','Integrar regeneración automática de Markdown','done','S',['PMAPP-004','PMAPP-005']],
  ['PMAPP-007','Implementar releases y registro de actividad','done','M',['PMAPP-003']],
  ['PMAPP-008','Implementar copias de seguridad locales','done','S',['PMAPP-002']],
  ['PMAPP-009','Validar dashboard local en Windows y documentar resultados','review','S',['PMAPP-004','PMAPP-006','PMAPP-007','PMAPP-008']]
];
let added = 0;
for (const [id,title,status,size,dependencies] of additions) {
  if (items.some(item => item.id === id)) continue;
  items.push({
    id, type:'PMAPP', epic:'Dashboard de gestión', title, priority:'P0', status, release,
    size, owner:'Rete', dependencies, progress: status === 'review' ? 90 : null,
    acceptanceCriteria: status === 'review'
      ? ['El dashboard inicia y permite guardar una actualización real en Windows.']
      : ['La capacidad indicada fue incorporada y superó pruebas automatizadas de sintaxis y API.'],
    notes: status === 'review' ? 'Implementación entregada; pendiente validación local del usuario.' : 'Implementado en Project Dashboard v0.1.'
  });
  added++;
}
fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + '\n', 'utf8');
project.version = '2.0';
project.lastUpdated = new Date().toISOString().slice(0,10);
fs.writeFileSync(projectPath, JSON.stringify(project, null, 2) + '\n', 'utf8');

const dashboardSection = `\n## Dashboard local\n\nLa interfaz habitual de actualización se inicia con:\n\n\`\`\`powershell\nnode project-management/app/server.mjs --open\n\`\`\`\n\nGuía: [\`DASHBOARD-LOCAL.md\`](./DASHBOARD-LOCAL.md). La edición manual descrita en \`ACTUALIZAR-PROGRESO.md\` permanece como procedimiento alternativo y de recuperación.\n`;
if (fs.existsSync(readmePath)) {
  const readme = fs.readFileSync(readmePath, 'utf8');
  if (!readme.includes('## Dashboard local')) fs.writeFileSync(readmePath, readme.trimEnd() + '\n' + dashboardSection, 'utf8');
}
const changeEntry = `## 2.0 — ${new Date().toISOString().slice(0,10)}\n\n- Se incorpora Project Dashboard v0.1 para mantener tareas, releases, registros y paneles desde una interfaz local.\n- Se agregan validación ampliada, backups automáticos y lectura de estado Git.\n\n`;
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  if (!changelog.includes('## 2.0 —')) {
    const firstBreak = changelog.indexOf('\n');
    fs.writeFileSync(changelogPath, `${changelog.slice(0, firstBreak + 1)}\n${changeEntry}${changelog.slice(firstBreak + 1)}`, 'utf8');
  }
}
const result = spawnSync(process.execPath, [generatorPath], { encoding:'utf8', cwd:path.resolve(pmRoot,'..') });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}
console.log(`Dashboard integrado. Work items agregados: ${added}.`);
console.log((result.stdout || '').trim());
console.log('Iniciar con: node project-management/app/server.mjs --open');
