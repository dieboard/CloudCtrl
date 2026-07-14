// Vergelijk twee (of meer) review-modellen op DEZELFDE testcases.
// Reviewers draaien parallel; een neutrale meta-judge scoort kritiek-eerst (geen optelsom).
//
//   node --env-file=.env agent-lab/compare-reviews.mjs
//   REVIEWERS=mistral:latest,qwen2.5-coder:latest JUDGE_MODEL=llama3:latest node ... compare-reviews.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runReviews, judge, label } from "./review-lib.mjs";

// Config kan via flags (werkt overal, ook Windows cmd) of via env-vars.
const argv = process.argv.slice(2);
const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const REVIEWERS = (flag("reviewers") || process.env.REVIEWERS || "mistral:latest,deepseek-coder-v2:16b").split(",").map((s) => s.trim());
const JUDGE_MODEL = flag("judge") || process.env.JUDGE_MODEL || "qwen3-coder:30b";
const file = argv.find((a) => !a.startsWith("--")) || "agent-lab/testcases.txt";
const cases = await readFile(file, "utf8");

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `agent-lab/reports/compare-${stamp}.md`;
await mkdir("agent-lab/reports", { recursive: true });

console.log(`Reviewers (parallel): ${REVIEWERS.join(", ")}`);
console.time("reviews");
const reviews = await runReviews(cases, REVIEWERS);
console.timeEnd("reviews");

console.log(`\nMeta-judge: ${JUDGE_MODEL} (dit duurt even)...`);
console.time("judge");
const verdict = await judge(cases, reviews, JUDGE_MODEL);
console.timeEnd("judge");

const report = `# Review-vergelijking — ${stamp}

> Reviewers op dezelfde testcases, beoordeeld door een neutrale meta-judge (${JUDGE_MODEL}).
> **Let op:** de meta-judge is óók feilbaar — jij blijft de eindbeoordelaar.

## Reviews (ruw)
${reviews.map((r, i) => `### Reviewer ${label(i)} — ${r.model}\n${r.text.trim()}`).join("\n\n")}

## Eindbeoordeling
${verdict.trim()}
`;
await writeFile(outPath, report);
console.log("\n" + report);
console.log(`\n📄 Vergelijking: ${pathToFileURL(resolve(outPath)).href}`);
