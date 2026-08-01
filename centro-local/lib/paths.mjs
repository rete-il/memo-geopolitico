import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libraryRoot = path.dirname(fileURLToPath(import.meta.url));

export const centerRoot = path.resolve(libraryRoot, '..');
export const siteRoot = path.resolve(centerRoot, '..');
export const publicRoot = path.join(centerRoot, 'public');
export const modulesRoot = path.join(centerRoot, 'modules');

export const paths = Object.freeze({
  centerRoot,
  siteRoot,
  publicRoot,
  observatorioRoot: path.join(modulesRoot, 'observatorio'),
  observatorioData: path.join(modulesRoot, 'observatorio', 'data', 'macroeventos.json'),
  taxonomyData: path.join(modulesRoot, 'observatorio', 'data', 'taxonomia-temas.json'),
  observatorioCatalog: path.join(modulesRoot, 'observatorio', 'data', 'catalogo-medios.json'),
  mediaRoot: path.join(modulesRoot, 'medios'),
  mediaDerived: path.join(modulesRoot, 'medios', 'data', 'medios.json'),
  mediaExcel: path.join(centerRoot, 'data', 'medios', 'Medios_Matriz_Geopolitica_Navegacion_actualizado.xlsx'),
  workflowRoot: path.join(modulesRoot, 'flujo-editorial'),
  workflowData: path.join(modulesRoot, 'flujo-editorial', 'data', 'workflow.json'),
  workflowState: path.join(modulesRoot, 'flujo-editorial', 'data', 'state.json'),
  publishedAnalyses: path.join(siteRoot, 'src', 'content', 'publicaciones', 'publicadas'),
  sessions: path.join(centerRoot, 'data', 'sesiones'),
  backups: path.join(centerRoot, 'data', 'backups'),
});

export const moduleDefinitions = Object.freeze({
  observatorio: {
    id: 'observatorio',
    label: 'Observatorio',
    root: paths.observatorioRoot,
    port: 4323,
    url: 'http://127.0.0.1:4323',
    healthUrl: 'http://127.0.0.1:4323/api/health',
    env: { OBSERVATORIO_HOST: '127.0.0.1', OBSERVATORIO_PORT: '4323' },
  },
  workflow: {
    id: 'workflow',
    label: 'Flujo editorial',
    root: paths.workflowRoot,
    port: 4324,
    url: 'http://127.0.0.1:4324',
    healthUrl: 'http://127.0.0.1:4324/api/health',
    env: { PORT: '4324' },
  },
});
