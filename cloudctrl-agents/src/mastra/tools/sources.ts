import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';

// Vindt een bestand in een 'sources/'-map door omhoog te lopen vanaf de werkmap.
// Robuust ongeacht waar Mastra de dev-server draait: de cwd is bij `mastra dev`
// bijvoorbeeld src/mastra/public/, niet de projectroot.
export async function loadSource<T = any>(filename: string): Promise<T> {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, 'sources', filename);
    try {
      await access(candidate);
      return JSON.parse(await readFile(candidate, 'utf8')) as T;
    } catch {
      // niet in deze map — een niveau omhoog
    }
    const parent = dirname(dir);
    if (parent === dir) break; // bij de root aangekomen
    dir = parent;
  }
  throw new Error(`Kon '${filename}' niet vinden in een 'sources/'-map (gezocht vanaf ${process.cwd()})`);
}
