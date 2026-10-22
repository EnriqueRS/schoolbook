import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJson, validateQuiz, generateQuiz } from '../src/quiz.js';

const testQ = (n) => ({
  tipo: 'test',
  pregunta: `Pregunta ${n}`,
  opciones: ['a', 'b', 'c', 'd'],
  correcta: 0,
  explicacion: `Explicación ${n}`,
  pagina: 10,
});
const abierta = (n) => ({
  tipo: 'abierta',
  pregunta: `Abierta ${n}`,
  correcta: 'una respuesta',
  explicacion: 'porque sí',
  pagina: 12,
});
const valido = {
  recortado: false,
  preguntas: [...[1, 2, 3, 4, 5, 6].map(testQ), abierta(1), abierta(2)],
};

test('acepta un test bien formado', () => {
  assert.deepEqual(validateQuiz(valido, 6, 23), []);
});

test('rechaza un recuento incorrecto', () => {
  const malo = { recortado: false, preguntas: [testQ(1), abierta(1)] };
  const errores = validateQuiz(malo, 6, 23);
  assert.ok(errores.some((e) => e.includes('6 preguntas de test')));
  assert.ok(errores.some((e) => e.includes('2 preguntas abiertas')));
});

test('admite menos preguntas si el tema se queda corto', () => {
  const corto = { recortado: true, preguntas: [testQ(1), testQ(2), abierta(1), abierta(2)] };
  assert.deepEqual(validateQuiz(corto, 6, 23), []);
});

test('rechaza páginas fuera del tema', () => {
  const malo = structuredClone(valido);
  malo.preguntas[0].pagina = 99;
  assert.ok(validateQuiz(malo, 6, 23).some((e) => e.includes('fuera del tema')));
});

test('rechaza opciones y respuestas mal formadas', () => {
  const malo = structuredClone(valido);
  malo.preguntas[0].opciones = ['a', 'b'];
  malo.preguntas[6].correcta = '';
  const errores = validateQuiz(malo, 6, 23);
  assert.ok(errores.some((e) => e.includes('4 opciones')));
  assert.ok(errores.some((e) => e.includes('sin respuesta esperada')));
});

test('parseJson tolera bloques de código y texto alrededor', () => {
  assert.deepEqual(parseJson('```json\n{"ok":true}\n```'), { ok: true });
  assert.deepEqual(parseJson('Aquí tienes: {"ok":1} espero que sirva'), { ok: 1 });
  assert.throws(() => parseJson('sin json'), /no contiene JSON/);
});

test('un JSON inválido provoca un reintento', async () => {
  const respuestas = ['no es json', JSON.stringify(valido)];
  let llamadas = 0;
  const modelo = async () => respuestas[llamadas++];
  const quiz = await generateQuiz('lengua', 1, modelo, 'Texto del tema.');
  assert.equal(llamadas, 2);
  assert.equal(quiz.preguntas.length, 8);
});

test('dos respuestas inválidas dan un error claro', async () => {
  let llamadas = 0;
  const modelo = async () => {
    llamadas++;
    return JSON.stringify({ recortado: false, preguntas: [] });
  };
  await assert.rejects(() => generateQuiz('lengua', 1, modelo, 'Texto del tema.'), /no devolvió un test válido/);
  assert.equal(llamadas, 2);
});

test('un tema inexistente no llama al modelo', async () => {
  let llamadas = 0;
  const modelo = async () => {
    llamadas++;
    return '';
  };
  await assert.rejects(() => generateQuiz('lengua', 99, modelo), /inexistente/);
  assert.equal(llamadas, 0);
});

test('las opciones se barajan y la correcta sigue siendo la misma', async () => {
  const modelo = async () => JSON.stringify(valido);
  const quiz = await generateQuiz('lengua', 1, modelo, 'Texto del tema.');
  const test1 = quiz.preguntas.find((p) => p.tipo === 'test');
  // El fixture pone siempre "a" como correcta: tras barajar debe seguir siéndolo.
  assert.equal(test1.opciones[test1.correcta], 'a');
  assert.equal(test1.opciones.length, 4);
});
