import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mapProfile, safeLink } from '../lib/pitchload';
import { startups, type Startup } from '../lib/startups';
import { profileGroups, drawProfileFacts, unavailable } from '../lib/profile-fields';
import { profileReaderPages } from '../lib/profile-reader';
import { investmentDisplay } from '../lib/booth-content';

const mapped = mapProfile(startups[0], {
  name: 'Example', handle: 'example', startup: {
    stage: 'Seed', gtmModel: 'B2B', productType: 'Hardware', industry: 'Chemicals',
    legalForm: 'GmbH', incorporated: false, femaleFounders: false, firstTimeFounders: true,
    seekingInvestment: true, investmentSize: 0, businessReadinessLevel: 'Revenue validated',
    productReadinessLevel: 'Working Prototype', technologyReadinessLevel: 'Technology validated in relevant environment',
  },
}, []);
const fields = new Map(profileGroups(mapped).flatMap(g => g.fields.map(f => [f.label, f.value] as const)));
for (const [label, expected] of Object.entries({
  Stage: 'Seed', 'Go to Market Model': 'B2B', 'Product Type': 'Hardware', Industry: 'Chemicals',
  'Legal form': 'GmbH', Incorporated: 'No', 'Female founders': 'No', 'First-time founders': 'Yes',
  'Seeking investment': 'Yes', 'Investment size': '0', 'Business Readiness Level': 'Revenue validated',
  'Product Readiness Level': 'Working Prototype', 'Technology Readiness Level': 'Technology validated in relevant environment',
})) assert.equal(fields.get(label), expected, label);
assert.equal(investmentDisplay(mapped).amount, '0');
const empty = mapProfile(startups[0], { name: 'Example', handle: 'example', startup: { incorporated: null, investmentSize: null } }, []);
assert.equal(profileGroups(empty)[1].fields.find(f => f.label === 'Incorporated')?.value, unavailable);
assert.equal(investmentDisplay(empty).amount, 'Not disclosed');
assert.equal(investmentDisplay({ ...mapped, profile: { ...mapped.profile, seekingInvestment: false, investmentSize: 5000 } }).amount, '—');
assert.equal(safeLink('javascript:alert(1)'), undefined);

const snapshot = JSON.parse(readFileSync('work/pitchload-current.json', 'utf8'));
const previous = JSON.parse(execFileSync('git', ['show', 'HEAD:work/pitchload-current.json'], { encoding: 'utf8' }));
assert.equal(snapshot.startups.length, 11);
assert.equal(snapshot.startups.filter((s: Startup) => s.contentSource === 'pitchload').length, 7);
for (const id of [6, 8, 9, 10]) {
  assert.deepEqual(snapshot.startups.find((s: Startup) => s.id === id), previous.startups.find((s: Startup) => s.id === id));
}
for (const startup of [...snapshot.startups, mapped]) {
  const pages = profileReaderPages(startup, t => t.length * 17);
  const actual = pages.flatMap(p => p.rows.filter(r => !r.label).map(r => r.text)).join('').replace(/\s/g, '');
  const expected = profileGroups(startup).flatMap(g => g.fields.map(f => f.value)).join('').replace(/\s/g, '');
  assert.equal(actual, expected, `${startup.name}: VR reader dropped data`);
  for (const page of pages) {
    assert.ok(page.rows.length <= 12);
    for (const row of page.rows) assert.ok(row.text.length * 17 <= 1080);
  }
  const canvas = {
    font: '30px Arial', fillStyle: '', fillRect() {},
    measureText(t: string) { return { width: t.length * parseFloat(this.font) * 0.56 }; },
    fillText(t: string, x: number, y: number) { assert.ok(x >= 0 && x + this.measureText(t).width <= 1024 && y > 0 && y <= 1037, `${startup.name}: board overflow`); },
  };
  drawProfileFacts(canvas as unknown as CanvasRenderingContext2D, startup);
}
console.log('PASS: all 13 API details displayed; false/zero/null handling; funding provenance; unchanged fallback booths; complete VR pagination; facts boards fit.');
