# 🗣️ Picture Words — Say What You See!

A browser game for practicing simple English words. A picture of a common
object appears — an animal, a household item, or an everyday machine — and the
player says its name out loud before the timer runs out. Correct names drop into
the green **Got it!** bucket; missed ones go to the red **Try again** bucket and
come back later. The game ends when every picture is green.

- **140 pictures** across 7 categories (animals, food, household, clothing, music,
  machines, nature) — the core set plus ImageNet-derived words mapped to emoji.
- **Choose-pictures menu** on the entry screen: a checkbox list (grouped by
  category) to include/exclude each word, showing **this-week per-word stats**
  (solve rate, and a ⚠ on words that are often missed despite a voice being heard,
  or that match ambiguously) — so you can drop the ones that misfire.
- **Repetition-tolerant**: say a word 1–5× (spaced or run together) and it counts.
- **Time per picture:** 3 / 4 / 5 / 6 seconds
- Speaks the correct word on a miss to reinforce learning
- **Synonyms and similar classes count as equal** — a 🐸 is accepted as
  *frog* **or** *toad*; a 🚗 as *car*, *automobile*, or *auto*; a 🛋️ as
  *couch* or *sofa*; a 🚚 as *truck* or *lorry*; and so on.

## Files

| File             | Purpose                                                            |
| ---------------- | ----------------------------------------------------------------- |
| `index.html`     | The game UI (imports the matcher from `words.js`).                 |
| `words.js`       | **Single source of truth**: the vocabulary + speech matcher.      |
| `words.test.js`  | Acceptance test suite (no false negatives, synonym equivalence).  |

The matcher lives in `words.js` rather than inside the page so the test suite
exercises *exactly* the code the game runs.

## Test

The suite guarantees the core property: **every recorded vocalization is
accepted against its ground-truth label (no false negatives)**, and that
**synonyms / highly-similar classes (frog ⇄ toad, couch ⇄ sofa, truck ⇄
lorry, …) are treated as equal**.

Because a unit test can't replay real microphone audio, the suite uses a
curated corpus per picture: the realistic things a child says and the realistic
ways the Web Speech recognizer transcribes them — canonical word, child-speak,
regional variants, synonyms, leading articles/filler, and simple plurals. It
also checks the property from the other side (clearly-wrong words are rejected,
so "accept everything" can't pass) and that no single word is the answer to two
different pictures.

```sh
node --test          # or:  npm test
```

All cases must pass. When you add a picture to `words.js`, add its corpus entry
to `words.test.js` (a hygiene test fails if you forget).

## Play

It uses the browser's Web Speech API, so:

- Use **Chrome or Edge** (desktop or Android). Firefox isn't supported; iOS
  Safari is unreliable.
- Needs **microphone access** and an **internet connection**.
- Must be served from a **secure origin** (`https://…` or `http://localhost`):
  the microphone is blocked on plain `file://` pages, and ES modules won't load
  from `file://` either.

### Run locally

```sh
./serve.sh        # serves http://localhost:8001
```

Then open <http://localhost:8001>. No mic? You can also **type** the word.

## Pictures are emoji

The objects are rendered as emoji, so the game stays a self-contained set of
files with no image assets or downloads. To use real photos instead, swap each
item's `emoji` field in `words.js` for an `<img>`/background and adjust the card
rendering in `index.html`.
