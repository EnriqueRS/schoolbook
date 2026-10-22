import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'data', 'pages');
const cache = new Map();

export function pageText(bookId, page) {
  const key = `${bookId}/${page}`;
  if (cache.has(key)) return cache.get(key);
  let text = '';
  try {
    text = fs.readFileSync(path.join(DIR, bookId, `${page}.txt`), 'utf8').trim();
  } catch {
    text = '';
  }
  cache.set(key, text);
  return text;
}

export function rangeText(bookId, from, to) {
  const parts = [];
  for (let p = from; p <= to; p++) {
    const text = pageText(bookId, p);
    if (text) parts.push(`[pág. ${p}]\n${text}`);
  }
  return parts.join('\n\n');
}
