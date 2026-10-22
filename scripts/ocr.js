// Extrae el texto de cada página con OCR. Idempotente: salta lo ya generado.
// Uso: node scripts/ocr.js [bookId]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { books } from '../src/books.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DPI = 300;

const only = process.argv[2];
const selected = only ? books.filter((b) => b.id === only) : books;

for (const b of selected) {
  const outDir = path.join(ROOT, 'data', 'pages', b.id);
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-'));
  const pdf = path.join(ROOT, 'books', b.pdf);
  let done = 0;

  for (let page = 1; page <= b.pages; page++) {
    const out = path.join(outDir, `${page}.txt`);
    if (fs.existsSync(out)) continue;
    const png = path.join(tmp, `p${page}`);
    execFileSync(
      'pdftoppm',
      ['-f', String(page), '-l', String(page), '-r', String(DPI), '-png', '-singlefile', pdf, png],
      { stdio: 'ignore' },
    );
    execFileSync('tesseract', [`${png}.png`, path.join(tmp, 'out'), '-l', 'spa', '--psm', '3'], {
      stdio: 'ignore',
    });
    // Deja una línea por párrafo: el modelo lee mejor que con los saltos del OCR.
    const raw = fs.readFileSync(path.join(tmp, 'out.txt'), 'utf8');
    fs.writeFileSync(out, raw.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() + '\n');
    fs.rmSync(`${png}.png`, { force: true });
    fs.rmSync(path.join(tmp, 'out.txt'), { force: true });
    if (++done % 10 === 0) console.log(`${b.id}: ${page}/${b.pages}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${b.id}: listo (${b.pages} páginas, ${done} nuevas)`);
}
