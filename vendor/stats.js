/* ---- adv/engine/engine.js ---- */
/* PD2 Advanced Stats engine.
   Rebuilds a character's unit stats the way D2Common does, from either a PD2 Armory JSON or a decoded .d2s
   (PD2Save.parse), then derives every line of BH.dll's Advanced Stats panel plus extra stats.

   Game-code references (1.13c + ProjectDiablo.dll):
   - Stat totals and "op" links: D2Common 0x6FD89530 (ops 1-13), base-list getter 0x6FD88B00, all-lists sum 0x6FD88CD0,
     item totals propagate to the owner through 0x6FD89CE0 -> 0x6FD88940.
   - Skill calc keywords: SkillCalc.txt; ln = par + (lvl-1)*par (D2Common 0x6FD51690); dm = 0x6FD9DC30 (verified natively);
     level tiers for elemental values = 0x6FD9DDB0; blvl = skill base level +0x28 (0x6FDA14C6).
   - Advanced Stats panel: BH.dll 0x1007C040 (line-by-line mapping in panel()).
   Works in browsers (window.PD2Adv) and Node (module.exports). */
(function (root) {
'use strict';
const tdiv = (a, b) => (b ? Math.trunc(a / b) : 0);
const S = { strength: 0, energy: 1, dexterity: 2, vitality: 3, maxhp: 7, maxmana: 9, maxstamina: 11, level: 12 };

// ---------------------------------------------------------------- skill calc language
function lvtier(l, t) {                          // D2Common 0x6FD9DDB0
  if (l <= 1) return 0;
  if (l <= 8) return (l - 1) * t[0];
  if (l <= 16) return 7 * t[0] + (l - 8) * t[1];
  if (l <= 22) return 7 * t[0] + 8 * t[1] + (l - 16) * t[2];
  if (l <= 28) return 7 * t[0] + 8 * t[1] + 6 * t[2] + (l - 22) * t[3];
  return 7 * t[0] + 8 * t[1] + 6 * t[2] + 6 * t[3] + (l - 28) * t[4];
}
function lentier(l, t) {
  if (l <= 1) return 0;
  if (l <= 8) return (l - 1) * t[0];
  if (l <= 16) return 7 * t[0] + (l - 8) * t[1];
  return 7 * t[0] + 8 * t[1] + (l - 16) * t[2];
}
function dm(l, a, b) {                           // D2Common 0x6FD9DC30
  if (l <= 0) return 0;
  const t = tdiv(110 * l, l + 6); const v = tdiv(t * (b - a), 100) + a; return v > b ? b : v;
}
function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; out.push({ t: 'n', v: parseFloat(s.slice(i, j)) }); i = j; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < s.length && /[A-Za-z_0-9]/.test(s[j])) j++; out.push({ t: 'id', v: s.slice(i, j) }); i = j; continue; }
    if (c === "'") { const j = s.indexOf("'", i + 1); out.push({ t: 's', v: s.slice(i + 1, j) }); i = j + 1; continue; }
    if (c === '"') { out.push({ t: 'p', v: '(' }); i++; while (i < s.length && s[i] !== '"') { const k = s.indexOf('"', i); const inner = s.slice(i, k); tokenize(inner).forEach(x => out.push(x)); i = k; } out.push({ t: 'p', v: ')' }); i++; continue; }
    const two = s.slice(i, i + 2);
    if (['<=', '>=', '==', '!='].includes(two)) { out.push({ t: 'o', v: two }); i += 2; continue; }
    out.push({ t: 'o', v: c }); i++;
  }
  return out;
}
function parseCalc(src) {
  const T = tokenize(String(src || '0')); let p = 0;
  const peek = () => T[p], take = () => T[p++];
  function primary() {
    const t = take();
    if (!t) return { k: 'n', v: 0 };
    if (t.t === 'n') return { k: 'n', v: t.v };
    if (t.v === '(') { const e = ternary(); take(); return e; }
    if (t.v === '-') return { k: 'neg', a: unary() };
    if (t.t === 'id') {
      if (peek() && peek().v === '(') {
        take(); const args = [];
        if (t.v === 'skill' || t.v === 'stat' || t.v === 'sklvl') {
          const name = take().v; let prop = null;
          if (peek() && peek().v === '.') { take(); prop = take().v; }
          while (peek() && peek().v !== ')') take();
          take(); return { k: t.v, name, prop };
        }
        while (peek() && peek().v !== ')') { args.push(ternary()); if (peek() && peek().v === ',') take(); }
        take(); return { k: 'fn', f: t.v, args };
      }
      return { k: 'id', v: t.v };
    }
    return { k: 'n', v: 0 };
  }
  function unary() { if (peek() && peek().v === '-') { take(); return { k: 'neg', a: unary() }; } if (peek() && peek().v === '+') { take(); return unary(); } return primary(); }
  function bin(next, ops) { return function () { let a = next(); while (peek() && ops.includes(peek().v)) { const o = take().v; a = { k: 'b', o, a, b: next() }; } return a; }; }
  const mul = bin(unary, ['*', '/']); const add = bin(mul, ['+', '-']); const cmp = bin(add, ['<', '>', '<=', '>=', '==', '!=']);
  function ternary() { const c = cmp(); if (peek() && peek().v === '?') { take(); const a = ternary(); take(); const b = ternary(); return { k: 't', c, a, b }; } return c; }
  return ternary();
}
const calcCache = new Map();
function evalCalc(src, ctx) {
  if (src === undefined || src === null || src === '') return 0;
  let ast = calcCache.get(src); if (!ast) { ast = parseCalc(src); calcCache.set(src, ast); }
  return Math.trunc(ev(ast, ctx));
}
function skillVal(sk, lvl, blvl, key, ctx) {   // one keyword evaluated for skill record sk at level lvl
  const P = sk.p;
  let m;
  if ((m = /^par([1-8])$/.exec(key))) return P[m[1] - 1];
  if ((m = /^ln([1-8])([1-8])$/.exec(key))) return lvl > 0 ? P[m[1] - 1] + (lvl - 1) * P[m[2] - 1] : 0;
  if ((m = /^dm([1-8])([1-8])$/.exec(key))) return dm(lvl, P[m[1] - 1], P[m[2] - 1]);
  switch (key) {
    case 'lvl': return lvl;
    case 'blvl': return blvl;
    case 'ulvl': return ctx.clvl;
    case 'edmn': case 'edns': case 'enma': case 'enms': {
      const v = ((sk.emin + lvtier(lvl, sk.eminl)) << sk.hs) + synergy(sk, ctx, ((sk.emin + lvtier(lvl, sk.eminl)) << sk.hs));
      return key === 'edns' || key === 'enms' ? v : v >> 8;
    }
    case 'edmx': case 'edxs': case 'exma': case 'exms': {
      const v = ((sk.emax + lvtier(lvl, sk.emaxl)) << sk.hs) + synergy(sk, ctx, ((sk.emax + lvtier(lvl, sk.emaxl)) << sk.hs));
      return key === 'edxs' || key === 'exms' ? v : v >> 8;
    }
    case 'edln': case 'edma': return sk.elen + lentier(lvl, sk.elenl);
    case 'toht': return lvl > 0 ? sk.th + (lvl - 1) * sk.lth : 0;
  }
  return 0;
}
function synergy(sk, ctx, base) {                  // EDmgSymPerCalc (D2Common 0x6FDA03C5): base * calc / 100
  if (!sk.sym) return 0;
  const pct = evalCalc(sk.sym, Object.assign({}, ctx, { sk, lvl: ctx.lvl, blvl: ctx.blvl }));
  return tdiv(base * pct, 100);
}
function ev(n, ctx) {
  switch (n.k) {
    case 'n': return n.v;
    case 'neg': return -ev(n.a, ctx);
    case 't': return ev(n.c, ctx) ? ev(n.a, ctx) : ev(n.b, ctx);
    case 'b': {
      const a = ev(n.a, ctx), b = ev(n.b, ctx);
      switch (n.o) {
        case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return b ? Math.trunc(a / b) : 0;
        case '<': return +(a < b); case '>': return +(a > b); case '<=': return +(a <= b); case '>=': return +(a >= b);
        case '==': return +(a === b); case '!=': return +(a !== b);
      }
      return 0;
    }
    case 'fn': {
      const v = n.args.map(a => ev(a, ctx));
      if (n.f === 'min') return Math.min(...v); if (n.f === 'max') return Math.max(...v);
      return v[0] || 0;
    }
    case 'id': return skillVal(ctx.sk, ctx.lvl, ctx.blvl, n.v, ctx);
    case 'skill': {
      const id = ctx.D.skillByName[String(n.name).toLowerCase()];
      if (id === undefined) return 0;
      const sk = ctx.D.skills[id]; const L = ctx.levels ? ctx.levels(id) : { lvl: 0, blvl: 0 };
      return skillVal(sk, L.lvl, L.blvl, n.prop || 'lvl', Object.assign({}, ctx, { sk, lvl: L.lvl, blvl: L.blvl }));
    }
    case 'stat': {
      const id = ctx.D.statByName[n.name]; return id === undefined || !ctx.stat ? 0 : ctx.stat(id);
    }
    case 'sklvl': return 0;
  }
  return 0;
}

// ---------------------------------------------------------------- data prep
function prepare(D) {
  if (D._prepared) return D;
  D.statByName = {};
  for (const [id, s] of Object.entries(D.isc)) D.statByName[s.n] = +id;
  // op links: target stat -> list of {src, op, param, base}
  D.opLinks = {};
  for (const [id, s] of Object.entries(D.isc)) {
    if (!s.op) continue;
    for (const t of s.ops) (D.opLinks[t] = D.opLinks[t] || []).push({ src: +id, op: s.op, p: s.opp, base: s.opb });
  }
  for (const sk of Object.values(D.skills)) sk.sym = sk.sym || '';
  D._prepared = true;
  return D;
}
function isType(D, t, target, seen) {
  if (!t) return false; if (t === target) return true;
  seen = seen || new Set(); if (seen.has(t)) return false; seen.add(t);
  const r = D.types[t]; return !!r && r.eq.some(e => isType(D, e, target, seen));
}
// An item's type test as D2Common's item-type check does it: Weapons.txt `type` AND `type2` (t2). Two-handed axes,
// mauls, polearms, spears, staves and scythes are type2 '2han'; one-handed weapons are type2 '1han'.
function itemIsType(D, it, target) {
  const b = it && D.items[it.code]; if (!b) return false;
  return isType(D, b.t, target) || (!!b.t2 && isType(D, b.t2, target));
}
// PD 0x102D30B0: does a stat entry layered with item type `layer` (a passive's passiveitype) count for the wielded
// weapon? (adv/re/crit_cb.md). '2han' (114) needs the other hand empty; '1han' (116) on a 2han-type weapon needs the
// other hand occupied, and for Barbarian/Assassin (#10747) it also counts for a 2han weapon held with a shield/2nd weapon.
function passiveLayerMatches(D, W, cls, layer) {
  const w = W.weapons[0]; if (!w || !layer) return false;
  const other = w === W.right ? W.left : W.right;
  const is = t => itemIsType(D, w, t);
  if (is(layer)) {
    if (layer === '2han') return !other;
    if (layer === '1han') return is('2han') ? !!other : true;
    return true;
  }
  return layer === '1han' && (cls === 4 || cls === 6) && is('2han') && !!other;
}

// ---------------------------------------------------------------- input normalisation
const BODY = { 1: 'head', 2: 'neck', 3: 'tors', 4: 'rarm', 5: 'larm', 6: 'rrin', 7: 'lrin', 8: 'belt', 9: 'feet', 10: 'glov', 11: 'rarm2', 12: 'larm2' };
const ARMORY_EQ = { 'Helm': 'head', 'Amulet': 'neck', 'Armor': 'tors', 'Right Hand': 'rarm', 'Left Hand': 'larm', 'Right Ring': 'rrin', 'Left Ring': 'lrin', 'Belt': 'belt', 'Boots': 'feet', 'Gloves': 'glov', 'Right Hand Switch': 'rarm2', 'Left Hand Switch': 'larm2', 'Alternate Right Hand': 'rarm2', 'Alternate Left Hand': 'larm2' };
// Armory modifier names that stand for several stats
function armoryStats(D, mods) {
  const out = []; const id = n => D.statByName[n];
  const add = (n, v, param) => { const s = id(n); if (s !== undefined) out.push({ id: s, param: param || 0, val: v }); };
  for (const m of mods || []) {
    const v = m.values || []; const n = m.name;
    switch (n) {
      case 'all_resist': ['fireresist', 'coldresist', 'lightresist', 'poisonresist'].forEach(x => add(x, v[0])); break;
      case 'all_attributes': ['strength', 'energy', 'dexterity', 'vitality'].forEach(x => add(x, v[0])); break;
      case 'maxdamage_percent': add('item_maxdamage_percent', v[0]); add('item_mindamage_percent', v[1] !== undefined ? v[1] : v[0]); break;
      case 'min_damage': add('mindamage', v[0]); add('secondary_mindamage', v[0]); add('item_throw_mindamage', v[0]); break;
      case 'max_damage': add('maxdamage', v[0]); add('secondary_maxdamage', v[0]); add('item_throw_maxdamage', v[0]); break;
      case 'firedam': add('firemindam', v[0]); add('firemaxdam', v[1] !== undefined ? v[1] : v[0]); break;
      case 'lightdam': add('lightmindam', v[0]); add('lightmaxdam', v[1] !== undefined ? v[1] : v[0]); break;
      case 'magicdam': add('magicmindam', v[0]); add('magicmaxdam', v[1] !== undefined ? v[1] : v[0]); break;
      case 'magicmindam': add('magicmindam', v[0]); if (v.length > 1 && !mods.some(x => x.name === 'magicmaxdam')) add('magicmaxdam', v[1]); break;
      case 'colddam': add('coldmindam', v[0]); add('coldmaxdam', v[1]); if (v[2] !== undefined && !mods.some(x => x.name === 'coldlength')) add('coldlength', v[2]); break;
      case 'poisondam': case 'poisonmindam': add('poisonmindam', v[0]); add('poisonmaxdam', v[1]); if (v[2] !== undefined && !mods.some(x => x.name === 'poisonlength')) add('poisonlength', v[2]); break;
      case 'lightmindam': add('lightmindam', v[0]); if (v.length > 1 && !mods.some(x => x.name === 'lightmaxdam')) add('lightmaxdam', v[1]); break;
      case 'firemindam': add('firemindam', v[0]); if (v.length > 1 && !mods.some(x => x.name === 'firemaxdam')) add('firemaxdam', v[1]); break;
      case 'coldmindam': add('coldmindam', v[0]); if (v.length > 1 && !mods.some(x => x.name === 'coldmaxdam')) add('coldmaxdam', v[1]); break;
      case 'item_addclassskills': add(n, v[1], v[0]); break;
      case 'item_addskill_tab': add(n, v[1], v[0]); break;
      case 'item_singleskill': case 'item_nonclassskill': case 'item_aura': case 'item_skillonequip': add(n, v[1], v[0]); break;
      case 'item_elemskill_fire': case 'item_elemskill_cold': case 'item_elemskill_lightning': case 'item_elemskill_poison': case 'item_elemskill_magic': case 'item_elemskill':
        add(n, v[v.length - 1], v.length > 1 ? v[0] : 0); break;
      case 'item_charged_skill': add(n, v[2] | (v[3] << 8), (v[1] << 6) | v[0]); break;
      case 'item_skillonhit': case 'item_skillonattack': case 'item_skillongethit': case 'item_skillonkill': case 'item_skillondeath':
      case 'item_skillonlevelup': case 'item_skilloncast': case 'item_skillonblock': case 'item_skillonpierce': case 'item_splashonhit': case 'item_skilloncrit':
        add(n, v[2], (v[1] << 6) | v[0]); break;
      case 'item_reanimate': add(n, v[1], v[0]); break;
      case 'corrupted': case 'desecrated': case 'desecrator': add(n, v[v.length - 1] || 0); break;
      default: {
        const s = id(n);
        if (s === undefined) { out.push({ unknown: n, val: v[0] }); break; }
        const isc = D.isc[s];
        let val = v[0];
        // per-level stats are shown divided by 2^param; the stored value is what the op uses
        if (isc && (isc.op === 2 || isc.op === 4 || isc.op === 5) && isc.opb === S.level) val = Math.round(val * (1 << isc.opp));
        out.push({ id: s, param: v.length > 1 ? v[0] : 0, val: v.length > 1 ? v[1] : val });
      }
    }
  }
  return out;
}
function fromArmory(J, D) {
  prepare(D);
  const C = J.character;
  const model = {
    source: 'armory', name: C.name, cls: C.class.id, level: C.level, hardcore: C.status.is_hardcore, ladder: C.status.is_ladder,
    exp: C.experience >>> 0, gold: C.gold.character, goldbank: C.gold.stash,
    base: { strength: C.attributes.strength, dexterity: C.attributes.dexterity, vitality: C.attributes.vitality, energy: C.attributes.energy,
            maxhp: C.life, maxmana: C.mana, maxstamina: C.stamina },
    skills: {}, items: [], merc: null,
  };
  for (const s of C.skills || []) if (s.level) model.skills[s.id] = s.level;
  const conv = (it) => {
    const r = {
      name: it.name, code: it.base_code || it.base.id, type: it.base.type_code, quality: it.quality && it.quality.id, eth: !!it.is_ethereal,
      stats: armoryStats(D, it.modifiers), rw: it.runeword ? it.runeword.name : null, runewordStats: [],
      sockets: it.socket_count || 0, children: (it.socketed || []).map(conv), setName: it.quality && it.quality.id === 5 ? it.name : null,
      defense: it.defense ? it.defense.base : null, defenseTotal: it.defense ? it.defense.total : null,
      armoryDamage: it.damage || null, unique: it.quality && it.quality.id === 7 ? it.name : null, ilvl: it.item_level,
      corrupted: !!it.corrupted, loc: 'other', slot: null, x: it.position ? it.position.column : 0, y: it.position ? it.position.row : 0,
      childrenIncluded: true, labels: (it.modifiers || []).map(m => m.label).filter(x => typeof x === 'string' && x),        // the Armory folds socketed runes/jewels into the parent's modifier list
    };
    const L = it.location || {};
    if (L.zone === 'Equipped') { r.loc = 'equip'; r.slot = ARMORY_EQ[L.equipment] || ('eq' + L.equipment_id); }
    else if (L.storage === 'Inventory') r.loc = 'inv';
    else if (L.storage === 'Stash') r.loc = 'stash';
    else if (L.storage === 'Cube') r.loc = 'cube';
    else if (L.zone === 'Belt' || L.storage === 'Belt') r.loc = 'belt';
    return r;
  };
  model.items = (J.items || []).map(conv);
  if (J.mercenary && J.mercenary.items) model.merc = { type: J.mercenary.type, name: J.mercenary.name, desc: J.mercenary.description, level: J.mercenary.level, experience: J.mercenary.experience, items: J.mercenary.items.map(conv) };
  return model;
}
function fromSave(P, D) {
  prepare(D);
  const A = P.attributes;
  const model = {
    source: 'save', name: P.name, cls: P.class.id, level: P.level, hardcore: P.hardcore, ladder: P.ladder,
    exp: A.experience, gold: A.gold, goldbank: A.goldbank,
    base: { strength: A.strength, dexterity: A.dexterity, vitality: A.vitality, energy: A.energy, maxhp: A.maxhp, maxmana: A.maxmana, maxstamina: A.maxstamina },
    skills: {}, items: [], merc: null, warnings: P.warnings || [],
  };
  for (const s of P.skills || []) if (s.level) model.skills[s.id] = s.level;
  const conv = (it) => {
    const L = it.location || {};
    const r = {
      name: it.unique_name || it.set_name || (it.runeword && it.runeword.name) || it.name, code: it.code, type: it.type, quality: it.quality, eth: !!it.ethereal,
      stats: (it.stats || []).map(s => ({ id: s.id, param: s.param || 0, val: s.values[0], vals: s.values })),
      runewordStats: (it.runeword_stats || []).map(s => ({ id: s.id, param: s.param || 0, val: s.values[0], vals: s.values })),
      setBonusLists: (it.set_bonus_lists || []).map(l => ({ bit: l.mask_bit, stats: l.stats.map(s => ({ id: s.id, param: s.param || 0, val: s.values[0] })) })),
      rw: it.runeword ? it.runeword.name : null, sockets: it.sockets || 0, children: (it.socketed || []).map(conv),
      setId: it.set_id, setName: it.set_item ? it.set_item[0] : null, defense: it.defense, unique: it.unique_name || null,
      ilvl: it.ilvl, loc: 'other', slot: null, x: L.x, y: L.y, quantity: it.quantity,
    };
    if (L.parent === 'equipped') { r.loc = 'equip'; r.slot = BODY[L.bodyloc] || L.bodyloc_code; }
    else if (L.storage === 'inventory') r.loc = 'inv';
    else if (L.storage === 'stash') r.loc = 'stash';
    else if (L.storage === 'cube') r.loc = 'cube';
    else if (L.parent === 'belt') r.loc = 'belt';
    return r;
  };
  model.items = (P.items || []).map(conv);
  if (P.mercenary && P.mercenary.items && P.mercenary.exists !== false) model.merc = { type: P.mercenary.type, experience: P.mercenary.experience, items: P.mercenary.items.map(conv) };
  return model;
}

// ---------------------------------------------------------------- item stat lists
function propStats(D, code, param, min, max, ctx) {   // Properties.txt -> stats (used for set bonuses and gem mods)
  const pr = D.props[code]; if (!pr) return [];
  const out = []; const val = max !== undefined && max !== null && max !== 0 && max > min ? max : min;
  for (const [func, stat, set, v] of pr) {
    const p = parseInt(param, 10);
    switch (func) {
      case 1: case 2: case 3: case 4: case 8: out.push({ id: stat, param: 0, val }); break;
      case 5: out.push({ id: 21, param: 0, val }); out.push({ id: 23, param: 0, val }); out.push({ id: 159, param: 0, val }); break;
      case 6: out.push({ id: 22, param: 0, val }); out.push({ id: 24, param: 0, val }); out.push({ id: 160, param: 0, val }); break;
      case 7: out.push({ id: 17, param: 0, val }); out.push({ id: 18, param: 0, val }); break;
      case 17: out.push({ id: stat, param: 0, val: isNaN(p) ? val : p }); break;        // per-level: parameter carries the rate
      case 21: out.push({ id: stat, param: v, val }); break;
      case 10: case 22: out.push({ id: stat, param: isNaN(p) ? (D.skillByName[String(param).toLowerCase()] || 0) : p, val }); break;
      case 11: case 19: case 24: break;                                           // events / charges: no stat totals
      case 12: case 36: break;
      case 15: out.push({ id: stat, param: 0, val: min }); break;
      case 16: out.push({ id: stat, param: 0, val: max }); break;
      default: if (stat >= 0) out.push({ id: stat, param: isNaN(p) ? 0 : p, val });
    }
  }
  return out.filter(s => s.id >= 0);
}
function socketStats(D, parent, child) {      // gems/runes get their mods from Gems.txt by parent class (.d2s only)
  if (child.stats && child.stats.length) return child.stats;
  const g = D.gems[child.code]; if (!g) return [];
  const base = D.items[parent.code]; const t = base ? base.t : parent.type;
  const part = base && base.c === 'weapon' ? 'weapon' : (isType(D, t, 'shld') ? 'shield' : 'helm');
  const out = []; for (const [c, p, mn, mx] of g[part]) out.push(...propStats(D, c, p, mn, mx));
  return out;
}
function itemBase(D, it, model) {            // the item's own base list: defense, damage, durability (set at creation)
  const b = D.items[it.code]; const out = [];
  if (!b) return out;
  if (b.c === 'armor' || (b.ac1 && b.c !== 'weapon')) {
    const def = it.defense !== null && it.defense !== undefined ? it.defense : 0;
    if (def) out.push({ id: 31, param: 0, val: def });
  }
  if (b.c === 'weapon') {
    const eth = it.eth ? 3 / 2 : 1;
    const f = v => Math.trunc(v * eth);
    if (b.min || b.max) { out.push({ id: 21, param: 0, val: f(b.min) }); out.push({ id: 22, param: 0, val: f(b.max) }); }
    if (b.min2 || b.max2) { out.push({ id: 23, param: 0, val: f(b.min2) }); out.push({ id: 24, param: 0, val: f(b.max2) }); }
    if (b.tmin || b.tmax) { out.push({ id: 159, param: 0, val: f(b.tmin) }); out.push({ id: 160, param: 0, val: f(b.tmax) }); }
    out.push({ id: 68, param: 0, val: -b.sp });                   // attackrate: -WSM (D2Common 0x6FD7AEB6)
  }
  if (b.c === 'armor' && b.blk) out.push({ id: 20, param: 0, val: b.blk });
  if (b.c === 'armor' && b.sp) out.push({ id: 67, param: 0, val: -b.sp });       // armor/shield speed penalty (D2Common 0x6FD7ADD9)
  return out;
}
class List {                                   // stat id+param -> value
  constructor() { this.m = new Map(); }
  add(id, param, v) { const k = id * 65536 + (param & 0xffff); this.m.set(k, (this.m.get(k) || 0) + v); }
  get(id, param) { return this.m.get(id * 65536 + ((param || 0) & 0xffff)) || 0; }
  sum(id) { let t = 0; for (const [k, v] of this.m) if (Math.floor(k / 65536) === id) t += v; return t; }
  each(fn) { for (const [k, v] of this.m) fn(Math.floor(k / 65536), k % 65536, v); }
}
function vshift(D, id, v) { const r = D.isc[id]; return r && r.vs ? v * (1 << r.vs) : v; }
function itemTotals(D, it, model, parent) {   // item unit: base list + affix lists, with item-level ops (4, 5, 13)
  const base = new List(), all = new List();
  for (const s of itemBase(D, it, model)) { base.add(s.id, s.param, s.val); all.add(s.id, s.param, s.val); }
  const aff = [...(it.stats || []), ...(it.runewordStats || [])];
  if (!it.childrenIncluded) for (const ch of it.children || []) aff.push(...socketStats(D, it, ch));
  // item lists hold life/mana/stamina as whole points; the game stores them << ValShift (8) when it reads the item
  for (const s of aff) if (s.id !== undefined && s.id >= 0) all.add(s.id, s.param, vshift(D, s.id, s.val));
  const out = new List(); all.each((id, p, v) => out.add(id, p, v));
  // item-level ops (owner type 4): 13 = % of the item's base value, 4/5 = per owner level
  all.each((src, p, v) => {
    const s = D.isc[src]; if (!s || !s.op) return;
    for (const t of s.ops) {
      if (s.op === 13) { const b = base.get(t, 0); if (b) out.add(t, 0, tdiv(b * v, 100)); }
      else if (s.op === 4 && s.opb === S.level) out.add(t, 0, (v * model.level) >> s.opp);
      else if (s.op === 5 && s.opb === S.level) { const b = base.get(t, 0); out.add(t, 0, tdiv(((v * model.level) >> s.opp) * b, 100)); }
    }
  });
  // item_armor_percent etc. already applied; per-owner-level armor done
  return out;
}

// ---------------------------------------------------------------- the character
function isCharm(D, it) { const b = D.items[it.code]; return !!b && isType(D, b.t, 'char'); }
function weaponOf(D, model, swap) {
  const r = model.items.find(i => i.loc === 'equip' && i.slot === (swap ? 'rarm2' : 'rarm'));
  const l = model.items.find(i => i.loc === 'equip' && i.slot === (swap ? 'larm2' : 'larm'));
  const w = [r, l].filter(x => x && D.items[x.code] && D.items[x.code].c === 'weapon');
  return { right: r || null, left: l || null, weapons: w };
}
function activeItems(D, model, opts) {
  const swap = !!opts.swap; const out = [];
  for (const it of model.items) {
    if (it.loc === 'equip') {
      const s = it.slot;
      if (s === 'rarm' || s === 'larm') { if (!swap) out.push(it); }
      else if (s === 'rarm2' || s === 'larm2') { if (swap) out.push(it); }
      else out.push(it);
    } else if (it.loc === 'inv' && isCharm(D, it)) out.push(it);
  }
  return out;
}
function setBonuses(D, items) {              // SetItems aprop by count + Sets partial/full bonuses
  const bySet = new Map(); const out = [];
  for (const it of items) {
    if (it.quality !== 5) continue;
    let sid = it.setId;
    if ((sid === undefined || sid === null) && it.setName) sid = D.setitems.findIndex(s => s.n === it.setName);
    if (sid === undefined || sid < 0 || !D.setitems[sid]) continue;
    const si = D.setitems[sid]; const set = si.set;
    if (!bySet.has(set)) bySet.set(set, []);
    if (!bySet.get(set).some(x => x.si === si)) bySet.get(set).push({ it, si });   // the same set item twice counts once
  }
  for (const [set, list] of bySet) {
    const n = list.length;
    for (const { it, si } of list) {
      if (it.setBonusLists && it.setBonusLists.length) {      // .d2s stores the item's own bonus lists
        for (const l of it.setBonusLists) if (n >= l.bit + 2) for (const s of l.stats) out.push({ ...s, src: it.name + ' (set bonus)' });
        continue;
      }
      for (let k = 1; k <= 5; k++) if (n >= k + 1) for (const [c, p, mn, mx] of si.ap[k] || []) propStats(D, c, p, mn, mx).forEach(s => out.push({ ...s, src: it.name + ' (' + (k + 1) + ' items)' }));
    }
    const S2 = D.sets[set]; if (!S2) continue;
    for (let k = 2; k <= 5; k++) if (n >= k) for (const [c, p, mn, mx] of S2.part[k] || []) propStats(D, c, p, mn, mx).forEach(s => out.push({ ...s, src: S2.n + ' (' + k + ' items)' }));
    const total = D.setitems.filter(s => s.set === set).length;
    if (n >= total && total > 0) for (const [c, p, mn, mx] of S2.full) propStats(D, c, p, mn, mx).forEach(s => out.push({ ...s, src: S2.n + ' (full set)' }));
  }
  return out;
}
function skillLevels(D, model, U) {          // hard + item bonuses, as D2 applies them to learned skills; oskills add on top
  const cls = model.cls;
  const all = U.sum(127), clsb = U.get(83, cls);
  const cache = new Map();
  return function (id) {
    if (cache.has(id)) return cache.get(id);
    const sk = D.skills[id]; const hard = model.skills[id] || 0;
    let lvl = 0;
    if (sk) {
      if (sk.cl === cls && hard > 0) {
        lvl = hard + all + clsb + U.get(188, cls * 8 + (sk.tab - 1)) + U.get(107, id);
        const el = { fire: 363, cold: 362, ltng: 364, pois: 365, mag: 366 }[sk.et];
        if (el) lvl += U.sum(el);
      }
      lvl += U.get(97, id);                        // item_nonclassskill (oskill)
    }
    const r = { lvl, blvl: hard };
    cache.set(id, r); return r;
  };
}

function compute(model, D, opts) {
  prepare(D); opts = opts || {};
  const cls = D.classes[model.cls];
  const items = activeItems(D, model, opts);
  const src = new Map();                                        // stat id -> [{src, val}]
  const note = (id, name, v) => { if (!v) return; if (!src.has(id)) src.set(id, []); src.get(id).push({ src: name, val: v }); };
  // raw sum of every list (D2Common 0x6FD88CD0): base, item totals, set bonuses, skill lists
  const R = new List();
  const base = new List();
  const b = model.base;
  const put = (id, v, name) => { base.add(id, 0, v); R.add(id, 0, v); note(id, name, v); };
  put(0, b.strength, 'Base (stat points)'); put(1, b.energy, 'Base (stat points)'); put(2, b.dexterity, 'Base (stat points)'); put(3, b.vitality, 'Base (stat points)');
  put(7, Math.round(b.maxhp * 256), 'Base life'); put(9, Math.round(b.maxmana * 256), 'Base mana'); put(11, Math.round(b.maxstamina * 256), 'Base stamina');
  put(12, model.level, 'Character level'); put(68, 100, 'Base attack rate');
  put(15, model.goldbank || 0, 'Stash'); put(14, model.gold || 0, 'Inventory');
  const itemLists = [];
  for (const it of items) {
    const T = itemTotals(D, it, model);
    itemLists.push({ it, T });
    T.each((id, p, v) => { R.add(id, p, v); note(id, it.name + (it.loc === 'inv' ? ' (charm)' : ''), v); });
  }
  for (const s of setBonuses(D, items)) { const v = vshift(D, s.id, s.val); R.add(s.id, s.param, v); note(s.id, s.src, v); }
  // PD2: items grant auras and "when equipped" self-auras
  const auraSkills = [];
  R.each((id, p, v) => { if ((id === 151 || id === 191) && v > 0) auraSkills.push({ id: p, lvl: v, from: id === 191 ? 'equip' : 'aura' }); });
  // skill passives (need levels, which depend on +skills) and auras
  const levels = skillLevels(D, model, R);
  const W = weaponOf(D, model, !!opts.swap);
  const passiveCtx = (sk, L) => ({ D, sk, lvl: L.lvl, blvl: L.blvl, clvl: model.level, levels, stat: id => R.sum(id) });
  const skillRows = [];
  const layered = new Map(), layeredMatch = new Map();
  // Passive stats: D2Common #10056 (0x6FDA2480) builds a skill's passivestat list whenever the unit has the skill and the
  // skill has a passivestate (gated on passivestate, not on the 'passive' column). It stores the stats with
  // param = passiveitype rather than gating them on the weapon, so they count whatever is equipped (masteries are
  // matched later where the attack code asks for a specific param, see masteryStat()).
  const hasLevel = id => levels(id).lvl > 0;
  for (const [idStr, sk] of Object.entries(D.skills)) {
    const id = +idStr; if (!sk.pst || !sk.ps.length) continue;
    const L = levels(id); if (!L.lvl) continue;
    const matches = !sk.pit || passiveLayerMatches(D, W, model.cls, sk.pit);
    const rows = [];
    for (const [stat, calc] of sk.ps) {
      if (stat < 0) continue;
      const v = evalCalc(calc, passiveCtx(sk, L));
      R.add(stat, 0, v); note(stat, (sk.dn || sk.n) + ' ' + L.lvl + ' (passive)', v); rows.push([stat, v]);
      // in the game these entries are layered (param = passiveitype): GetUnitStat(stat, 0) does not see them and the
      // attack code adds them only through PD 0x102D30B0 when the weapon matches -> keep them apart (T0 / TP below)
      if (sk.pit) { layered.set(stat, (layered.get(stat) || 0) + v); if (matches) layeredMatch.set(stat, (layeredMatch.get(stat) || 0) + v); }
    }
    skillRows.push({ id, name: sk.dn || sk.n, lvl: L.lvl, active: true, weaponMatch: matches, itype: sk.pit, rows });
  }
  // Auras and buffs on the owner (adv/re/auras.md): which stat columns the owner gets depends on the skill's srvdofunc.
  //   65 (Might, Prayer, Fanaticism...): aurastats + passivestats (PD2 NOPs the stock passivestate test at 0x6FCBAA75)
  //   66/81 (Holy Fire/Freeze/Shock, Conviction, Sanctuary): passivestats only; 18 (armors, Quickness, Fade, Holy Shield):
  //   aurastats + passivestats; 23/47: passivestats; 68 (BO/BC/Shout), 25 (Enchant), 116/120 (forms, Feral Rage), 9: aurastats.
  // Item auras (151) and equipped skills (191) run the same code at the item's level; blvl = the owner's hard points.
  // One stat list per state: two sources of the same state never stack (the last applied wins; item auras re-apply).
  const AU = (typeof require === 'function' && typeof module !== 'undefined') ? require('../re/auras.js') : root.PD2Auras;
  const cand = [];
  for (const a of auraSkills) cand.push({ id: a.id, lvl: a.lvl, blvl: model.skills[a.id] || 0, from: a.from === 'equip' ? 'item (when equipped)' : 'item aura', item: true });
  for (const b of opts.buffs || []) {
    const L = levels(b.id); const lvl = b.lvl !== undefined ? b.lvl : L.lvl; if (!lvl) continue;
    cand.push({ id: b.id, lvl, blvl: b.blvl !== undefined ? b.blvl : L.blvl, from: 'active skill', item: false });
  }
  const byState = new Map();
  for (const c of cand) {
    const sk = D.skills[c.id]; if (!sk) continue;
    const key = sk.ast || ('skill' + c.id);
    const prev = byState.get(key);
    if (!prev || (c.item && !prev.item) || (c.item === prev.item && c.lvl > prev.lvl)) byState.set(key, c);
  }
  const auraRows = [];
  for (const c of byState.values()) {
    const sk = D.skills[c.id];
    const kinds = AU ? AU.selfBuffStats(Object.assign({ id: c.id }, sk), c.lvl, c.blvl, { id: c.id }).map(x => x.which) : ['aura'];
    const L = { lvl: c.lvl, blvl: c.blvl };
    const rows = [];
    // stats with the ItemStatCost 'direct' behaviour (current life/mana/stamina, e.g. Prayer's heal) change the pool, not a total
    const addCols = (list, tag) => { for (const [stat, calc] of list) { if (stat < 0 || stat === 6 || stat === 8 || stat === 10) continue; const v = evalCalc(calc, passiveCtx(sk, L)); if (!v) continue; R.add(stat, 0, v); note(stat, (sk.dn || sk.n) + ' ' + c.lvl + ' (' + tag + ')', v); rows.push([stat, v]); } };
    if (kinds.includes('aura')) addCols(sk.as, sk.aura ? 'aura' : 'buff');
    // a passivestate skill the unit owns already has its passivestats from #10056 (they move to the aura list, never doubled)
    if (kinds.includes('passive') && !(sk.pst && hasLevel(c.id))) addCols(sk.ps, sk.aura ? 'aura' : 'buff');
    auraRows.push({ id: c.id, name: sk.dn || sk.n, lvl: c.lvl, blvl: c.blvl, rows, from: c.from, kinds });
  }
  // auras from party members / a mercenary: auratargetstate with aurastat1-6 only, evaluated with the caster
  for (const a of opts.partyAuras || []) {
    const sk = D.skills[a.id]; if (!sk || !a.lvl) continue;
    const L = { lvl: a.lvl, blvl: a.blvl || 0 }; const rows = [];
    for (const [stat, calc] of sk.as) { if (stat < 0 || stat === 6 || stat === 8 || stat === 10) continue; const v = evalCalc(calc, passiveCtx(sk, L)); if (!v) continue; R.add(stat, 0, v); note(stat, (sk.dn || sk.n) + ' ' + a.lvl + ' (' + (a.src || 'party aura') + ')', v); rows.push([stat, v]); }
    auraRows.push({ id: a.id, name: sk.dn || sk.n, lvl: a.lvl, rows, from: a.src || 'party', kinds: ['aura'] });
  }
  // unit-level ops (owner type 0): 1, 2, 3, 8, 9, 11 (D2Common 0x6FD89530)
  const memo = new Map();
  const T = (id) => {
    if (memo.has(id)) return memo.get(id);
    memo.set(id, R.sum(id));
    let v = R.sum(id); const v0 = v;
    for (const L of D.opLinks[id] || []) {
      const s = T(L.src); if (!s) continue;
      switch (L.op) {
        case 1: case 11: if (v0) v += tdiv(s * v0, 100); break;
        case 2: { const bv = L.base >= 0 ? base.get(L.base, 0) : 0; if (bv > 0) v += (s * bv) >> L.p; break; }
        case 3: { const bv = L.base >= 0 ? base.get(L.base, 0) : 0; if (bv > 0) v += tdiv(((s * bv) >> L.p) * v0, 100); break; }
        case 8: { const bonus = s - base.get(L.src, 0); if (bonus) v += (cls.ManaPerMagic * bonus) << 6; break; }
        case 9: { const bonus = s - base.get(L.src, 0); if (bonus) v += ((id === 11 ? cls.StaminaPerVitality : cls.LifePerVitality) * bonus) << 6; break; }
      }
    }
    memo.set(id, v); return v;
  };
  const stat = id => T(id);
  // T0(id): the layer-0 value the server reads with GetUnitStat(unit, id, 0) (T minus weapon-type-layered passives);
  // TP(id): PD 0x102D30B0, the layered passive entries whose item type the wielded weapon matches.
  const T0 = id => T(id) - (layered.get(id) || 0);
  const TP = id => layeredMatch.get(id) || 0;
  return { model, D, cls, items, itemLists, R, T: stat, T0, TP, src, levels, skillRows, auraRows, weapons: W, opts };
}

// ---------------------------------------------------------------- BH.dll Advanced Stats panel (0x1007C040)
const OW_TABLE = [9, 18, 27, 36, 45];
function owBase(lvl) {                         // D2Game 0x6FCCC940 (per-frame open wounds base by level)
  const t = OW_TABLE; if (lvl <= 1) return 0;
  if (lvl <= 15) return (lvl - 1) * t[0];
  if (lvl <= 30) return 14 * t[0] + (lvl - 15) * t[1];
  if (lvl <= 45) return 14 * t[0] + 15 * t[1] + (lvl - 30) * t[2];
  if (lvl <= 60) return 14 * t[0] + 15 * (t[1] + t[2]) + (lvl - 45) * t[3];
  return 14 * t[0] + 15 * (t[1] + t[2] + t[3]) + (lvl - 60) * t[4];
}
function masteryStat(C, statKey, skillId) {   // BH 0x10079670: a mastery's value when the equipped weapon matches it
  const D = C.D; const sk = D.skills[skillId]; if (!sk) return 0;
  const L = C.levels(skillId); if (!L.lvl) return 0;
  const w = C.weapons.weapons[0];
  if (sk.pit && !(w && itemIsType(D, w, sk.pit))) return 0;
  const want = { crit: [344, 347, 337], cb: [136], cbe: [268], critmult: [256] }[statKey];
  let v = 0;
  for (const [stat, calc] of sk.ps) if (want.includes(stat)) v += evalCalc(calc, { D, sk, lvl: L.lvl, blvl: L.blvl, clvl: C.model.level, levels: C.levels, stat: C.T });
  return v;
}
function panel(C, opts) {
  opts = opts || {}; const T = C.T; const D = C.D; const m = C.model;
  const diff = opts.difficulty === undefined ? 2 : opts.difficulty;
  const pen = [0, -20, -50][diff] * 2;                             // BH: {0,-20,-50}[difficulty] * (expansion ? 2 : 1)
  const maxRes = s => Math.min(T(s) + 75, 90);
  const P = {};
  P.level = m.level; P.addxp = T(85);
  P.fire = { cur: T(39) + pen, max: maxRes(40) };
  P.cold = { cur: T(43) + pen, max: maxRes(44), len: T(153) > 0 ? 0 : (2 - Math.min(T(118), 2)) * 50 };
  P.light = { cur: T(41) + pen, max: maxRes(42) };
  P.poison = { cur: T(45) + pen, max: maxRes(46), len: 100 - T(110) - pen };
  P.curse = { cur: Math.min(T(504), 75), max: 75, len: ((100 - T(109)) >>> 0) > 25 ? 100 - T(109) : 25 };   // BH compares unsigned
  P.absorb = { fire: [T(143), T(142)], cold: [T(149), T(148)], light: [T(145), T(144)], magic: [T(147), T(146)] };
  P.dr = { phys: [T(34), T(36)], magic: [T(35), T(37)] };
  P.thorns = { phys: T(78), light: T(128) };
  P.mastery = { fire: T(329), cold: T(331), light: T(330), poison: T(332), magic: T(357) };
  P.pierce = { fire: T(333), cold: T(335), light: T(334), poison: T(336), magic: T(358) };
  const dex = T(2);
  const arDex = C.cls.ToHitFactor + 5 * (dex - 7);
  P.ar = { dex: arDex, equip: T(19), total: arDex + T(19) };
  P.def = { dex: tdiv(dex, 4), equip: T(31), total: tdiv(dex, 4) + T(31) };
  P.dmg = { one: [T(21), T(22)], two: [T(23), T(24)] };
  P.fcr = T(105); P.fbr = T(102); P.fhr = T(99); P.frw = T(96); P.attackrate = T(68); P.ias = T(93);
  // crushing blow: Two-Hand Mastery (134) + items; efficiency 100 + mastery + items
  // (BH reads the layer-0 stats, T0: the mastery's own layered entries must not be counted a second time)
  const T0 = C.T0 || T;
  // BH 0x10079670 assumes GetUnitStat(136/268/256, layer 0) already includes the mastery. It adds nothing when the
  // weapon matches and SUBTRACTS the mastery when a '2han' weapon has the other hand occupied (bh_panel_review.md).
  // The game keeps mastery stats on their own layer (D2Common 0x6FDA25DF), so BH never shows them.
  const w0 = C.weapons.weapons[0], other0 = w0 ? (w0 === C.weapons.right ? C.weapons.left : C.weapons.right) : null;
  const bhNeg = w0 && itemIsType(D, w0, '2han') && other0 ? 1 : 0;
  const lay = id => T(id) - T0(id);
  P.cb = { chance: T0(136) - bhNeg * lay(136), eff: T0(268) - bhNeg * lay(268) + 100 };
  P.ow = { chance: T(135), dps: T(501) + ((owBase(m.level) + 25) * 25 >> 8) };
  const dsCap = Math.min(T(210) + 75, 100);
  P.ds = { chance: Math.min(T(141), dsCap), cap: dsCap, mult: T(257) + 150 };
  P.crit = { chance: Math.min(masteryStat(C, 'crit', 252) + masteryStat(C, 'crit', 135) + masteryStat(C, 'crit', 128) + T0(337) + T0(258), 75), cap: 75, mult: T0(256) + 200 };
  P.ll = T(60); P.ml = T(62); P.pierceChance = T0(166) + T0(156);   // BH reads layer 0 only (no Throwing Mastery)
  P.perKill = { life: T(86), mana: T(138) };
  const withMast = (v, mst) => v + Math.trunc(v * mst / 100);
  P.added = {
    phys: T(111),
    magic: [withMast(T(52), T(357)), withMast(T(53), T(357))],
    fire: [withMast(T(48), T(329)), withMast(T(49), T(329))],
    cold: [withMast(T(54), T(331)), withMast(T(55), T(331))],
    light: [withMast(T(50), T(330)), withMast(T(51), T(330))],
  };
  const plen = T(101) > 0 ? T(101) : T(59);
  P.added.poison = { min: Math.trunc(withMast(T(57), T(332)) / 256 * plen), max: Math.trunc(withMast(T(58), T(332)) / 256 * plen), secs: plen / 25 };
  P.mf = T(80); P.gf = T(79); P.stashGold = T(15);
  P.game = gameValues(C, P, diff, pen);
  return P;
}

// What the game actually uses for the lines where BH's panel is wrong (adv/re/bh_panel_review.md).
function gameValues(C, P, diff, pen) {
  const T = C.T, T0 = C.T0 || T, TP = C.TP || (() => 0), D = C.D;
  const hasW = !!C.weapons.weapons[0];
  const G = {};
  // crit: PD 0x10270E00 = weapon-matched melee mastery crit (344) + Critical Strike (337) + item crit (258), cap 75;
  // throw skills use 347 instead of 344. No weapon: no crit.
  G.crit = { chance: hasW ? Math.min(TP(344) + T0(337) + T0(258), 75) : 0, throwChance: hasW ? Math.min(TP(347) + T0(337) + T0(258), 75) : 0,
    mult: 200 + T0(256) + TP(256) };
  // crushing blow: PD 0x102AF610 = layer 0 + weapon-matched layers (Two-Hand Mastery only with the other hand empty)
  G.cb = { chance: T0(136) + TP(136), eff: 100 + T0(268) + TP(268) };
  const sm = D.skills[97], sl = C.levels(97);
  if (sm && sl.lvl > 0) {
    const ctx = { D, sk: sm, lvl: sl.lvl, blvl: sl.blvl, clvl: C.model.level, levels: C.levels, stat: C.T };
    G.cb.smite = { chance: evalCalc(sm.calc[2], ctx), eff: evalCalc(sm.calc[3], ctx) };
  }
  // open wounds: PD 0x102AF060 drain per frame = owBase + 25 + 5 x deep wounds (/256, 25 frames a second);
  // one state per monster, up to 3 of your procs add up (adv/re/pierce_ow.md)
  const per = (owBase(C.model.level) + 25 + 5 * T(501)) * 25 / 256;
  G.ow = { chance: T(135), dps: Math.floor(per), max: Math.floor(3 * per) };
  // cold length: half freeze / cannot be frozen, then cold resist (with penalty, capped) shortens chill and freeze too
  const cr = Math.max(Math.min(T(43) + pen, Math.min(T(44) + 75, 90)), -100);
  G.coldLen = Math.trunc(P.cold.len * (100 - cr) / 100);
  // poison length: 100 - min(PLR + penalty, 75)
  G.poisonLen = 100 - Math.min(T(110) + pen, 75);
  // curse length: curse length reduction capped at 75 for players
  G.curseLen = 100 - Math.min(T(109), 75);
  // projectile pierce: owner's 156 + 166 + weapon-matched 166 (Throwing Mastery), rolled once per missile with a
  // seed that is always 0 for players, so the number of pierces is fixed (PD 0x102CB8D0, adv/re/pierce_ow.md)
  G.pierceChance = T(156) + T0(166) + TP(166);
  G.pierces = G.pierceChance >= 95 ? 10 : G.pierceChance >= 87 ? 5 : G.pierceChance >= 67 ? 1 : 0;
  return G;
}

// ---------------------------------------------------------------- extra stats (beyond the panel)
function extras(C, opts) {
  const T = C.T; const D = C.D; const m = C.model; const cls = C.cls; opts = opts || {};
  const X = {};
  X.life = T(7) / 256; X.mana = T(9) / 256; X.stamina = T(11) / 256;
  X.str = T(0); X.dex = T(2); X.vit = T(3); X.ene = T(1);
  X.lifeRegen = T(74); X.manaRegen = T(27); X.stamRegen = T(28);
  X.ar = null; X.defense = T(31) + tdiv(T(2), 4);
  X.defMelee = T(33); X.defMissile = T(32);
  X.enhancedDef = T(16); X.skillArmor = T(171);
  X.lightRadius = T(89); X.reqPct = T(91);
  X.skillsAll = T(127); X.dmgToMana = T(114); X.slow = T(150); X.knockback = T(81);
  X.cbf = T(153) > 0; X.halfFreeze = T(118) > 0; X.poisonLen = T(110); X.curseRes = T(109);
  X.prevHeal = T(117) > 0; X.ignoreDef = T(115) > 0; X.targetDef = T(116); X.maxDs = T(210);
  X.dmgPct = T(25) + T(17); X.arPct = T(119); X.demonDmg = T(121); X.undeadDmg = T(122);
  X.lifeAfterHit = T(424); X.mfPerLevel = null; X.reducedPrices = T(87); X.addXp = T(85);
  X.extraSummons = { golem: T(476), spirits: T(459), skeWar: T(461), skeMage: T(462), hydra: T(463), valk: T(464) };
  X.maxCurses = T(368); X.curseEff = T(504);
  // block (D2Game block roll): (toblock + shield) * (dex - 15) / (clvl * 2), capped 75 (read; see notes)
  const shield = C.weapons.left && D.items[C.weapons.left.code] && D.items[C.weapons.left.code].c === 'armor' ? C.weapons.left : null;
  X.hasShield = !!shield;
  return X;
}

const API = { itemTotals, prepare, fromArmory, fromSave, compute, panel, extras, evalCalc, dm, lvtier, owBase, isType, itemIsType, passiveLayerMatches };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.PD2Adv = API;
})(typeof window !== 'undefined' ? window : globalThis);

