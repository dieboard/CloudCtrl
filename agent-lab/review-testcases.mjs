// Analyse met 1 LLM: laat één model je testcases nakijken (streamt live).
// Leest agent-lab/testcases.txt (of een pad als argument).
//
//   npm run review                                # default reviewer: llama3
//   REVIEW_MODEL=mistral:latest npm run review    # ander model
//   node agent-lab/review-testcases.mjs mijn-cases.txt
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chatStream } from "./models.mjs";
import { reviewSystem } from "./review-lib.mjs";

const model = process.env.REVIEW_MODEL || "llama3:latest";
const file = process.argv[2] || "agent-lab/testcases.txt";
let cases;
try {
  cases = await readFile(file, "utf8");
} catch (error) {
  if (error.code === "ENOENT" && file === "agent-lab/run/testcases.txt") {
    console.error("\n[FOUT] Resultaat van fase 1 ontbreekt. Voer eerst `npm run phase:1` uit.\n");
    process.exit(1);
  }
  throw error;
}

console.log(`\n>>> Reviewer: ${model}  |  Bron: ${file}\n`);
console.time("review");
try {
  const review = await chatStream([{ role: "system", content: reviewSystem }, { role: "user", content: cases }], { model, maxTokens: 1200 });
  console.log("");
  console.timeEnd("review");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const reportPath = `agent-lab/reports/review-${stamp}.md`;
  await mkdir("agent-lab/reports", { recursive: true });
  await writeFile(reportPath, `# Review — ${stamp}\n\n- Reviewer: \`${model}\`\n- Bron: \`${file}\`\n\n${review.trim()}\n`);
  console.log(`📄 Reviewrapport: ${pathToFileURL(resolve(reportPath)).href}`);
} catch (err) {
  console.error(`\n[FOUT] ${err.message}`);
  process.exit(1);
}
