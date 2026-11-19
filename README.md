# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/androyesfernandez/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/androyesfernandez/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

The Leonida Field Guide: an offline trophy guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies. Every trophy carries its official name, description and grade, an original guide written for this entry that names its sources beside it, its roadmap stage, and — where PlayStation tracks one — an interactive counter you can tick off in the guide pane. Around the checklist sit a three-stage roadmap to the platinum, a missables view built around the one possibly-missable trophy (Positive Mental Attitude, Chapter 1), a "Next up" planner that sums the hours left on your road, and a Sources & honesty view that tags every guide confirmed, reported or unconfirmed and states the launch-week conflicts (the 15 vs 18 meditation count) instead of hiding them. Progress, counters, notes and your queue persist in localStorage and export/import as a JSON file; a spoiler setting blanks unearned story trophies until you earn them. No network requests, no Rockstar artwork — the look and the words are this entry's own.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 — the guide works fully offline from app/

# hand it in (writes the dossier to out/):
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ktpzxevq&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
