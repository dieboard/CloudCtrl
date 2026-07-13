// Optionele cross-check (LLM-as-a-judge): laat een ANDER model je gegenereerde testcases nakijken.
// Een andere familie (llama3 i.p.v. qwen) heeft andere blinde vlekken en vangt fouten die de
// generator zelf mist. Het is een VERSTERKER, geen vervanger van je eigen QA-oordeel.
//
// Gebruik:
//   1. Plak je Studio-output in agent-lab/testcases.txt
//   2. node agent-lab/review-testcases.mjs                       (default reviewer: llama3:latest)
//      REVIEW_MODEL=mistral:latest node agent-lab/review-testcases.mjs   (ander model)
import { readFile } from "node:fs/promises";
import { chat } from "./models.mjs";

const reviewer = process.env.REVIEW_MODEL || "llama3:latest";
const file = process.argv[2] || "agent-lab/testcases.txt";
const cases = await readFile(file, "utf8");

const system = `Je bent een kritische, ervaren QA-reviewer. Je krijgt door een ANDER AI-model
gegenereerde testcases (Gherkin) voor een neerslagfilter met twee drempels: een minimale hoeveelheid
(mm/u) EN een minimale kans (%). Een datapunt telt alleen als regen als het aan BEIDE voldoet.

Beoordeel de cases kritisch en meld PER casenummer:
- logische fouten (let op: bij drempels 0/0 hoort ALLE neerslag getoond te worden, niet niets);
- onderlinge tegenstrijdigheden tussen cases;
- (bijna-)dubbele cases;
- ontbrekende dekking (grenswaarden, 2x2-combinaties, geen-data, exact-op-de-grens).

Wees concreet en beknopt. Sluit af met een korte eindconclusie.`;

console.log(`\n>>> Reviewer: ${reviewer}  |  Bron: ${file}\n`);
console.time("review");
try {
  const out = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: cases },
    ],
    { model: reviewer, maxTokens: 1200 }
  );
  console.timeEnd("review");
  console.log("\n===== REVIEW =====\n");
  console.log(out);
} catch (err) {
  console.timeEnd("review");
  console.error(`\n[FOUT] ${err.message}`);
  process.exit(1);
}
