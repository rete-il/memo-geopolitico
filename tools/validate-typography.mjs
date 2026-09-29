import fs from 'node:fs';
import path from 'node:path';

const directory = path.resolve(process.argv[2] || 'dist');
const errors = [];
let pages = 0;

function visibleText(html) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', period: '.' };
  return html.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === '#') return String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
    return entities[code.toLowerCase()] ?? entity;
  }).replace(/\s+/gu, ' ').trim();
}

// Punctuation that belongs to an abbreviation or an ellipsis is not a final
// sentence period. The catalog currently needs no individual exceptions.
function hasFinalPeriod(title) {
  const text = title.replace(/["'»”’)]*$/u, '');
  if (!text.endsWith('.') || text.endsWith('...')) return false;
  return !/(?:\b(?:EE\.\s?UU|RR\.\s?HH|a\.\s?C|d\.\s?C|p\.\s?ej)|\betc)\.$/u.test(text);
}

for (const relative of fs.readdirSync(directory, { recursive: true }).filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(directory, relative), 'utf8');
  if (!/<main\b/i.test(html)) continue;
  pages += 1;
  const titles = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];
  if (titles.length !== 1) {
    errors.push(`${relative}: se esperaba un H1; se encontraron ${titles.length}`);
    continue;
  }
  const [, attributes, content] = titles[0];
  const className = attributes.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] || '';
  const text = visibleText(content);
  if (!className.split(/\s+/).includes('page-title')) errors.push(`${relative}: el H1 no usa el componente compartido`);
  if (!text) errors.push(`${relative}: H1 vacío`);
  if (hasFinalPeriod(text)) errors.push(`${relative}: punto final en «${text}»`);
}

if (!pages) errors.push('No se encontraron páginas con contenido principal');
if (errors.length) {
  console.error(`Tipografía: ${errors.length} errores en ${pages} páginas de ${path.basename(directory)}.\n${errors.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Tipografía: ${pages} páginas de ${path.basename(directory)} con un único título compartido, no vacío y sin punto final.`);
}
