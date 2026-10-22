# PD2 Dragon Tail calculator

[Open the calculator](https://fvmpd2.github.io/pd2-dragon-tail-calculator/).

Estimates Dragon Tail's average fire explosion damage per enemy, including boots, attributes, off-weapon damage, synergies, Critical/Deadly Strike and fire resistance. The initial physical kick and other charge releases are excluded.

- **IAS calculator:** weapon speed, weapon/gear IAS, dual claws, Burst of Speed hard points, Fanaticism and slows. Calculated frames feed the sustained estimate; observed frames can override them.
- **Debuffs:** Conviction and Lower Resist level selectors use supplied S14 game formulas. Lower Resist includes Curse Mastery. Manual reduction overrides remain available.
- **Character import:** choose an Assassin `.d2s` save or PD2 Armory `.json` export. Equipment, inventory charms, skill levels and supported item stats populate the build. Files stay in your browser. Other planner JSON schemas are not supported.
- **Sharing:** Copy build link saves the current inputs in the URL; no account or server is needed.

Import notes identify values to review. Saves do not establish which manually cast buffs, party/mercenary auras or curses are active. Burst of Speed is assumed active at its hard-point level. Native mercenary auras and equipment-granted auras are applied automatically, assuming the mercenary is alive and in range (a dead mercenary in a save is excluded). Mercenary level is read directly or inferred from saved experience; missing native-aura data is flagged. Review other party buffs and set the monster's resistance/hit assumptions. Set and socket modifiers are handled by the character reader; unsupported files are rejected rather than partially applied. Review unusual item modifiers and active weapon selection after import.

## Sources and limits

Damage mechanics: [mechanics & evidence](mechanics.html). Debuff formulas and Dragon Tail's −20 speed modifier come from supplied S14 Open Beta patch 1 `Skills.txt`; hashes/formulas are in `gamedata-provenance.json`. Weapon base speeds use the supplied S14 table. Assassin kick animations are 13 frames at base speed 256. Timing follows the [PD2 IAS audit](https://roofooevazan.github.io/pd2-ias-calc/). Character parsing and item aggregation use locally bundled [PD2 Advanced Stats](https://github.com/RoofooEvazan/pd2-advanced-stats) modules; see [credits](vendor/README.md).

This is a static code model, not a live-game calibration. Sustained damage assumes held kicks, identical exposed targets and the entered hit/application chances; it omits charge-building, travel and downtime. PvP, absorb, exceptional target states and integer overflow are outside scope.

## Run and test

Open `index.html`, or serve this folder with any static web server. No build step.

```sh
node test.js
node features-test.cjs
node browser-test.cjs # requires Playwright; PD2_BROWSER_PATH can select a browser
```

Optional real-save verification is local only: never commit character files or personal exports.
