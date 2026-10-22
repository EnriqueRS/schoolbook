const $ = (sel) => document.querySelector(sel);

const CHIPS = {
  'Más fácil': 'Explícamelo más fácil, como si tuviera 8 años.',
  'Un ejemplo': 'Ponme un ejemplo de mi vida diaria.',
  Pregúntame: 'Hazme una pregunta para ver si lo he entendido.',
  '¿Para qué sirve?': '¿Para qué sirve esto en la vida real?',
};

const state = {
  books: [],
  book: null,
  page: 1,
  chromeTimer: null,
  tutor: { messages: [], scope: 'pliego' },
  quiz: null,
};

// ---------- catálogo ----------

async function load() {
  const { books } = await (await fetch('/api/books')).json();
  state.books = books;
  renderShelf();

  // Enlace directo: #libro/pagina (útil para guardar dónde se quedó uno).
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}

function openFromHash() {
  const [libro, pagina] = location.hash.slice(1).split('/');
  const book = state.books.find((b) => b.id === libro);
  if (book) openBook(libro, Number(pagina) || undefined);
}

function renderShelf() {
  const grid = $('#books');
  grid.textContent = '';
  for (const b of state.books) {
    const saved = Number(localStorage.getItem(`schoolbook:pos:${b.id}`)) || 0;
    const btn = document.createElement('button');
    btn.className = 'book';
    btn.innerHTML = `<img src="${b.portada}" alt="" loading="lazy">
      <strong></strong><span></span>`;
    btn.querySelector('strong').textContent = b.title;
    btn.querySelector('span').textContent =
      `${b.temas.length} temas` + (saved > 1 ? ` · seguías por la pág. ${saved}` : '');
    btn.addEventListener('click', () => openBook(b.id));
    grid.appendChild(btn);
  }
}

function temaOf(page) {
  return state.book?.temas.find((t) => page >= t.from && page <= t.to) ?? null;
}

// ---------- lector ----------

function spreadOf(page) {
  const b = state.book;
  const pair = page % 2 === 0 ? page : page - 1;
  const left = b.leftPage === 'even' ? pair : pair + 1;
  const right = left + 1;
  return {
    left: left >= 1 && left <= b.pages ? left : null,
    right: right >= 1 && right <= b.pages ? right : null,
  };
}

function openBook(id, page) {
  state.book = state.books.find((b) => b.id === id);
  const saved = Number(localStorage.getItem(`schoolbook:pos:${id}`));
  $('#shelf').classList.add('hidden');
  $('#reader').classList.remove('hidden');
  closeTutor();
  closeQuiz();
  const start = page ?? (saved >= 1 && saved <= state.book.pages ? saved : 1);
  showPage(start);
}

function showPage(page) {
  const b = state.book;
  page = Math.min(Math.max(1, page), b.pages);
  state.page = page;
  const sp = spreadOf(page);

  setPageImage($('#pageLeft'), sp.left);
  setPageImage($('#pageRight'), sp.right);

  const shown = [sp.left, sp.right].filter(Boolean);
  $('#pos').textContent =
    shown.length > 1 ? `${shown[0]}–${shown[shown.length - 1]} / ${b.pages}` : `${shown[0]} / ${b.pages}`;
  $('#progressBar').style.width = `${(shown[shown.length - 1] / b.pages) * 100}%`;
  localStorage.setItem(`schoolbook:pos:${b.id}`, String(page));
  history.replaceState(null, '', `#${b.id}/${page}`);

  const t = temaOf(page);
  $('#btnQuiz').textContent = t ? `Test del tema ${t.n}` : 'Test';
  $('#chromeTitle').textContent = `${b.title}${t ? ` · Tema ${t.n}` : ''}`;
  $('#tutorTitle').textContent = t ? `Tema ${t.n} · ${t.title}` : 'Tutor';

  prefetch(page);
  hideChrome();
}

function setPageImage(img, page) {
  if (page) {
    img.src = `/pages/${state.book.id}/${page}.webp`;
    img.style.visibility = 'visible';
  } else {
    img.removeAttribute('src');
    img.style.visibility = 'hidden';
  }
}

function prefetch(page) {
  for (const delta of [2, -2]) {
    const target = page + delta;
    if (target < 1 || target > state.book.pages) continue;
    const { left, right } = spreadOf(target);
    for (const p of [left, right]) {
      if (p) new Image().src = `/pages/${state.book.id}/${p}.webp`;
    }
  }
}

function step(direction) {
  const next = state.page + direction * 2;
  if (next < 1 || next > state.book.pages) return;
  showPage(next);
}

function showChrome() {
  $('#chrome').classList.remove('hidden');
  clearTimeout(state.chromeTimer);
  state.chromeTimer = setTimeout(hideChrome, 3000);
}

function hideChrome() {
  clearTimeout(state.chromeTimer);
  $('#chrome').classList.add('hidden');
}

let pointer = null;
$('#spread').addEventListener('pointerdown', (e) => {
  pointer = { x: e.clientX, y: e.clientY, t: Date.now() };
});

$('#spread').addEventListener('pointerup', (e) => {
  if (!pointer) return;
  const dx = e.clientX - pointer.x;
  const dy = e.clientY - pointer.y;
  const elapsed = Date.now() - pointer.t;
  pointer = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    step(dx < 0 ? 1 : -1);
    return;
  }
  if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && elapsed < 400) {
    $('#chrome').classList.contains('hidden') ? showChrome() : hideChrome();
  }
});

window.addEventListener('keydown', (e) => {
  if ($('#reader').classList.contains('hidden')) return;
  if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'Escape') {
    if (!$('#tutor').classList.contains('hidden')) closeTutor();
    else if (!$('#quiz').classList.contains('hidden')) closeQuiz();
    else $('#reader').classList.add('hidden'), $('#shelf').classList.remove('hidden');
  }
});

$('#btnBack').addEventListener('click', () => {
  $('#reader').classList.add('hidden');
  $('#shelf').classList.remove('hidden');
  renderShelf();
});

// ---------- tutor ----------

function openTutor() {
  $('#tutor').classList.remove('hidden');
  if (!state.tutor.messages.length) {
    addBubble('ai', `Estoy viendo esta página de ${state.book.title}. ¿Qué quieres que te explique?`);
  }
  $('#tutorInput').focus();
}

function closeTutor() {
  $('#tutor').classList.add('hidden');
}

// Negritas seguras para el tutor: se construye con nodos, nunca con innerHTML.
function setRich(el, text) {
  el.textContent = '';
  for (const part of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      el.appendChild(strong);
    } else {
      el.appendChild(document.createTextNode(part));
    }
  }
}

function addBubble(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  $('#tutorLog').appendChild(div);
  $('#tutorLog').scrollTop = $('#tutorLog').scrollHeight;
  return div;
}

async function ask(text, echo = true) {
  const input = $('#tutorInput');
  if (echo) addBubble('me', text);
  state.tutor.messages.push({ role: 'user', content: text });
  input.value = '';

  const bubble = addBubble('ai', '…');
  const body = {
    libro: state.book.id,
    pagina: state.page,
    alcance: state.tutor.scope,
    historial: state.tutor.messages.slice(0, -1),
    mensaje: text,
  };

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || `Error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';
    bubble.textContent = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let cut;
      while ((cut = buffer.indexOf('\n\n')) >= 0) {
        const chunk = buffer.slice(0, cut);
        buffer = buffer.slice(cut + 2);
        if (!chunk.startsWith('data: ')) continue;
        const event = JSON.parse(chunk.slice(6));
        if (event.delta) {
          answer += event.delta;
          setRich(bubble, answer);
          $('#tutorLog').scrollTop = $('#tutorLog').scrollHeight;
        }
        if (event.error) throw new Error(event.error);
      }
    }
    state.tutor.messages.push({ role: 'assistant', content: answer || bubble.textContent });
  } catch (error) {
    bubble.remove();
    const err = addBubble('err', `${error.message} `);
    const retry = document.createElement('button');
    retry.className = 'link';
    retry.textContent = 'Reintentar';
    retry.addEventListener('click', () => {
      err.remove();
      state.tutor.messages.pop();
      ask(text, false);
    });
    err.appendChild(retry);
  }
}

$('#btnTutor').addEventListener('click', openTutor);
$('#btnCloseTutor').addEventListener('click', closeTutor);
$('#tutorForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('#tutorInput').value.trim();
  if (text) ask(text);
});
for (const chip of document.querySelectorAll('#chips .chip')) {
  chip.addEventListener('click', () => openTutor() ?? ask(CHIPS[chip.textContent] ?? chip.textContent));
}
$('#btnScope').addEventListener('click', () => {
  state.tutor.scope = state.tutor.scope === 'tema' ? 'pliego' : 'tema';
  $('#btnScope').textContent =
    state.tutor.scope === 'tema' ? 'Solo el pliego' : 'Ampliar al tema';
});

// ---------- test ----------

async function openQuiz() {
  const t = temaOf(state.page);
  if (!t) {
    addBubble('err', 'Esta página no pertenece a ningún tema, así que no hay test.');
    openTutor();
    return;
  }
  $('#quiz').classList.remove('hidden');
  $('#quizTitle').textContent = `Test · Tema ${t.n} — ${t.title}`;
  $('#quizBody').innerHTML = '<p class="loading">Preparando el test…</p>';
  $('#quizFoot').textContent = '';
  state.quiz = { tema: t, preguntas: [], respondidas: 0, aciertos: 0 };

  try {
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libro: state.book.id, tema: t.n }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo generar el test');
    state.quiz.preguntas = data.preguntas;
    renderQuiz(data);
  } catch (error) {
    $('#quizBody').innerHTML = '';
    const p = document.createElement('p');
    p.className = 'fb';
    p.textContent = error.message;
    $('#quizBody').appendChild(p);
  }
}

function renderQuiz(data) {
  const body = $('#quizBody');
  body.textContent = '';
  if (data.recortado) {
    const note = document.createElement('p');
    note.className = 'fb';
    note.textContent = 'El tema tiene poco texto, así que el test tiene menos preguntas.';
    body.appendChild(note);
  }

  data.preguntas.forEach((q, index) => {
    const block = document.createElement('div');
    block.className = 'q';
    const title = document.createElement('h3');
    title.innerHTML = '<span class="n"></span>';
    title.querySelector('.n').textContent = `${index + 1}.`;
    title.append(q.pregunta);
    block.appendChild(title);

    const fb = document.createElement('div');
    fb.className = 'fb';

    if (q.tipo === 'test') {
      const opts = document.createElement('div');
      opts.className = 'opts';
      q.opciones.forEach((texto, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt';
        btn.textContent = texto;
        btn.addEventListener('click', () => {
          for (const b of opts.children) b.disabled = true;
          const ok = i === q.correcta;
          opts.children[q.correcta].classList.add('ok');
          if (!ok) btn.classList.add('no');
          state.quiz.aciertos += ok ? 1 : 0;
          state.quiz.respondidas++;
          fb.innerHTML = '<b></b> ';
          fb.querySelector('b').textContent = ok ? '¡Correcto!' : 'Casi.';
          fb.append(q.explicacion + ' ');
          fb.appendChild(pageLink(q.pagina));
          updateFoot();
        });
        opts.appendChild(btn);
      });
      block.appendChild(opts);
    } else {
      const area = document.createElement('textarea');
      area.placeholder = 'Responde con tus palabras…';
      const check = document.createElement('button');
      check.className = 'check';
      check.textContent = 'Comprobar';
      check.addEventListener('click', async () => {
        if (!area.value.trim()) return;
        check.disabled = true;
        fb.textContent = 'Corrigiendo…';
        try {
          const res = await fetch('/api/grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pregunta: q.pregunta,
              esperada: q.correcta,
              respuesta: area.value,
            }),
          });
          const data = await res.json();
          const label = { correcta: '¡Muy bien!', parcial: 'Vas bien.', incorrecta: 'Repásalo.' };
          fb.innerHTML = '<b></b> ';
          fb.querySelector('b').textContent = label[data.valoracion] ?? 'Corregido.';
          fb.append(`${data.comentario} `);
          fb.appendChild(pageLink(q.pagina));
          state.quiz.aciertos += data.valoracion === 'correcta' ? 1 : data.valoracion === 'parcial' ? 0.5 : 0;
        } catch {
          fb.textContent = 'No he podido corregirlo. Inténtalo otra vez.';
          check.disabled = false;
          return;
        }
        state.quiz.respondidas++;
        updateFoot();
      });
      block.append(area, check);
    }

    block.appendChild(fb);
    body.appendChild(block);
  });
  updateFoot();
}

function pageLink(page) {
  const link = document.createElement('a');
  link.textContent = `Ir a la pág. ${page}`;
  link.addEventListener('click', () => {
    closeQuiz();
    showPage(page);
  });
  return link;
}

function updateFoot() {
  const q = state.quiz;
  const total = q.preguntas.length;
  const foot = $('#quizFoot');
  foot.textContent = '';
  const info = document.createElement('span');
  info.textContent =
    q.respondidas >= total
      ? `Resultado: ${q.aciertos} de ${total}`
      : `${q.respondidas} de ${total} respondidas`;
  const actions = document.createElement('div');
  actions.className = 'actions';
  const again = document.createElement('button');
  again.textContent = 'Otro test';
  again.addEventListener('click', openQuiz);
  const close = document.createElement('button');
  close.className = 'primary';
  close.textContent = 'Cerrar';
  close.addEventListener('click', closeQuiz);
  actions.append(again, close);
  foot.append(info, actions);
}

function closeQuiz() {
  $('#quiz').classList.add('hidden');
  state.quiz = null;
}

$('#btnQuiz').addEventListener('click', openQuiz);
$('#btnCloseQuiz').addEventListener('click', closeQuiz);

load();
