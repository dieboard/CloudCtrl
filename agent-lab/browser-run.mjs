// Eén gecontroleerde Browser Use Cloud-run tegen de live CloudCtrl-app.
// Draaien:  node --env-file=.env agent-lab/browser-run.mjs
const KEY = process.env.BROWSER_USE_API_KEY;
const TARGET = process.env.CLOUDCTRL_URL || "https://dieboard.github.io/CloudCtrl/";
const BASE = "https://api.browser-use.com/api/v3";

if (!KEY) { console.error("BROWSER_USE_API_KEY ontbreekt (--env-file=.env?)"); process.exit(1); }
const headers = { "X-Browser-Use-API-Key": KEY, "Content-Type": "application/json" };

const task = `Ga naar ${TARGET}
Typ "Rotterdam" in het zoekveld (input met placeholder "Zoek een plaats of adres...") en klik op de knop "Zoek".
Wacht tot de grafiek (een canvas-element) geladen is en controleer dat de geladen locatie "Rotterdam" is.
Zet daarna de schuifbalk "Min. hoeveelheid" op het maximum (1.0 mm/u) en de schuifbalk "Min. kans" op 100%.
Lees de tekst in de samenvatting (het element met id "forecastSummary").
Rapporteer beknopt: (1) welke plaats is geladen, (2) de exacte samenvattingstekst, (3) of er nog balken in de grafiek zichtbaar zijn bij deze strengste instelling.`;

const start = await fetch(`${BASE}/sessions`, { method: "POST", headers, body: JSON.stringify({ task }) });
if (!start.ok) { console.error("START HTTP", start.status, await start.text()); process.exit(1); }
const s = await start.json();
console.log("Sessie gestart. id:", s.id);
console.log("LIVE meekijken:", s.live_url || "(geen live_url geleverd)");

const done = ["idle", "stopped", "error", "timed_out"];
for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  const res = await fetch(`${BASE}/sessions/${s.id}`, { headers });
  if (!res.ok) continue;
  const d = await res.json();
  console.log(`[${(i * 3)}s] status: ${d.status}`);
  if (done.includes(d.status)) {
    console.log("\n===== RESULTAAT =====");
    console.log("status:", d.status);
    console.log("output:\n" + (d.output ?? "(leeg)"));
    process.exit(0);
  }
}
console.log("timeout (>6 min)");
