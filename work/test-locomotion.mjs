import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
const code=ts.transpileModule(readFileSync('lib/xr-locomotion.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
writeFileSync('work/xr-locomotion.mjs',code);
const {joystickStep,slideOnFloor,thumbstick}=await import('./xr-locomotion.mjs');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
for (const yaw of [0, Math.PI/2, Math.PI, -Math.PI/2, 0.62]) {
  for(const [x,y] of [[0,-1],[0,1],[1,0],[-1,0]]) {
    const expected=new THREE.Vector3(x,0,y).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).multiplyScalar(1.8/90);
    const step=joystickStep(x,y,yaw,1/90);
    close(step.x,expected.x);close(step.z,expected.z);
  }
  for (const pitch of [-1.45,0,1.45]) {
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
    const actualYaw=new THREE.Euler().setFromQuaternion(q,'YXZ').y;
    const step=joystickStep(0,-1,actualYaw,1/90);
    const flat=joystickStep(0,-1,yaw,1/90);
    close(step.x,flat.x);close(step.z,flat.z);
  }
}
assert.deepEqual(joystickStep(.08,.08,0,1/90),{x:0,z:0});
for (const hz of [60,72,90,120]) {
  const step=joystickStep(0,-1,0,1/hz);
  close(-step.z*hz,1.8);
  const diagonal=joystickStep(1,-1,0,1/hz);
  close(Math.hypot(diagonal.x,diagonal.z),Math.hypot(step.x,step.z));
}
assert.ok(Math.abs(joystickStep(0,-.4,0,.01).z)<Math.abs(joystickStep(0,-1,0,.01).z));
close(Math.abs(joystickStep(0,-1,0,10).z),.09);
assert.deepEqual(thumbstick(null),{x:0,y:0});
assert.deepEqual(thumbstick({axes:[1,-1,0,0]}),{x:0,y:0});
assert.deepEqual(thumbstick({axes:[0,0,1,-1]}),{x:1,y:-1});
assert.deepEqual(thumbstick({axes:[0,0,NaN,Infinity]}),{x:0,y:0});
const next=slideOnFloor({x:.95,z:0},{x:.09,z:-.09},p=>p.x<1);
assert.ok(next.x<1);close(next.z,-.09);
const blocked=slideOnFloor({x:0,z:0},{x:.09,z:-.09},()=>false);
assert.deepEqual(blocked,{x:0,z:0});
const room=slideOnFloor({x:17.49,z:22.99},{x:.09,z:.09},p=>Math.abs(p.x)<17.5&&p.z<23);
assert.ok(room.x<17.5&&room.z<23);
console.log('PASS: four directions across five headings, pitch independence, frame-rate independence, diagonal speed, analog speed, deadzone, axis mapping/disconnect, wall sliding and bounds.');
