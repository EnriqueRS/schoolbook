import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { book, books, pageUrl, spread } from './books.js';
import { generateQuiz, gradeAnswer } from './quiz.js';
import { contexto, mensajesTutor } from './tutor.js';
import { streamCompleted } from './ai.js';

try {
  process.loadEnvFile();
} catch {
  // sin .env: se usan las variables del entorno
}

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = process.env.PORT || 8099;

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(ROOT, 'public')));
// 30 días: las páginas no cambian y la tablet las cachea enteras.
app.use('/pages', express.static(path.join(ROOT, 'data', 'pages'), { maxAge: '30d', immutable: true }));

app.get('/api/books', (_req, res) => {
  res.json({
    books: books.map(({ pdf, ...b }) => ({
      ...b,
      pliegos: Math.ceil(b.pages / 2),
      portada: pageUrl(b.id, 1),
    })),
  });
});

// Sirve una página concreta y falla en claro cuando no existe.
app.get('/api/page/:libro/:pagina', (req, res) => {
  const b = book(req.params.libro);
  if (!b) return res.status(404).json({ error: 'Libro inexistente' });
  const page = Number(req.params.pagina);
  const sp = spread(b.id, page);
  if (!sp) {
    return res.status(404).json({ error: `La página ${req.params.pagina} no existe en este libro` });
  }
  res.json({ libro: b.id, pagina: page, pliego: sp, imagen: pageUrl(b.id, page) });
});

app.post('/api/quiz', async (req, res) => {
  const { libro, tema } = req.body ?? {};
  try {
    res.json(await generateQuiz(libro, tema));
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message });
  }
});

app.post('/api/grade', async (req, res) => {
  const { pregunta, esperada, respuesta } = req.body ?? {};
  if (!pregunta || !respuesta) return res.status(400).json({ error: 'Falta la pregunta o la respuesta' });
  try {
    res.json(await gradeAnswer({ pregunta, esperada, respuesta }));
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { libro, pagina, alcance = 'pliego', historial, mensaje } = req.body ?? {};
  if (!mensaje) return res.status(400).json({ error: 'Falta el mensaje' });

  const b = book(libro);
  if (!b) return res.status(404).json({ error: 'Libro inexistente' });
  const ctx = contexto(b.id, pagina, alcance === 'tema' ? 'tema' : 'pliego');
  if (!ctx) return res.status(404).json({ error: `La página ${pagina} no existe en este libro` });

  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const send = (evento) => res.write(`data: ${JSON.stringify(evento)}\n\n`);
  try {
    for await (const delta of streamCompleted(mensajesTutor(b, ctx, historial, mensaje), {
      maxTokens: 1500,
      temperature: 0.5,
    })) {
      send({ delta });
    }
    send({ done: true });
  } catch (error) {
    send({ error: 'El tutor no puede responder ahora mismo. Inténtalo otra vez.' });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`schoolbook en http://localhost:${PORT}`);
});
