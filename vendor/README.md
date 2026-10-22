# Character reader credits

`save.js`, `auras.js`, `stats.js`, and `data.js` are the character decoder, aura rules, stat engine and supporting data from [RoofooEvazan's PD2 Advanced Stats](https://github.com/RoofooEvazan/pd2-advanced-stats), retrieved 22 October 2026 from its published `index.html`. Original source comments are preserved. The files are separated from the page's script bundle without changing their calculation code. No game art is included.

These modules load only when importing a character. Parsing runs locally; files are never sent to a server. This calculator's adapter is in `importer.js`. Unsupported save versions, malformed files and checksum failures are rejected by the reader. Keep the reader and its supporting tables together when updating them.

`hireling.js` contains the expansion Hireling rows (identity, level/experience scaling, skills) extracted from the same published `MINION_DATA` bundle. The Dragon Tail adapter uses these for mercenary native aura levels.
