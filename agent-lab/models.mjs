// Provider-switch: kies via MODEL_PROVIDER=ollama|openai welk model de agent gebruikt.
// Ollama en OpenAI praten allebei OpenAI-compatibel, dus dezelfde aanroepcode werkt voor beide.
// Morgen kun je zo met één env-variabele wisselen als Tim een ander model voorschrijft.

const PROVIDERS = {
  ollama: {
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    apiKey: "ollama", // dummy — Ollama negeert 'm
    model: process.env.OLLAMA_MODEL || "qwen3-coder:30b",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o",
  },
};

export function getModel() {
  const name = (process.env.MODEL_PROVIDER || "ollama").toLowerCase();
  const cfg = PROVIDERS[name];
  if (!cfg) throw new Error(`Onbekende MODEL_PROVIDER: '${name}'. Kies 'ollama' of 'openai'.`);
  if (!cfg.apiKey) throw new Error(`Geen API-key voor provider '${name}'. Zet de juiste env-var in .env.`);
  return { provider: name, ...cfg };
}

// Simpele OpenAI-compatibele chat-aanroep (werkt voor Ollama én OpenAI).
export async function chat(messages, { temperature = 0.2, maxTokens = 1500 } = {}) {
  const { baseURL, apiKey, model, provider } = getModel();
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`${provider} gaf HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
