(function(root){
 'use strict';
 const D=typeof module!=='undefined'?require('./gamedata.js'):root.TailData;
 const number=v=>{const n=Number(v||0);if(!Number.isFinite(n))throw Error('Enter a valid attack-speed value.');return n;};
 const dm=(l,a,b)=>l>0?Math.min(b,a+Math.trunc(Math.trunc(110*l/(l+6))*(b-a)/100)):0;
 function reductions(conv,lr,cm){
  conv=number(conv);lr=number(lr);cm=number(cm);
  return {conviction:conv>0?Math.min(D.conviction[2],D.conviction[0]+(conv-1)*D.conviction[1]):0,lowerRes:lr>0?D.lowerRes[0]+D.lowerRes[1]*lr+Math.trunc(cm/2):0};
 }
 function calculate(p){
  const val=k=>number(p[k]);
  const wsm=val('wsm'),wias=val('weaponIas'),second=String(p.dual)==='yes';
  const useSecond=second&&(-val('wsm2')+val('weaponIas2')>=-wsm+wias);
  const usedWsm=useSecond?val('wsm2'):wsm,usedIas=useSecond?val('weaponIas2'):wias;
  const bos=val('bos'),fana=val('fana'),gear=val('gearIas');
  if([wias,val('weaponIas2'),gear,bos,fana].some(n=>n<0))throw Error('IAS and speed skill levels must be zero or higher.');
  const skillSpeed=(bos>0?Math.trunc(110*bos*(D.bos[1]-D.bos[0])/(100*(bos+6)))+D.bos[0]:0)+dm(fana,...D.fanaticism)+val('otherSpeed');
  const framesAt=g=>{const ias=usedIas+g,eias=Math.trunc(120*ias/(120+ias)),speed=Math.max(15,Math.min(175,100+skillSpeed+D.tailPenalty-usedWsm+eias)),rate=Math.trunc(D.animation[1]*speed/100);return Math.max(1,Math.ceil(D.animation[0]*256/rate)-1);};
  const frames=framesAt(gear),breakpoints=[];let last;
  for(let g=0;g<=600;g++){const f=framesAt(g);if(f!==last){breakpoints.push({ias:g,frames:f});last=f;}}
  return {frames,attacks:25/frames,skillSpeed,usedWsm,usedIas,useSecond,breakpoints,next:breakpoints.find(b=>b.ias>gear&&b.frames<frames)||null};
 }
 const api={calculate,reductions};if(typeof module!=='undefined')module.exports=api;else root.TailSpeed=api;
})(globalThis);
