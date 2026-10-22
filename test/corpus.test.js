import test from 'node:test';
import assert from 'node:assert/strict';
import { rangeText, pageText } from '../src/corpus.js';

const hayOcr = pageText('lengua', 12).length > 100;

test('el texto de una página sale del OCR', { skip: !hayOcr && 'sin OCR: ejecuta npm run ocr' }, () => {
  const texto = pageText('lengua', 12);
  assert.match(texto, /mayúsculas/i);
  assert.ok(texto.length > 300);
});

test('el rango de un tema lleva sus páginas numeradas', { skip: !hayOcr && 'sin OCR' }, () => {
  const texto = rangeText('lengua', 6, 23);
  assert.match(texto, /\[pág\. 6\]/);
  assert.match(texto, /\[pág\. 23\]/);
  assert.ok(texto.length > 3000, 'el tema 1 de Lengua debería tener bastante texto');
});

test('una página sin texto no rompe el rango', () => {
  assert.equal(pageText('lengua', 9999), '');
  assert.equal(rangeText('lengua', 9998, 9999), '');
});
