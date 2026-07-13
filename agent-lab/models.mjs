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
export async function chat(messages, { temperature = 0.2, maxTokens = 1500, model } = {}) {
  const cfg = getModel();
  const useModel = model || cfg.model; // optionele override, bv. om een ander model te laten reviewen
  const res = await fetch(`${cfg.baseURL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: useModel, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`${cfg.provider} (${useModel}) gaf HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Zelfde als chat(), maar streamt de tokens terwijl ze binnenkomen (voor live "opbouw"-weergave).
// onToken(delta) wordt per stukje aangeroepen; standaard schrijft hij naar stdout. Geeft de volledige
// tekst terug. Valt terug op geen output als streaming niet lukt.
export async function chatStream(messages, { temperature = 0.2, maxTokens = 1500, model, onToken } = {}) {
  const cfg = getModel();
  const useModel = model || cfg.model;
  const res = await fetch(`${cfg.baseURL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: useModel, messages, temperature, max_tokens: maxTokens, stream: true }),
  });
  if (!res.ok) throw new Error(`${cfg.provider} (${useModel}) gaf HTTP ${res.status}: ${await res.text()}`);
  const emit = onToken || ((d) => process.stdout.write(d));
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const delta = JSON.parse(payload).choices?.[0]?.delta?.content ?? "";
        if (delta) { full += delta; emit(delta); }
      } catch {
        // onvolledige/rare regel — negeren
      }
    }
  }
  return full;
}
