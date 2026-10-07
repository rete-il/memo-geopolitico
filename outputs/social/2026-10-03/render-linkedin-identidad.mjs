import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const output = new URL('./', import.meta.url);
const colors = { paper: '#f8f6f1', ink: '#101c2c', amber: '#c47a27', gold: '#f4b95e', blue: '#245a78', line: '#d9d5cb' };

const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="MG, Memo Geopolítico">
  <rect width="400" height="400" fill="${colors.ink}"/>
  <text x="200" y="250" text-anchor="middle" font-family="Georgia,serif" font-size="152" font-weight="bold" letter-spacing="4.4" fill="${colors.gold}">MG</text>
</svg>`;

// Leave the left side clear for LinkedIn's overlaid Page logo and narrow displays.
const organizationCover = `<svg xmlns="http://www.w3.org/2000/svg" width="1128" height="191" viewBox="0 0 1128 191" role="img" aria-label="Memo Geopolítico. Procesos que exceden la coyuntura. memogeopolitico.com">
  <rect width="1128" height="191" fill="${colors.paper}"/>
  <rect width="1128" height="5" fill="${colors.amber}"/>
  <path d="M264 32V159" fill="none" stroke="${colors.line}" stroke-width="2"/>
  <text x="682" y="81" text-anchor="middle" font-family="Georgia,serif" font-size="48" font-weight="bold" fill="${colors.ink}">Memo Geopolítico</text>
  <text x="682" y="121" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="23" fill="${colors.blue}">Procesos que exceden la coyuntura</text>
  <text x="682" y="157" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="19" fill="${colors.blue}">memogeopolitico.com</text>
</svg>`;

const profileCover = `<svg xmlns="http://www.w3.org/2000/svg" width="1584" height="396" viewBox="0 0 1584 396" role="img" aria-label="Memo Geopolítico. Procesos que exceden la coyuntura. memogeopolitico.com">
  <rect width="1584" height="396" fill="${colors.paper}"/>
  <rect width="1584" height="7" fill="${colors.amber}"/>
  <path d="M350 64V332" fill="none" stroke="${colors.line}" stroke-width="2"/>
  <text x="954" y="165" text-anchor="middle" font-family="Georgia,serif" font-size="75" font-weight="bold" fill="${colors.ink}">Memo Geopolítico</text>
  <text x="954" y="237" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="33" fill="${colors.blue}">Procesos que exceden la coyuntura</text>
  <text x="954" y="309" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="27" fill="${colors.blue}">memogeopolitico.com</text>
</svg>`;

for (const [name, source] of [
  ['linkedin-logo-400', logo],
  ['linkedin-portada-pagina-1128x191', organizationCover],
  ['linkedin-portada-perfil-1584x396', profileCover],
]) {
  await fs.writeFile(new URL(`${name}.svg`, output), source, 'utf8');
  await sharp(Buffer.from(source)).png().toFile(fileURLToPath(new URL(`${name}.png`, output)));
}

console.log('Logo y portadas de LinkedIn creados.');
