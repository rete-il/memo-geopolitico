import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const output = new URL('./', import.meta.url);
const coverSvg = await fs.readFile(new URL('linkedin-portada-pagina-1128x191.svg', output));
const logoSvg = await fs.readFile(new URL('linkedin-logo-400.svg', output));

await sharp(coverSvg, { density: 144 })
  .resize(2256, 382)
  .flatten({ background: '#f8f6f1' })
  .toColourspace('srgb')
  .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
  .toFile(fileURLToPath(new URL('linkedin-portada-pagina-2256x382.jpg', output)));

await sharp(logoSvg)
  .resize(400, 400)
  .flatten({ background: '#101c2c' })
  .toColourspace('srgb')
  .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
  .toFile(fileURLToPath(new URL('linkedin-logo-400.jpg', output)));

for (const name of ['linkedin-portada-pagina-2256x382.jpg', 'linkedin-logo-400.jpg']) {
  const file = fileURLToPath(new URL(name, output));
  const metadata = await sharp(file).metadata();
  const stat = await fs.stat(file);
  console.log(JSON.stringify({ name, width: metadata.width, height: metadata.height, channels: metadata.channels, space: metadata.space, sizeBytes: stat.size }));
}
