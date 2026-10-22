import fs from 'node:fs';

export const catalog = JSON.parse(
  fs.readFileSync(new URL('../data/books.json', import.meta.url), 'utf8'),
);

export const books = catalog.books;

export function book(id) {
  return books.find((b) => b.id === id);
}

export function tema(bookId, n) {
  return book(bookId)?.temas.find((t) => t.n === Number(n));
}

// Páginas que forman el pliego de una página; null cuando el lado no existe.
export function spread(bookId, page) {
  const b = book(bookId);
  page = Number(page);
  if (!b || !Number.isInteger(page) || page < 1 || page > b.pages) return null;
  const evenIsLeft = b.leftPage === 'even';
  const firstOfPair = page % 2 === 0 ? page : page - 1;
  const left = evenIsLeft ? firstOfPair : firstOfPair + 1;
  return {
    left: left >= 1 && left <= b.pages ? left : null,
    right: left + 1 >= 1 && left + 1 <= b.pages ? left + 1 : null,
  };
}

export function pageUrl(bookId, page) {
  return `/pages/${bookId}/${page}.webp`;
}
