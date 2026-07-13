# Setup-keuzes — CloudCtrl Agent Workshop

Een lopend beslislog: welke keuzes we maken en **waaróm**. Bedoeld zodat je morgen gerichte
vragen kunt stellen en later niets hoeft te reconstrueren.

## Kernbeslissingen

| Onderwerp | Keuze | Waarom |
|---|---|---|
| Platform voor de workshop | CloudCtrl **web** (niet de Kotlin/Android-versie) | Een browser-agent stuurt een DOM aan; een native app heeft die niet. Web is het enige testbare doelwit. |
| Hosting / testdoelwit | **GitHub Pages** → https://dieboard.github.io/CloudCtrl/ (Vercel = gelijkwaardig alternatief) | Gratis statische host, serveert altijd `main` → geen branch-gedoe, geen extra account. `index.html` verandert niet, dus alle bronnen serveren dezelfde app. |
| Vercel production-branch | Mag terug naar `main` | Nu GitHub Pages (`main`) het doelwit is, hoeft Vercel niet meer op `feature/agent-workshop` te staan. Vuistregel: **"de app die ik test = wat op `main` staat"**. |
| Model (agent-brein) | **Lokaal: qwen3-coder:30b via Ollama** | Gratis, privé, draait op de 128 GB-laptop. Bewezen POC. |
| Model-switch | `MODEL_PROVIDER=ollama\|openai` in `agent-lab/` | Eén env-variabele om te wisselen als de workshop een cloud-model voorschrijft. |
| OpenAI als alternatief | Aanwezig maar **niet actief** | Prepaid credits (factuur mei 2024) zijn verlopen — 1 jaar geldig. Geen nieuw tegoed toegevoegd; we blijven lokaal. |
| Secrets | Alleen in `.env` (gitignored) | `.env.example` bevat enkel placeholders; keys komen nooit in Git. |
| Browser Use | Cloud, key in `.env` | Cloud kan de gedeployde Vercel-URL bereiken (localhost niet). |

## Mastra-wizard (`npm create mastra`)

| Vraag | Keuze | Waarom |
|---|---|---|
| Default model provider | OpenAI | Alleen om te scaffolden; `@ai-sdk/openai` praat óók met Ollama via `baseURL`. Model wordt daarna op qwen gezet. |
| API key | OpenAI-key ingevuld | Nodig om te scaffolden; niet actief gebruikt (geen tegoed). Draait op qwen. |
| Mastra Observability | **Nee** | Voorkomt extra auth/account; de Playground toont lokaal al elke tool-call. Later aan te zetten. |
| Tooling coding assistant | **Skills** | Recommended, en sluit aan op de "agent skills"-quality-checks uit de workshop. |
| Coding assistant | **Claude Code** | De AI-CLI die je nu gebruikt; Mastra-skills worden in het Claude Code-format (`.claude/`) geïnstalleerd. Staat los van het runtime-model (qwen) en van Browser Use. |
| Runtime-model in Mastra | **Lokaal qwen** via `@ai-sdk/openai-compatible@1.0.39` in `src/mastra/model.ts` | Model-router kent geen lokale Ollama; daarom een AI SDK v5-modelobject (`createOpenAICompatible` → `http://localhost:11434/v1`). Eén centrale plek (`model.ts`) voor agent én scorer-judge, makkelijk te wisselen naar `'openai/gpt-5-mini'`. |

---
_Laatst bijgewerkt: 13 jul 2026. Wordt aangevuld terwijl we de stappen doorlopen._
