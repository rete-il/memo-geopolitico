import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const output = new URL('./', import.meta.url);
const colors = { paper: '#f8f6f1', ink: '#101c2c', amber: '#c47a27', gold: '#f4b95e', blue: '#245a78', line: '#d9d5cb' };

const avatar = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="MG, Memo Geopolítico">
  <rect width="1080" height="1080" fill="${colors.ink}"/>
  <text x="540" y="675" text-anchor="middle" font-family="Georgia,serif" font-size="410" font-weight="bold" letter-spacing="12" fill="${colors.gold}">MG</text>
</svg>`;

const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="624" viewBox="0 0 1640 624" role="img" aria-label="Memo Geopolítico. Procesos que exceden la coyuntura. memogeopolitico.com">
  <rect width="1640" height="624" fill="${colors.paper}"/>
  <rect width="1640" height="8" fill="${colors.amber}"/>
  <path d="M108 92V532M1532 92V532" fill="none" stroke="${colors.line}" stroke-width="2"/>
  <path d="M108 92H168M1472 92H1532M108 532H168M1472 532H1532" fill="none" stroke="${colors.line}" stroke-width="2"/>
  <rect x="779" y="108" width="82" height="82" rx="18" fill="${colors.ink}"/>
  <text x="820" y="162" text-anchor="middle" font-family="Georgia,serif" font-size="34" font-weight="bold" letter-spacing="2" fill="${colors.gold}">MG</text>
  <text x="820" y="294" text-anchor="middle" font-family="Georgia,serif" font-size="80" font-weight="bold" fill="${colors.ink}">Memo Geopolítico</text>
  <rect x="775" y="328" width="90" height="4" fill="${colors.amber}"/>
  <text x="820" y="389" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="35" fill="${colors.blue}">Procesos que exceden la coyuntura</text>
  <text x="820" y="472" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="29" fill="${colors.blue}">memogeopolitico.com</text>
</svg>`;

for (const [name, source] of [['facebook-perfil-1080', avatar], ['facebook-portada', cover]]) {
  await fs.writeFile(new URL(`${name}.svg`, output), source, 'utf8');
  await sharp(Buffer.from(source)).png().toFile(fileURLToPath(new URL(`${name}.png`, output)));
}

// Proofs emulate a circular avatar and a centered, taller mobile cover crop.
const avatarProof = await sharp(Buffer.from(avatar)).resize(120, 120).png().toBuffer();
await sharp(avatarProof)
  .composite([{ input: Buffer.from('<svg width="120" height="120"><circle cx="60" cy="60" r="60" fill="white"/></svg>'), blend: 'dest-in' }])
  .png().toFile(fileURLToPath(new URL('facebook-perfil-preview-120.png', output)));
await sharp(Buffer.from(cover)).extract({ left: 265, top: 0, width: 1110, height: 624 }).resize(640, 360)
  .png().toFile(fileURLToPath(new URL('facebook-portada-preview-movil.png', output)));

console.log('Avatar, portada y pruebas de recorte creados.');
