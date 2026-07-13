import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { readPullRequest } from '../tools/read-pr';
import { readScrumCard } from '../tools/read-scrum-card';
import { localModel } from '../model';

export const testplanAgent = new Agent({
  id: 'testplan-agent',
  name: 'Testplan Agent',
  instructions: `Je bent een ervaren QA-engineer. Je genereert testcases voor een feature op basis van
een pull request en een scrumbord-kaart.

WERKWIJZE:
1. Lees de PR met de tool 'read-pull-request'.
2. Lees de scrumkaart met de tool 'read-scrum-card'.
3. Leid uit beide de acceptatiecriteria en de bedoelde werking af.

EISEN AAN DE TESTCASES:
- Dek expliciet de GRENSWAARDEN af: drempel = 0, drempel = maximum, en een waarde PRECIES op de grens.
- Dek de 2x2-combinaties af: hoeveelheid gehaald ja/nee x kans gehaald ja/nee.
- Denk aan een lege of afgelopen voorspelling (geen data).
- Let op de consistentie tussen de samenvatting en de grafiek (mogelijke > vs >= randgevallen).
- Formuleer elke case platform-NEUTRAAL in Gherkin (Given/When/Then), los van de implementatie.
- Assert waar mogelijk INVARIANTEN (bv. 'strengere drempel toont nooit meer regen'), niet exacte
  aantallen — de app gebruikt live weerdata.

UITVOER: een genummerde lijst Gherkin-scenario's, niets anders.`,
  model: localModel,
  tools: { readPullRequest, readScrumCard },
  memory: new Memory(),
});
