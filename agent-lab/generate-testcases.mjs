// Mini "testplan-agent" zonder framework: leest de bronnen en laat het model testcases genereren.
// Bewijst dat qwen3-coder:30b (lokaal) de taak aankan, met dezelfde switch als straks in Mastra.
//
// Draaien:
//   node agent-lab/generate-testcases.mjs                        (default = ollama/qwen)
//   MODEL_PROVIDER=openai node --env-file=.env agent-lab/generate-testcases.mjs
import { readFile } from "node:fs/promises";
import { chat, getModel } from "./models.mjs";

const pr = JSON.parse(await readFile("sources/pr-42.json", "utf8"));
const card = JSON.parse(await readFile("sources/scrum-card.json", "utf8"));

const system = `Je bent een ervaren QA-engineer. Genereer testcases als Gherkin-scenario's (Given/When/Then).
Dek expliciet af: grenswaarden (drempel = 0, drempel = maximum, en een waarde PRECIES op de grens),
de 2x2-combinaties (hoeveelheid gehaald ja/nee x kans gehaald ja/nee), en het geval 'geen data'.
Assert waar mogelijk invarianten (bv. 'strengere drempel toont nooit meer regen'), niet exacte aantallen.
Geef ALLEEN de Gherkin-scenario's terug, geen extra uitleg.`;

const user = `PULL REQUEST:
${JSON.stringify(pr, null, 2)}

SCRUMKAART:
${JSON.stringify(card, null, 2)}

Genereer de testcases voor deze dubbele-drempel-feature.`;

const { provider, model } = getModel();
console.log(`\n>>> Provider: ${provider}  |  Model: ${model}\n`);
console.time("generatietijd");
const out = await chat([
  { role: "system", content: system },
  { role: "user", content: user },
]);
console.timeEnd("generatietijd");
console.log("\n===== GEGENEREERDE TESTCASES =====\n");
console.log(out);
