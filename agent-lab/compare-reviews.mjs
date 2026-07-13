// Vergelijk twee (of meer) review-modellen op DEZELFDE testcases.
// Handig om snel nieuwe versies/modellen tegen elkaar te toetsen.
//
//   - Reviewers draaien PARALLEL (genoeg geheugen).
//   - Een neutrale meta-judge bepaalt per reviewer: % raak, goed/fout, kritiek gevangen/gemist,
//     en een EINDOORDEEL dat GEEN optelsom is: wie een kritiek punt mist dat de ander vond, kan
//     niet winnen — ook niet met meer duplicaat-meldingen. Het is geen ruisfilter.
//
// Gebruik:
//   node --env-file=.env agent-lab/compare-reviews.mjs                    # mistral vs llama3
//   REVIEWERS=mistral:latest,llama3:latest,qwen2.5-coder:latest ...
//   JUDGE_MODEL=qwen3-coder:30b ...                                       # andere meta-judge
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chat } from "./models.mjs";

const REVIEWERS = (process.env.REVIEWERS || "mistral:latest,llama3:latest").split(",").map((s) => s.trim());
const JUDGE_MODEL = process.env.JUDGE_MODEL || "qwen3-coder:30b";
const file = process.argv[2] || "agent-lab/testcases.txt";
const cases = await readFile(file, "utf8");

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `agent-lab/reports/compare-${stamp}.md`;
await mkdir("agent-lab/reports", { recursive: true });

const reviewSystem = `Je bent een kritische QA-reviewer. Beoordeel Gherkin-testcases voor een
neerslagfilter met twee drempels (hoeveelheid mm/u EN kans %); een datapunt telt alleen als regen
bij BEIDE. Meld PER casenummer: logische fouten (bij drempels 0/0 hoort ALLE neerslag getoond te
worden), tegenstrijdigheden en (bijna-)duplicaten. Wees beknopt en concreet.`;

console.log(`Reviewers (parallel): ${REVIEWERS.join(", ")}`);
console.time("reviews");
const reviews = await Promise.all(
  REVIEWERS.map((m) =>
    chat([{ role: "system", content: reviewSystem }, { role: "user", content: cases }], { model: m, maxTokens: 1000 })
      .then((text) => ({ model: m, text }))
      .catch((err) => ({ model: m, text: `[FOUT] ${err.message}` }))
  )
);
console.timeEnd("reviews");

const label = (i) => String.fromCharCode(65 + i); // A, B, C...
const judgeSystem = `Je bent een neutrale, strenge meta-reviewer. Meerdere QA-reviewers beoordeelden
DEZELFDE Gherkin-testcases voor een neerslagfilter met twee drempels (hoeveelheid mm/u EN kans %;
een datapunt telt alleen als regen bij BEIDE).

WERKWIJZE:
1. Bepaal ZELF eerst de echte problemen. Onderscheid KRITIEK (logische fouten in de verwachte
   uitkomst — bv. bij drempels 0/0 hoort ALLE neerslag getoond te worden — en ontbrekende kritieke
   dekking) van KLEIN (duplicaten, formulering).
2. Beoordeel per reviewer: geldige bevindingen vs. valse positieven, en welke KRITIEKE problemen hij
   ving of miste.

SCOREREGELS (GEEN optelsom, GEEN ruisfilter):
- Een KRITIEK probleem vangen weegt zwaar; missen weegt zwaar negatief.
- Wie een kritiek probleem MIST dat een ander WEL vond, kan NIET winnen — ook niet met meer
  duplicaat-meldingen.
- Duplicaten/kleine punten zijn slechts tiebreakers. Valse positieven verlagen de score.

Geef EXACT dit formaat, per reviewer een blok, daarna het eindoordeel:

## Reviewer <letter> (<model>)
- Raak: X van Y bevindingen (Z%)
- Kritiek gevangen: <lijst of "geen">
- Kritiek gemist: <lijst of "geen">
- Valse positieven: <aantal + kort>

## Eindoordeel
Winnaar: <letter> — reden op basis van KRITIEKE dekking (niet aantal).`;

const judgeUser =
  `TESTCASES:\n${cases}\n\n` +
  reviews.map((r, i) => `REVIEW ${label(i)} (${r.model}):\n${r.text}`).join("\n\n");

console.log(`\nMeta-judge: ${JUDGE_MODEL} (dit duurt even)...`);
console.time("judge");
const verdict = await chat([{ role: "system", content: judgeSystem }, { role: "user", content: judgeUser }], { model: JUDGE_MODEL, maxTokens: 1500 });
console.timeEnd("judge");

let report = `# Review-vergelijking — ${stamp}

> Twee reviewers op dezelfde testcases, beoordeeld door een neutrale meta-judge (${JUDGE_MODEL}).
> **Let op:** de meta-judge is óók feilbaar — jij blijft de eindbeoordelaar.

## Reviews (ruw)
${reviews.map((r, i) => `### Reviewer ${label(i)} — ${r.model}\n${r.text.trim()}`).join("\n\n")}

## Vergelijking & eindscore
${verdict.trim()}
`;

await writeFile(outPath, report);
console.log("\n" + report);
console.log(`\n📄 Vergelijking: ${pathToFileURL(resolve(outPath)).href}`);
