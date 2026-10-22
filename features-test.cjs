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
for(const f of ['engine.js','vendor/data.js','vendor/save.js','vendor/auras.js','vendor/stats.js','vendor/hireling.js','importer.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),c);
// Independent synthetic character: equipped boots, off-weapon ED, and a weapon with local ED.
const model={name:'Test Assassin',source:'save',cls:6,level:90,skills:{270:20,255:20,275:20,258:5},base:{strength:100,dexterity:200,energy:25,vitality:100,maxhp:500,maxmana:100,maxstamina:100},items:[
 {name:'Boots',code:'uhb',loc:'equip',slot:'feet',stats:[{id:0,param:0,val:20},{id:17,param:0,val:40}]},
 {name:'Weapon',code:'hax',loc:'equip',slot:'rarm',stats:[{id:17,param:0,val:300},{id:93,param:0,val:30}]}
]};
const imported=c.TailImport.convert(model);assert.equal(imported.values.str,120);assert.equal(imported.values.ed,40);assert.equal(imported.values.weaponIas,30);assert.equal(imported.values.gearIas,0);assert.equal(imported.values.bos,5);assert.equal(imported.values.talon,20);assert.equal(imported.values.flatMin,0);assert(D.calculate(imported.values).applied>0);assert(imported.notes.some(x=>x.includes('5 hard points')));
const auraItem=(id,lvl,runeword=false)=>({name:'Test aura item',code:'hax',loc:'equip',slot:'rarm',stats:runeword?[]:[{id:151,param:id,val:lvl}],runewordStats:runeword?[{id:151,param:id,val:lvl}]:[]});
const withMerc=merc=>c.TailImport.convert({...model,merc});
const conviction=withMerc({level:90,type:36,items:[auraItem(123,12,true)]});assert.equal(conviction.values.convictionLevel,12);assert.equal(conviction.values.ed,40);assert.equal(conviction.values.pierce,0);
const fana=withMerc({level:90,type:36,items:[auraItem(122,15)]});assert.equal(fana.values.fana,15);assert(fana.values.ed>40);assert(S.calculate(fana.values).frames<=S.calculate(imported.values).frames);
const stacked=withMerc({level:90,type:36,items:[auraItem(122,7),auraItem(122,8)]});assert.equal(stacked.values.fana,15);assert.equal(stacked.values.ed,fana.values.ed);
const dead=withMerc({level:90,type:36,dead:true,items:[auraItem(122,15)]});assert.equal(dead.values.fana,0);assert.equal(dead.values.ed,40);assert(dead.notes.some(x=>x.includes('dead')));
const nativeType=c.TailHirelings.find(h=>h.skills.some(s=>s.id===98)).Id;
const native=withMerc({level:90,type:nativeType,items:[]});assert(native.values.ed>40);assert(native.notes.some(x=>x.includes('Might')));
const nativeExp=90*90*91*c.TailHirelings.find(h=>h.Id===nativeType).ExpLvl;
const inferred=withMerc({experience:nativeExp,type:nativeType,items:[]});assert.equal(inferred.values.ed,native.values.ed);
// A stronger mercenary aura replaces the same player's aura rather than adding a second copy.
const ownFana={...model,items:[...model.items,auraItem(122,10)]};
const replaced=c.TailImport.convert({...ownFana,merc:{level:90,type:36,items:[auraItem(122,15)]}});assert.equal(replaced.values.fana,15);assert.equal(replaced.values.ed,fana.values.ed);
assert.throws(()=>c.PD2Save.parse(new Uint8Array(100),c.SAVE_DATA));
assert.throws(()=>c.TailImport.convert({...model,cls:1}));
console.log('Passed: game-data debuffs, Curse Mastery, speed skills, dual wielding, IAS monotonicity, gear stat import, local weapon ED exclusion, missing buffs, wrong class and malformed saves.');
