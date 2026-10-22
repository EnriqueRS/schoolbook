import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, books, book, tema, spread, pageUrl } from '../src/books.js';
import { validateCatalog } from '../scripts/check.js';

test('la tabla de temas es consistente', () => {
  assert.deepEqual(validateCatalog(catalog), []);
});

test('45 temas repartidos como 12/12/12/9', () => {
  assert.equal(books.reduce((n, b) => n + b.temas.length, 0), 45);
  assert.deepEqual(
    books.map((b) => b.temas.length),
    [12, 12, 12, 9],
  );
});

test('los rangos de cada libro son contiguos', () => {
  for (const b of books) {
    for (let i = 1; i < b.temas.length; i++) {
      assert.equal(b.temas[i].from, b.temas[i - 1].to + 1, `${b.id} tema ${i + 1}`);
    }
  }
});

test('el repaso pertenece al tema anterior', () => {
  // Lengua: el repaso trimestral queda dentro del tema 4.
  assert.equal(tema('lengua', 4).to + 1, tema('lengua', 5).from);
  // Religión: el último tema acaba antes de "Historias para leer" (pág. 90).
  assert.equal(tema('religion', 9).to, 89);
});

test('el pliego pone la página par a la izquierda', () => {
  assert.deepEqual(spread('lengua', 10), { left: 10, right: 11 });
  assert.deepEqual(spread('lengua', 11), { left: 10, right: 11 });
  assert.deepEqual(spread('lengua', 6), { left: 6, right: 7 });
  assert.deepEqual(spread('lengua', 7), { left: 6, right: 7 });
});

test('la portada va sola con un hueco a la izquierda', () => {
  assert.deepEqual(spread('lengua', 1), { left: null, right: 1 });
});

test('un libro que acaba en página par deja la última sola', () => {
  assert.deepEqual(spread('religion', book('religion').pages), { left: 98, right: null });
});

test('un libro que acaba en página impar cierra con pliego completo', () => {
  assert.deepEqual(spread('matematicas', book('matematicas').pages), {
    left: 232,
    right: 233,
  });
});

test('una página fuera de rango no tiene pliego', () => {
  assert.equal(spread('lengua', 999), null);
  assert.equal(spread('lengua', 0), null);
  assert.equal(spread('noexiste', 3), null);
});

test('las url de página son estáticas', () => {
  assert.equal(pageUrl('lengua', 12), '/pages/lengua/12.webp');
});
