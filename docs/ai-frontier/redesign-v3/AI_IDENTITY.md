# How AI belongs in the game

Proposal added after the user's review question, 2026-11-04. The GBA art direction and trainer/team premise are confirmed. The depth of real-model involvement is still being discussed; this proposal is not implemented.

## The missing hook

Provider-inspired avatars, historical lore and an optional API arena alone leave the main adventure feeling like a generic creature RPG. Give the trainer something specifically about AI to do: **teach a companion how to approach a goal, improve the information it has, equip a useful tool, then observe how its approach performs.**

The fantasy world can remain warm and characterful. Relays, field notebooks, tools, rival guilds and corrupted signals make AI ideas tangible without turning dialogue into a technical lecture.

## A concrete encounter

A rival is attacking a relay while a decoy wisp distracts the team. Before the encounter, the player gives Emberquill the directive **Protect the relay before chasing the wisp**. A field note found on the route explains how to recognise a decoy. A verification lens can inspect the signal.

The trainer chooses which context to share and which tool to equip. During the battle, Emberquill's declared plan and the result are visible: it inspects the suspected decoy, protects the relay and identifies a useful opening. The player still makes tactical commands and team changes. The result shows whether the relay survived, turns spent and energy used. Improving the instruction or adding the missing clue gives a concrete reason to retry.

The encounter must be mechanically authored so success/failure can be checked by game rules. A model's persuasive explanation cannot award a win by itself.

## Player actions and AI meaning

| Game action | AI idea | What the player sees |
| --- | --- | --- |
| Give a short directive | Instructions and priorities | A visible goal with a small number of choices |
| Teach from a demonstrated turn | Examples / few-shot learning | A pattern the companion can use again |
| Select field notes to bring | Useful context and memory | A limited notebook, relevant clues and a reason to choose |
| Equip a lens, map reader or calculator device | Tool use | A named capability with clear input, result and charge cost |
| Test a rival scenario | Evaluation | Objective success conditions and a replayable result |
| Adjust the plan after a failure | Iteration | A changed plan and an understandable difference in the next attempt |

Start with guided choices and short plans. Free-text coaching can be an advanced feature after the core choices work. Avoid making a new player write long prompts or read raw JSON.

## Three implementation levels

| Option | AI connection | Runtime behaviour |
| --- | --- | --- |
| Keyless adventure + optional live challenges | AI coaching ideas are taught locally; selected challenges use actual providers | Authored rules for story battles; explicit bounded real-model requests in the live mode |
| Real AI in every battle | Actual models decide companion tactics throughout play | A model request for each decision, or one model-generated conditional plan per encounter |
| AI-inspired fiction only | Characters, lore and authored moves reference AI | No real-model decisions in the core adventure |

The current visual plan can serve any option. The battle command design needs a further review once the option is chosen. Ember/Grove/Tide currently describe fictional move effects; they are not a sufficient AI identity on their own and must not imply provider rankings.

## Cost-aware real AI design

A useful middle path is one real model-generated plan at the start of a battle, expressed through a small set of legal conditions/actions. The local engine executes it for the next several rounds. The player can inspect and choose when to replace it. This preserves immediate combat response, makes coaching visible and reduces repeated calls. It needs its own prototype to establish whether the choices are interesting.

Model output proposes allowed actions; the game validates legality, costs, targets and objectives. Unsupported output becomes an explicit retry/fallback, never an invented successful provider response. Live results display the actual provider/model version and the tested scenario. A companion's level, personality and fantasy stats remain separate from model capability claims.

See [the infrastructure cost scenarios](COSTS.md) before choosing how often live AI is used. This review has not selected a funded deployment or changed any billing setting.
