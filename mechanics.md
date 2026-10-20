# Project Diablo 2 Dragon Tail: mechanics and damage scaling

Audit date: 20 October 2026. Scope: the supplied S13 original ProjectDiablo.dll and the supplied S14 Open Beta DLL, plus their available skill tables. This is static analysis, not a live-game calibration. It does not establish what changed in every intermediate beta patch. Exact file fingerprints are in [sources.json](sources.json).

[Use the calculator](https://fvmpd2.github.io/pd2-dragon-tail-calculator/). [Calculation engine](engine.js). [Tests](test.js).

## Correction: compiled boot damage

The initial version incorrectly treated the zero damage fields in Armor.txt as the live boot values. The compiled Armor.bin contradicts those fields and is what the native kick helper reads. This revision corrects the model, adds all boot bases plus custom minimum/maximum inputs, and increases predicted damage accordingly. Earlier saved links without a boot selection now default to Myrmidon Greaves; select your own base.

## The main findings

1. **There is no separate timed explosion event in the Dragon Tail server handler.** It applies the radial fire damage during the skill's server action. It does not schedule a later explosion callback.
2. **The explosion is not calculated from the primary target's lost life or its physical damage after resistance.** The custom handler generates a fresh kick-damage seed and scales its physical field into fire. Physical immunity on the kicked target therefore does not itself zero that seed.
3. **Fire mastery / +fire skill damage is additive with Dragon Tail's explosion bonus**, rather than a separate multiplicative mastery pass on the completed explosion.
4. **Critical/Deadly Strike can increase the seed before it becomes fire.** The rebuilt explosion seed calls the critical routine again; it is not simply a copy of the initial kick's damage or strike outcome.
5. **Damage to demons/undead is evaluated against the kicked target when constructing that seed.** The handler then constructs one fire amount for the area application. The surrounding monsters' own fire resistances still determine their individual damage taken.
6. **Boot base damage matters.** The compiled PD2 Armor.bin contains the values read by the DLL; for example, Myrmidon Greaves are 83–155. The supplied Armor.txt is inconsistent and lists 0–0. The calculator uses the compiled values. The boots' strength coefficient is 100.
7. **Charges are not safely represented by multiplying the displayed kick by Tiger Strike's tooltip.** The initial hit and rebuilt explosion have different buffers and processing order. The calculator deliberately does not automatically transfer charge-only bonuses to the explosion.

## What happens in the handler

The server-do-50 handler validates game, attacker, target and combat data. It calls the progressive-charge release helper, applies the stored melee combat through the durability/combat helper, checks whether the attacker is dead, then constructs a fresh damage structure using the custom kick builder. It evaluates Dragon Tail's skill formula, reads fire mastery (stat 329), constructs a new fire-only area packet and immediately calls the radial application helper around the target's position.

This order has several consequences:

- An existing melee combat record and a valid target/path are prerequisites; this is not a ground-targeted fire nova.
- The explosion is centred on the **kicked target**, rather than on the Assassin.
- A successful initial attack and a damaging area application are different stages. Do not infer all hit, block or dodge behavior from a character-sheet damage number.
- The handler checks that the **attacker** survived the initial processing. An attacker death can abort the later burst.
- Target life is not an input to the rebuilt damage. There is no overkill multiplier or corpse-life multiplier in this formula.
- The handler does not require the monster's death animation to finish.
- Other martial-arts releases are their own effects. Do not attribute every projectile, meteor, poison cloud or fire visual during a finisher to Dragon Tail's explosion.

## Explosion delay, animation and attack speed

The server fire calculation and radial application happen inside the same invocation of the skill's server-do handler. **No additional whole-frame timer is present there.** This does not mean zero time from clicking: the character must reach the action point in the kick animation, and client rendering/network updates can show the effect later.

The skill uses the KK animation and `UseAttackRate=1`. Its parameter 4 is −20. The S14 table explicitly connects this to a temporary `attackrate` state; see the beta comparison below. Faster attack speed concerns the kick's animation/cadence, not a separate explosion fuse. FCR is not the cadence input for this attack.

The `dragontail missile` row (533) has Range 16 and a 16-frame visual animation using `ExpArrowExplode`. It has no base damage and no next-hit delay value. The server handler applies the damage radially instead of waiting for this visual missile to travel. **The 16-frame value is not a 16-frame damage delay, a repeated damage tick count, or a damage window.**

The radial damage call does not use the visual missile's normal hit processing or its NHD column. There is no Dragon-Tail-specific NHD timer in the traced handler. Other charge missiles can still have their own NHD and collision rules.

The calculator asks for an observed attack cycle if a sustained estimate is wanted. It does not invent an IAS breakpoint from the −20 parameter. Animation speed limits, weapon speed, skill IAS, action frames and interruptions need their own animation audit.

## Damage formula

Let:

- `L` = effective Dragon Tail level, including +skills;
- `T` and `F` = hard points in Dragon Talon and Dragon Flight;
- `M` = active fire mastery / +fire skill damage stat;
- `K` = the fresh physical kick seed, after the eligible strike multiplier, before target physical resistance.

The skill formula is:

```text
S = 40 + 13 × (L − 1) + 8 × (T + F)
Fire before resistance = K × (100 + S + M) / 100
```

The extra **100** comes from the DLL, rather than from the text formula alone. The synergy bonus is additive in percentage points; it is not `base × (1 + 0.08 × synergy points)`.

For level 40 with 20 hard points in each synergy:

```text
S = 40 + 13 × 39 + 8 × 40 = 867
Fire factor with no mastery = (100 + 867) / 100 = 9.67×
Fire factor with +50 mastery = 10.17×
Relative benefit of +50 mastery = 1017 / 967 − 1 = 5.17%
```

That +50 is not an additional 1.5× multiplication. Nor does an independent second mastery pass apply to the newly constructed fire-only area packet in this handler.

### Building the seed from attributes and gear

With boots equipped and ordinary nonnegative bonuses, the custom builder reduces to the following useful model:

```text
Base minimum = Dex / 4 + boot base minimum + off-weapon min damage + Damage +X + 2 × item_kickdamage
Base maximum = Dex / 3 + boot base maximum + off-weapon max damage + Damage +X + 2 × item_kickdamage
ED pool = Strength + effective off-weapon ED + matching damage-to-demon/undead ED
Kick range = Base range × (100 + ED pool) / 100
```

The code works at 1/256 damage precision; `Dex / 3` can retain fractions. The calculator reproduces the principal fixed-point endpoint truncations, but the expected average uses endpoint means instead of enumerating the entire random distribution.

Details behind this model:

- The custom builder explicitly creates dexterity-derived base minimum/maximum using divisors 4 and 3.
- The native kick helper supplies the boots and their strength/dexterity coefficients. The compiled Armor.bin stores base minimum/maximum at record offsets 0xFE/0xFF (424-byte records, after the 4-byte count). All 15 boot bases are selectable in the calculator. The matching strength coefficient is 100, with no dexterity coefficient. Armor.txt's zero minimum/maximum fields do not match these compiled records.
- The helper adds the item kick-damage stat to the output, then includes it again in the worn boots' contribution. Thus that particular stat is counted twice on this path. This is not a claim that every item described as increasing kick damage uses that same stat.
- The custom builder subtracts weapon item min/max stats from the character's min/max totals. Local weapon physical base damage and local weapon ED therefore are not the kick's normal scaling source. The distinct `damage +X` stat is added explicitly.
- Attribute bonuses, generic ED, off-weapon item ED and the matching monster-type bonus go into the kick scaling pool. Do not enter strength twice.
- The native helper temporarily removes weapon contributions while collecting its ED values. Use effective active-weapon totals for global modifiers; simply adding everything printed on two weapons is not established by this audit.
- The native helper has a −90 floor on part of the ED pool. The combined-ED entry is intended for ordinary builds; use a validated manual seed for large negative bonuses, unusual equipment or no boots.

**Example:** Myrmidon Greaves (83–155), 300 dexterity, 200 strength and no other physical bonuses gives a seed range of (75 + 83) × 3 to (100 + 155) × 3 = **474–765**. With level 40 and both synergies maxed, the normal explosion is approximately **4,583.58–7,397.55 fire**, before resistance and strike outcomes.

### Critical Strike and Deadly Strike

The kick builder calls the PD2 critical routine before constructing the fire amount. The traced S13 and S14 routines check Critical Strike first, capped at 75%; if it fails, it checks Deadly Strike, capped at 75% plus the maximum-DS stat (never above an actual 100% probability). Base multipliers are 2× and 1.5× respectively. The separate multiplier stats modify these values.

```text
P(CS) = capped CS chance
P(DS) = (1 − P(CS)) × capped DS chance
P(normal) = 1 − P(CS) − P(DS)
Mean seed multiplier = P(normal) + P(CS) × CS multiplier + P(DS) × DS multiplier
```

They do not stack on the same seed. There is no second separate strike roll on the converted fire packet. Since the burst amount is constructed once, the area does not reroll its seed/critical separately for each surrounding enemy. Their resistances and defensive outcomes can differ.

The custom handler reruns the builder after initial melee processing. Accordingly, a critical initial kick does not prove that the fire burst used a critical seed. Conversely, the burst's seed can critically roll independently of the earlier kick.

### Physical resistance versus fire resistance

The primary monster's physical resistance is not used to reduce the new kick seed before fire construction. Therefore the old vanilla shortcut “physical immune anchor means no explosion damage” does not follow for this custom handler.

The monster **receiving** the explosion uses its own fire resistance, immunity and applicable reductions. It is not assigned the anchor's fire resistance. Physical pierce does not turn into fire pierce and is not an explosion multiplier merely because the seed was physical.

The calculator implements the resistance convention used by the existing PD2 calculator: ordinary −enemy fire resistance cannot break an intact immunity; Conviction/Lower Resist have half effectiveness against initial immunity; once broken, ordinary pierce participates; reductions below zero are halved; final resistance is floored at −100. Breaking sources are rounded separately. These generic resistance rules are kept separate from the verified Dragon Tail conversion. Enter actual reductions after any boss-specific curse penalties. Flat reduction, absorb, PvP and exceptional immune/invulnerable states are not modeled.

## Niche scaling and positioning opportunities

### Choose the monster you kick

The fresh kick builder receives the primary target. It checks that target for demon/undead ED before producing the one shared fire amount. When those bonuses are large, kicking a matching monster can yield a stronger area burst against the surrounding pack. The other enemies still need to pass the area eligibility/range checks and apply their own fire resistance.

The area is centred on the target's coordinates, so choosing a monster in the middle of a pack can reach more enemies than choosing one at its edge. Parameter 3 is a fixed radius value of 6, not an increase per skill level. Raising Dragon Tail improves its damage; the row does not increase this radius with levels.

The radial helper, reached at D2Game `6FCC0C70`, uses target-filter and obstruction processing rather than a physical moving fire missile. No guarantee of hitting through pillars, walls or special target states is made here. Visual overlap alone is not proof of a valid damage application.

### Dexterity, strength, flat damage, ED and fire mastery

Dexterity increases the base range; strength and effective physical ED scale that range; Dragon Tail's skill/synergy/mastery pool then scales the result into fire. These are separate scaling stages. Additional bonuses within the same pool dilute one another.

At 300 dexterity with Myrmidon Greaves and no other flat damage, +20 dexterity gives about 2.82% more average seed. At 200 strength and no other ED, +20 strength gives about 6.67% more seed. Once large ED is active, another +20 strength is a smaller relative improvement. Flat off-weapon damage becomes more valuable when both later multipliers are high.

At level 40 with 40 synergy hard points and no mastery, +1 Dragon Tail level gives 13/967 ≈ 1.34% more fire; one additional synergy hard point gives 8/967 ≈ 0.83%. Fire pierce may be substantially stronger than +fire skill damage against resistant monsters, provided immunity is already broken. The calculator compares these upgrades for the entered setup.

Upgrading a boot base can improve its kick damage. Select the actual upgraded base in the calculator. The compiled PD2 values differ from the bundled vanilla patch in some cases: Myrmidon Greaves are 83–155 in PD2 versus 83–149 in patch_d2.mpq. Ethereal weapon damage and local weapon ED do not substitute for boot base damage.

## Charge interactions: important boundary

The handler releases martial-arts effects before rebuilding the explosion damage. It then zero-initializes a fresh damage packet. The legacy progressive-damage helper reached through the kick builder checks the successful-hit flag before injecting its charge-specific ED; an empty packet is not the same as the initial successful melee packet.

**This is a reason to test Tiger Strike transfer explicitly, not to copy a vanilla Tiger Tail formula into the calculator.** No automatic Tiger Strike or Cobra ED contribution is included. Generic ED that is demonstrably still active when the fresh explosion seed is built can be entered under effective ED. Manually patched Cobra DLLs from earlier tests are not the original S13 or S14 files audited here.

Other charge releases may add substantial independent damage. This fire-only model excludes those bolts, novas, meteors and clouds. Their synergies, mastery, NHD, missile blocking and timing must be computed separately. The same applies to Crushing Blow, Open Wounds, leech and attack/casting procs: they are not automatically copied into the clean fire-only area packet. The initial kick can have its own on-hit behavior; this calculator does not calculate it.

### Useful in-game checks

- For timing, remove all charges and chance-to-cast effects, kick a durable isolated target while another durable target is inside the radius, and compare their life changes frame by frame. Use life loss rather than the start/end of the fire sprite. The game runs at 25 simulation frames/second.
- For the physical-immunity question, compare normal fire-vulnerable secondary targets around physical-resistant versus physical-immune anchors, keeping monster type and other stats identical.
- For Tiger Strike, use no CS/DS, no other charges and fixed equipment. Compare repeated secondary-target life loss with zero versus three Tiger charges. This isolates the explosion from the initial hit and Tiger's own splash.
- For the demon/undead-anchor interaction, keep the secondary monster type unchanged, change only the primary type, and repeat with and without a large race ED source.

## S13 versus the supplied S14 Open Beta

| Part | S13 supplied files | S14 beta supplied files | Result |
|---|---|---|---|
| Dragon Tail server-do function | 50, custom handler `102FA2F0` | 50, custom handler `103AACF0` | Same traced calculation/order, relocated calls |
| Fire formula | 40 + 13 per level after level 1 + 8 per synergy hard point | Same | No damage coefficient change found |
| Radius parameter | 6 | 6 | No radius change found |
| Attack-rate parameter | −20 | −20 | Same parameter |
| Explicit skill aura fields | Empty in the earlier extracted S13 Skills.txt | `temp_skill_buff`, `attackrate`, `par4` | Beta makes the temporary attack-rate state explicit in the row |
| Kick builder | `1026EAD0` | `10300760` | Same traced dex/flat/ED structure |
| Explosion fire mastery | Added to 100 + calc1 | Same | No multiplicative mastery change found |
| Explosion scheduling | Immediate radial call in handler | Same | No separate delay added |
| Visual missile | `dragontail missile`, row 533 | Same identity | Visual lifetime is separate from damage |

The aura-field difference does **not** alone prove S13 had no penalty: the legacy start function already consumes parameter 4. This audit does not infer a new numeric attack speed breakpoint from a table wiring change.

The S14 formula uses Dragon Talon and Dragon Flight hard points. It does not use their own enhanced-damage formulas as synergy values. Their unrelated coefficient changes therefore must not be copied into Dragon Tail's 8%-per-hard-point formula.

This is a comparison of the available snapshots, not a claim that all open-beta builds have been examined or that later release patches match them.

## Evidence map

Addresses are preferred virtual addresses in the exact fingerprints in sources.json, not portable offsets for modifying another version.

| Finding | S13 location | S14 beta location / supporting data |
|---|---|---|
| Install custom server-do-50 | `102BE479` | `1036830A` |
| Full Dragon Tail handler | `102FA2F0–102FA4AB` | `103AACF0–103AAEAB` |
| Fresh kick builder called for burst | `102FA398–102FA3C1` | `103AAD98–103AADC1` |
| Read fire mastery stat 329 | `102FA3DD–102FA3E5` | `103AADDD–103AADE5` |
| Add 100 + calc1 + mastery | `102FA404–102FA425` | `103AAE04–103AAE25` |
| Fire-only radial application | `102FA42A–102FA474` | `103AAE2A–103AAE74` |
| Custom kick builder | `1026EAD0–1026ED2D` | `10300760` onward |
| Dexterity base / off-weapon flat / race ED | `1026EB17–1026ECC3` | Same builder structure in beta |
| Critical routine called by builder | `1026ECEC`, wrapper `1026F8C0` → `10270E00` | Same call sequence in beta builder |
| Strike chance caps and priority | `10270D20–10270DEE` | `10302A10–10302ADE` (same caps/priority) |
| Native worn-boot helper | D2Common export 10323, `6FDA1C60–6FDA1EBE` | Supplied common DLL fingerprint unchanged |
| Legacy progressive ED gate | D2Game `6FCB1E30` | Successful-hit flag gate; see charge caveat |
| Radial target callback | D2Game `6FCC1210` → `6FCC10B0` | Per-target packet copy / damage processing |
| Table rows | Skills 270, Missiles 533, compiled Armor boot records | Extracted from supplied pd2data.mpq |

## Calculator scope

The calculator predicts the fire explosion seed and per-enemy damage, with explicit assumptions. It is not a full Assassin simulator. It excludes the initial kick's direct damage, charge-release damage, weapon-specific conditional effects, Crushing Blow, Open Wounds, absorb/flat reduction, exact AI/pathing, interruptions, boss invulnerability, PvP and overflow. Its optional throughput estimate takes attack cadence and failure probabilities supplied by the user; it does not solve IAS or prove eligibility against a particular defense.

Tests exercise hand-calculated examples, additive mastery, strike probabilities/caps, immunity, below-zero resistance, race anchoring, validation and attempted-attack throughput. Passing them verifies the implemented model; it does not replace an in-game comparison. In particular, charge transfer and exact visual/action-frame alignment remain explicit live-test targets.
