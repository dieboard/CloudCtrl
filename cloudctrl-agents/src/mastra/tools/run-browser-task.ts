import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Browser Use Cloud API v3. Geverifieerd tegen https://docs.browser-use.com/cloud/llms.txt
const BASE = 'https://api.browser-use.com/api/v3';

export const runBrowserTask = createTool({
  id: 'run-browser-task',
  description:
    'Voert een browseropdracht (natuurlijke taal) uit op een echte website via Browser Use Cloud en geeft het waarnemingsresultaat terug.',
  inputSchema: z.object({
    task: z
      .string()
      .describe('De volledige browseropdracht in natuurlijke taal, inclusief start-URL en wat te controleren.'),
  }),
  outputSchema: z.object({
    status: z.string(),
    output: z.string(),
    liveUrl: z.string().optional(),
  }),
  execute: async (inputData) => {
    const key = process.env.BROWSER_USE_API_KEY;
    if (!key) throw new Error('BROWSER_USE_API_KEY ontbreekt in de omgeving (.env van het Mastra-project).');
    const headers = { 'X-Browser-Use-API-Key': key, 'Content-Type': 'application/json' };

    // 1) start de sessie
    const startRes = await fetch(`${BASE}/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ task: inputData.task }), // model weggelaten -> Browser Use gebruikt zijn default
    });
    if (!startRes.ok) throw new Error(`Browser Use start gaf HTTP ${startRes.status}: ${await startRes.text()}`);
    const { id, live_url } = await startRes.json();

    // 2) poll tot terminale status
    const done = ['idle', 'stopped', 'error', 'timed_out'];
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`${BASE}/sessions/${id}`, { headers });
      if (!res.ok) continue;
      const data = await res.json();
      if (done.includes(data.status)) {
        return { status: data.status, output: data.output ?? '', liveUrl: data.live_url ?? live_url };
      }
    }
    return { status: 'timeout', output: 'Taak niet op tijd afgerond (>5 min).', liveUrl: live_url };
  },
});
