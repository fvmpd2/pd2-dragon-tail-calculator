'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const S=require('./speed.js'),D=require('./engine.js');
assert.deepEqual(S.reductions(20,20,20),{conviction:50,lowerRes:49});
assert.deepEqual(S.reductions(0,0,20),{conviction:0,lowerRes:0});
assert.equal(S.reductions(100,1,1).conviction,150);
assert.equal(S.reductions(1,1,1).lowerRes,20);
assert.equal(S.calculate({}).frames,16);
assert.equal(S.calculate({bos:20}).skillSpeed,53);
assert.equal(S.calculate({fana:20}).skillSpeed,35);
const dual=S.calculate({wsm:0,weaponIas:40,dual:'yes',wsm2:-30,weaponIas2:20});
assert(dual.useSecond);assert.equal(dual.usedWsm,-30);assert.equal(dual.usedIas,20);
assert.equal(dual.frames,S.calculate({wsm:-30,weaponIas:20}).frames);
let last=Infinity;for(let gearIas=0;gearIas<=600;gearIas++){const r=S.calculate({gearIas});assert(r.frames<=last);last=r.frames;}
assert.throws(()=>S.calculate({gearIas:-1}));
const c={console};c.window=c;c.globalThis=c;vm.createContext(c);
for(const f of ['engine.js','vendor/data.js','vendor/save.js','vendor/auras.js','vendor/stats.js','importer.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),c);
// Independent synthetic character: equipped boots, off-weapon ED, and a weapon with local ED.
const model={name:'Test Assassin',source:'save',cls:6,level:90,skills:{270:20,255:20,275:20,258:5},base:{strength:100,dexterity:200,energy:25,vitality:100,maxhp:500,maxmana:100,maxstamina:100},items:[
 {name:'Boots',code:'uhb',loc:'equip',slot:'feet',stats:[{id:0,param:0,val:20},{id:17,param:0,val:40}]},
 {name:'Weapon',code:'hax',loc:'equip',slot:'rarm',stats:[{id:17,param:0,val:300},{id:93,param:0,val:30}]}
]};
const imported=c.TailImport.convert(model);assert.equal(imported.values.str,120);assert.equal(imported.values.ed,40);assert.equal(imported.values.weaponIas,30);assert.equal(imported.values.gearIas,0);assert.equal(imported.values.bos,0);assert.equal(imported.values.talon,20);assert.equal(imported.values.flatMin,0);assert(D.calculate(imported.values).applied>0);assert(imported.notes.some(x=>x.includes('hard points 5')));
assert.throws(()=>c.PD2Save.parse(new Uint8Array(100),c.SAVE_DATA));
assert.throws(()=>c.TailImport.convert({...model,cls:1}));
console.log('Passed: game-data debuffs, Curse Mastery, speed skills, dual wielding, IAS monotonicity, gear stat import, local weapon ED exclusion, missing buffs, wrong class and malformed saves.');
