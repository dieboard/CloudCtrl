# 🎮 CheatSheet — CloudCtrl Agent Workshop

Alle commando's draaien vanuit de **projectroot** (`CloudCtrl/`). ⚠️ = kost Browser Use-credits.

## 🎛️ Interactief (Studio)
```
npm run dev          # Mastra Studio → http://localhost:4111 (chat met agents, Traces)
```

## 🤖 Pijplijn (1 knop, live opbouw)
```
npm run report            # genereren → review → go/no-go-rapport        (gratis)
npm run report:all        # + Browser Use uitvoeren                    ⚠️ credits
npm run report:browser    # genereren + Browser Use, review overslaan   ⚠️ credits
```

## 🧩 Los draaien (elke fase apart)
```
node agent-lab/generate-testcases.mjs   # alleen testcases genereren (qwen)
npm run review                          # analyse met 1 LLM   (leest agent-lab/testcases.txt)
npm run compare                         # analyse met 2 LLM's parallel + meta-judge
npm run compare:3                       # analyse met 3 LLM's (mistral + llama3 + qwen2.5-coder)
npm run browser                         # 1 Browser Use-run + live-view-URL        ⚠️ credits
```
> Voor `review`/`compare`: plak je testcases eerst in **`agent-lab/testcases.txt`**.

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
