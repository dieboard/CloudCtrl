import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Leest een scrumbord-kaart uit sources/scrum-card.json.
export const readScrumCard = createTool({
  id: 'read-scrum-card',
  description: 'Leest een scrumbord-kaart met titel en acceptatiecriteria.',
  inputSchema: z.object({
    id: z.string().describe('Kaart-id, bijvoorbeeld CC-17'),
  }),
  outputSchema: z.object({
    id: z.string(),
    title: z.string(),
    acceptanceCriteria: z.array(z.string()),
  }),
  execute: async () => {
    const path = join(process.cwd(), 'sources', 'scrum-card.json');
    return JSON.parse(await readFile(path, 'utf8'));
  },
});
