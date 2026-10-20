# Original character atlas

The nine provider routes in the optional live arena have distinct **fictional** pixel characters. These are original game identities, not provider mascots, endorsements, model capability claims, or benchmark ratings. `client/src/components/creatures/pixelData.js` is the source for names, five-color palettes, 18×20 sprite grids, and provider/fighter/hero mappings. Both the React creature canvas and Pixi texture baker consume that one atlas.

| Provider route | Character | Visual identity | Story use |
| --- | --- | --- | --- |
| Anthropic | Emberquill | Coral feather horns, glowing beak and feet | Warden Archivist |
| OpenAI | Kitewhisk | Mint pointed ears, golden kite tail | Research Guild Pathfinder |
| Google | Duplet | Paired blue heads, winding shared body | Observatory Stargazer |
| OpenRouter | Crosswake | Rose body with many branching arms | Arena roster |
| Groq | Zipcat | Low orange sprinting silhouette | Arena roster |
| xAI | Rampart | Steel horns and fortress brow | Arena roster |
| Together | Latticewing | Amber striped body and mint wings | Arena roster |
| Ollama | Mossback | Violet long ears and green garden saddle | Arena roster |
| Custom | Patchbyte | Asymmetric violet machine with cyan core | Arena fallback |

Each provider route has a unique mapped character; fighter IDs and the three RPG hero IDs resolve to the same atlas. Source and shape validation is in `shared/rpg/characterArt.test.js`. Future animation frames should preserve these silhouettes, palettes, and identity names. Do not add a real model's alleged abilities to this table without separate current provider documentation and an explicit product reason.
