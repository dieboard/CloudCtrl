import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Centrale modelkeuze — één plek om te wisselen tussen lokaal en cloud.
//
// Lokaal draait via Ollama's OpenAI-compatibele endpoint (http://localhost:11434/v1).
// Wil je cloud? Vervang `localModel` hieronder door de model-router-string, bv.:
//   export const localModel = 'openai/gpt-5-mini';   // vereist OPENAI_API_KEY + tegoed
//
// De Mastra-agent en de scorer-judge accepteren allebei zowel een model-object als een string.

const ollama = createOpenAICompatible({
  name: 'ollama',
  baseURL: 'http://localhost:11434/v1',
});

export const localModel = ollama('qwen3-coder:30b');
