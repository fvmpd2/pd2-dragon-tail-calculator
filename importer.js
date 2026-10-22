/* Character decoding/stat aggregation: locally vendored PD2 Advanced Stats modules.
   https://github.com/RoofooEvazan/pd2-advanced-stats — see vendor/README.md. */
(function(root){
 'use strict';
 let loading;
 function load(){return loading||(loading=(async()=>{for(const file of ['data.js','save.js','auras.js','stats.js','hireling.js'])await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='vendor/'+file;s.onload=resolve;s.onerror=()=>reject(Error('Could not load character reader. Please reconnect and try again.'));document.head.append(s);});})().catch(e=>{loading=null;throw e;}));}
 function mercAuras(model,D){
  const m=model.merc,notes=[],byId=new Map();
  if(!m)return {auras:[],notes};
  if(m.dead){notes.push('Mercenary is dead: its auras were not applied.');return {auras:[],notes};}
  const E=root.PD2Adv,type=Number(m.type?.id??m.type),rows=(root.TailHirelings||[]).filter(h=>h.Id===type);
  const rowAt=level=>{let r=rows[0];for(const h of rows)if(h.Level<=level)r=h;return r;};
  let level=Number(m.level)||0;
  if(!level&&m.experience>0&&rows.length){level=1;while(level<98){const r=rowAt(level);if(m.experience<(level+1)*(level+1)*(level+2)*r.ExpLvl)break;level++;}}
  // Do not guess a native aura's level from the player's level.
  if(!level)notes.push('Mercenary level is missing: native mercenary auras could not be inferred. Item auras were still read.');
  const mercModel={...model,level:level||model.level};
  const totals=(m.items||[]).map(it=>({it,T:E.itemTotals(D,it,mercModel)}));
  const add=(id,lvl,src)=>{if(!D.skills[id]?.aura||lvl<=0)return;const prev=byId.get(id);if(!prev||prev.lvl<lvl)byId.set(id,{id,lvl,src});};
  const allSkills=totals.reduce((n,x)=>n+x.T.sum(127),0),h=level&&rowAt(level);
  for(const s of h?.skills||[])if(s.mode===1&&level>=s.reqlevel){const base=Math.min(32,s.level+((s.lvlperlvl*(level-h.Level))>>5));if(base>0)add(s.id,base+allSkills,'mercenary skill');}
  // Multiple equipped copies of an aura add levels on the same mercenary.
  const equipped=new Map();
  for(const {it,T}of totals)T.each((id,param,v)=>{if(id===151&&v>0){const a=equipped.get(param)||{lvl:0,names:[]};a.lvl+=v;a.names.push(it.name||it.code);equipped.set(param,a);}});
  for(const [id,a]of equipped)add(id,a.lvl,'mercenary '+a.names.join(' + '));
  return {auras:[...byId.values()],notes};
 }
 function convert(model,swap=false,warnings=[]){
  if(model.cls!==6)throw Error('Choose an Assassin character for Dragon Tail.');
  const E=root.PD2Adv,D=root.ENGINE_DATA,C=E.compute(model,D,{swap}),merc=mercAuras(model,D),delta=new Map(),applied=[];
  for(const a of merc.auras){
   const own=(C.auraRows||[]).find(x=>x.id===a.id);
   if(own&&own.lvl>=a.lvl)continue;
   const sk=D.skills[a.id];applied.push(a);
   // Enemy auras (e.g. Conviction) affect the target, never the player's resistance stats.
   if(sk.do!==65)continue;
   if(own)for(const [id,v]of own.rows)delta.set(id,(delta.get(id)||0)-v);
   for(const [id,calc]of sk.as){if(id<0||[6,8,10].includes(id))continue;const v=E.evalCalc(calc,{D,sk,lvl:a.lvl,blvl:0,clvl:model.merc.level||model.level,levels:()=>({lvl:0,blvl:0}),stat:()=>0});delta.set(id,(delta.get(id)||0)+v);}
  }
  const baseT=C.T,baseT0=C.T0;C.T=id=>baseT(id)+(delta.get(id)||0);C.T0=id=>baseT0(id)+(delta.get(id)||0);
  const T=C.T,P=E.panel(C);
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
   gearIas:withoutWeapons(93),bos:C.levels(258).blvl,fana:0,otherSpeed:0,convictionLevel:0,lowerResLevel:0,curseMastery:0,conviction:0,lowerRes:0};
  // Equipped auras are present in the save; manually cast buffs/party auras are not.
  for(const a of [...(C.auraRows||[]),...applied]){if(a.id===122)values.fana=Math.max(values.fana,a.lvl);if(a.id===123)values.convictionLevel=Math.max(values.convictionLevel,a.lvl);}
  const unknown=model.items.flatMap(i=>(i.stats||[]).filter(s=>s.unknown).map(s=>s.unknown));
  const notes=[...warnings,...(model.warnings||[]),...merc.notes,...unknown.map(x=>'Unrecognised item modifier: '+x),
   `Burst of Speed assumed active at ${values.bos} hard points; gear bonuses are excluded.`,
   ...applied.map(a=>`Applied ${D.skills[a.id].dn||D.skills[a.id].n} level ${a.lvl} (${a.src}); assumes the mercenary is alive and in aura range.`),
   'Review other party auras, curses and temporary buffs; these are not assumed active.',
   'Enemy resistance, hit chance and target settings are not character stats. Check these separately.'];
  return {name:model.name||'Assassin',values,notes,gear:C.items.filter(i=>i.loc==='equip').map(i=>i.name||i.code)};
 }
 async function parse(file){
  if(file.size>8*1024*1024)throw Error('Choose a character file smaller than 8 MB.');
  await load();
  if(/\.d2s$/i.test(file.name)){
   const decoded=root.PD2Save.parse(await file.arrayBuffer(),root.SAVE_DATA);
   const model=root.PD2Adv.fromSave(decoded,root.ENGINE_DATA);if(model.merc)model.merc.dead=!!decoded.mercenary?.dead;
   return convert(model,!!decoded.header.active_weapon,decoded.warnings||[]);
  }
  let j;try{j=JSON.parse(await file.text());}catch{throw Error('Choose a .d2s save or a PD2 Armory JSON export.');}
  if(j.data?.character)j=j.data;
  if(!j.character||!Array.isArray(j.items))throw Error('JSON must contain a PD2 Armory character and items. Other planner schemas are not supported yet.');
  return convert(root.PD2Adv.fromArmory(j,root.ENGINE_DATA));
 }
 root.TailImport={parse,convert,mercAuras};
})(globalThis);
