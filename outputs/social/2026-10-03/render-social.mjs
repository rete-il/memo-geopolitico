import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const output = new URL('./', import.meta.url);
const colors = { paper:'#f8f6f1', ink:'#101c2c', amber:'#c47a27', bright:'#f4b95e', blue:'#245a78', line:'#d9d5cb' };
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Memo Geopolítico. Estados Unidos y China: competencia y cooperación. IA, comercio, inversión y tierras raras."><rect width="${w}" height="${h}" fill="${colors.paper}"/><rect x="0" y="0" width="${w}" height="10" fill="${colors.amber}"/>${body}</svg>`;
const logo = (x,y,size) => `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size*.22}" fill="${colors.ink}"/><text x="${x+size/2}" y="${y+size*.63}" text-anchor="middle" font-family="Georgia,serif" font-size="${size*.39}" font-weight="bold" letter-spacing="${size*.025}" fill="${colors.bright}">MG</text>`;
const type = (x,y,size,text,opts='') => `<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="${size}" fill="${colors.ink}" ${opts}>${text}</text>`;
const sans = (x,y,size,text,opts='') => `<text x="${x}" y="${y}" font-family="Segoe UI,Arial,sans-serif" font-size="${size}" fill="${colors.blue}" ${opts}>${text}</text>`;
const horizontal = (x,y,w) => `<path d="M${x} ${y}h${w}" fill="none" stroke="${colors.line}" stroke-width="2"/>`;

const facebook = svg(1200,1200,
  logo(88,82,82) + type(194,133,43,'Memo Geopolítico','font-weight="bold"') +
  horizontal(88,214,1024) +
  type(88,387,90,'Estados Unidos') +
  type(88,498,90,'y China:') +
  type(88,646,90,'competencia') +
  type(88,757,90,'y cooperación') +
  `<rect x="88" y="819" width="94" height="5" fill="${colors.amber}"/>` +
  sans(88,886,32,'IA · Comercio · Inversión · Tierras raras') +
  horizontal(88,982,1024) +
  sans(88,1055,30,'Procesos que exceden la coyuntura') +
  sans(88,1111,31,'memogeopolitico.com','font-weight="600"')
);

const linkedin = svg(1200,630,
  logo(66,51,66) + type(154,94,33,'Memo Geopolítico','font-weight="bold"') +
  horizontal(66,148,1068) +
  type(66,250,66,'Estados Unidos y China:') +
  type(66,332,66,'competencia y cooperación') +
  `<rect x="66" y="372" width="82" height="4" fill="${colors.amber}"/>` +
  sans(66,434,28,'IA · Comercio · Inversión · Tierras raras') +
  horizontal(66,503,1068) +
  sans(66,566,25,'Procesos que exceden la coyuntura') +
  sans(1134,566,26,'memogeopolitico.com','font-weight="600" text-anchor="end"')
);

for (const [name, source] of [['facebook-eeuu-china-1200x1200', facebook], ['linkedin-eeuu-china-1200x630', linkedin]]) {
  await fs.writeFile(new URL(name+'.svg',output), source, 'utf8');
  await sharp(Buffer.from(source)).png().toFile(fileURLToPath(new URL(name+'.png',output)));
}
console.log('Gráficos SVG y PNG creados.');
