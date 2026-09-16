import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const out = resolve('work/panel-test'); mkdirSync(out, { recursive: true });
for (const name of ['booth-panels', 'booth-content']) {
 const code = ts.transpileModule(readFileSync(`lib/${name}.ts`, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
 writeFileSync(`${out}/${name}.mjs`, code.replaceAll("'./booth-content'", "'./booth-content.mjs'"));
}
const { drawCompanyBoard, panelText, companyFacts, profileParagraphs } = await import(pathToFileURL(`${out}/booth-panels.mjs`));
const data = JSON.parse(readFileSync('work/pitchload-current.json', 'utf8'));
let text = [];
const ctx = { font:'20px Arial', fillRect(){}, measureText(value) { return { width: value.length * parseFloat(this.font) * .56 }; }, fillText(value,x,y) { text.push({value,x,y,width:this.measureText(value).width}); } };
for (const company of data.startups) for (let page=0;page<3;page++) {
 text=[]; drawCompanyBoard(ctx,company,page);
 for (const row of text) {
   assert.ok(row.x>=0 && row.x+row.width<=1024.01,`${company.name}: horizontal text overflow`);
   assert.ok(row.y>0 && row.y<=648,`${company.name}: vertical text overflow`);
 }
 assert.ok(text.some(row=>row.value===companyFacts(company)[0].value));
}
text=[];
const result=panelText(ctx,'W'.repeat(800),20,50,230,34,3);
assert.equal(result.length,3);
assert.ok(result[2].endsWith('…'));
assert.ok(text.every(row=>row.width<=230));
assert.deepEqual(companyFacts({...data.startups[0],foundingYear:undefined,employees:0,jobs:[]}).map(x=>x.value),['—','—','0']);
assert.equal(profileParagraphs({description:'First paragraph.\n\n\nSecond paragraph.'}).length,2);
console.log('PASS: all 33 board layouts, long-token clipping, missing facts, real zero job counts, and complete profile paragraphs.');
