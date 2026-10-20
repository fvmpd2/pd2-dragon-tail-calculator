# PD2 Dragon Tail Damage Calculator

A standalone Dragon Tail fire-explosion calculator and mechanics audit for **Project Diablo 2 S13 / S14 Open Beta**. Built with AI from the supplied DLLs and text tables, checked 20 October 2026.

**[Use the calculator](https://fvmpd2.github.io/pd2-dragon-tail-calculator/)** · **[Read the DLL mechanics audit](mechanics.md)**

Predict Dragon Tail damage from dexterity, strength, off-weapon flat damage, effective ED, hard-point synergies, fire mastery, Critical Strike, Deadly Strike and enemy fire resistance. A manual pre-resistance kick input supports externally validated gear calculations. Build links preserve inputs. Upgrade comparisons show which stats improve the entered setup.

## Mechanics covered

- Explosion timing versus animation lifetime: no separate scheduled explosion timer found.
- A freshly generated kick seed rather than physical damage taken by the primary monster.
- Additive fire mastery and the DLL's additional 100% term.
- Demon/undead damage evaluated against the kicked target.
- Critical/Deadly Strike before fire construction, with a fresh explosion seed.
- Zero base boot damage in the supplied PD2 tables.
- S13 versus S14 beta table and handler differences.
- Charge-transfer caveats, player testing scenarios and exact source fingerprints.

## Run locally

Open `index.html` in a browser. No account, dependency installation or original game DLL is required. Run `node test.js` for the formula checks.

For GitHub Pages, publish `main` / repository root. Files needed at runtime: `index.html`, `style.css`, `engine.js`, `app.js`. Keep `mechanics.html`, `mechanics.md`, `sources.json` and `evidence.asm` beside them for reproducibility.

## Scope and limits

Results are **fire explosion damage**, excluding the initial kick and other martial-arts releases. They are a static-code model, not a live-game-calibrated full-character DPS simulator. Tiger Strike/Cobra charge ED is not automatically assumed to transfer into the rebuilt explosion seed. See the [charge interaction evidence and testing plan](mechanics.md#charge-interactions-important-boundary).

The generic resistance model halves breaking reductions against initial immunity and the below-zero reduction portion. Enter effective debuff values after any boss penalties. Flat reduction, absorb, PvP, extreme-value overflow, exceptional target states and IAS breakpoints are not simulated. Expected averages approximate fixed-point roll distributions.

Source comparisons cover the supplied snapshots, not every intermediate beta update. No original game binaries or full data archives are redistributed.
