const BASE = process.env.LITELLM_BASE_URL || 'http://localhost:4000';
const MODEL = process.env.LITELLM_MODEL || 'nan/deepseek-v4-flash-0731';

function key() {
  const k = process.env.LITELLM_API_KEY;
  if (!k) throw new Error('Falta LITELLM_API_KEY en el entorno');
  return k;
}

async function call(messages, { maxTokens = 2500, temperature = 0.4, stream = false }) {
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key()}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream,
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`LiteLLM ${res.status}: ${detail}`);
  }
  return res;
}

export async function complete(messages, options = {}) {
  const res = await call(messages, options);
  const data = await res.json();
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error('LiteLLM: respuesta sin choices');
  return message.content ?? '';
}

export async function* streamCompleted(messages, options = {}) {
  const res = await call(messages, { ...options, stream: true });
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // una línea partida se recupera en la siguiente iteración
      }
    }
  }
}
