// CloudCtrl testpijplijn met los te kiezen fasen.
//
//   Fase 1 (--gen)      genereer testcases      (lokaal qwen)   gratis
//   Fase 2 (--review)   review door 2e model    (llama3)        gratis   -> vereist Fase 1 (cases)
//   Fase 4 (--browser)  voer uit op Browser Use (cloud)         credits  -> vereist Fase 1 (cases)
//   Fase 3 (rapport)    wordt ALTIJD gemaakt/getoond als er cases zijn.
//
// Geen vlaggen = --gen --review (de gratis go/no-go). Met vlaggen draai je exact die fasen.
// Cases worden bewaard in agent-lab/reports/state/cases.txt, zodat je Fase 2 of 4 later los kunt
// draaien op een eerder gegenereerde set.
//
// Voorbeelden:
//   node --env-file=.env agent-lab/pipeline.mjs                    # 1+2 (+rapport)
//   node --env-file=.env agent-lab/pipeline.mjs --gen --review --browser   # 1+2+4 (+rapport)
//   node --env-file=.env agent-lab/pipeline.mjs --gen --browser    # 1+4 (+rapport)  -> "1 en 4"
//   node --env-file=.env agent-lab/pipeline.mjs --review           # 2 op eerdere cases
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { chat, chatStream } from "./models.mjs";

// ---- fasekeuze ----
const args = process.argv.slice(2);
let doGen = args.includes("--gen");
let doReview = args.includes("--review");
let doBrowser = args.includes("--browser");
if (!doGen && !doReview && !doBrowser) { doGen = true; doReview = true; } // default: gratis go/no-go

const BROWSER_LIMIT = Number(process.env.BROWSER_LIMIT || 3);
const REVIEW_MODEL = process.env.REVIEW_MODEL || "llama3:latest";
const TARGET = process.env.CLOUDCTRL_URL || "https://dieboard.github.io/CloudCtrl/";
const BASE = "https://api.browser-use.com/api/v3";

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const REPORT_DIR = "agent-lab/reports";
const STATE_DIR = `${REPORT_DIR}/state`;
const CASES_FILE = `${STATE_DIR}/cases.txt`;
const reportPath = `${REPORT_DIR}/report-${stamp}.md`;
const logPath = `${REPORT_DIR}/log-${stamp}.txt`;
await mkdir(STATE_DIR, { recursive: true });

async function log(line) {
  const l = `[${new Date().toISOString()}] ${line}`;
  console.log(l);
  await appendFile(logPath, l + "\n");
}
function banner(t) { console.log(`\n─── ${t} ───`); }

function parseCases(text) {
  const out = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*\d+[.)]\s/.test(line)) { if (cur) out.push(cur.trim()); cur = line; }
    else if (cur != null) cur += "\n" + line;
  }
  if (cur) out.push(cur.trim());
  return out.filter((c) => c.length > 0);
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
    if (done.includes(d.status)) return { status: d.status, successful: d.isTaskSuccessful, output: d.output ?? "", liveUrl: d.liveUrl };
  }
  return { status: "timeout", output: "" };
}

await log(`Start. Fasen: ${[doGen && "gen", doReview && "review", doBrowser && "browser"].filter(Boolean).join(", ")} (+rapport).`);

// ---- Fase 1: genereren (of eerdere cases laden) ----
let generated = "";
if (doGen) {
  banner("FASE 1 · genereren (live)");
  await log("Fase 1: testcases genereren (lokaal model).");
  const pr = JSON.parse(await readFile("sources/pr-42.json", "utf8"));
  const card = JSON.parse(await readFile("sources/scrum-card.json", "utf8"));
  const genSystem = `Je bent een ervaren QA-engineer. Genereer testcases als Gherkin (Given/When/Then).
Dek af: grenswaarden (drempel 0 en maximum), de 2x2-combinaties (hoeveelheid ja/nee x kans ja/nee),
een geval 'geen data', en VERPLICHT een case waarin een datapunt EXACT gelijk is aan de drempel.
Assert invarianten, geen exacte aantallen. Genereer MAXIMAAL 12 UNIEKE cases; zorg dat de verwachte
uitkomst logisch klopt (bij drempels 0/0 hoort ALLE neerslag getoond te worden). Geef ALLEEN
genummerde Gherkin-scenario's terug.`;
  const genUser = `PULL REQUEST:\n${JSON.stringify(pr, null, 2)}\n\nSCRUMKAART:\n${JSON.stringify(card, null, 2)}`;
  generated = await chatStream([{ role: "system", content: genSystem }, { role: "user", content: genUser }], { maxTokens: 2500 });
  console.log("");
  await writeFile(CASES_FILE, generated);
  await appendFile(logPath, "\n[cases]\n" + generated + "\n");
} else if (doReview || doBrowser) {
  try {
    generated = await readFile(CASES_FILE, "utf8");
    await log(`Eerdere cases geladen uit ${CASES_FILE}.`);
  } catch {
    console.error(`\n[STOP] Fase 2/4 vereist Fase 1: er zijn geen cases. Draai eerst met --gen.`);
    process.exit(1);
  }
}
const pr = JSON.parse(await readFile("sources/pr-42.json", "utf8"));
const cases = parseCases(generated);

// ---- Fase 2: review (streaming) ----
let review = null;
if (doReview) {
  banner(`FASE 2 · review door ${REVIEW_MODEL} (live)`);
  await log(`Fase 2: review door ${REVIEW_MODEL}.`);
  const revSystem = `Je bent een kritische QA-reviewer. Beoordeel door een ANDER model gegenereerde
Gherkin-testcases voor een neerslagfilter met twee drempels (hoeveelheid mm/u EN kans %). Meld PER
casenummer: logische fouten (bij drempels 0/0 hoort ALLE neerslag getoond te worden),
tegenstrijdigheden en (bijna-)duplicaten. Wees beknopt en concreet.`;
  review = await chatStream([{ role: "system", content: revSystem }, { role: "user", content: generated }], { model: REVIEW_MODEL, maxTokens: 1200 });
  console.log("");
}

// ---- Fase 4: Browser Use ----
let browserResults = [];
if (doBrowser) {
  banner(`FASE 4 · Browser Use — eerste ${BROWSER_LIMIT} cases (kost credits)`);
  await log(`Fase 4: Browser Use-uitvoering van de eerste ${BROWSER_LIMIT} cases.`);
  for (const [i, caseText] of cases.slice(0, BROWSER_LIMIT).entries()) {
    await log(`  case ${i + 1} naar Browser Use...`);
    const task = `Test het volgende scenario op ${TARGET}.
Begin ALTIJD met: ga naar ${TARGET}, zoek "Rotterdam" via #locationInput + #searchButton en wacht tot #rainChart geladen is.
Gebruik ELEMENT-ID's (niet labeltekst, UI kan EN/NL zijn): #amountThresholdSlider (0..1), #probThresholdSlider (0..100), #filterToggle, #forecastSummary, #rainChart.
SCENARIO:
${caseText}
Als het scenario niet in de browser uit te voeren is (bv. 'geen data'), meld dat.
Rapporteer beknopt: GESLAAGD / GEFAALD / NIET-UITVOERBAAR + wat je zag.`;
    try {
      const r = await runBrowserTask(task);
      await log(`  case ${i + 1}: status=${r.status} successful=${r.successful}`);
      browserResults.push({ i: i + 1, caseText, ...r });
    } catch (err) {
      await log(`  case ${i + 1}: FOUT ${err.message}`);
      browserResults.push({ i: i + 1, caseText, status: "fout", output: err.message });
    }
  }
}

// ---- Fase 3: rapport (altijd, als er cases zijn) ----
if (cases.length === 0) {
  console.error("\n[STOP] Geen cases -> geen rapport mogelijk.");
  process.exit(1);
}
banner("RAPPORT");
let report = `# CloudCtrl Testrapport — ${stamp}

> **Go/no-go voor de tester.** Beoordeel dit rapport en beslis of de cases naar Browser Use mogen.
> Bron: PR #${pr.number} + scrumkaart. Doelwit: ${TARGET}
> Gedraaide fasen: ${[doGen && "genereren", doReview && "review", doBrowser && "browser"].filter(Boolean).join(", ")}.

## 1. Overgebleven testcases (${cases.length})
${cases.join("\n")}

## 2. Cases die abnormaal lijken (ter beoordeling)
${review ? `_Aangedragen door ${REVIEW_MODEL} — een versterker, geen orakel. Lees kritisch._\n\n${review.trim()}` : "_Fase 2 (review) niet uitgevoerd._"}

## 3. Overzicht van alle wijzigingen (software onder test)
- **PR #${pr.number}:** ${pr.title}
- ${pr.body}
- **Gewijzigde bestanden:** ${(pr.changedFiles || []).join(", ") || "(onbekend)"}
`;
if (doBrowser) {
  report += `\n---\n\n## Browser Use-uitvoering (${browserResults.length} cases)\n`;
  for (const r of browserResults) {
    report += `\n### Case ${r.i}\n${r.caseText}\n\n**Status:** ${r.status} · **Geslaagd:** ${r.successful ?? "-"}\n\n**Waarneming:**\n${r.output || "(leeg)"}\n`;
  }
} else {
  report += `\n---\n\n_Browser Use niet uitgevoerd. Draai met \`--browser\` om (na go) de eerste ${BROWSER_LIMIT} cases echt te testen._\n`;
}

await writeFile(reportPath, report);
await log(`Klaar. Rapport: ${reportPath}`);
console.log("\n" + report);
