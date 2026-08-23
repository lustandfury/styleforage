import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';
import sharp from 'sharp';

/**
 * One-off/occasional maintenance script: converts large PNG/JPG images under
 * public/images to WebP. Not wired into the build — run manually
 * (`npm run optimize:images`) after adding a new heavy image asset.
 *
 * Usage: node scripts/optimize-images.mjs <file1> <file2> ...
 * Paths are relative to public/images/. Writes a sibling .webp file; does not
 * delete the original (update source references yourself, then remove it).
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '..', 'public', 'images');

const targets = process.argv.slice(2);

if (targets.length === 0) {
  console.error('Usage: node scripts/optimize-images.mjs <file1.png> <file2.jpg> ...');
  console.error('Paths are relative to public/images/.');
  process.exit(1);
}

for (const target of targets) {
  const inputPath = join(imagesDir, target);
  if (!existsSync(inputPath)) {
    console.error(`Skipping ${target} — not found in public/images/`);
    continue;
  }

  const ext = extname(target);
  const name = basename(target, ext);
  const outputPath = join(dirname(inputPath), `${name}.webp`);
  const beforeSize = statSync(inputPath).size;

  await sharp(inputPath).webp({ quality: 82 }).toFile(outputPath);

  const afterSize = statSync(outputPath).size;
  const savedPct = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(0);
  console.log(
    `${target} → ${name}.webp: ${(beforeSize / 1024).toFixed(0)}KB → ${(afterSize / 1024).toFixed(0)}KB (-${savedPct}%)`
  );
}
