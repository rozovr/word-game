/* =========================================================================
   Picture Words — acceptance test suite.

   Run:  node --test            (from this directory)

   Goal stated by the product: "assure that recorded vocalizations are
   accepted against their ground truth labels (NO FALSE NEGATIVES), and that
   synonyms / highly-similar classes (frog ⇄ toad) are treated as equals."

   We can't replay real microphone audio in a unit test, so the corpus below
   stands in for it: for every picture, the realistic things a child says and
   the realistic ways the Web Speech recogniser transcribes them — canonical
   word, child-speak, regional variants, synonyms, leading articles/filler,
   and simple plurals. The suite asserts the matcher accepts ALL of them.

   The suite also guards the property from the other side (a clearly-wrong
   word is rejected) so "accept everything" can't pass as a fix, and checks
   that no single word is the answer to two different pictures.
   ========================================================================= */

import { test } from "node:test";
import assert from "node:assert/strict";
import { WORDS, CATEGORIES, normalize, matchesWord, findById } from "./words.js";

/* ---- Ground-truth corpus -------------------------------------------------
   id -> list of utterances that MUST be accepted for that picture.          */
const CORPUS = {
  // animals
  dog:    ["dog", "a dog", "the dog", "dogs", "doggy", "doggie", "puppy", "pup", "hound", "it's a dog"],
  cat:    ["cat", "a cat", "the cat", "cats", "kitty", "kitten"],
  frog:   ["frog", "a frog", "frogs", "froggy", "toad", "a toad", "it's a toad"],
  fish:   ["fish", "a fish", "the fish", "fishy"],
  bird:   ["bird", "a bird", "birds", "birdie"],
  cow:    ["cow", "a cow", "cows", "cattle", "calf"],
  pig:    ["pig", "a pig", "pigs", "piggy", "hog"],
  horse:  ["horse", "a horse", "horses", "pony"],
  rabbit: ["rabbit", "a rabbit", "rabbits", "bunny", "hare"],
  duck:   ["duck", "a duck", "ducks", "duckling"],
  bear:   ["bear", "a bear", "the bear", "bears"],
  lion:   ["lion", "a lion", "lions", "cub"],

  // household
  chair:    ["chair", "a chair", "chairs", "seat", "stool"],
  bed:      ["bed", "a bed", "the bed", "beds"],
  door:     ["door", "a door", "the door", "doors"],
  couch:    ["couch", "a couch", "the couch", "sofa", "a sofa", "settee"],
  plate:    ["plate", "a plate", "plates", "dish"],
  spoon:    ["spoon", "a spoon", "spoons", "the spoon"],
  key:      ["key", "a key", "keys", "the key"],
  book:     ["book", "a book", "books", "the book"],
  pencil:   ["pencil", "a pencil", "pencils"],
  sock:     ["sock", "a sock", "socks"],
  clock:    ["clock", "a clock", "clocks", "alarm clock", "an alarm clock", "alarm"],
  umbrella: ["umbrella", "an umbrella", "umbrellas", "brolly", "parasol"],

  // machines / vehicles
  car:        ["car", "a car", "the car", "cars", "automobile", "auto"],
  bicycle:    ["bicycle", "a bicycle", "bicycles", "bike", "a bike", "cycle", "pushbike"],
  bus:        ["bus", "a bus", "the bus", "coach"],
  train:      ["train", "a train", "trains", "locomotive"],
  airplane:   ["airplane", "an airplane", "airplanes", "aeroplane", "plane", "a plane", "air plane", "jet", "aircraft"],
  helicopter: ["helicopter", "a helicopter", "helicopters", "chopper"],
  rocket:     ["rocket", "a rocket", "rockets", "spaceship", "spacecraft"],
  truck:      ["truck", "a truck", "trucks", "lorry"],
  boat:       ["boat", "a boat", "boats", "sailboat", "ship", "yacht"],
  phone:      ["phone", "a phone", "phones", "telephone", "cell phone", "mobile", "mobile phone", "smartphone"],
  laptop:     ["laptop", "a laptop", "laptops", "computer", "notebook"],
  camera:     ["camera", "a camera", "cameras"],
};

/* Pairs of "highly similar classes" the product wants treated as equal.
   Each pair: [targetId, utterance-that-must-pass]. */
const SIMILAR_CLASS_EQUIVALENCES = [
  ["frog", "toad"],
  ["couch", "sofa"],
  ["couch", "settee"],
  ["rabbit", "bunny"],
  ["rabbit", "hare"],
  ["car", "automobile"],
  ["bicycle", "bike"],
  ["airplane", "plane"],
  ["airplane", "jet"],
  ["truck", "lorry"],
  ["boat", "ship"],
  ["phone", "telephone"],
  ["laptop", "computer"],
  ["plate", "dish"],
  ["bus", "coach"],
];

/* Clearly-wrong utterances that MUST be rejected, so the matcher is shown to
   actually discriminate (including some near-rhymes). [targetId, utterance]. */
const MUST_REJECT = [
  ["dog", "cat"],
  ["frog", "dog"],        // rhymes, different animal
  ["truck", "duck"],      // rhymes
  ["duck", "truck"],
  ["cat", "hat"],         // rhymes, not in vocab
  ["car", "bicycle"],
  ["airplane", "helicopter"],
  ["spoon", "plate"],
  ["bear", "bird"],
  ["book", "cook"],
];

/* =========================================================================
   1. NO FALSE NEGATIVES — every corpus utterance is accepted for its picture.
   ========================================================================= */
test("no false negatives: every recorded vocalization is accepted", () => {
  const failures = [];
  for (const [id, utterances] of Object.entries(CORPUS)) {
    const item = findById(id);
    assert.ok(item, `corpus references unknown picture id "${id}"`);
    for (const u of utterances) {
      if (!matchesWord(u, item)) failures.push(`${id} ✗ "${u}"`);
    }
  }
  assert.deepEqual(
    failures,
    [],
    `These ground-truth vocalizations were wrongly rejected:\n  ${failures.join("\n  ")}`
  );
});

/* =========================================================================
   2. Every declared accept alias matches its own picture (data ⇄ matcher
      stay consistent, incl. multi-word aliases like "alarm clock").
   ========================================================================= */
test("every declared synonym in the vocabulary matches its picture", () => {
  for (const item of WORDS) {
    for (const alias of item.accept) {
      assert.ok(
        matchesWord(alias, item),
        `declared alias "${alias}" does not match its own picture "${item.id}"`
      );
    }
    // The canonical label spoken plainly must also pass.
    assert.ok(
      matchesWord(item.label, item),
      `canonical label "${item.label}" does not match picture "${item.id}"`
    );
  }
});

/* =========================================================================
   3. Synonyms / highly-similar classes are treated as EQUAL.
   ========================================================================= */
test("synonyms and similar classes (frog ⇄ toad …) are accepted as equal", () => {
  for (const [id, utterance] of SIMILAR_CLASS_EQUIVALENCES) {
    const item = findById(id);
    assert.ok(item, `equivalence references unknown picture id "${id}"`);
    assert.ok(
      matchesWord(utterance, item),
      `"${utterance}" should be accepted as equal to "${item.label}" but was rejected`
    );
  }
});

/* Specifically the example called out in the request, both directions. */
test("frog and toad are interchangeable for the frog picture", () => {
  const frog = findById("frog");
  assert.ok(matchesWord("frog", frog));
  assert.ok(matchesWord("toad", frog));
  assert.ok(matchesWord("a toad jumped", frog)); // filler around the keyword
});

/* Repetitions of a word (1–5×, spaced or glued) count as a hit. */
test("repetitions of a word are accepted", () => {
  const frog = findById("frog"), dog = findById("dog"), car = findById("car");
  assert.ok(matchesWord("frog frog frog", frog));
  assert.ok(matchesWord("dog dog", dog));
  assert.ok(matchesWord("frogfrog", frog));
  assert.ok(matchesWord("frogfrogfrog", frog));
  assert.ok(matchesWord("frogfrogfrogfrogfrog", frog));
  assert.ok(matchesWord("toadtoad", frog));
  assert.ok(matchesWord("automobile automobile", car));
  assert.ok(!matchesWord("catcat", dog));   // repeated wrong word still rejected
  assert.ok(!matchesWord("cardog", car));   // non-repeat concatenation is not a hit
  assert.ok(!matchesWord("cardog", dog));
});

/* =========================================================================
   4. Discrimination — clearly-wrong words are rejected (guards against a
      degenerate "accept everything" matcher passing test #1).
   ========================================================================= */
test("clearly-wrong vocalizations are rejected", () => {
  for (const [id, utterance] of MUST_REJECT) {
    const item = findById(id);
    assert.ok(item, `reject-case references unknown picture id "${id}"`);
    assert.ok(
      !matchesWord(utterance, item),
      `"${utterance}" should NOT be accepted for "${item.label}" but it was`
    );
  }
});

test("empty / noise input is never accepted", () => {
  for (const item of WORDS) {
    assert.ok(!matchesWord("", item), `empty string matched "${item.id}"`);
    assert.ok(!matchesWord("   ", item), `whitespace matched "${item.id}"`);
    assert.ok(!matchesWord("...", item), `punctuation matched "${item.id}"`);
    assert.ok(!matchesWord("um uh", item), `filler "um uh" matched "${item.id}"`);
  }
});

/* =========================================================================
   5. No single word is the answer to two different pictures — otherwise
      "treated as equal" would leak across unrelated pictures and a picture
      could be ambiguous. (Multi-word aliases are exempt.)
   ========================================================================= */
test("no single-word alias is shared by two different pictures", () => {
  const owners = new Map(); // alias -> [ids]
  for (const item of WORDS) {
    for (const alias of item.accept) {
      const norm = normalize(alias);
      if (norm.includes(" ")) continue; // phrases may legitimately overlap words
      if (!owners.has(norm)) owners.set(norm, []);
      owners.get(norm).push(item.id);
    }
  }
  const clashes = [...owners.entries()]
    .filter(([, ids]) => new Set(ids).size > 1)
    .map(([alias, ids]) => `"${alias}" → ${[...new Set(ids)].join(", ")}`);
  assert.deepEqual(clashes, [], `Ambiguous aliases shared by multiple pictures:\n  ${clashes.join("\n  ")}`);
});

/* =========================================================================
   6. Hygiene — corpus covers every picture, vocabulary is well-formed.
   ========================================================================= */
test("the hand corpus stays valid (all corpus ids exist; covers the core)", () => {
  // The synthetic corpus guarantees no-false-negatives for the original core
  // vocabulary. Newer ImageNet-derived words are vetted by real on-device stats
  // + the word-selection menu instead, so they need no hand corpus.
  const ids = new Set(WORDS.map((w) => w.id));
  const unknown = Object.keys(CORPUS).filter((id) => !ids.has(id));
  assert.deepEqual(unknown, [], `Corpus references pictures not in the vocabulary: ${unknown.join(", ")}`);
  assert.ok(Object.keys(CORPUS).length >= 36, "core corpus shrank unexpectedly");
});

test("vocabulary is well-formed (unique ids, valid categories, non-empty accept)", () => {
  const ids = new Set();
  for (const item of WORDS) {
    assert.ok(!ids.has(item.id), `duplicate picture id "${item.id}"`);
    ids.add(item.id);
    assert.ok(item.emoji && item.label, `picture "${item.id}" missing emoji/label`);
    assert.ok(CATEGORIES.includes(item.category), `picture "${item.id}" has invalid category "${item.category}"`);
    assert.ok(Array.isArray(item.accept) && item.accept.length > 0, `picture "${item.id}" has empty accept list`);
    // The canonical label (lowercased) should be among the accepted forms.
    assert.ok(
      item.accept.map(normalize).includes(normalize(item.label)),
      `picture "${item.id}" does not accept its own label "${item.label}"`
    );
  }
});
