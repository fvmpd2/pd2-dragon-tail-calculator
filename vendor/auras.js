/* ---- adv/re/auras.js ---- */
/* Which Skills.txt stat columns a skill's OWNER receives from its aura / state buff in Project Diablo 2
   (1.13c D2Game + ProjectDiablo.dll). See auras.md for addresses; status READ (disassembly), not harness-verified.

   selfBuffStats(skill, lvl, blvl, { fromItem, isAura, srvdofunc, ownerMana })
     skill : a Skills.txt row (columns aurastat1..6 / passivestat1..5 / srvdofunc / aura / passivestate)
             or an engine.js record ({ as:[[stat,calc]..], ps:[[stat,calc]..], aura, pst } — srvdofunc from DOFUNC by opts.id
             or skill.id/skill.Id).
     returns [{ which: 'aura'|'passive', index }] — index is 0-based column position (aurastat1 -> 0); for engine records
             it is the index into sk.as / sk.ps. The caller evaluates the calcs with (lvl, blvl):
             lvl  = level the aura/buff runs at (cast level incl. +skills; item level for item_aura / item_skillonequip / charges),
             blvl = the owner's own hard points in THAT skill id (0 if none — e.g. CTA Battle Orders on a non-Barbarian,
                    The Beast Fanaticism on a non-Paladin). fromItem does not change the columns, only these values.
     Owner-side special stats (applied by the callback 0x6FCBA1A0, not as list stats): stat 110 (poison length) and
     ItemStatCost 'direct' stats such as hitpoints (Prayer heal) — see auras.md.
   affectsSelf(skill) -> true when the owner receives any stat list from the skill's own state (aurafilter is irrelevant:
             the area iteration 0x6FCC0C70 always excludes the owner; the do-func applies the owner's state directly).
   targetStats(skill) -> which columns OTHER units (party/merc/enemies) get: 'aura' | 'none'. */
(function (root) {
'use strict';

// srvdofunc per skill id for PD2 skills carrying aura/passive stats (generated from PD2 Skills.txt).
const DOFUNC = {"8":6,"17":6,"28":49,"30":13,"32":16,"40":25,"41":182,"42":160,"46":23,"50":18,"52":25,"60":18,"62":144,"66":30,"68":18,"70":31,"71":30,"72":30,"75":56,"77":30,"78":60,"80":31,"81":61,"85":56,"86":59,"87":30,"88":62,"89":31,"90":57,"91":30,"94":56,"95":58,"98":65,"99":65,"100":65,"102":66,"103":65,"104":65,"105":65,"106":13,"108":65,"109":65,"110":65,"113":65,"114":81,"115":65,"116":18,"117":18,"118":66,"119":66,"120":65,"122":65,"123":66,"125":65,"137":71,"138":68,"144":2,"146":68,"147":9,"149":68,"150":75,"151":76,"152":9,"155":68,"173":23,"196":101,"209":18,"210":18,"215":109,"221":114,"222":115,"223":116,"226":119,"227":119,"228":116,"230":182,"232":120,"233":120,"235":18,"236":119,"237":119,"242":165,"246":119,"247":119,"248":13,"254":170,"257":44,"258":18,"259":170,"261":45,"262":45,"264":47,"265":170,"267":18,"268":49,"269":170,"271":45,"272":45,"273":51,"274":170,"276":45,"278":18,"279":49,"280":170,"294":130,"295":131,"296":65,"297":65,"298":65,"309":30,"314":137,"328":109,"350":116,"360":68,"366":45,"367":157,"378":162,"380":76,"383":144,"388":116,"390":23,"391":18,"395":65,"396":65,"398":23,"406":68,"407":68,"408":2,"416":81,"420":30,"421":144,"424":30,"426":68,"427":30,"429":18,"439":66,"441":101,"442":30,"443":30,"446":30,"447":30,"454":144,"455":124,"459":160,"465":18,"466":18,"468":8,"472":66,"473":65,"474":66,"475":81,"476":66,"477":65,"478":65,"479":65,"480":30,"485":169,"501":81,"509":23,"517":8,"518":18,"521":8,"525":18,"529":68,"531":66,"532":81,"534":66,"543":47,"552":30,"555":18,"556":18,"559":66,"561":170,"578":144,"580":169,"581":169,"582":169,"583":169,"585":30};

// Owner rule per do-func: which lists land in the owner's own state list.
//   65 aura (0x6FCBA8D0): aurastat + passivestat (PD2 NOPs the stock passivestate gate at 0x6FCBAA75)
//   66/81 offensive auras, 47 Cloak, 23 Energy Shield/Blaze: passivestat only (aurastats go to enemies)
//   18 self buffs (0x6FC628F0): aurastat + passivestat
//   68 warcries (PD 0x102C9F00), 25 Enchant (PD 0x102F98D0), 116 wereforms, 120 Feral Rage/Maul, 9 Frenzy/Berserk: aurastat
//   82 Redemption: nothing
const OWNER = { 65: ['aura', 'passive'], 18: ['aura', 'passive'], 66: ['passive'], 81: ['passive'], 47: ['passive'],
  23: ['passive'], 68: ['aura'], 25: ['aura'], 116: ['aura'], 120: ['aura'], 9: ['aura'], 82: [] };
// What other units get: 65/68/25 -> aurastats to allies; 66/81/47 -> aurastats to enemies; 18/23/116/120/9 -> nobody.
const TARGET = { 65: 'aura', 68: 'aura', 25: 'aura', 66: 'aura', 81: 'aura', 47: 'aura' };

function skillId(sk, o) { const v = o && o.id != null ? o.id : (sk.id != null ? sk.id : (sk.Id != null ? sk.Id : sk['*Id'])); return v == null || v === '' ? null : +v; }
function doFunc(sk, o) {
  const v = (o && o.srvdofunc != null) ? o.srvdofunc : (sk.srvdofunc != null && sk.srvdofunc !== '' ? sk.srvdofunc : sk.do);
  if (v != null && v !== '') return +v;
  const id = skillId(sk, o); return id != null && DOFUNC[id] != null ? DOFUNC[id] : null;
}
function columns(sk, which) {   // 0-based indices of filled stat columns
  const out = [];
  if (which === 'aura') {
    if (Array.isArray(sk.as)) sk.as.forEach((c, i) => { if (c[0] >= 0) out.push(i); });
    else for (let k = 1; k <= 6; k++) if (sk['aurastat' + k]) out.push(k - 1);
  } else {
    if (Array.isArray(sk.ps)) sk.ps.forEach((c, i) => { if (c[0] >= 0) out.push(i); });
    else for (let k = 1; k <= 5; k++) if (sk['passivestat' + k]) out.push(k - 1);
  }
  return out;
}
function ownerKinds(sk, opts) {
  const o = opts || {};
  let f = doFunc(sk, o);
  if (f == null) f = (o.isAura || +sk.aura === 1) ? 65 : 18;          // unknown: treat like the generic aura / self buff
  let kinds = OWNER[f];
  if (!kinds) kinds = ['aura'];                                       // other state do-funcs use AuraStatsToList 0x6FC648E0
  if (f === 65 && o.ownerMana != null && !(o.ownerMana > 0)) kinds = kinds.filter(k => k !== 'passive'); // mana > cost gate
  return kinds;
}

function selfBuffStats(skill, lvl, blvl, opts) {
  // lvl/blvl are accepted for API symmetry: the column choice does not depend on them (calcs do).
  const res = [];
  for (const which of ownerKinds(skill, opts)) {
    let cols = columns(skill, which);
    if (which === 'aura' && doFunc(skill, opts || {}) === 25 && !Array.isArray(skill.as)) {   // PD Enchant stops at first empty column
      const stop = cols.findIndex((c, i) => c !== i); if (stop >= 0) cols = cols.slice(0, stop);
    }
    for (const index of cols) res.push({ which, index });
  }
  return res;
}
function affectsSelf(skill, opts) { return selfBuffStats(skill, 0, 0, opts).length > 0; }
function targetStats(skill, opts) { const f = doFunc(skill, opts || {}); return TARGET[f] || 'none'; }

const api = { selfBuffStats, affectsSelf, targetStats, DOFUNC, OWNER };
if (typeof module !== 'undefined') module.exports = api;
if (typeof window !== 'undefined') window.PD2Auras = api;
})(this);

