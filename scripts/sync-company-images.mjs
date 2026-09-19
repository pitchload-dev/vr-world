import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Bundle public company artwork so WebXR never depends on third-party CORS.
const snapshot = JSON.parse(await readFile('work/pitchload-current.json', 'utf8'));
const manifest = {};
await mkdir('public/media/companies', { recursive: true });
for (const company of snapshot.startups) {
  for (const kind of ['logo', 'hero']) {
    const source = company.profile?.[kind === 'logo' ? 'logoUrl' : 'heroImageUrl'];
    if (!source) continue;
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid company image URL');
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`${company.name} ${kind}: HTTP ${response.status}`);
    const mime = response.headers.get('content-type')?.split(';')[0];
    const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime];
    if (!extension) throw new Error(`${company.name} ${kind}: unsupported image type ${mime}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error('Company image outside size limit');
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    const path = `/media/companies/${company.id}-${kind}-${hash}.${extension}`;
    await writeFile('public' + path, bytes);
    manifest[source] = path;
    console.log(`${company.name}: ${kind} (${Math.round(bytes.length / 1024)} KB)`);
  }
}
await writeFile('lib/company-image-assets.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`${Object.keys(manifest).length} company images bundled.`);
