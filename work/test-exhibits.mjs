import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
mkdirSync('work/exhibit-test',{recursive:true});
for(const name of ['abstract-exhibits','exhibit-concepts','startups','booth-content']){
 const code=ts.transpileModule(readFileSync(`lib/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 writeFileSync(`work/exhibit-test/${name}.mjs`,code.replace(/(['"])(\.\/[^'"]+)\1/g,'$1$2.mjs$1'));
}
const {createExhibit}=await import('./exhibit-test/abstract-exhibits.mjs');
const {exhibitConcept}=await import('./exhibit-test/exhibit-concepts.mjs');
const {startups}=await import('./exhibit-test/startups.mjs');
const {previewSlides}=await import('./exhibit-test/booth-content.mjs');
globalThis.document={createElement:()=>({width:512,height:256,getContext:()=>({fillRect(){},fillText(){}})})};
const snapshot=g=>{const state=[];g.traverse(o=>{state.push([...o.position,...o.scale,o.rotation.x,o.rotation.y,o.rotation.z,o.visible]);if(o.isInstancedMesh)state.push([...o.instanceMatrix.array]);});return JSON.stringify(state);};
let triangles=0,meshes=0;
for(const s of startups){
 const concept=exhibitConcept(s.id);assert.equal(s.model,concept.kind);assert.equal(s.exhibit,concept.title);
 assert.ok(previewSlides(s)[1].body.includes(concept.action));
 const exhibit=createExhibit(concept.kind,s.color);exhibit.update(1,false,false);const closed=snapshot(exhibit.group);
 exhibit.update(1,true,false);assert.notEqual(snapshot(exhibit.group),closed,`${s.name}: no interaction`);
 exhibit.update(1,false,false);assert.equal(snapshot(exhibit.group),closed,`${s.name}: reset failed`);
 let n=0,tris=0;
 exhibit.group.traverse(o=>{if(!o.isMesh)return;n++;const geo=o.geometry;assert.ok(geo.attributes.position.array.every(Number.isFinite));tris+=(geo.index?geo.index.count:geo.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});
 for(const open of [false,true])for(let t=0;t<8;t+=.25){
  exhibit.update(t,open);exhibit.group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(exhibit.group);
  assert.ok(bounds.min.toArray().every(Number.isFinite)&&bounds.max.toArray().every(Number.isFinite));
  assert.ok(bounds.min.x>-.95&&bounds.max.x<.95&&bounds.min.y>-.65&&bounds.max.y<.95&&bounds.min.z>-.8&&bounds.max.z<.8,`${s.name}: outside pedestal display envelope`);
 }
 assert.ok(n<45&&tris<6500,`${s.name}: geometry budget`);triangles+=tris;meshes+=n;
 console.log(`${s.name}: ${n} meshes, ${tris} triangles; interaction/reset and bounds PASS`);
}
assert.equal(new Set(startups.map(s=>exhibitConcept(s.id).kind)).size,11);
// Refresh only local exhibit metadata, preserving every API profile and original retrieval date.
const path='work/pitchload-current.json',data=JSON.parse(readFileSync(path,'utf8'));
for(const s of data.startups){const concept=exhibitConcept(s.id);s.model=concept.kind;s.exhibit=concept.title;}
writeFileSync(path,JSON.stringify(data,null,2),{mode:0o600});
console.log(`PASS: eleven distinct concepts, ${meshes} meshes / ${triangles} triangles in total; snapshot metadata synchronized.`);
