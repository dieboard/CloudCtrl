---
name: write-e2e-test
description: Schrijf en verifieer deterministische Playwright E2E-tests voor CloudCtrl. Gebruik wanneer een goedgekeurde user story of testcase moet worden omgezet naar uitvoerbare webtests, vooral voor de dubbele-drempel-filter, Emei Shan-mockdata, regressietests, testbewijs of Playwright-rapportage.
---

# Write CloudCtrl E2E test

## Werkwijze

1. Lees de user story, acceptatiecriteria en relevante Gherkin-cases.
2. Gebruik stabiele testdata. Open voor het Emei Shan-regenscenario:
   `/?fixture=emei-shan-rain`.
3. Controleer vóór assertions dat `body[data-weather-source="mock"]` aanwezig is. Stop als live data
   is geladen terwijl een deterministische test is gevraagd.
4. Gebruik stabiele IDs (`#amountThresholdSlider`, `#probThresholdSlider`, `#filterToggle`,
   `#forecastSummary`, `#rainChart`) en geen EN/NL-labeltekst als selector.
5. Bewaar Gherkin als leesbare specificatie en schrijf aparte Playwright-code als uitvoerbare test.
6. Gebruik voor de dubbele drempel de contractregel:
   `amount >= amountThreshold && probability >= probabilityThreshold`.
7. Test minimaal:
   - fixture en locatie zijn geladen;
   - exact-op-de-grens;
   - beide voorwaarden zijn vereist (AND);
   - strengere drempels tonen nooit meer punten;
   - samenvatting en grafiek reageren na sliderwijzigingen consistent.
8. Voer `npm run test:e2e` werkelijk uit. Meld een test niet als klaar zonder groene uitvoering.
9. Bewaar bij falen Playwright trace, screenshot en video. Verwijder geen geldige assertion om een
   test groen te maken.
10. Classificeer een failure als `APP_BUG`, `SLECHTE_TEST`, `TESTDATA` of `AUTOMATION` en geef de
    eerstvolgende actie.

## Ontwerpkeuzes

- Gebruik voor deze enkele pagina helpers in plaats van een volledig Page Object Model.
- Laat Browser Use alleen volgen voor exploratie of expliciete onafhankelijke controle; Playwright
  is het primaire regressievangnet.
- Stel bij onduidelijke verwachtingen eerst een aanpak of verduidelijking voor. Schrijf bij helder
  gedrag direct de test en verifieer hem.

## Bewijs

Lever altijd de testbestanden, de console-uitkomst en de locatie van het HTML-rapport. Noem bij
failures de trace/screenshot-locatie en maak duidelijk of Browser Use nog wel of niet zinvol is.
