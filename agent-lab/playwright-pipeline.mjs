import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const reportsDir = resolve(root, 'agent-lab/reports');
const fixture = process.env.TEST_FIXTURE || 'emei-shan-rain';
const includeBrowserUse = process.argv.includes('--browser');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

await mkdir(reportsDir, { recursive: true });

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} stopte met exitcode ${code}`)));
  });
}

console.log(`\n=== DEEL 1/2 · testcaseanalyse (${fixture}) ===\n`);
const analysisArgs = ['--env-file=.env', 'agent-lab/pipeline.mjs', `--fixture=${fixture}`];
if (includeBrowserUse) analysisArgs.push('--browser');
await run(process.execPath, analysisArgs);

const agentReports = (await readdir(reportsDir))
  .filter((name) => name.startsWith('report-') && name.endsWith('.md'))
  .sort();
const agentReport = agentReports.at(-1);

console.log('\n=== DEEL 2/2 · Playwright E2E ===\n');
let playwrightExit = 0;
try {
  const playwrightCli = resolve(root, 'node_modules/@playwright/test/cli.js');
  await run(process.execPath, [playwrightCli, 'test']);
} catch (error) {
  playwrightExit = 1;
  console.error(`\nPlaywright rapporteerde failures: ${error.message}`);
}

let summary = { total: 0, passed: 0, failed: 0, skipped: 0, failures: [] };
try {
  const json = JSON.parse(await readFile(resolve(root, 'test-results/results.json'), 'utf8'));
  const visit = (suite) => {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        summary.total++;
        const result = test.results?.at(-1);
        if (result?.status === 'passed') summary.passed++;
        else if (result?.status === 'skipped') summary.skipped++;
        else {
          summary.failed++;
          summary.failures.push({ title: spec.title, error: result?.error?.message || 'Onbekende fout' });
        }
      }
    }
    for (const child of suite.suites || []) visit(child);
  };
  for (const suite of json.suites || []) visit(suite);
} catch (error) {
  summary.failures.push({ title: 'Rapportparser', error: error.message });
}

const combinedPath = resolve(reportsDir, `playwright-pipeline-${stamp}.md`);
const failureText = summary.failures.length
  ? summary.failures.map((failure) => `- **${failure.title}:** ${failure.error.split('\n')[0]}`).join('\n')
  : '_Geen failures._';
const regressionDecision = playwrightExit === 0 && summary.failed === 0 ? 'GO' : 'NO-GO';

const report = `# CloudCtrl analyse + Playwright — ${stamp}

## Eindbesluit

**Playwright-regressie: ${regressionDecision}.** ${summary.passed}/${summary.total} tests geslaagd, ${summary.failed} gefaald, ${summary.skipped} overgeslagen.

**Nieuwe LLM-kandidaten: menselijke beoordeling vereist.** De analyse genereert voorstellen; alleen
tests die via de go/no-go en \`$write-e2e-test\` zijn vastgelegd, tellen mee in het regressiebesluit.

## Analyse

- Fixture: \`${fixture}\`
- Browser Use: ${includeBrowserUse ? 'uitgevoerd (kost credits)' : 'overgeslagen'}
- Agentrapport: ${agentReport ? `[${agentReport}](./${agentReport})` : '(niet gevonden)'}

## Playwright

- HTML-rapport: [open Playwright report](${pathToFileURL(resolve(root, 'playwright-report/index.html')).href})
- JSON-resultaten: \`test-results/results.json\`
- Bewijs bij failures: \`test-results/artifacts/\` (trace, screenshot en video)

### Failures

${failureText}

## Vervolg

${regressionDecision === 'GO'
  ? 'De vaste regressietests zijn groen. Browser Use is alleen nog nodig voor expliciete exploratie of een onafhankelijke second opinion.'
  : 'Classificeer iedere failure als APP_BUG, SLECHTE_TEST, TESTDATA of AUTOMATION. Ga pas naar Browser Use als de lokale regressietest betrouwbaar is.'}
`;

await writeFile(combinedPath, report);
console.log(`\n${report}`);
console.log(`\n📄 Gecombineerd rapport: ${pathToFileURL(combinedPath).href}`);

process.exitCode = playwrightExit;
