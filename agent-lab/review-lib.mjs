// Gedeelde review-logica: gebruikt door compare-reviews.mjs en studio-run.mjs.
import { chat } from "./models.mjs";

export const reviewSystem = `Je bent een kritische QA-reviewer. Beoordeel Gherkin-testcases voor een
neerslagfilter met twee drempels (hoeveelheid mm/u EN kans %); een datapunt telt alleen als regen
bij BEIDE. Meld PER casenummer: logische fouten (bij drempels 0/0 hoort ALLE neerslag getoond te
worden), tegenstrijdigheden en (bijna-)duplicaten. Wees beknopt en concreet.`;

export const judgeSystem = `Je bent een neutrale, strenge meta-reviewer. Meerdere QA-reviewers
beoordeelden DEZELFDE Gherkin-testcases voor een neerslagfilter met twee drempels (hoeveelheid mm/u
EN kans %; een datapunt telt alleen als regen bij BEIDE).

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
