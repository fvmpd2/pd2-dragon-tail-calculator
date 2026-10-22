/* ---- adv/d2s.js ---- */
/* PD2 save decoder, browser port of adv/d2s.py (keep the two in lockstep).
 * Plain JS, no modules or dependencies.  Usage:
 *   var result = PD2Save.parse(arrayBuffer, DATA);          // DATA = contents of save-data.json
 *   var result = PD2Save.parse(arrayBuffer, DATA, true);    // strict: refuse data-overrides entries
 * Throws PD2Save.SaveFormatError on any inconsistency (it never guesses past a desync).
 * Code references (see SAVE_FORMAT.md): PD2 0x102E8F00 loader, D2Game 0x6FC74810 JM list,
 * D2Common #11145 0x6FD7C470, compact reader 0x6FD7C0C0, PD2 full item reader 0x102D8C40.
 */
(function (root) {
  'use strict';

  function SaveFormatError(msg) {
    this.name = 'SaveFormatError';
    this.message = msg;
    this.stack = (new Error(msg)).stack;
  }
  SaveFormatError.prototype = Object.create(Error.prototype);
  SaveFormatError.prototype.constructor = SaveFormatError;
  function fail(msg) { throw new SaveFormatError(msg); }
  function hex(n) { return '0x' + n.toString(16); }
  function pyrepr(s) { return "'" + s + "'"; }

  // ---------------- bit reader (Fog #10130 / #10129 / #10127) ----------------
  function Bits(buf, byteOff, byteEnd) {
    this.buf = buf; this.start = byteOff; this.pos = byteOff * 8; this.end = byteEnd * 8;
  }
  Bits.prototype.read = function (n) {
    if (n === 0) return 0;
    if (n > 32) fail('bit read of ' + n + ' bits');
    if (this.pos + n > this.end) fail('bit read past end of buffer at bit ' + this.pos + ' (+' + n + ')');
    var v = 0, mul = 1;
    for (var k = 0; k < n; k++) {
      var p = this.pos + k;
      if (this.buf[p >> 3] & (1 << (p & 7))) v += mul;
      mul *= 2;
    }
    this.pos += n;
    return v;
  };
  Bits.prototype.readSigned = function (n) {
    var v = this.read(n);
    if (n > 0 && n < 32 && Math.floor(v / Math.pow(2, n - 1)) % 2 === 1) v -= Math.pow(2, n);
    return v;
  };
  Bits.prototype.bytesUsed = function () {
    var used = this.pos - this.start * 8;
    return Math.floor((used + 7) / 8);
  };

  // ---------------- little-endian helpers ----------------
  function u8(b, o) { return b[o]; }
  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 16777216; }
  function tagIs(b, o, s) {
    for (var i = 0; i < s.length; i++) if (b[o + i] !== s.charCodeAt(i)) return false;
    return o + s.length <= b.length;
  }
  function bytesHex(b, a, e) {
    var s = '';
    for (var i = a; i < e; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }

  var I_NAME = 0, I_ENC = 1, I_CSVBITS = 2, I_CSVPARAM = 3, I_CSVSIGNED = 4, I_VALSHIFT = 5, I_SAVE = 7;
  function saveCols(r, sel) { var o = I_SAVE + 3 * sel; return [r[o], r[o + 1], r[o + 2]]; }

  var T_GOLD = 'gold', T_PLAY = 'play', T_CHARM = 'char', T_BOOK = 'book', T_SCROLL = 'scro',
      T_BODYPART = 'body', T_WEAPON = 'weap', T_ARMOR = 'armo';
  var F_IDENTIFIED = 0x10, F_SOCKETED = 0x800, F_EAR = 0x10000, F_COMPACT = 0x200000,
      F_ETHEREAL = 0x400000, F_PERSONALIZED = 0x1000000, F_BIT25 = 0x2000000, F_RUNEWORD = 0x4000000;
  var STAT_GROUPS = {
    17: [[17, 'G'], [18, 'G']], 48: [[48, 'V'], [49, 'V']], 50: [[50, 'G'], [51, 'V']],
    52: [[52, 'G'], [53, 'G']], 54: [[54, 'G'], [55, 'V'], [56, 'G']], 57: [[57, 'V'], [58, 'V'], [59, 'G']]
  };
  var MODE_NAMES = {0: 'stored', 1: 'equipped', 2: 'belt', 3: 'ground', 4: 'cursor', 5: 'dropping', 6: 'socketed'};
  var PAGE_NAMES = {0: 'inventory', 3: 'cube', 4: 'stash_page4', 5: 'stash'};
  var QUALITY_NAMES = {1: 'low', 2: 'normal', 3: 'superior', 4: 'magic', 5: 'set', 6: 'rare', 7: 'unique',
                       8: 'crafted', 9: 'tempered'};
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function flag(f, m) { return Math.floor(f / m) % 2 === 1; }   // f may exceed 2^31

  // ---------------- tables ----------------
  function Tables(D, isc, items) {
    this.D = D; this.isc = isc; this.items = items; this.itemtypes = D.itemtypes;
    this.typeIndex = {};
    for (var n = 0; n < D.itemtypes.length; n++) {
      var c = D.itemtypes[n][0];
      if (c && !has(this.typeIndex, c)) this.typeIndex[c] = n;
    }
    this._equiv = {};
  }
  Tables.prototype.equiv = function (code) {
    if (has(this._equiv, code)) return this._equiv[code];
    var out = [], todo = [code];
    while (todo.length) {
      var c = todo.pop();
      if (!c || out.indexOf(c) >= 0) continue;
      out.push(c);
      if (has(this.typeIndex, c)) {
        var row = this.itemtypes[this.typeIndex[c]];
        todo.push(row[1]); todo.push(row[2]);
      }
    }
    this._equiv[code] = out;
    return out;
  };
  Tables.prototype.isType = function (code, t) {
    var b = this.items[code];
    if (this.equiv(b[2]).indexOf(t) >= 0) return true;
    return b[3] !== '' && this.equiv(b[3]).indexOf(t) >= 0;
  };

  function read7bitString(br) {
    var s = '';
    for (;;) { var c = br.read(7); if (c === 0) return s; s += String.fromCharCode(c); }
  }

  // ---------------- decoder ----------------
  function Decoder(D, strict) {
    this.D = D; this.strict = !!strict; this.warnings = []; this.inferredIsc = {};
    var ov = D.overrides || {items: {}, isc: {}};
    this.overrideItems = this.strict ? {} : ov.items;
    var isc = D.isc, k;
    if (!this.strict && Object.keys(ov.isc).length) {
      isc = D.isc.map(function (r) { return r.slice(); });
      var keys = Object.keys(ov.isc).sort(function (a, b) { return (+a) - (+b); });
      for (var i = 0; i < keys.length; i++) {
        k = keys[i];
        var e = ov.isc[k], o = I_SAVE + 3 * e[0];
        isc[+k][o] = e[1]; isc[+k][o + 1] = e[2]; isc[+k][o + 2] = e[3];
        this.inferredIsc[k + '/' + e[0]] = true;
      }
    }
    var items = D.items;
    var okeys = Object.keys(this.overrideItems);
    if (okeys.length) {
      items = {};
      for (k in D.items) if (has(D.items, k)) items[k] = D.items[k];
      okeys.sort();
      for (var j = 0; j < okeys.length; j++) items[okeys[j]] = this.overrideItems[okeys[j]];
    }
    this.t = new Tables(D, isc, items);
  }
  Decoder.prototype.warn = function (m) { if (this.warnings.indexOf(m) < 0) this.warnings.push(m); };

  Decoder.prototype.statEntry = function (sid, param, value, sel, groupOf) {
    var r = this.t.isc[sid];
    var e = {id: sid, name: r[I_NAME], param: param, values: [value], encode: r[I_ENC],
             valshift: r[I_VALSHIFT], columns: sel};
    if (groupOf !== null) e.group_of = groupOf;
    if (has(this.inferredIsc, sid + '/' + sel)) {
      e.inferred = true;
      this.warn('stat ' + sid + ' (' + r[I_NAME] + '): save width taken from data-overrides.json (inferred, not in data.zip)');
    }
    if (r[I_ENC] === 2) {
      e.decoded = {skill: Math.floor(param / 64), level: param % 64, chance: value};
    } else if (r[I_ENC] === 3) {
      e.decoded = {skill: Math.floor(param / 64), level: param % 64, charges: ((value % 256) + 256) % 256,
                   max_charges: Math.floor(value / 256)};
    }
    return e;
  };
  Decoder.prototype.readOne = function (br, sid, kind, sel, groupOf, out) {
    var r = this.t.isc[sid], c = saveCols(r, sel), bits = c[0], add = c[1], pbits = c[2];
    if (bits <= 0) fail('stat ' + sid + ' (' + r[I_NAME] + ') has 0 save bits in column set ' + sel +
                        ' (bit ' + br.pos + '): bitstream desync?');
    var param = 0;
    if (kind === 'G' && pbits > 0) param = br.read(pbits) % 65536;
    var v = br.read(bits) - add;
    out.push(this.statEntry(sid, param, v, sel, groupOf));
  };
  Decoder.prototype.readStatList = function (br, sel, idbits) {
    var term = Math.pow(2, idbits) - 1, out = [];
    for (;;) {
      var sid = br.read(idbits);
      if (sid === term) return out;
      if (sid >= this.t.isc.length) fail('stat id ' + sid + ' out of ItemStatCost range at bit ' + (br.pos - idbits));
      if (has(STAT_GROUPS, sid)) {
        var g = STAT_GROUPS[sid];
        for (var i = 0; i < g.length; i++) this.readOne(br, g[i][0], g[i][1], sel, g[i][0] !== sid ? sid : null, out);
      } else {
        this.readOne(br, sid, 'G', sel, null, out);
      }
    }
  };

  Decoder.prototype.readItem = function (buf, off, end, version) {
    var br = new Bits(buf, off, end);
    if (br.read(16) !== 0x4D4A) fail('item at ' + hex(off) + ' does not start with JM');
    var flags = br.read(32);
    var bit25 = flag(flags, F_BIT25);
    if (bit25) flags -= F_BIT25;
    var it = {offset: off, flags: flags,
              identified: flag(flags, F_IDENTIFIED), is_socketed: flag(flags, F_SOCKETED),
              ear: flag(flags, F_EAR), compact: flag(flags, F_COMPACT),
              ethereal: flag(flags, F_ETHEREAL), personalized: flag(flags, F_PERSONALIZED),
              runeword_flag: flag(flags, F_RUNEWORD)};
    if (bit25) it.flag_bit25 = true;
    var iv = br.read(10);
    it.item_version = iv;
    var mode = br.read(3);
    var loc = {mode: mode, parent: has(MODE_NAMES, mode) ? MODE_NAMES[mode] : 'mode' + mode};
    if (mode === 3 || mode === 5) {
      loc.x = br.read(16); loc.y = br.read(16); loc.bodyloc = 0; loc.page = -1; loc.storage = null;
    } else {
      loc.bodyloc = br.read(4); loc.x = br.read(4); loc.y = br.read(4);
      var page = br.read(3) - 1;
      loc.page = page;
      loc.storage = page >= 0 && has(PAGE_NAMES, page) ? PAGE_NAMES[page] : null;
    }
    var bl = loc.bodyloc;
    loc.bodyloc_code = (bl > 0 && bl < this.D.bodylocs.length) ? this.D.bodylocs[bl] : null;
    it.location = loc;
    var nchildren = 0;
    if (flag(flags, F_COMPACT)) this.readCompact(br, it, version);
    else nchildren = this.readFull(br, it, version, bit25, iv);
    it.bits = br.pos - off * 8;
    // Fog #10128 (0x6FF641BE) zeroes each new byte: unused high bits of the last byte must be 0
    var pad = (8 - (it.bits % 8)) % 8;
    if (pad && (buf[off + br.bytesUsed() - 1] >> (8 - pad))) fail('item at ' + hex(off) + ': non-zero padding after bit ' + it.bits + ' (desync)');
    var ks = ['set_id', 'unique_id', 'defense', 'durability', 'quantity', 'sockets', 'ilvl'];
    for (var i = 0; i < ks.length; i++) if (!has(it, ks[i])) it[ks[i]] = null;
    if (!has(it, 'prefixes')) it.prefixes = [];
    if (!has(it, 'suffixes')) it.suffixes = [];
    it.socketed = [];
    it.runeword = null;
    return [it, br.bytesUsed(), nchildren];
  };

  Decoder.prototype.base = function (it, codeInt) {
    var code = '';
    for (var k = 0; k < 4; k++) code += String.fromCharCode(Math.floor(codeInt / Math.pow(256, k)) % 256);
    var key = code.replace(/ +$/, ''), b;
    if (has(this.D.items, key)) {
      b = this.t.items[key];
    } else if (has(this.overrideItems, key)) {
      b = this.t.items[key];
      it.base_inferred = true;
      this.warn('item code ' + pyrepr(key) + ' is not in data.zip; structure taken from data-overrides.json (inferred)');
    } else {
      fail('unknown item code ' + pyrepr(code) + ' at item ' + hex(it.offset));
    }
    it.code = key; it.name = b[0]; it.category = b[1]; it.type = b[2]; it.type2 = b[3] ? b[3] : null;
    return [key, b];
  };
  Decoder.prototype.readEar = function (br, it) {
    var cls = br.read(3), lvl = br.read(7);
    it.ear_data = {'class': cls, level: lvl, name: read7bitString(br)};
  };
  Decoder.prototype.emptyLists = function (it) { it.stats = []; it.set_bonus_lists = []; it.runeword_stats = []; };
  Decoder.prototype.readRealm = function (br, it, version) {
    if (version > 0x56) {
      if (br.read(1)) {
        var a = br.read(32), b = br.read(32), c = version > 0x5D ? br.read(32) : null;
        it.realm_data = [a, b, c];
      }
    }
  };
  Decoder.prototype.readCompact = function (br, it, version) {
    if (flag(it.flags, F_EAR)) {
      this.readEar(br, it);
      it.code = 'ear'; it.name = 'Ear'; it.category = 'ear'; it.type = 'play'; it.type2 = null;
    } else {
      var cb = this.base(it, br.read(32)), code = cb[0], b = cb[1];
      if (this.t.isType(code, T_GOLD)) { var big = br.read(1); it.gold = br.read(big ? 32 : 12); }
      if (version > 0x5C && b[5] && b[6]) {
        var c = saveCols(this.t.isc[356], 0);
        it.quest_difficulty = br.read(c[0]) - c[1];
      }
    }
    this.readRealm(br, it, version);
    it.quality = 2; it.quality_name = 'normal';
    this.emptyLists(it);
  };
  Decoder.prototype.readFull = function (br, it, version, bit25, iv) {
    var sel = iv <= 0x66 ? 2 : (version < 0x5D ? 1 : 0);
    var idbits = iv >= 0x66 ? 10 : 9;
    it.save_columns = sel; it.stat_id_bits = idbits;
    var cb = this.base(it, br.read(32)), code = cb[0], b = cb[1], v;
    if (bit25) { this.emptyLists(it); return 0; }
    var nchildren = br.read(3);
    it.socketed_count = nchildren;
    it.id = br.read(32);
    it.ilvl = br.read(7);
    var q = br.read(4);
    it.quality = q;
    it.quality_name = has(QUALITY_NAMES, q) ? QUALITY_NAMES[q] : 'q' + q;
    if (br.read(1)) it.gfx = br.read(3);
    if (br.read(1)) { v = br.read(11); it.automagic = {id: v, name: this.name(this.D.automagic, v)}; }
    if (q === 1 || q === 3) {
      v = br.read(3); it.quality_sub = v;
      if (q === 1) it.low_quality = {id: v, name: this.name(this.D.lowquality, v)};
    } else if (q === 2) {
      if (this.t.isType(code, T_CHARM)) {
        if (br.read(1)) it.prefixes = [this.affix('magicprefix', br.read(11))];
        else it.suffixes = [this.affix('magicsuffix', br.read(11))];
      }
      if (this.t.isType(code, T_BODYPART) && !this.t.isType(code, T_PLAY)) it.file_index = br.read(10);
      if (this.t.isType(code, T_SCROLL) || this.t.isType(code, T_BOOK)) it.spell_id = br.read(5);
    } else if (q === 4) {
      var p = br.read(11), s = br.read(11);
      it.prefixes = [this.affix('magicprefix', p)];
      it.suffixes = [this.affix('magicsuffix', s)];
    } else if (q === 6 || q === 8) {
      var n1 = br.read(8), n2 = br.read(8);
      it.rare_name = {id1: n1, id2: n2, name1: this.rareName(n1), name2: this.rareName(n2)};
      var pre = [], suf = [];
      for (var k = 0; k < 3; k++) {
        if (br.read(1)) pre.push(this.affix('magicprefix', br.read(11)));
        if (br.read(1)) suf.push(this.affix('magicsuffix', br.read(11)));
      }
      it.prefixes = pre; it.suffixes = suf;
    } else if (q === 5) {
      v = br.read(12);
      it.set_id = v;
      if (v < this.D.setitems.length) {
        it.set_item = this.D.setitems[v];
      } else {
        it.set_item = null;
        this.warn('set item id ' + v + ' is beyond SetItems.txt (' + this.D.setitems.length + ' rows): name unknown');
      }
    } else if (q === 7) {
      v = br.read(12);
      if (v >= this.D.unique.length) v = -1;
      it.unique_id = v;
      it.unique_name = v >= 0 ? this.D.unique[v] : null;
    } else if (q === 9) {
      var ta = br.read(8), tb = br.read(8);
      it.tempered_names = [ta, tb];
    } else {
      fail('invalid quality ' + q + ' at item ' + hex(it.offset));
    }
    if (flag(it.flags, F_RUNEWORD)) it.runeword_raw = br.read(16);
    if (flag(it.flags, F_EAR)) this.readEar(br, it);
    else if (flag(it.flags, F_PERSONALIZED)) it.personalized_name = read7bitString(br);
    this.readRealm(br, it, version);

    var c;
    if (this.t.isType(code, T_ARMOR)) {
      c = saveCols(this.t.isc[31], sel);
      it.defense = br.read(c[0]) - c[1];
      this.readDurability(br, it, version, sel);
    } else if (this.t.isType(code, T_WEAPON)) {
      this.readDurability(br, it, version, sel);
    } else if (this.t.isType(code, T_GOLD)) {
      var big = br.read(1); it.gold = br.read(big ? 32 : 12);
    }
    if (b[4]) it.quantity = br.read(version >= 0x51 ? 9 : 8);
    if (flag(it.flags, F_SOCKETED)) {
      c = saveCols(this.t.isc[194], sel);
      it.sockets = br.read(c[0]);
    }
    var setmask = 0;
    if (version > 0x54 && q === 5) { setmask = br.read(5); it.set_list_mask = setmask; }
    it.stats = this.readStatList(br, sel, idbits);
    it.set_bonus_lists = [];
    for (var bit = 0; bit < 5; bit++) {
      if (setmask & (1 << bit)) it.set_bonus_lists.push({mask_bit: bit, stats: this.readStatList(br, sel, idbits)});
    }
    it.runeword_stats = flag(it.flags, F_RUNEWORD) ? this.readStatList(br, sel, idbits) : [];
    return nchildren;
  };
  Decoder.prototype.readDurability = function (br, it, version, sel) {
    var m = saveCols(this.t.isc[73], sel);
    var mx = br.read(m[0]) - m[1], cur = null;
    if (mx !== 0) {
      var c = saveCols(this.t.isc[72], sel), cbits = c[0];
      if (version < 0x60) cbits = 8;
      cur = br.read(cbits) - c[1];
    }
    it.durability = {cur: cur, max: mx};
  };
  Decoder.prototype.name = function (tbl, v) { return (v >= 0 && v < tbl.length) ? tbl[v] : null; };
  Decoder.prototype.affix = function (t, v) { return {id: v, name: v ? this.name(this.D[t], v) : null}; };
  Decoder.prototype.rareName = function (v) {
    var suf = this.D.raresuffix, pre = this.D.rareprefix;
    if (v <= 0) return null;
    v -= 1;
    if (v < suf.length) return suf[v];
    if (v - suf.length < pre.length) return pre[v - suf.length];
    return null;
  };
  Decoder.prototype.resolveRuneword = function (it) {
    if (!it.runeword_flag) { it.runeword = null; return; }
    var codes = it.socketed.map(function (c) { return c.code; });
    var rw = {raw: has(it, 'runeword_raw') ? it.runeword_raw : null, rune_codes: codes, id: null, key: null, name: null};
    var runes = this.D.runes;
    for (var n = 0; n < runes.length; n++) {
      var r = runes[n];
      if (r[2] && r[3].length === codes.length && r[3].every(function (x, i) { return x === codes[i]; }) &&
          this.rwTypeOk(it.code, r[4], r[5])) {
        rw.id = n; rw.key = r[0]; rw.name = r[1];
        break;
      }
    }
    it.runeword = rw;
  };
  Decoder.prototype.rwTypeOk = function (code, itypes, etypes) {
    var ok = false, i;
    for (i = 0; i < itypes.length; i++) if (this.t.isType(code, itypes[i])) ok = true;
    if (ok) for (i = 0; i < etypes.length; i++) if (this.t.isType(code, etypes[i])) return false;
    return ok;
  };

  Decoder.prototype.readItemList = function (buf, off, end, version, where) {
    if (!tagIs(buf, off, 'JM')) fail(where + ': expected JM list header at ' + hex(off));
    var count = u16(buf, off + 2);
    off += 4;
    var items = [];
    for (var i = 0; i < count; i++) {
      var r = this.readItem(buf, off, end, version), it = r[0];
      off += r[1];
      var kids = [];
      for (var k = 0; k < r[2]; k++) {
        var rc = this.readItem(buf, off, end, version), ch = rc[0];
        if (rc[2]) fail('socketed child at ' + hex(off) + ' claims children');
        if (ch.location.mode !== 6) fail('socketed child at ' + hex(off) + ' has mode ' + ch.location.mode + ', expected 6');
        off += rc[1];
        kids.push(ch);
      }
      it.socketed = kids;
      this.resolveRuneword(it);
      items.push(it);
    }
    return [items, off];
  };

  Decoder.prototype.parseD2s = function (buf) {
    var D = this.D, i, k;
    if (buf.length < 0x2FD) fail('file too small');
    var magic = u32(buf, 0), version = u32(buf, 4), size = u32(buf, 8), checksum = u32(buf, 12);
    if (magic !== 0xAA55AA55) fail('bad magic ' + magic.toString(16));
    if (version !== 0x60) fail('only save version 0x60 (1.10-1.13) is implemented; got ' + hex(version));
    if (size !== buf.length) fail('header size ' + size + ' != file size ' + buf.length);
    var calc = checksum32(buf);
    if (calc !== checksum) fail('checksum mismatch: header ' + checksum.toString(16) + ' computed ' + calc.toString(16));
    var name = '';
    for (i = 0x14; i < 0x24 && buf[i] !== 0; i++) name += String.fromCharCode(buf[i]);
    var status = buf[0x24], cls = buf[0x28];
    if (cls >= D.classes.length) fail('class ' + cls + ' out of range');
    var out = {version: version, name: name, 'class': {id: cls, name: D.classes[cls][0]},
               level: buf[0x2B], status: status,
               hardcore: (status & 0x04) !== 0, died: (status & 0x08) !== 0,
               expansion: (status & 0x20) !== 0, ladder: (status & 0x40) !== 0,
               progression: buf[0x25],
               header: {checksum: checksum, active_weapon: u32(buf, 0x10), byte_29: buf[0x29],
                        skill_count: buf[0x2A], created: u32(buf, 0x2C), last_played: u32(buf, 0x30),
                        difficulty: [buf[0xA8], buf[0xA9], buf[0xAA]], map_id: u32(buf, 0xAB)}};
    var pos = 0x14F;
    if (!tagIs(buf, pos, 'Woo!') || u32(buf, pos + 4) !== 6) fail('quest section not found at 0x14F');
    pos += 0x12A;
    if (!tagIs(buf, pos, 'WS')) fail('expected WS at ' + hex(pos));
    pos += 0x50;
    if (!(buf[pos] === 1 && buf[pos + 1] === 0x77)) fail('expected NPC section (01 77) at ' + hex(pos));
    pos += 0x34;
    if (!tagIs(buf, pos, 'gf')) fail('gf section not at ' + hex(pos));
    // 'gf' (D2Game 0x6FD0B910)
    var br = new Bits(buf, pos + 2, buf.length), stats = {}, rawStats = [];
    for (;;) {
      var sid = br.read(9);
      if (sid >= 0x1FF) break;
      if (sid >= this.t.isc.length) fail('gf stat id ' + sid + ' out of range');
      var r = this.t.isc[sid], csvBits = r[I_CSVBITS], csvParam = r[I_CSVPARAM];
      if (csvBits <= 0) fail('gf stat ' + sid + ' has CSvBits 0');
      var param = csvParam > 0 ? br.read(csvParam) : 0;
      var v = (csvBits < 32 && r[I_CSVSIGNED]) ? br.readSigned(csvBits) : br.read(csvBits);
      rawStats.push({id: sid, name: r[I_NAME], param: param, value: v});
      stats[sid] = v;
    }
    pos = pos + 2 + br.bytesUsed();
    var attrIds = [['strength', 0], ['energy', 1], ['dexterity', 2], ['vitality', 3], ['statpts', 4],
                   ['newskills', 5], ['hitpoints', 6], ['maxhp', 7], ['mana', 8], ['maxmana', 9],
                   ['stamina', 10], ['maxstamina', 11], ['level', 12], ['experience', 13], ['gold', 14],
                   ['goldbank', 15]];
    var attrs = {};
    for (i = 0; i < attrIds.length; i++) {
      var aid = attrIds[i][1], av = has(stats, aid) ? stats[aid] : 0, vs = this.t.isc[aid][I_VALSHIFT];
      attrs[attrIds[i][0]] = vs ? av / Math.pow(2, vs) : av;
    }
    out.attributes = attrs;
    out.attributes_raw = rawStats;
    // 'if' skills
    if (!tagIs(buf, pos, 'if')) fail('expected if at ' + hex(pos));
    var n = buf[0x2A], clsSk = D.classskills[cls], skills = [];
    for (k = 0; k < n; k++) {
      if (k >= clsSk.length) fail('skill slot ' + k + ' beyond class skill list (' + clsSk.length + ')');
      skills.push({id: clsSk[k], name: D.skills[clsSk[k]], level: buf[pos + 2 + k]});
    }
    out.skills = skills;
    pos += 2 + n;
    var rl = this.readItemList(buf, pos, buf.length, version, 'player items');
    out.items = rl[0]; pos = rl[1];
    // corpses
    if (!tagIs(buf, pos, 'JM')) fail('expected corpse JM at ' + hex(pos));
    var ncorpse = u16(buf, pos + 2);
    if (ncorpse > 1) fail('corpse count ' + ncorpse + ' > 1');
    pos += 4;
    var corpses = [];
    for (i = 0; i < ncorpse; i++) {
      var head = [u32(buf, pos), u32(buf, pos + 4), u32(buf, pos + 8)];
      pos += 12;
      var rc = this.readItemList(buf, pos, buf.length, version, 'corpse items');
      pos = rc[1];
      corpses.push({header: head, items: rc[0]});
    }
    out.corpses = corpses;
    // mercenary
    var mflags = u32(buf, 0xAF), mseed = u32(buf, 0xB3), mname = u16(buf, 0xB7), mtype = u16(buf, 0xB9),
        mexp = u32(buf, 0xBB);
    var mercExists = mexp !== 0 || mseed !== 0 || mname !== 0, hire = null;
    if (mercExists) {
      var ver = out.expansion ? 100 : 0;
      for (i = 0; i < D.hireling.length; i++) {
        if (D.hireling[i][0] === mtype && D.hireling[i][1] === ver) { hire = D.hireling[i]; break; }
      }
      mercExists = hire !== null;
    }
    var merc = {flags: mflags, dead: flag(mflags, 0x10000), seed: mseed, name_id: mname, type: mtype,
                experience: mexp, exists: mercExists,
                hireling: hire ? {hireling: hire[2], subtype: hire[3], act: hire[4], difficulty: hire[5]} : null,
                items: []};
    out.golem = null;
    if (out.expansion) {
      if (!tagIs(buf, pos, 'jf')) fail('expected jf at ' + hex(pos));
      pos += 2;
      if (mercExists) { var rm = this.readItemList(buf, pos, buf.length, version, 'merc items'); merc.items = rm[0]; pos = rm[1]; }
      if (!tagIs(buf, pos, 'kf')) fail('expected kf at ' + hex(pos));
      var hasGolem = buf[pos + 2];
      pos += 3;
      if (hasGolem && tagIs(buf, pos, 'JM')) {
        var rg = this.readItem(buf, pos, buf.length, version), g = rg[0];
        pos += rg[1];
        var kids = [];
        for (k = 0; k < rg[2]; k++) { var rk = this.readItem(buf, pos, buf.length, version); pos += rk[1]; kids.push(rk[0]); }
        g.socketed = kids;
        this.resolveRuneword(g);
        out.golem = g;
      }
    }
    out.mercenary = merc;
    out.pd2 = this.parsePdBlock(buf, pos);
    return out;
  };

  Decoder.prototype.parsePdBlock = function (buf, pos) {
    if (pos === buf.length) return null;
    if (!tagIs(buf, pos, 'pd')) fail('unexpected data at ' + hex(pos) + ' (expected PD2 "pd" block or EOF)');
    var ver = u16(buf, pos + 2), i;
    pos += 4;
    var res = {version: ver};
    this.tag(buf, pos, 'su');
    var n = buf[pos + 2];
    if (n > 0x80) fail('su count ' + n);
    res.su = [];
    for (i = 0; i < n; i++) res.su.push(u16(buf, pos + 3 + 2 * i));
    pos += 3 + 2 * n;
    this.tag(buf, pos, 'bk');
    res.bk = u32(buf, pos + 2);
    pos += 6;
    this.tag(buf, pos, 'st');
    var p = pos + 2, st = [];
    st.push(u32(buf, p), u32(buf, p + 4)); p += 8;
    for (i = 0; i < 4; i++) st.push(u16(buf, p + 2 * i));
    p += 8;
    if (ver >= 0xA00) { st.push(u16(buf, p), u16(buf, p + 2)); p += 4; }
    for (i = 0; i < 11; i++) st.push(u16(buf, p + 2 * i));
    p += 22;
    if (ver >= 0xA81) { for (i = 0; i < 5; i++) st.push(u32(buf, p + 4 * i)); p += 20; }
    res.st = st;
    pos = p;
    if (ver >= 0x901) {
      this.tag(buf, pos, 'ht'); res.ht = buf[pos + 2]; pos += 3;
      this.tag(buf, pos, 'xp'); res.xp = buf[pos + 2]; pos += 3;
    }
    if (ver >= 0xA80) {
      this.tag(buf, pos, 'hc');
      res.hc = [];
      for (i = 0; i < 16; i++) {
        var o = pos + 2 + 8 * i;
        res.hc.push([u16(buf, o), u16(buf, o + 2), u32(buf, o + 4)]);
      }
      pos += 2 + 128;
    }
    if (pos !== buf.length) fail('PD2 block ends at ' + hex(pos) + ', file ends at ' + hex(buf.length));
    return res;
  };
  Decoder.prototype.tag = function (buf, pos, t) {
    if (!tagIs(buf, pos, t)) fail("expected b'" + t + "' at " + hex(pos));
  };

  Decoder.prototype.parseStash = function (buf, version) {
    if (version === undefined) version = 0x60;
    var magic = u32(buf, 0), ver = u32(buf, 4), size = u32(buf, 8), checksum = u32(buf, 12);
    if (magic !== 0xBB55BB55) fail('bad stash magic ' + magic.toString(16));
    if (size !== buf.length) fail('stash size field ' + size + ' != file size ' + buf.length);
    var calc = checksum32(buf);
    if (calc !== checksum) fail('stash checksum mismatch ' + checksum.toString(16) + ' vs ' + calc.toString(16));
    this.tag(buf, 0x10, 'st');
    this.tag(buf, 0x50, 'cu');
    var out = {kind: 'pd2_shared_stash', version: ver, checksum: checksum,
               st_block: bytesHex(buf, 0x12, 0x50), cu_block: bytesHex(buf, 0x52, 0x12E),
               st_first_dword: u32(buf, 0x12)};
    var r = this.readItemList(buf, 0x12E, buf.length, version, 'shared stash');
    if (r[1] !== buf.length) fail('stash item list ends at ' + hex(r[1]) + ', file ends at ' + hex(buf.length));
    out.items = r[0];
    return out;
  };

  function checksum32(buf) {
    var s = 0;
    for (var i = 0; i < buf.length; i++) {
      var b = (i >= 12 && i < 16) ? 0 : buf[i];
      s = (((s << 1) | (s >>> 31)) >>> 0);
      s = (s + b) >>> 0;
    }
    return s;
  }

  function parse(arrayBuffer, DATA, strict) {
    var buf = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    var dec = new Decoder(DATA, strict), out;
    if (buf[0] === 0x55 && buf[1] === 0xAA && buf[2] === 0x55 && buf[3] === 0xAA) out = dec.parseD2s(buf);
    else if (buf[0] === 0x55 && buf[1] === 0xBB && buf[2] === 0x55 && buf[3] === 0xBB) out = dec.parseStash(buf);
    else fail('unknown file magic');
    out.warnings = dec.warnings;
    return out;
  }

  var api = {parse: parse, SaveFormatError: SaveFormatError, checksum32: checksum32};
  root.PD2Save = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

