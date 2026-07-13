// Volledige gratis flow via de ECHTE Mastra Testplan Agent (verschijnt in Studio Traces):
//   1. Zorg dat Studio draait — start 'm anders in een NIEUW venster en wacht tot hij klaar is.
//   2. Roep de Testplan Agent aan via de API -> testcases (qwen).
//   3. Review parallel door mistral + llama3.
//   4. Meta-judge (qwen) -> vergelijking + kritiek-eerst eindscore.
//   5. Rapport + links (Browser Use zit hier NIET in — dat is de credit-stap, apart).
//
//   node --env-file=.env agent-lab/studio-run.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runReviews, judge, label } from "./review-lib.mjs";

const STUDIO = process.env.STUDIO_URL || "http://localhost:4111";
// LET OP: gebruik NIET 'PROMPT' als env-naam — dat is een gereserveerde Windows-variabele ($P$G).
const PROMPT = process.env.TESTPLAN_PROMPT || "Genereer testcases voor PR 42 en scrumkaart CC-17";
const REVIEWERS = (process.env.REVIEWERS || "mistral:latest,llama3:latest").split(",").map((s) => s.trim());
const JUDGE_MODEL = process.env.JUDGE_MODEL || "qwen3-coder:30b";

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `agent-lab/reports/studio-run-${stamp}.md`;
await mkdir("agent-lab/reports", { recursive: true });

const studioUp = async () => {
  try { return (await fetch(`${STUDIO}/api/agents`)).ok; } catch { return false; }
};

// 1. Zorg dat Studio draait
if (await studioUp()) {
  console.log("✓ Mastra Studio draait al.");
} else {
  console.log("Studio draait niet — ik start 'm in een nieuw venster...");
  spawn("cmd", ["/c", "start", "Mastra Studio", "cmd", "/k", "npm run dev"], { cwd: process.cwd(), stdio: "ignore" });
  process.stdout.write("Wachten tot Studio klaar is");
  let ok = false;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    process.stdout.write(".");
    if (await studioUp()) { ok = true; break; }
  }
  if (!ok) { console.error("\nStudio kwam niet op. Start handmatig: npm run dev"); process.exit(1); }
  console.log(" ✓");
}

// 2. Echte Testplan Agent via de API (verschijnt in Studio Traces)
const callAgent = (id) =>
  fetch(`${STUDIO}/api/agents/${id}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: PROMPT }] }),
  });

console.log(`\n▶ Testplan Agent aanroepen (qwen, kan even duren): "${PROMPT}"`);
console.time("agent");
let r = await callAgent("testplanAgent");
if (r.status === 404) r = await callAgent("testplan-agent");
if (!r.ok) { console.error(`Agent HTTP ${r.status}: ${await r.text()}`); process.exit(1); }
const cases = (await r.json()).text ?? "";
console.timeEnd("agent");
console.log("\n─── Testcases (van de Mastra-agent) ───\n" + cases);

// 3. Reviews parallel
console.log(`\n▶ Reviews parallel: ${REVIEWERS.join(", ")}`);
console.time("reviews");
const reviews = await runReviews(cases, REVIEWERS);
console.timeEnd("reviews");

// 4. Meta-judge
console.log(`\n▶ Meta-judge: ${JUDGE_MODEL} (even geduld)`);
console.time("judge");
const verdict = await judge(cases, reviews, JUDGE_MODEL);
console.timeEnd("judge");

// 5. Rapport
const report = `# Studio-run rapport — ${stamp}

> Volledige flow via de echte Mastra Testplan Agent. Bekijk de agent-run visueel in Studio Traces.

## 1. Testcases (van de Mastra Testplan Agent)
${cases}

## 2. Reviews (parallel)
${reviews.map((r2, i) => `### Reviewer ${label(i)} — ${r2.model}\n${r2.text.trim()}`).join("\n\n")}

## 3. Eindbeoordeling
${verdict.trim()}
`;
await writeFile(outPath, report);
console.log("\n" + report);
console.log(`\n📄 Rapport: ${pathToFileURL(resolve(outPath)).href}`);
console.log(`🔎 Bekijk de agent-run in Studio Traces: ${STUDIO}/observability`);
