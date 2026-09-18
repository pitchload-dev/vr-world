import { build } from 'esbuild';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// The key stays on this machine; only normalized company data is exported.
let key = process.env.PITCHLOAD_API_KEY;
if (!key) {
  const vars = await readFile('.dev.vars', 'utf8').catch(() => '');
  key = vars.match(/^PITCHLOAD_API_KEY=(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '');
}
if (!key) throw new Error('Configure PITCHLOAD_API_KEY or the ignored .dev.vars file.');
await mkdir('work/pitchload-import', { recursive: true });
const modulePath = resolve('work/pitchload-import/refresh.mjs');
await build({ entryPoints: ['lib/pitchload.ts'], outfile: modulePath, bundle: true, platform: 'node', format: 'esm', target: 'node22' });
const { loadPitchload } = await import(pathToFileURL(modulePath));
const failures = [];
const content = await loadPitchload(key, undefined, async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) failures.push(`${new URL(url).pathname}: ${response.status}`);
  return response;
});
if (content.source === 'preview' || failures.length) {
  throw new Error('Refresh incomplete; previous snapshot preserved. ' + failures.join(', '));
}
const previous = JSON.parse(await readFile('work/pitchload-current.json', 'utf8'));
for (const startup of content.startups) {
  // Preserve all existing demo content for companies outside the playlist.
  if (startup.contentSource !== 'pitchload') {
    const existing = previous.startups.find(s => s.id === startup.id);
    if (existing && existing.contentSource !== 'pitchload') Object.assign(startup, existing);
  }
}
const temporary = 'work/pitchload-current.json.tmp';
await writeFile(temporary, JSON.stringify(content, null, 2) + '\n', { mode: 0o600 });
await rename(temporary, 'work/pitchload-current.json');
console.log(JSON.stringify({ updatedAt: content.updatedAt, companies: content.startups.map(s => ({ name: s.name, source: s.contentSource || 'preview', stage: s.profile?.stage, industry: s.profile?.industry, jobs: s.jobs.length })) }, null, 2));
