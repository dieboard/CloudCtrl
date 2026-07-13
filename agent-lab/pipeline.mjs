// Volledige testpijplijn voor CloudCtrl.
//
//   Fase 1  genereer testcases        (lokaal qwen)         - gratis, experimenteel
//   Fase 2  review door tweede model  (llama3)              - gratis, experimenteel
//   Fase 3  go/no-go-rapport + log    (naar agent-lab/reports/)
//   Fase 4  [OPTIONEEL] Browser Use   (--browser)           - kost credits, "serieus"
//
// Gebruik:
//   node --env-file=.env agent-lab/pipeline.mjs            # t/m rapport (geen credits)
//   node --env-file=.env agent-lab/pipeline.mjs --browser  # 1-click: alles incl. Browser Use
//   BROWSER_LIMIT=5 node --env-file=.env agent-lab/pipeline.mjs --browser
//
// De filosofie: de eerste fasen draai je vaak en goedkoop; de laatste (echte browser) alleen
// als het rapport groen licht geeft.
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { chat } from "./models.mjs";

const RUN_BROWSER = process.argv.includes("--browser");
const BROWSER_LIMIT = Number(process.env.BROWSER_LIMIT || 3);
const REVIEW_MODEL = process.env.REVIEW_MODEL || "llama3:latest";
const TARGET = process.env.CLOUDCTRL_URL || "https://dieboard.github.io/CloudCtrl/";
const BASE = "https://api.browser-use.com/api/v3";

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const reportPath = `agent-lab/reports/report-${stamp}.md`;
const logPath = `agent-lab/reports/log-${stamp}.txt`;
await mkdir("agent-lab/reports", { recursive: true });

async function log(line) {
  const stampedLine = `[${new Date().toISOString()}] ${line}`;
  console.log(stampedLine);
  await appendFile(logPath, stampedLine + "\n");
}

function parseCases(text) {
  const cases = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*\d+[.)]\s/.test(line)) {
      if (cur) cases.push(cur.trim());
      cur = line;
    } else if (cur != null) {
      cur += "\n" + line;
    }
  }
  if (cur) cases.push(cur.trim());
  return cases.filter((c) => c.length > 0);
}

async function runBrowserTask(task) {
  const KEY = process.env.BROWSER_USE_API_KEY;
  if (!KEY) throw new Error("BROWSER_USE_API_KEY ontbreekt (--env-file=.env?)");
  const headers = { "X-Browser-Use-API-Key": KEY, "Content-Type": "application/json" };
  const start = await fetch(`${BASE}/sessions`, { method: "POST", headers, body: JSON.stringify({ task }) });
  if (!start.ok) throw new Error(`Browser Use start HTTP ${start.status}: ${await start.text()}`);
  const { id } = await start.json();
  const done = ["idle", "stopped", "error", "timed_out"];
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${BASE}/sessions/${id}`, { headers });
    if (!res.ok) continue;
    const d = await res.json();
    if (done.includes(d.status)) {
      return { status: d.status, successful: d.isTaskSuccessful, output: d.output ?? "", liveUrl: d.liveUrl };
    }
  }
  return { status: "timeout", output: "" };
}

// ---- Fase 1: genereren ----
await log(`Fase 1: testcases genereren (lokaal model).`);
const pr = JSON.parse(await readFile("sources/pr-42.json", "utf8"));
const card = JSON.parse(await readFile("sources/scrum-card.json", "utf8"));

const genSystem = `Je bent een ervaren QA-engineer. Genereer testcases als Gherkin (Given/When/Then).
Dek af: grenswaarden (drempel 0 en maximum), de 2x2-combinaties (hoeveelheid ja/nee x kans ja/nee),
een geval 'geen data', en VERPLICHT een case waarin een datapunt EXACT gelijk is aan de drempel
(om te testen of samenvatting en grafiek hetzelfde tonen). Assert invarianten, geen exacte aantallen.
Vermijd bijna-identieke cases: genereer MAXIMAAL 12 cases die elk iets UNIEKS testen. Zorg dat de
verwachte uitkomst logisch klopt (bij drempels 0/0 hoort ALLE neerslag getoond te worden). Geef
ALLEEN genummerde Gherkin-scenario's terug.`;
const genUser = `PULL REQUEST:\n${JSON.stringify(pr, null, 2)}\n\nSCRUMKAART:\n${JSON.stringify(card, null, 2)}`;
const generated = await chat(
  [
    { role: "system", content: genSystem },
    { role: "user", content: genUser },
  ],
  { maxTokens: 2500 }
);
const cases = parseCases(generated);
await log(`Fase 1 klaar: ${cases.length} cases gegenereerd.`);

// ---- Fase 2: review door tweede model ----
await log(`Fase 2: review door ${REVIEW_MODEL}.`);
const revSystem = `Je bent een kritische QA-reviewer. Beoordeel door een ANDER model gegenereerde
Gherkin-testcases voor een neerslagfilter met twee drempels (hoeveelheid mm/u EN kans %). Meld PER
casenummer: logische fouten (let op: bij drempels 0/0 hoort ALLE neerslag getoond te worden),
tegenstrijdigheden en (bijna-)duplicaten. Wees beknopt en concreet.`;
const review = await chat(
  [
    { role: "system", content: revSystem },
    { role: "user", content: generated },
  ],
  { model: REVIEW_MODEL, maxTokens: 1200 }
);
await log(`Fase 2 klaar.`);

// ---- Fase 3: rapport ----
await log(`Fase 3: go/no-go-rapport schrijven -> ${reportPath}`);
let report = `# CloudCtrl Testrapport — ${stamp}

> **Go/no-go voor de tester.** Beoordeel dit rapport en beslis of de cases naar Browser Use mogen.
> Bron: PR #${pr.number} + scrumkaart ${card.id}. Doelwit: ${TARGET}

## 1. Overgebleven testcases (${cases.length})
${cases.map((c) => (/^\s*\d/.test(c) ? c : `- ${c}`)).join("\n")}

## 2. Cases die abnormaal lijken (ter beoordeling)
_Aangedragen door een tweede model (${REVIEW_MODEL}) — een versterker, geen orakel. Lees kritisch._

${review.trim()}

## 3. Overzicht van alle wijzigingen (software onder test)
- **PR #${pr.number}:** ${pr.title}
- ${pr.body}
- **Gewijzigde bestanden:** ${(pr.changedFiles || []).join(", ") || "(onbekend)"}
`;

// ---- Fase 4: optioneel Browser Use ----
if (RUN_BROWSER) {
  await log(`Fase 4: Browser Use-uitvoering van de eerste ${BROWSER_LIMIT} cases (kost credits).`);
  report += `\n---\n\n## Browser Use-uitvoering (eerste ${BROWSER_LIMIT} cases)\n`;
  const subset = cases.slice(0, BROWSER_LIMIT);
  for (let i = 0; i < subset.length; i++) {
    const caseText = subset[i];
    await log(`  case ${i + 1}/${subset.length} naar Browser Use...`);
    const task = `Test het volgende scenario op ${TARGET}.
Begin ALTIJD met: ga naar ${TARGET}, zoek "Rotterdam" via #locationInput + #searchButton en wacht tot #rainChart geladen is.
Gebruik ELEMENT-ID's (niet labeltekst, de UI kan EN/NL zijn): #amountThresholdSlider (0..1), #probThresholdSlider (0..100), #filterToggle, #forecastSummary, #rainChart.
SCENARIO:
${caseText}
Als het scenario niet in de browser uit te voeren is (bv. 'geen data'), meld dat.
Rapporteer beknopt: GESLAAGD / GEFAALD / NIET-UITVOERBAAR + wat je zag.`;
    try {
      const r = await runBrowserTask(task);
      await log(`  case ${i + 1}: status=${r.status} successful=${r.successful}`);
      report += `\n### Case ${i + 1}\n${caseText}\n\n**Status:** ${r.status} · **Geslaagd:** ${r.successful}\n\n**Waarneming:**\n${r.output}\n`;
    } catch (err) {
      await log(`  case ${i + 1}: FOUT ${err.message}`);
      report += `\n### Case ${i + 1}\n${caseText}\n\n**FOUT:** ${err.message}\n`;
    }
  }
} else {
  report += `\n---\n\n_Browser Use niet uitgevoerd. Draai met \`--browser\` om (na go) de eerste ${BROWSER_LIMIT} cases echt in de browser te testen._\n`;
}

await writeFile(reportPath, report);
await log(`Klaar. Rapport: ${reportPath}`);
console.log(`\n===== RAPPORT (${reportPath}) =====\n`);
console.log(report);
