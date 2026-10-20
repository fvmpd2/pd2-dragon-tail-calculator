/* PD2 Dragon Tail model. See mechanics.md for evidence and scope. */
(function(root){
'use strict';
const trunc=Math.trunc, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const boots={"lbt":{"name":"Leather Boots","min":3,"max":8},"vbt":{"name":"Heavy Boots","min":4,"max":12},"mbt":{"name":"Chain Boots","min":6,"max":14},"tbt":{"name":"Light Plate Boots","min":8,"max":18},"hbt":{"name":"Plate Boots","min":10,"max":20},"xlb":{"name":"Demonhide Boots","min":30,"max":64},"xvb":{"name":"Sharkskin Boots","min":32,"max":72},"xmb":{"name":"Mesh Boots","min":35,"max":78},"xtb":{"name":"Battle Boots","min":42,"max":84},"xhb":{"name":"War Boots","min":45,"max":90},"ulb":{"name":"Wyrmhide Boots","min":75,"max":100},"uvb":{"name":"Scarabshell Boots","min":70,"max":110},"umb":{"name":"Boneweave Boots","min":80,"max":125},"utb":{"name":"Mirrored Boots","min":69,"max":147},"uhb":{"name":"Myrmidon Greaves","min":83,"max":155}};
const defaults={boots:'uhb',bootMin:83,bootMax:155,mode:'stats',level:40,talon:20,flight:20,dex:300,str:200,flatMin:0,flatMax:0,damagePlus:0,kickBonus:0,ed:0,demonEd:0,undeadEd:0,anchor:'beast',mastery:0,manualMin:225,manualMax:300,cs:0,ds:0,maxDs:0,csBonus:0,dsBonus:0,res:50,pierce:0,conviction:0,lowerRes:0,physRes:0,hit:100,block:0,frames:12,targets:1};
function resistance(raw,pierce=0,conviction=0,lowerRes=0){
 const immune=raw>=100;
 let r=raw;
 for(const x of [conviction,lowerRes]) r-=immune?trunc(Math.abs(x)/2):Math.abs(x);
 const broken=r<100;
 if(!broken)return {effective:r,multiplier:0,immune:true};
 r-=Math.abs(pierce);
 // PD2's below-zero reduction penalty, then the -100 floor.
 if(r<0)r=trunc(r/2);
 r=Math.max(-100,r);
 return {effective:r,multiplier:(100-r)/100,immune:false};
}
function calculate(input={}){
 const v={...defaults,...input};
 if(!['custom',...Object.keys(boots)].includes(v.boots))throw Error('Select a valid boot base.');
 if(v.boots!=='custom'){v.bootMin=boots[v.boots].min;v.bootMax=boots[v.boots].max;}
 const n={};for(const [k,x]of Object.entries(v))n[k]=typeof defaults[k]==='number'?Number(x):x;
 for(const [k,x]of Object.entries(n))if(typeof x==='number'&&!Number.isFinite(x))throw Error('Enter a valid number for '+k+'.');
 for(const k of ['bootMin','bootMax','level','talon','flight','dex','str','flatMin','flatMax','damagePlus','kickBonus','manualMin','manualMax','cs','ds','maxDs','frames','targets'])if(n[k]<0)throw Error(k+' cannot be negative.');
 if(n.level<1||n.level>100||n.talon>20||n.flight>20)throw Error('Use skill level 1–100 and hard-point synergies 0–20.');
 if(n.frames<1||n.targets<1)throw Error('Attack frames and target count must be at least 1.');
 if(n.bootMax<n.bootMin)throw Error('Boot maximum must be at least boot minimum.');
 if(n.flatMax<n.flatMin||n.manualMax<n.manualMin)throw Error('Maximum damage must be at least minimum damage.');
 let ed=n.str+n.ed+(n.anchor==='demon'?n.demonEd:n.anchor==='undead'?n.undeadEd:0);
 const skillBonus=40+13*(trunc(n.level)-1)+8*(trunc(n.talon)+trunc(n.flight));
 const firePercent=100+skillBonus+n.mastery;
 if(firePercent<0)throw Error('Combined explosion percentage cannot be negative.');
 let kmin,kmax;
 if(n.mode==='manual'){
  kmin=trunc(n.manualMin*256);kmax=trunc(n.manualMax*256);
 }else{
  // Worn-boot base comes from compiled Armor.bin, not the inconsistent text table.
  const common=2*trunc(n.kickBonus)+trunc(n.damagePlus);
  const lo=trunc(trunc(n.dex)*256/4)+(trunc(n.bootMin)+common+trunc(n.flatMin))*256;
  const hi=trunc(trunc(n.dex)*256/3)+(trunc(n.bootMax)+common+trunc(n.flatMax))*256;
  // Native kick helper clamps the strength + damagepercent sub-total before adding item ED.
  // UI ED is a combined effective bonus: do not emulate separate negative pools here.
  if(ed<=-90)throw Error('For large negative ED penalties use the manual kick mode.');
  kmin=trunc(lo*(100+ed)/100);kmax=trunc(hi*(100+ed)/100);
 }
 const pCS=clamp(n.cs,0,75)/100;
 const pDS=(1-pCS)*clamp(n.ds,0,Math.min(100,75+n.maxDs))/100;
 const pNormal=1-pCS-pDS;
 const cm=(200+n.csBonus)/100,dm=(150+n.dsBonus)/100;
 if(cm<0||dm<0)throw Error('Strike multipliers cannot be negative.');
 const outcomes=[{name:'Normal',p:pNormal,m:1},{name:'Critical Strike',p:pCS,m:cm},{name:'Deadly Strike',p:pDS,m:dm}].map(o=>{
  const min=trunc(trunc(kmin*o.m)*firePercent/100)/256;
  const max=trunc(trunc(kmax*o.m)*firePercent/100)/256;
  return {...o,min,max,avg:(min+max)/2};
 });
 const rf=resistance(n.res,n.pierce,n.conviction,n.lowerRes);
 const raw=outcomes.reduce((a,o)=>a+o.avg*o.p,0);
 const applied=raw*rf.multiplier;
 const attemptFactor=clamp(n.hit,0,100)/100*(1-clamp(n.block,0,100)/100);
 const attempts=25/n.frames;
 const physicalBase=(kmin+kmax)/512;
 const strikeMean=pNormal+pCS*cm+pDS*dm;
 return {input:n,ed,skillBonus,firePercent,kmin:kmin/256,kmax:kmax/256,physicalBase,strikeMean,outcomes,raw,applied,resistance:rf,attemptFactor,perAttempt:applied*attemptFactor,dps:applied*attemptFactor*attempts,pack:applied*n.targets,physicalEstimate:physicalBase*strikeMean*Math.max(0,(100-n.physRes)/100),comparisons:undefined};
}
const api={boots,defaults,resistance,calculate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DragonTail=api;
})(typeof globalThis!=='undefined'?globalThis:this);
