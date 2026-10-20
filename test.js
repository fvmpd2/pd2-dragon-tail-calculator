const assert=require('node:assert/strict');
const {calculate,resistance}=require('./engine.js');
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
assert.throws(()=>calculate({flatMin:10,flatMax:2}));
assert.throws(()=>calculate({talon:21}));
assert.throws(()=>calculate({frames:0}));
console.log('Dragon Tail: 23 formula, immunity, strike, race, validation and throughput checks passed.');
