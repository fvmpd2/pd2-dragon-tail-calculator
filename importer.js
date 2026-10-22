/* Character decoding/stat aggregation: locally vendored PD2 Advanced Stats modules.
   https://github.com/RoofooEvazan/pd2-advanced-stats — see vendor/README.md. */
(function(root){
 'use strict';
 let loading;
 function load(){return loading||(loading=(async()=>{for(const file of ['data.js','save.js','auras.js','stats.js'])await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='vendor/'+file;s.onload=resolve;s.onerror=()=>reject(Error('Could not load character reader. Please reconnect and try again.'));document.head.append(s);});})().catch(e=>{loading=null;throw e;}));}
 function convert(model,swap=false,warnings=[]){
  if(model.cls!==6)throw Error('Choose an Assassin character for Dragon Tail.');
  const E=root.PD2Adv,D=root.ENGINE_DATA,C=E.compute(model,D,{swap}),T=C.T,P=E.panel(C);
  const boots=C.items.find(i=>i.slot==='feet');
  if(!boots||!root.DragonTail.boots[boots.code])throw Error('No supported equipped boot base was found. Select boots manually after checking the character.');
  const weaponLists=C.itemLists.filter(x=>D.items[x.it.code]?.c==='weapon');
  const withoutWeapons=id=>T(id)-weaponLists.reduce((sum,x)=>sum+x.T.sum(id),0);
  const weapons=C.weapons.weapons;
  const first=weapons[0],second=weapons[1];
  const ias=it=>it?E.itemTotals(D,it,model).sum(93):0;
  const wsm=it=>it?D.items[it.code].sp||0:0;
  const skill=C.levels(270);
  if(!skill.lvl)throw Error('This character has no Dragon Tail skill.');
  const values={mode:'stats',boots:boots.code,level:skill.lvl,talon:C.levels(255).blvl,flight:C.levels(275).blvl,
   str:T(0),dex:T(2),mastery:T(329),pierce:Math.abs(T(333)),
   ed:T(25)+withoutWeapons(17),demonEd:T(121),undeadEd:T(122),
   flatMin:withoutWeapons(21),flatMax:withoutWeapons(22),damagePlus:T(111),kickBonus:T(137),
   cs:P.crit.chance,ds:T(141),maxDs:T(210),csBonus:T(256),dsBonus:T(257),
   speedMode:'auto',wsm:wsm(first),weaponIas:ias(first),dual:second?'yes':'no',wsm2:wsm(second),weaponIas2:ias(second),
   gearIas:withoutWeapons(93),bos:0,fana:0,otherSpeed:0,convictionLevel:0,lowerResLevel:0,curseMastery:0,conviction:0,lowerRes:0};
  // Equipped auras are present in the save; manually cast buffs/party auras are not.
  for(const a of C.auraRows||[]){if(a.id===122)values.fana=Math.max(values.fana,a.lvl);if(a.id===123)values.convictionLevel=Math.max(values.convictionLevel,a.lvl);}
  const unknown=model.items.flatMap(i=>(i.stats||[]).filter(s=>s.unknown).map(s=>s.unknown));
  const notes=[...warnings,...(model.warnings||[]),...unknown.map(x=>'Unrecognised item modifier: '+x),
   'Review active Burst of Speed (hard points '+C.levels(258).blvl+'), party/mercenary auras, curses and temporary buffs; these are not assumed active.',
   'Enemy resistance, hit chance and target settings are not character stats. Check these separately.'];
  return {name:model.name||'Assassin',values,notes,gear:C.items.filter(i=>i.loc==='equip').map(i=>i.name||i.code)};
 }
 async function parse(file){
  if(file.size>8*1024*1024)throw Error('Choose a character file smaller than 8 MB.');
  await load();
  if(/\.d2s$/i.test(file.name)){
   const decoded=root.PD2Save.parse(await file.arrayBuffer(),root.SAVE_DATA);
   return convert(root.PD2Adv.fromSave(decoded,root.ENGINE_DATA),!!decoded.header.active_weapon,decoded.warnings||[]);
  }
  let j;try{j=JSON.parse(await file.text());}catch{throw Error('Choose a .d2s save or a PD2 Armory JSON export.');}
  if(j.data?.character)j=j.data;
  if(!j.character||!Array.isArray(j.items))throw Error('JSON must contain a PD2 Armory character and items. Other planner schemas are not supported yet.');
  return convert(root.PD2Adv.fromArmory(j,root.ENGINE_DATA));
 }
 root.TailImport={parse,convert};
})(globalThis);
