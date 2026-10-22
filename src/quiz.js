// Generación y validación del test de un tema.
import { complete } from './ai.js';
import { book, tema } from './books.js';
import { rangeText } from './corpus.js';

const SISTEMA = `Eres maestro de 5º de primaria en España y preparas tests de repaso.
Escribes en español, con frases cortas y vocabulario de niño de 10 años.
Devuelves siempre JSON válido, sin texto alrededor y sin bloques de código.`;

export function promptQuiz(b, t, texto) {
  return `${SISTEMA}

Prepara un test sobre el tema "${t.title}" de ${b.title}, usando SOLO el texto adjunto
(páginas ${t.from} a ${t.to}). No uses conocimiento externo ni inventes contenido que no aparezca.
Si el texto no da para tanto, devuelve menos preguntas y marca "recortado": true.

Formato exacto:
{"recortado": false, "preguntas": [
 {"tipo":"test","pregunta":"...","opciones":["...","...","...","..."],"correcta":0,"explicacion":"...","pagina":12},
 {"tipo":"abierta","pregunta":"...","correcta":"respuesta esperada","explicacion":"...","pagina":14}
]}

Reglas:
- Seis preguntas "test" con cuatro opciones y una sola correcta (índice 0-3).
- Dos preguntas "abierta" que se respondan con una o dos frases.
- "pagina" es la página del libro donde está la respuesta.
- "explicacion" justifica la respuesta en una frase.

TEXTO DEL TEMA:
${texto}`;
}

export function parseJson(raw) {
  const text = String(raw ?? '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('la respuesta no contiene JSON');
  return JSON.parse(text.slice(start, end + 1));
}

export function validateQuiz(quiz, from, to) {
  const errors = [];
  if (!quiz || !Array.isArray(quiz.preguntas)) return ['falta la lista de preguntas'];
  const test = quiz.preguntas.filter((p) => p.tipo === 'test');
  const abiertas = quiz.preguntas.filter((p) => p.tipo === 'abierta');

  if (quiz.recortado) {
    if (quiz.preguntas.length < 4) errors.push('recortado pero con menos de 4 preguntas');
  } else {
    if (test.length !== 6) errors.push(`se esperaban 6 preguntas de test, hay ${test.length}`);
    if (abiertas.length !== 2) errors.push(`se esperaban 2 preguntas abiertas, hay ${abiertas.length}`);
  }

  for (const [i, p] of quiz.preguntas.entries()) {
    const id = `pregunta ${i + 1}`;
    if (!p.pregunta) errors.push(`${id}: sin enunciado`);
    if (!p.explicacion) errors.push(`${id}: sin explicación`);
    if (!Number.isInteger(p.pagina) || p.pagina < from || p.pagina > to) {
      errors.push(`${id}: página ${p.pagina} fuera del tema (${from}-${to})`);
    }
    if (p.tipo === 'test') {
      if (!Array.isArray(p.opciones) || p.opciones.length !== 4) {
        errors.push(`${id}: necesita 4 opciones`);
      } else if (!Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta > 3) {
        errors.push(`${id}: índice de respuesta correcta inválido`);
      }
    } else if (p.tipo === 'abierta') {
      if (!p.correcta) errors.push(`${id}: sin respuesta esperada`);
    } else {
      errors.push(`${id}: tipo "${p.tipo}" desconocido`);
    }
  }
  return errors;
}

export function shuffleOptions(preguntas) {
  for (const p of preguntas) {
    if (p.tipo !== 'test') continue;
    const correcta = p.opciones[p.correcta];
    for (let i = p.opciones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p.opciones[i], p.opciones[j]] = [p.opciones[j], p.opciones[i]];
    }
    p.correcta = p.opciones.indexOf(correcta);
  }
  return preguntas;
}

// `texto` es inyectable para que los tests no dependan de tener el OCR generado.
export async function generateQuiz(bookId, n, model = complete, texto) {
  const b = book(bookId);
  const t = tema(bookId, n);
  if (!b || !t) throw Object.assign(new Error('Libro o tema inexistente'), { status: 404 });

  texto ??= rangeText(bookId, t.from, t.to);
  if (!texto) {
    throw Object.assign(new Error('No hay texto OCR para este tema: ejecuta npm run ocr'), {
      status: 503,
    });
  }

  const messages = [{ role: 'user', content: promptQuiz(b, t, texto) }];
  let lastErrors = [];
  for (let intento = 0; intento < 2; intento++) {
    const raw = await model(messages, { maxTokens: 8000, temperature: 0.4 });
    let quiz;
    try {
      quiz = parseJson(raw);
    } catch (error) {
      lastErrors = [error.message];
    }
    if (quiz) {
      lastErrors = validateQuiz(quiz, t.from, t.to);
      if (!lastErrors.length) {
        return {
          libro: bookId,
          tema: t,
          preguntas: shuffleOptions(quiz.preguntas),
          recortado: !!quiz.recortado,
        };
      }
    }
    messages.push({ role: 'assistant', content: raw });
    messages.push({
      role: 'user',
      content: `La respuesta no es válida: ${lastErrors.join('; ')}. Devuelve el JSON corregido y nada más.`,
    });
  }
  throw Object.assign(new Error(`El modelo no devolvió un test válido: ${lastErrors.join('; ')}`), {
    status: 502,
  });
}

export async function gradeAnswer({ pregunta, esperada, respuesta }) {
  const raw = await complete(
    [
      {
        role: 'system',
        content:
          'Eres maestro de 5º de primaria. Corriges con cariño, en español, sin humillar. Devuelves solo JSON.',
      },
      {
        role: 'user',
        content: `Pregunta: ${pregunta}
Respuesta esperada: ${esperada}
Respuesta del niño: ${respuesta}

Valora con esta rúbrica: "correcta" si recoge la idea principal, "parcial" si va encaminada pero
le falta algo, "incorrecta" si no se acerca. El comentario tiene una o dos frases y dice qué faltó.
Formato: {"valoracion":"correcta|parcial|incorrecta","comentario":"..."}`,
      },
    ],
    { maxTokens: 1200, temperature: 0.2 },
  );
  try {
    const parsed = parseJson(raw);
    if (['correcta', 'parcial', 'incorrecta'].includes(parsed.valoracion)) return parsed;
  } catch {
    // cae al valor por defecto
  }
  return { valoracion: 'parcial', comentario: 'No he podido corregirla. Revísala con tu profe.' };
}
