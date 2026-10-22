'use strict';
const form=document.querySelector('#build'),$=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(n);
for(const select of form.querySelectorAll('[data-level]')){
 const kind=select.dataset.level,max=['bos','cm'].includes(kind)?20:100;
 for(let level=0;level<=max;level++){
  const option=document.createElement('option');option.value=level;
  const r=TailSpeed.reductions(kind==='conviction'?level:0,kind==='lowerRes'?level:0,0);
  option.textContent=level===0?'0 · Not active':`${level}${kind==='conviction'?' · −'+r.conviction+'%':kind==='lowerRes'?' · −'+r.lowerRes+'%':''}`;
  select.append(option);
 }
}
for(const [id,key]of [['weaponBase','wsm'],['weaponBase2','wsm2']]){
 const select=$('#'+id);select.append(new Option('Custom / imported weapon','custom'));
 for(const w of TailData.weapons)select.append(new Option(`${w.name} (${w.wsm} WSM)`,w.code));
 select.addEventListener('change',()=>{const w=TailData.weapons.find(w=>w.code===select.value);if(w)form.elements.namedItem(key).value=w.wsm;render();});
}
const saved=new URLSearchParams(location.hash.slice(1));
for(const [key,value]of saved){const field=form.elements.namedItem(key);if(field&&value.length<50)field.value=value;}
function read(){const v={};for(const [k,x]of new FormData(form)){const el=form.elements.namedItem(k);v[k]=el.type==='number'||el.dataset.level?Number(x):x;}return v;}
function applyReductions(){const r=TailSpeed.reductions(form.elements.convictionLevel.value,form.elements.lowerResLevel.value,form.elements.curseMastery.value);for(const k of ['conviction','lowerRes'])form.elements.namedItem(k).value=r[k];}
function render(){
 const selected=form.elements.namedItem('boots').value;
 for(const [key,prop]of [['bootMin','min'],['bootMax','max']]){const el=form.elements.namedItem(key);el.readOnly=selected!=='custom';if(DragonTail.boots[selected])el.value=DragonTail.boots[selected][prop];}
 const input=read();$('#stats').hidden=input.mode==='manual';$('#manual').hidden=input.mode!=='manual';
 try{
 for(const key of ['pierce','conviction','lowerRes']){input[key]=Math.abs(input[key]);form.elements.namedItem(key).value=input[key];}
 const speed=TailSpeed.calculate(input),frames=form.elements.namedItem('frames');frames.readOnly=input.speedMode!=='manual';
 if(frames.readOnly){frames.value=speed.frames;input.frames=speed.frames;}
 $('#secondWeapon').hidden=input.dual!=='yes';
 $('#speedResult').textContent=`${input.frames} frames · ${fmt(25/input.frames)}/s`;
 $('#speedSummary').textContent=`${input.frames} frames per kick · ${fmt(25/input.frames)} kicks/second${input.speedMode==='manual'?' (manual)':''}`;
 $('#nextSpeed').textContent=`Using ${speed.useSecond?'second':'first'} weapon: ${speed.usedWsm} WSM, ${speed.usedIas} weapon IAS. ${speed.next?`Next breakpoint: ${speed.next.frames} frames at ${speed.next.ias} IAS from other gear (+${speed.next.ias-input.gearIas}).`:'No faster breakpoint within 600 gear IAS.'}`;
 $('#speedBreakpoints').replaceChildren();for(const b of speed.breakpoints){const tr=document.createElement('tr');for(const v of [b.ias,b.frames]){const td=document.createElement('td');td.textContent=v;tr.append(td);}$('#speedBreakpoints').append(tr);}
 $('#curseValues').textContent=`Conviction: −${input.conviction}% · Lower Resist: −${input.lowerRes}% (before immunity penalties)`;
 const a=DragonTail.calculate(input);$('#error').hidden=true;
 $('#damage').textContent=fmt(a.applied);$('#raw').textContent=fmt(a.raw);$('#resResult').textContent=a.resistance.immune?'Immune':`${fmt(a.resistance.effective)}%`;$('#factor').textContent=`${fmt(a.firePercent/100)}×`;$('#kick').textContent=`${fmt(a.kmin)}–${fmt(a.kmax)}`;
 $('#outcomes').replaceChildren();for(const o of a.outcomes){const tr=document.createElement('tr');for(const s of [o.name,fmt(o.p*100)+'%',fmt(o.min)+'–'+fmt(o.max)]){const td=document.createElement('td');td.textContent=s;tr.append(td);}$('#outcomes').append(tr);}
 $('#breakdown').textContent=`Skill bonus = 40 + 13 × (${a.input.level} − 1) + 8 × (${a.input.talon} + ${a.input.flight}) = ${a.skillBonus}%. Fire = a fresh kick roll × (100 + ${a.skillBonus} + ${a.input.mastery}) / 100. Critical/Deadly Strike changes the kick seed before conversion; the burst is not independently multiplied again. ${a.input.mode==='stats'?`Boot base: ${a.input.bootMin}–${a.input.bootMax}; effective ED pool: ${a.ed}%.`:''} Outputs approximate fixed-point endpoint rounding; they are not an exact enumeration of every random roll.`;
 $('#throughput').textContent=`${fmt(a.perAttempt)} fire per attempt; ${fmt(a.dps)} fire/second at ${a.input.frames} game frames per attempt. ${fmt(a.pack)} combined fire to ${a.input.targets} identical enemies per successful burst. Assumes every enemy is in range, eligible and exposed to the same resistance reduction.`;
 const deltas=[['+1 Dragon Tail level',{level:Math.min(100,input.level+1)}],['+1 synergy hard point',input.talon<20?{talon:input.talon+1}:input.flight<20?{flight:input.flight+1}:null],['+10 fire skill damage',{mastery:input.mastery+10}],['+10 fire pierce',{pierce:Math.abs(input.pierce)+10}]];
 if(input.mode==='stats')deltas.unshift(['+20 dexterity',{dex:input.dex+20}],['+20 strength',{str:input.str+20}],['+100 effective ED',{ed:input.ed+100}]);
 $('#compare').replaceChildren();for(const [label,patch]of deltas){const row=document.createElement('div');row.className='improvement';const name=document.createElement('span');name.textContent=label;const result=document.createElement('strong');if(!patch)result.textContent='Synergies maxed';else{const b=DragonTail.calculate({...input,...patch});result.textContent=a.applied?`+${fmt((b.applied/a.applied-1)*100)}%`:`${fmt(b.applied)} damage`;}row.append(name,result);$('#compare').append(row);}
 const hash=new URLSearchParams(input).toString();history.replaceState(null,'','#'+hash);
 }catch(e){$('#error').hidden=false;$('#error').textContent=e.message;$('#damage').textContent='Check inputs';for(const id of ['raw','resResult','factor','kick'])$('#'+id).textContent='—';$('#outcomes').replaceChildren();$('#compare').replaceChildren();$('#breakdown').textContent='';$('#throughput').textContent='';}
}
form.addEventListener('input',e=>{if(['convictionLevel','lowerResLevel','curseMastery'].includes(e.target.name))applyReductions();if(e.target.name==='wsm')$('#weaponBase').value='custom';if(e.target.name==='wsm2')$('#weaponBase2').value='custom';render();});form.addEventListener('submit',e=>e.preventDefault());
$('#reset').addEventListener('click',()=>{form.reset();render();$('#feedback').textContent='Defaults restored.';});
$('#share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#feedback').textContent='Build link copied.';}catch{const t=document.createElement('textarea');t.value=location.href;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();$('#feedback').textContent=ok?'Build link copied.':'Copy the address bar to share this build.';}});
$('#character').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 e.target.disabled=true;$('#feedback').textContent='Reading character…';
 try{
  const result=await TailImport.parse(file);
  // Validate everything before applying any imported character values.
  DragonTail.calculate({...read(),...result.values});TailSpeed.calculate({...read(),...result.values});
  for(const [k,v]of Object.entries(result.values)){const field=form.elements.namedItem(k);if(field)field.value=v;}
  $('#weaponBase').value='custom';$('#weaponBase2').value='custom';applyReductions();render();
  $('#importReview').hidden=false;$('#importReview').open=true;$('#importTitle').textContent=`Imported ${result.name} · review buffs & targets`;
  $('#importNotes').replaceChildren();for(const note of result.notes){const li=document.createElement('li');li.textContent=note;$('#importNotes').append(li);}
  $('#importGear').textContent='Equipped: '+result.gear.join(', ');$('#feedback').textContent='Character imported. Review the notes below.';
 }catch(error){$('#feedback').textContent='Import failed: '+error.message;}
 finally{e.target.disabled=false;e.target.value='';}
});
render();

