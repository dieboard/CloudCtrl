// Analyse met 1 LLM: laat één model je testcases nakijken (streamt live).
// Leest agent-lab/testcases.txt (of een pad als argument).
//
//   npm run review                                # default reviewer: llama3
//   REVIEW_MODEL=mistral:latest npm run review    # ander model
//   node agent-lab/review-testcases.mjs mijn-cases.txt
import { readFile } from "node:fs/promises";
import { chatStream } from "./models.mjs";
import { reviewSystem } from "./review-lib.mjs";

const model = process.env.REVIEW_MODEL || "llama3:latest";
const file = process.argv[2] || "agent-lab/testcases.txt";
const cases = await readFile(file, "utf8");

console.log(`\n>>> Reviewer: ${model}  |  Bron: ${file}\n`);
console.time("review");
try {
  await chatStream([{ role: "system", content: reviewSystem }, { role: "user", content: cases }], { model, maxTokens: 1200 });
  console.log("");
  console.timeEnd("review");
} catch (err) {
  console.error(`\n[FOUT] ${err.message}`);
  process.exit(1);
}
