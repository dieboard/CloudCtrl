# 🎮 CheatSheet — CloudCtrl Agent Workshop

Alle commando's draaien vanuit de **projectroot** (`CloudCtrl/`). ⚠️ = kost Browser Use-credits.

## 🎛️ Interactief (Studio)
```
npm run dev          # Mastra Studio → http://localhost:4111 (chat met agents, Traces)
```

Emei Shan-regenscenario in **Workflows → weather-workflow → New workflow run**:
```json
{"city":"Emei Shan","dataMode":"mock"}
```
Gebruik `"dataMode":"live"` om dezelfde locatie actueel via Open-Meteo op te halen.

## 🤖 Alles in één keer
```
npm run all               # genereren → review → Playwright → gecombineerd rapport
npm run all:browser       # hetzelfde + Browser Use                    ⚠️ credits
```

`npm run report:playwright` is een alias van de veilige `all`-route. Deze voert alleen reeds
goedgekeurde Playwright-code uit; nieuwe gegenereerde cases gaan eerst langs de menselijke gate.

## 🎭 Playwright (primair regressievangnet)
```
npm run test:e2e          # headless uitvoeren + HTML/JSON-rapport
npm run test:e2e:headed   # zichtbaar browservenster
npm run test:e2e:ui       # interactieve Playwright UI
npm run test:e2e:report   # laatste HTML-rapport openen
```
Nieuwe goedgekeurde testcase toevoegen: vraag je coding agent om **`$write-e2e-test`** te gebruiken.
De skill schrijft de test, voert `npm run test:e2e` uit en bewaart bewijs bij failures.

## 🧩 Iedere fase apart
```
npm run phase:1          # genereren; schrijft agent-lab/run/testcases.txt + rapport
npm run phase:2          # review met 1 LLM; leest fase 1 en schrijft reviewrapport
npm run phase:2:compare  # review met 2 LLM's parallel + meta-judge
npm run phase:3          # goedgekeurde Playwright-suite headless + rapport
npm run phase:3:headed   # dezelfde suite in een zichtbaar browservenster
npm run phase:4          # optionele Browser Use-controle               ⚠️ credits
```

Fase 2 bouwt voort op Fase 1. Je mag `agent-lab/run/testcases.txt` tussendoor beoordelen of aanpassen.
Gebruik daarna `$write-e2e-test` in Codex/Cursor/Claude om een goedgekeurde case aan Fase 3 toe te
voegen. `npm run review`, `compare`, `compare:3`, `browser` en de oudere `report:*`-commando's
blijven als handige aliases bestaan.

## 🔧 Handige knoppen
> Env-vars hieronder werken in **PowerShell/bash**. In **Windows cmd**: `set VAR=waarde&& npm run ...`
> — of gebruik de kant-en-klare scripts (bv. `npm run compare:3`) die geen env-var nodig hebben.
```
OLLAMA_MODEL=qwen2.5-coder:latest npm run report    # ander (kleiner/sneller) lokaal model
REVIEW_MODEL=mistral:latest       npm run review     # andere reviewer
JUDGE_MODEL=qwen2.5-coder:latest  npm run compare    # andere meta-judge
BROWSER_LIMIT=5                   npm run report:all  # aantal cases naar Browser Use

compare met eigen modellen (werkt óók in cmd):
node agent-lab/compare-reviews.mjs --reviewers=mistral:latest,qwen2.5-coder:latest --judge=llama3:latest

ollama run qwen3-coder:30b "hi"   # model vast in geheugen laden (voorkomt koude start)
ollama ps                         # welk model is geladen + geheugen/GPU
npx kill-port 4111                # poort 4111 vrijmaken (als Studio klem zit)
```

## 🌐 URLs
```
Live app (testdoelwit):   https://dieboard.github.io/CloudCtrl/
Mastra Studio:            http://localhost:4111
Browser Use-dashboard:    https://cloud.browser-use.com   (live + opgenomen sessies)
```

## 📄 Waar dingen landen
```
Rapporten & logs:   agent-lab/reports/   (gitignored)
Secrets:            .env                 (gitignored — NOOIT committen)
```

---
_Geavanceerd/experimenteel: `npm run studio-run` — volledige flow via de échte Mastra-agent (zichtbaar in Traces), maar traag met lokaal qwen via de synchrone API._
