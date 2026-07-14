// Gedeelde review-logica: gebruikt door compare-reviews.mjs en studio-run.mjs.
import { chat } from "./models.mjs";

export const reviewSystem = `Je bent een kritische QA-reviewer. Beoordeel Gherkin-testcases voor een
neerslagfilter met twee drempels (hoeveelheid mm/u EN kans %); een datapunt telt alleen als regen
bij BEIDE. Meld PER casenummer: logische fouten (bij drempels 0/0 hoort ALLE neerslag getoond te
worden), tegenstrijdigheden en (bijna-)duplicaten. Wees beknopt en concreet.`;

export const judgeSystem = `Je bent een strenge eindbeoordelaar. Je krijgt Gherkin-testcases voor
een neerslagfilter met twee drempels (hoeveelheid mm/u en kans %; een datapunt telt alleen als regen
bij beide), plus reviews van meerdere modellen.

Gebruik die reviews als signaal, maar vorm je EIGEN definitieve oordeel over de testcases. Negeer
reviewer-beweringen die niet kloppen; voeg problemen toe die zij misten. Onderscheid kritieke
problemen (logische fouten in de verwachte uitkomst — bv. bij drempels 0/0 hoort alle neerslag
getoond te worden) van kleine punten (duplicaten, formulering).

Schrijf in gewone zinnen, geen woorden in hoofdletters voor nadruk. Geef exact dit formaat:

**Synthese — de echte problemen (jouw eigen herevaluatie)**
- Kritieke problemen: <genummerde lijst met casenr + wat er mis is, of "geen">
- Kleine punten: <kort, of "geen">
- Advies: <go of no-go voor de tester + 1-2 zinnen waarom>

**De reviewers (ter info)**
Per reviewer één regel: <letter> (<model>) — kort wat hij goed ving en wat hij miste of onterecht flagde.`;

export const label = (i) => String.fromCharCode(65 + i); // A, B, C...

export async function runReviews(cases, reviewers) {
  return Promise.all(
    reviewers.map((m) =>
      chat([{ role: "system", content: reviewSystem }, { role: "user", content: cases }], { model: m, maxTokens: 1000 })
        .then((text) => ({ model: m, text }))
        .catch((err) => ({ model: m, text: `[FOUT] ${err.message}` }))
    )
  );
}

export async function judge(cases, reviews, judgeModel) {
  const judgeUser =
    `TESTCASES:\n${cases}\n\n` + reviews.map((r, i) => `REVIEW ${label(i)} (${r.model}):\n${r.text}`).join("\n\n");
  return chat([{ role: "system", content: judgeSystem }, { role: "user", content: judgeUser }], { model: judgeModel, maxTokens: 1500 });
}

// Fase 4 — triage: gegeven wat de ECHTE app deed, is een afwijking een echte bug of een slechte test?
export const triageSystem = `Je bent een QA-triage-assistent voor CloudCtrl (neerslagfilter met twee
drempels: hoeveelheid mm/u EN kans %; een datapunt telt als regen bij beide). Een testcase is
uitgevoerd op de ECHTE app. Bepaal of een eventuele afwijking waarschijnlijk een ECHTE APP-BUG is,
of een SLECHTE TESTCASE (verkeerde verwachting, flaky assert op live weerdata, of niet uitvoerbaar).

Bekend écht probleem: de samenvatting gebruikt \`>\` en de grafiek \`>=\` → bij een datapunt exact
gelijk aan de drempel tonen ze verschillend. Dat is een echte bug (testcase die dat vangt = goed).

Antwoord in exact 3 regels, gewone zinnen:
Classificatie: ECHTE BUG | SLECHTE TEST | ONDUIDELIJK
Reden: <1 zin>
Actie: <app fixen/loggen> OF <testcase herbouwen: hoe>`;

export async function triage(caseText, observation, model) {
  const user = `TESTCASE:\n${caseText}\n\nWAARNEMING OP DE ECHTE APP:\n${observation}`;
  return chat([{ role: "system", content: triageSystem }, { role: "user", content: user }], { model, maxTokens: 300 });
}
