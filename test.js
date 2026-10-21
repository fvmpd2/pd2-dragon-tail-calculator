const assert=require('node:assert/strict');
const {calculate:calc,resistance,boots}=require('./engine.js');
const calculate=(v={})=>calc({boots:'custom',bootMin:0,bootMax:0,...v});
const near=(a,b,t=.02)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
// Hand-calculated example: dex300 =>75–100, str200 =>225–300;
// level40 +40 hard synergies =>867% bonus, 967% total =>2175.75–2901.
let a=calculate({level:40,dex:300,str:200,res:0});
near(a.kmin,225);near(a.kmax,300);assert.equal(a.firePercent,967);
near(a.outcomes[0].min,2175.75);near(a.outcomes[0].max,2901);
// Adding mastery is additive to 967, not a second x1.5 multiplier.
let b=calculate({mastery:50,res:0});near(b.raw/a.raw,1017/967);
// Physical resistance of anchor does not enter the explosion basis.
near(calculate({physRes:100}).raw,calculate({physRes:0}).raw);
// Race ED is selected by the kicked anchor, and scales every target's burst.
near(calculate({demonEd:300,anchor:'demon'}).raw/calculate({demonEd:300,anchor:'beast'}).raw,2);
// Strike chances are exclusive; CS has priority and its 75% cap.
a=calculate({cs:100,ds:100});near(a.outcomes[1].p,.75);near(a.outcomes[2].p,.1875);near(a.outcomes[0].p,.0625);
near(calculate({ds:100,maxDs:25}).outcomes[2].p,1);
// Immunity can't be pierced by ordinary -res alone.
assert.equal(resistance(110,200).multiplier,0);
assert.equal(resistance(110,0,25).effective,98);
assert.equal(resistance(50,100).effective,-25);
assert.equal(resistance(0,500).effective,-100);
// Lower life doesn't diminish the burst; there is no target-life input.
// One common burst roll, not a separate crit roll per enemy.
a=calculate({targets:8});near(a.pack,8*a.applied);
// Manual source supports external validated gear calculations.
a=calculate({mode:'manual',manualMin:1000,manualMax:1000,level:1,talon:0,flight:0,res:0});near(a.raw,1400);
// Failure / cadence only affect an explicit attempted-attack throughput estimate.
a=calculate({hit:50,block:20,frames:10});near(a.perAttempt,.4*a.applied);near(a.dps,a.applied);
// Flat bonuses are independent; a minimum-only bonus is valid.
const seed=calc({res:0});
for(const [min,max] of [[10,0],[0,10],[10,2],[10,20]]){
 const v=calc({flatMin:min,flatMax:max,res:0});
 near(v.kmin,seed.kmin+min*3);near(v.kmax,seed.kmax+max*3);
 assert(Number.isFinite(v.applied));assert(v.raw>=seed.raw);
}
// Even a minimum bonus larger than the base range stays valid.
const crossed=calc({flatMin:1000,flatMax:0,res:0});near(crossed.kmax,crossed.kmin);
assert.throws(()=>calc({flatMin:-1}));
assert.throws(()=>calc({mode:'manual',manualMin:500,manualMax:100}));
assert.doesNotThrow(()=>calc({mode:'stats',manualMin:500,manualMax:100,flatMin:10}));
assert.throws(()=>calculate({talon:21}));
assert.throws(()=>calculate({frames:0}));
// Independently check the compiled Myrmidon range and its contribution before ED.
assert.deepEqual(boots.uhb,{name:'Myrmidon Greaves',min:83,max:155});
a=calc({boots:'uhb',dex:300,str:200});near(a.kmin,474);near(a.kmax,765);
near(a.outcomes[0].min,4583.58);near(a.outcomes[0].max,7397.55);
assert.equal(Object.keys(boots).length,15);
assert.throws(()=>calc({boots:'custom',bootMin:5,bootMax:1}));
assert.throws(()=>calc({boots:'unknown'}));
// Preset ignores stale editable values; a custom range is honored.
near(calc({boots:'uhb',bootMin:0,bootMax:0}).kmin,474);
near(calc({boots:'custom',bootMin:10,bootMax:20}).kmin,255);
console.log('Dragon Tail formula, compiled boots, preset/custom, immunity and validation checks passed.');

