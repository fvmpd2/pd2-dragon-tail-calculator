'use strict';
const form=document.querySelector('#build'),$=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(n);
const saved=new URLSearchParams(location.hash.slice(1));
for(const [key,value]of saved){const field=form.elements.namedItem(key);if(field&&value.length<50)field.value=value;}
function read(){const v={};for(const [k,x]of new FormData(form))v[k]=typeof DragonTail.defaults[k]==='number'?Number(x):x;return v;}
function render(){
 const input=read();$('#stats').hidden=input.mode==='manual';$('#manual').hidden=input.mode!=='manual';
 try{
 const a=DragonTail.calculate(input);$('#error').hidden=true;
 $('#damage').textContent=fmt(a.applied);$('#raw').textContent=fmt(a.raw);$('#resResult').textContent=a.resistance.immune?'Immune':`${fmt(a.resistance.effective)}%`;$('#factor').textContent=`${fmt(a.firePercent/100)}×`;$('#kick').textContent=`${fmt(a.kmin)}–${fmt(a.kmax)}`;
 $('#outcomes').replaceChildren();for(const o of a.outcomes){const tr=document.createElement('tr');for(const s of [o.name,fmt(o.p*100)+'%',fmt(o.min)+'–'+fmt(o.max)]){const td=document.createElement('td');td.textContent=s;tr.append(td);}$('#outcomes').append(tr);}
 $('#breakdown').textContent=`Skill bonus = 40 + 13 × (${a.input.level} − 1) + 8 × (${a.input.talon} + ${a.input.flight}) = ${a.skillBonus}%. Fire = a fresh kick roll × (100 + ${a.skillBonus} + ${a.input.mastery}) / 100. Critical/Deadly Strike changes the kick seed before conversion; the burst is not independently multiplied again. ${a.input.mode==='stats'?`Effective ED pool: ${a.ed}%.`:''} Outputs approximate fixed-point endpoint rounding; they are not an exact enumeration of every random roll.`;
 $('#throughput').textContent=`${fmt(a.perAttempt)} fire per attempt; ${fmt(a.dps)} fire/second at ${a.input.frames} game frames per attempt. ${fmt(a.pack)} combined fire to ${a.input.targets} identical enemies per successful burst. Assumes every enemy is in range, eligible and exposed to the same resistance reduction.`;
 const deltas=[['+1 Dragon Tail level',{level:Math.min(100,input.level+1)}],['+1 synergy hard point',input.talon<20?{talon:input.talon+1}:input.flight<20?{flight:input.flight+1}:null],['+10 fire skill damage',{mastery:input.mastery+10}],['+10 fire pierce',{pierce:Math.abs(input.pierce)+10}]];
 if(input.mode==='stats')deltas.unshift(['+20 dexterity',{dex:input.dex+20}],['+20 strength',{str:input.str+20}],['+100 effective ED',{ed:input.ed+100}]);
 $('#compare').replaceChildren();for(const [label,patch]of deltas){const row=document.createElement('div');row.className='improvement';const name=document.createElement('span');name.textContent=label;const result=document.createElement('strong');if(!patch)result.textContent='Synergies maxed';else{const b=DragonTail.calculate({...input,...patch});result.textContent=a.applied?`+${fmt((b.applied/a.applied-1)*100)}%`:`${fmt(b.applied)} damage`;}row.append(name,result);$('#compare').append(row);}
 const hash=new URLSearchParams(input).toString();history.replaceState(null,'','#'+hash);
 }catch(e){$('#error').hidden=false;$('#error').textContent=e.message;$('#damage').textContent='Check inputs';for(const id of ['raw','resResult','factor','kick'])$('#'+id).textContent='—';$('#outcomes').replaceChildren();$('#compare').replaceChildren();$('#breakdown').textContent='';$('#throughput').textContent='';}
}
form.addEventListener('input',render);form.addEventListener('submit',e=>e.preventDefault());
$('#reset').addEventListener('click',()=>{form.reset();render();$('#feedback').textContent='Defaults restored.';});
$('#share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#feedback').textContent='Build link copied.';}catch{const t=document.createElement('textarea');t.value=location.href;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();$('#feedback').textContent=ok?'Build link copied.':'Copy the address bar to share this build.';}});
render();
