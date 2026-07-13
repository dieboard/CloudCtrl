import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { runBrowserTask } from '../tools/run-browser-task';
import { localModel } from '../model';

const TARGET_URL = process.env.CLOUDCTRL_URL || 'https://dieboard.github.io/CloudCtrl/';

export const browserAgent = new Agent({
  id: 'browser-agent',
  name: 'Browser Agent',
  instructions: `Je voert EEN testcase uit op de CloudCtrl web-app via de tool 'run-browser-task'.

DOELWIT (start-URL): ${TARGET_URL}

SELECTORS (noem deze in je browseropdracht zodat de browser-agent de juiste elementen vindt):
- Zoekveld: #locationInput  (placeholder "Zoek een plaats of adres...")
- Zoekknop: #searchButton
- Min. hoeveelheid-slider: #amountThresholdSlider  (0..1, stap 0.05)
- Min. kans-slider: #probThresholdSlider  (0..100, stap 5)
- Filter/overlay-toggle: #filterToggle  (aangevinkt = Filter Modus, sliders zichtbaar)
- Grafiek: #rainChart  (canvas)
- Samenvatting (tekst): #forecastSummary

WERKWIJZE:
1. Vertaal de gegeven testcase naar EEN concrete browseropdracht.
2. Laat de opdracht ALTIJD beginnen met: ga naar het DOELWIT, zoek een plaats (bv. Rotterdam) via
   #locationInput + #searchButton, wacht tot de grafiek geladen is, en verifieer dat de juiste
   plaats geladen is voordat je verder gaat.
3. Zet daarna de sliders (#amountThresholdSlider, #probThresholdSlider) en/of #filterToggle zoals de
   testcase vereist, en lees #forecastSummary + of er balken in #rainChart staan.
4. Assert INVARIANTEN (bv. "strengere drempel toont nooit meer regen"), geen exacte aantallen — de
   app gebruikt live weerdata.
5. Roep 'run-browser-task' aan met die volledige opdracht.
6. Geef daarna een kort oordeel terug: GESLAAGD / GEFAALD / ONDUIDELIJK, plus wat je waarnam en
   (indien geleverd) de live_url om mee te kijken.`,
  model: localModel,
  tools: { runBrowserTask },
  memory: new Memory(),
});
