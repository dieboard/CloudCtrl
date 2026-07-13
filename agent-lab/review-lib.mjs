// Gedeelde review-logica: gebruikt door compare-reviews.mjs en studio-run.mjs.
import { chat } from "./models.mjs";

export const reviewSystem = `Je bent een kritische QA-reviewer. Beoordeel Gherkin-testcases voor een
neerslagfilter met twee drempels (hoeveelheid mm/u EN kans %); een datapunt telt alleen als regen
bij BEIDE. Meld PER casenummer: logische fouten (bij drempels 0/0 hoort ALLE neerslag getoond te
worden), tegenstrijdigheden en (bijna-)duplicaten. Wees beknopt en concreet.`;

export const judgeSystem = `Je bent een neutrale, strenge meta-reviewer. Meerdere QA-reviewers
beoordeelden dezelfde Gherkin-testcases voor een neerslagfilter met twee drempels (hoeveelheid mm/u
en kans %; een datapunt telt alleen als regen bij beide).

Werkwijze:
1. Bepaal zelf eerst de echte problemen. Onderscheid kritieke problemen (logische fouten in de
   verwachte uitkomst — bv. bij drempels 0/0 hoort alle neerslag getoond te worden — en ontbrekende
   kritieke dekking) van kleine punten (duplicaten, formulering).
2. Beoordeel per reviewer: geldige bevindingen vs. valse positieven, en welke kritieke problemen hij
   ving of miste.

Scoreregels (geen optelsom, geen ruisfilter):
- Een kritiek probleem vangen weegt zwaar; het missen ervan weegt zwaar negatief.
- Wie een kritiek probleem mist dat een ander wél vond, kan niet winnen — ook niet met meer
  duplicaat-meldingen.
- Duplicaten en kleine punten zijn slechts tiebreakers. Valse positieven verlagen de score.

Schrijfstijl: schrijf in gewone zinnen; gebruik geen woorden in HOOFDLETTERS voor nadruk.

Geef exact dit formaat, per reviewer een blok, daarna het eindoordeel:

## Reviewer <letter> (<model>)
- Raak: X van Y bevindingen (Z%)
- Kritiek gevangen: <lijst of "geen">
- Kritiek gemist: <lijst of "geen">
- Valse positieven: <aantal + kort>

## Eindoordeel
Winnaar: <letter>. Leg in een paar gewone zinnen uit waarom, met verwijzing naar de concrete
kritieke punten die elke reviewer ving of miste — zodat het oordeel logisch volgt uit de blokken
hierboven (dus niet losstaand "op basis van kritieke dekking").`;

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
