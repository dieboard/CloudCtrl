import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { loadSource } from './sources';

// Leest een pull request uit sources/pr-<number>.json.
// (In het echt zou dit de GitHub API aanroepen; voor de workshop lezen we een lokaal bestand.)
export const readPullRequest = createTool({
  id: 'read-pull-request',
  description: 'Leest de titel, beschrijving en gewijzigde bestanden van een pull request.',
  inputSchema: z.object({
    number: z.number().describe('Het PR-nummer, bijvoorbeeld 42'),
  }),
  outputSchema: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string(),
    changedFiles: z.array(z.string()),
  }),
  execute: async (inputData) => {
    const pr = await loadSource<any>(`pr-${inputData.number}.json`);
    return {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      changedFiles: pr.changedFiles ?? [],
    };
  },
});
