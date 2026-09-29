import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const start = '# BEGIN generated canonical redirects';
const end = '# END generated canonical redirects';

export function collectCanonicalRedirects(directory) {
  const redirects = [];
  for (const relative of fs.readdirSync(directory, { recursive: true })) {
    if (!relative.endsWith('index.html')) continue;
    const html = fs.readFileSync(path.join(directory, relative), 'utf8');
    const destination = html.match(/<meta name="memo:redirect" content="([^"]+)"\s*\/?\s*>/)?.[1];
    if (!destination) continue;
    const from = `/${relative.replaceAll('\\', '/').replace(/index\.html$/, '')}`;
    if (!/^\/(?!\/)[a-z0-9/-]+\/$/i.test(destination) || destination === from) {
      throw new Error(`Redirección canónica inválida: ${from} -> ${destination}`);
    }
    if (!fs.existsSync(path.join(directory, destination, 'index.html'))) {
      throw new Error(`Destino canónico inexistente: ${destination}`);
    }
    redirects.push({ from, to: destination });
  }
  const sources = new Set(redirects.map(({ from }) => from));
  if (redirects.some(({ to }) => sources.has(to))) {
    throw new Error('Los alias canónicos no deben crear cadenas ni ciclos de redirección');
  }
  return redirects.sort((a, b) => a.from.localeCompare(b.from));
}

export function writeCanonicalRedirects(directory) {
  const redirects = collectCanonicalRedirects(directory);
  const file = path.join(directory, '_redirects');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const previousBlock = new RegExp(`\\n?${start}[\\s\\S]*?${end}\\n?`, 'g');
  const existing = current.replace(previousBlock, '').trimEnd();
  // Netlify's forced status is required: a static HTML fallback also exists at
  // each alias for preview servers that do not understand the _redirects file.
  const rules = redirects.flatMap(({ from, to }) => [
    `${from.slice(0, -1)} ${to} 301!`,
    `${from} ${to} 301!`,
  ]);
  fs.writeFileSync(file, `${existing}${existing ? '\n' : ''}${start}\n${rules.join('\n')}\n${end}\n`);
  return redirects;
}

/** @returns {import('astro').AstroIntegration} */
export function canonicalRedirectsIntegration() {
  return {
    name: 'memo-canonical-redirects',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const redirects = writeCanonicalRedirects(fileURLToPath(dir));
        logger.info(`${redirects.length} alias canónicos con redirección permanente`);
      },
    },
  };
}
