// Valida la tabla de temas. Uso: npm run check
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EXPECTED = { lengua: 12, matematicas: 12, conocimiento: 12, religion: 9 };

export function validateCatalog(catalog) {
  const errors = [];
  const ids = new Set();

  for (const b of catalog.books) {
    if (ids.has(b.id)) errors.push(`id de libro repetido: ${b.id}`);
    ids.add(b.id);
    if (b.leftPage !== 'even' && b.leftPage !== 'odd') {
      errors.push(`${b.id}: leftPage debe ser "even" u "odd"`);
    }
    const temas = [...b.temas].sort((x, y) => x.n - y.n);
    if (temas.length !== EXPECTED[b.id]) {
      errors.push(`${b.id}: se esperaban ${EXPECTED[b.id]} temas, hay ${temas.length}`);
    }
    temas.forEach((t, i) => {
      if (t.n !== i + 1) errors.push(`${b.id}: numeración de temas rota en ${t.n}`);
      if (!t.title) errors.push(`${b.id} tema ${t.n}: sin título`);
      if (t.from < 1 || t.to > b.pages) errors.push(`${b.id} tema ${t.n}: fuera del libro`);
      if (t.from > t.to) errors.push(`${b.id} tema ${t.n}: inicio posterior al fin`);
      const prev = temas[i - 1];
      if (!prev) return;
      if (t.from <= prev.to) errors.push(`${b.id} tema ${t.n}: solapa con el ${prev.n}`);
      else if (t.from !== prev.to + 1) {
        errors.push(`${b.id} tema ${t.n}: hueco entre ${prev.to} y ${t.from}`);
      }
    });
  }

  const total = catalog.books.reduce((n, b) => n + b.temas.length, 0);
  if (total !== 45) errors.push(`se esperaban 45 temas en total, hay ${total}`);
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = JSON.parse(readFileSync(new URL('../data/books.json', import.meta.url), 'utf8'));
  const errors = validateCatalog(catalog);
  if (errors.length) {
    console.error('Tabla de temas inválida:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`Tabla de temas correcta: ${catalog.books.length} libros, 45 temas, sin huecos ni solapes.`);
}
