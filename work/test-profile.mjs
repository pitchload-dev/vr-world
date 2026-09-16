import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const out = resolve('work/profile-test'); mkdirSync(out, {recursive:true});
for (const name of ['profile-reader','profile-fields','booth-panels','booth-content','startups']) {
  const code=ts.transpileModule(readFileSync(`lib/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  writeFileSync(`${out}/${name}.mjs`,code.replace(/(['"])(\.\/[^'"]+)\1/g,'$1$2.mjs$1'));
}
const {profileReaderPages}=await import(pathToFileURL(`${out}/profile-reader.mjs`));
const {drawProfileFacts,profileGroups,fullProfile,unavailable}=await import(pathToFileURL(`${out}/profile-fields.mjs`));
const data=JSON.parse(readFileSync('work/pitchload-current.json','utf8'));
let drawn=[];
const c={font:'30px Arial',fillRect(){},measureText(s){return {width:s.length*parseFloat(this.font)*0.56};},fillText(text,x,y){drawn.push({text,x,y,width:this.measureText(text).width});}};
for (const startup of data.startups) {
  drawn=[];drawProfileFacts(c,startup);
  assert.ok(drawn.some(r=>r.text==='Technology Readiness Level'));
  for (const r of drawn) assert.ok(r.x>=0 && r.x+r.width<=1024 && r.y>0 && r.y<=1037,`${startup.name}: board overflow`);
  const pages=profileReaderPages(startup,s=>s.length*17);
  const actual=pages.flatMap(p=>p.rows.filter(r=>!r.label).map(r=>r.text)).join('').replace(/\s/g,'');
  const expected=profileGroups(startup).flatMap(g=>g.fields.map(f=>f.value)).join('').replace(/\s/g,'');
  assert.equal(actual,expected,`${startup.name}: lost profile text`);
  for (const page of pages) { assert.ok(page.rows.length<=12);for(const row of page.rows)assert.ok(row.text.length*17<=1080); }
}
const kcm=data.startups[7];
assert.equal(fullProfile(kcm).founders,3);
assert.equal(fullProfile(kcm).stage,'Pre-Seed');
assert.equal(fullProfile(kcm).technologyReadinessLevel,undefined);
assert.equal(fullProfile(data.startups[5]).founders,undefined);
const stress={...kcm,profile:{employees:0,description:'First paragraph.\n\n'+ 'Long full description. '.repeat(600)+'FINAL_SENTENCE',website:'https://example.com/'+'x'.repeat(1000)}};
assert.equal(profileGroups(stress)[1].fields.find(f=>f.label==='Employees').value,'0');
const pages=profileReaderPages(stress,s=>s.length*17);
assert.ok(pages.flatMap(p=>p.rows).some(r=>r.text.includes('FINAL_SENTENCE')));
const actual=pages.flatMap(p=>p.rows.filter(r=>!r.label).map(r=>r.text)).join('').replace(/\s/g,'');
assert.equal(actual,profileGroups(stress).flatMap(g=>g.fields.map(f=>f.value)).join('').replace(/\s/g,''));
assert.ok(profileGroups(kcm)[0].fields.find(f=>f.label==='Technology Readiness Level').value===unavailable);
assert.doesNotMatch(readFileSync('lib/hall.ts','utf8'),/VideoTexture|createElement\('video'\)/);
assert.match(readFileSync('app/page.tsx','utf8'),/<video/);
console.log('PASS: 11 facts boards fit; all profile text survives VR pagination; long URLs and descriptions; KCM-only supplied values; unknown TRL; video only in profile.');
