// Contexto y mensajes del tutor.
import { book, spread } from './books.js';
import { pageText, rangeText } from './corpus.js';

export function contexto(bookId, page, alcance) {
  const b = book(bookId);
  if (!b) return null;
  page = Number(page);
  if (alcance === 'tema') {
    const t = b.temas.find((x) => page >= x.from && page <= x.to);
    if (!t) return null;
    return { tipo: 'tema', tema: t, texto: rangeText(bookId, t.from, t.to) };
  }
  const sp = spread(bookId, page);
  if (!sp) return null;
  const paginas = [sp.left, sp.right].filter(Boolean);
  const t = b.temas.find((x) => page >= x.from && page <= x.to) ?? null;
  return {
    tipo: 'pliego',
    tema: t,
    paginas,
    texto: paginas.map((p) => `[pág. ${p}]\n${pageText(bookId, p)}`).join('\n\n'),
  };
}

export function mensajesTutor(b, ctx, historial, mensaje) {
  const sistema = `Eres un tutor que ayuda a un niño de 10 años (5º de primaria) con su libro de ${b.title}.
Reglas:
- Hablas en español, con frases cortas y palabras sencillas.
- Usas ejemplos de su vida: el recreo, la cocina, el fútbol, videojuegos, mascotas.
- Te basas SOLO en el contenido del libro que tienes abajo. Si algo no está, dilo.
- NUNCA resuelves un ejercicio del libro: das una pista, el primer paso y le animas.
- Terminas SIEMPRE con una pregunta corta para comprobar que lo ha entendido.
- Respondes en 3 o 4 frases como máximo. Sin listas largas ni tecnicismos.
- Puedes poner en **negrita** las dos o tres palabras clave de la idea. Nada de otros símbolos de formato.

Estás viendo ${ctx.tipo === 'tema' ? `el tema completo "${ctx.tema?.title ?? ''}"` : `las páginas ${ctx.paginas.join(' y ')}`}${
    ctx.tema ? ` (tema "${ctx.tema.title}")` : ''
  }.

CONTENIDO DEL LIBRO:
${ctx.texto}`;

  const previos = (historial ?? [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-8)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

  return [{ role: 'system', content: sistema }, ...previos, { role: 'user', content: mensaje }];
}
