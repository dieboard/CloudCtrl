# cloudctrl.feature - platform-neutrale testspec voor de dubbele-drempel-feature.
# Herbruikbaar voor de web-app (browser-agent) EN later voor de Kotlin-app (Maestro / Compose UI-test).

Feature: Dubbele-drempel neerslagfilter

  Background:
    Given de CloudCtrl web-app is geopend
    And ik heb een plaats gezocht zodat er een voorspelling geladen is

  Scenario: Beide drempels op nul toont alle neerslag
    When ik hoeveelheid op 0 en kans op 0 zet in Filter Modus
    Then wordt er geen enkel datapunt weggefilterd

  Scenario: Strengste instelling filtert (bijna) alles weg
    When ik hoeveelheid op 1.0 en kans op 100 zet in Filter Modus
    Then toont de grafiek hooguit extreme neerslag
    And meldt de samenvatting doorgaans droog weer

  Scenario Outline: 2x2 - datapunt telt alleen als regen bij beide drempels
    Given een datapunt met hoeveelheid <amount> mm/u en kans <prob> %
    And drempels hoeveelheid 0.5 en kans 50
    Then telt het datapunt als regen: <telt>

    Examples:
      | amount | prob | telt |
      | 0.8    | 70   | ja   |
      | 0.8    | 30   | nee  |
      | 0.2    | 70   | nee  |
      | 0.2    | 30   | nee  |

  Scenario: Monotonie - strengere drempel toont nooit meer regen (invariant)
    Given een gefilterde grafiek bij hoeveelheid 0.2 en kans 40
    When ik de hoeveelheid verhoog naar 0.6
    Then is het aantal getoonde balken gelijk of lager

  Scenario: Grenswaarde - samenvatting en grafiek moeten consistent zijn
    Given een datapunt met hoeveelheid precies gelijk aan de drempel
    When ik de samenvatting en de grafiek vergelijk
    Then tonen beide hetzelfde resultaat
    # Bekende bug: samenvatting gebruikt > (index.html:323), grafiek gebruikt >= (index.html:409)

  Scenario: Geen data - afgelopen voorspelling
    Given een voorspelling die volledig in het verleden ligt
    When de pagina de samenvatting berekent
    Then toont de app een nette melding zonder te crashen
