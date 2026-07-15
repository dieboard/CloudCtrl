---
name: cloudctrl-consistency-check
description: Shift-left kwaliteitscheck voor CloudCtrl's dubbele-drempel-filter. Gebruik bij het bekijken of wijzigen van code in index.html die neerslag filtert op drempels (amountThreshold/probThreshold). Controleert of de samenvatting en de grafiek dezelfde vergelijkingsoperator (> vs >=) gebruiken, of het filter écht op BEIDE drempels test, en of de grenswaarden kloppen.
---

# CloudCtrl dubbele-drempel consistentie-check

Een **shift-left** kwaliteitscontrole: kijk tijdens het coderen mee met de dubbele-drempel-feature,
zodat een bug wordt gevangen op het moment dat je 'm typt — niet pas in een testrapport achteraf.

## Wanneer toepassen
Zodra de diff of het bestand logica raakt rond de neerslagfilter-drempels. Herkenbaar aan:
`amountThreshold`, `probThreshold`, `amountThresholdSlider`, `probThresholdSlider`, of vergelijkingen
met `precipitation` / `precipitation_probability` in `index.html`.

## Wat te controleren

1. **Operator-consistentie (`>` vs `>=`).**
   Een datapunt telt als regen bij *hoeveelheid ≥ drempel EN kans ≥ drempel*. Die vergelijking staat
   op twee plekken, en die **moeten dezelfde operator gebruiken**:
   - **Samenvatting** — zoek de `findIndex` op `precipitation` (`nextRainIndex`): gebruikt nu `>`.
   - **Grafiek/filter** — zoek `precipitationData = amounts.map(...)`: gebruikt nu `>=`.
   Verschillen ze, dan tonen samenvatting en grafiek **verschillend gedrag bij een datapunt dat exact
   gelijk is aan de drempel**. → Meld dit als bug.

2. **Beide voorwaarden (AND, niet OR).**
   Controleer dat er echt op BEIDE drempels wordt getest met `&&`, niet per ongeluk `||` of maar één.

3. **Grenswaarden.**
   Drempel 0 hoort *alle* neerslag te tonen; drempel maximum (1.0 mm/u / 100%) (bijna) niets.

## Wat te doen bij een bevinding
- Wijs de twee exacte regels aan (samenvatting vs. grafiek).
- Stel één consistente operator voor en pas **beide** plekken aan.
- Adviseer een testcase op de grens: een datapunt met waarde **exact gelijk** aan de drempel.

## Waarom dit blijft
De regel is taal-onafhankelijk. Neem 'm 1-op-1 mee naar de Kotlin-versie; alleen de bestands- en
functieverwijzingen passen zich aan.
