import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { paths as defaultPaths } from './paths.mjs';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function modifiedAt(file) {
  return fs.existsSync(file) ? fs.statSync(file).mtime.toISOString() : null;
}

function fileInfo(file) {
  return {
    exists: fs.existsSync(file),
    modified_at: modifiedAt(file),
    name: path.basename(file),
  };
}

function excelRows(file) {
  const workbook = XLSX.readFile(file, { cellDates: false });
  const preferred = workbook.SheetNames.includes('Matriz profesional')
    ? 'Matriz profesional'
    : workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[preferred], {
    header: 1,
    raw: true,
    defval: '',
  });
  return rows.slice(4).filter((row) => String(row[1] || '').trim()).length;
}

function countMarkdown(directory) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) return null;
  return fs.readdirSync(directory).filter((name) => name.toLowerCase().endsWith('.md')).length;
}

function safeSection(id, label, requiredFiles, build) {
  const missing = requiredFiles.filter((file) => !fs.existsSync(file));
  if (missing.length) {
    return {
      id,
      label,
      ok: false,
      error: `Faltan ${missing.length} archivo(s) del módulo.`,
      missing: missing.map((file) => path.basename(file)),
    };
  }
  try {
    return { id, label, ok: true, ...build() };
  } catch (error) {
    return { id, label, ok: false, error: error.message };
  }
}

export function collectDataHealth(customPaths = defaultPaths) {
  const observatorio = safeSection(
    'observatorio',
    'Observatorio',
    [customPaths.observatorioData, customPaths.taxonomyData],
    () => {
      const data = readJson(customPaths.observatorioData);
      const taxonomy = readJson(customPaths.taxonomyData);
      return {
        macroeventos: Array.isArray(data.macroeventos) ? data.macroeventos.length : 0,
        senales: Array.isArray(data.macroeventos)
          ? data.macroeventos.reduce((total, item) => total + (item.senales?.length || 0), 0)
          : 0,
        fuentes: Array.isArray(data.macroeventos)
          ? data.macroeventos.reduce((total, item) => total + (item.fuentes?.length || 0), 0)
          : 0,
        expedientes: Array.isArray(data.expedientes_editoriales) ? data.expedientes_editoriales.length : 0,
        categorias: Array.isArray(taxonomy.categorias) ? taxonomy.categorias.length : 0,
        temas: Array.isArray(taxonomy.categorias)
          ? taxonomy.categorias.reduce((total, item) => total + (item.temas?.length || 0), 0)
          : 0,
        updated_at: data.actualizado || modifiedAt(customPaths.observatorioData),
        file: fileInfo(customPaths.observatorioData),
      };
    },
  );

  const medios = safeSection(
    'medios',
    'Medios',
    [customPaths.mediaExcel, customPaths.mediaDerived],
    () => {
      const derived = readJson(customPaths.mediaDerived);
      const canonical = excelRows(customPaths.mediaExcel);
      const derivedCount = Array.isArray(derived.records) ? derived.records.length : 0;
      return {
        canonical,
        derived: derivedCount,
        in_sync: canonical === derivedCount,
        warning: canonical === derivedCount
          ? null
          : `El Excel canónico contiene ${canonical} medios y la vista actual ${derivedCount}.`,
        updated_at: modifiedAt(customPaths.mediaExcel),
        file: fileInfo(customPaths.mediaExcel),
      };
    },
  );

  const workflow = safeSection(
    'workflow',
    'Flujo editorial',
    [customPaths.workflowData, customPaths.workflowState],
    () => {
      const contract = readJson(customPaths.workflowData);
      const state = readJson(customPaths.workflowState);
      return {
        etapas: Array.isArray(contract.stages) ? contract.stages.length : 0,
        fases: Array.isArray(contract.phases) ? contract.phases.length : 0,
        documentos: Array.isArray(state.documents) ? state.documents.length : 0,
        updated_at: state.updated_at || modifiedAt(customPaths.workflowState),
        file: fileInfo(customPaths.workflowState),
      };
    },
  );

  const published = countMarkdown(customPaths.publishedAnalyses);
  const publicaciones = {
    id: 'publicaciones',
    label: 'Análisis publicados',
    ok: published !== null,
    count: published,
    deferred: published === null,
    note: published === null
      ? 'Se comprobarán al instalar el Centro dentro de la raíz del sitio.'
      : null,
  };

  const sections = [observatorio, medios, workflow, publicaciones];
  return {
    ok: sections.filter((item) => !item.deferred).every((item) => item.ok),
    sections,
    observatorio,
    medios,
    workflow,
    publicaciones,
    checked_at: new Date().toISOString(),
  };
}
