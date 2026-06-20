/* =========================================================================
   Picture Words — shared vocabulary + speech-matching logic.

   This module is the SINGLE SOURCE OF TRUTH for two consumers:
     - index.html        (the game UI, via <script type="module">)
     - words.test.js      (the no-false-negatives test suite, via node --test)

   Keeping the matcher here — rather than inlined in the page — is what makes
   the test meaningful: the test exercises exactly the code the game runs.
   ========================================================================= */

/* ---- Vocabulary ----------------------------------------------------------
   Each item:
     id       stable identifier
     emoji     the picture shown to the player
     label     the canonical answer (what we reveal / speak on a miss)
     category  "animals" | "household" | "machines" (for the deck filter)
     accept    every spoken form we treat as correct for this picture —
               the word itself, child-speak nicknames, regional variants,
               and *synonyms / highly-similar classes* (frog ⇄ toad,
               couch ⇄ sofa, truck ⇄ lorry, …). Only the CURRENT picture's
               accept set is ever checked during play, so an alias that also
               names another picture never cross-matches mid-game.

   All accept entries are lowercase. Single-word entries match any spoken
   token (so "a dog" works); multi-word entries match as a whole phrase.
   Plural/singular differences are tolerated automatically (see `matchesWord`),
   so you don't need to list both "book" and "books".                        */
export const WORDS = [
  // ---------------- Animals ----------------
  { id: "dog",      emoji: "🐶", label: "Dog",      category: "animals",   accept: ["dog", "doggy", "doggie", "puppy", "pup", "hound"] },
  { id: "cat",      emoji: "🐱", label: "Cat",      category: "animals",   accept: ["cat", "kitty", "kitten"] },
  { id: "frog",     emoji: "🐸", label: "Frog",     category: "animals",   accept: ["frog", "toad", "froggy"] },
  { id: "fish",     emoji: "🐟", label: "Fish",     category: "animals",   accept: ["fish", "fishy"] },
  { id: "bird",     emoji: "🐦", label: "Bird",     category: "animals",   accept: ["bird", "birdie"] },
  { id: "cow",      emoji: "🐮", label: "Cow",      category: "animals",   accept: ["cow", "cattle", "calf"] },
  { id: "pig",      emoji: "🐷", label: "Pig",      category: "animals",   accept: ["pig", "piggy", "hog"] },
  { id: "horse",    emoji: "🐴", label: "Horse",    category: "animals",   accept: ["horse", "pony"] },
  { id: "rabbit",   emoji: "🐰", label: "Rabbit",   category: "animals",   accept: ["rabbit", "bunny", "hare"] },
  { id: "duck",     emoji: "🦆", label: "Duck",     category: "animals",   accept: ["duck", "duckling"] },
  { id: "bear",     emoji: "🐻", label: "Bear",     category: "animals",   accept: ["bear"] },
  { id: "lion",     emoji: "🦁", label: "Lion",     category: "animals",   accept: ["lion", "cub"] },

  // ---------------- Household ----------------
  { id: "chair",    emoji: "🪑", label: "Chair",    category: "household", accept: ["chair", "seat", "stool"] },
  { id: "bed",      emoji: "🛏️", label: "Bed",      category: "household", accept: ["bed"] },
  { id: "door",     emoji: "🚪", label: "Door",     category: "household", accept: ["door"] },
  { id: "couch",    emoji: "🛋️", label: "Couch",    category: "household", accept: ["couch", "sofa", "settee"] },
  { id: "plate",    emoji: "🍽️", label: "Plate",    category: "household", accept: ["plate", "dish"] },
  { id: "spoon",    emoji: "🥄", label: "Spoon",    category: "household", accept: ["spoon"] },
  { id: "key",      emoji: "🔑", label: "Key",      category: "household", accept: ["key"] },
  { id: "book",     emoji: "📚", label: "Book",     category: "household", accept: ["book"] },
  { id: "pencil",   emoji: "✏️", label: "Pencil",   category: "household", accept: ["pencil"] },
  { id: "sock",     emoji: "🧦", label: "Sock",     category: "household", accept: ["sock"] },
  { id: "clock",    emoji: "⏰", label: "Clock",    category: "household", accept: ["clock", "alarm clock", "alarm"] },
  { id: "umbrella", emoji: "☂️", label: "Umbrella", category: "household", accept: ["umbrella", "brolly", "parasol"] },

  // ---------------- Machines / vehicles ----------------
  { id: "car",        emoji: "🚗", label: "Car",        category: "machines", accept: ["car", "automobile", "auto"] },
  { id: "bicycle",    emoji: "🚲", label: "Bicycle",    category: "machines", accept: ["bicycle", "bike", "cycle", "pushbike"] },
  { id: "bus",        emoji: "🚌", label: "Bus",        category: "machines", accept: ["bus", "coach"] },
  { id: "train",      emoji: "🚂", label: "Train",      category: "machines", accept: ["train", "locomotive"] },
  { id: "airplane",   emoji: "✈️", label: "Airplane",   category: "machines", accept: ["airplane", "aeroplane", "plane", "jet", "aircraft"] },
  { id: "helicopter", emoji: "🚁", label: "Helicopter", category: "machines", accept: ["helicopter", "chopper"] },
  { id: "rocket",     emoji: "🚀", label: "Rocket",     category: "machines", accept: ["rocket", "spaceship", "spacecraft"] },
  { id: "truck",      emoji: "🚚", label: "Truck",      category: "machines", accept: ["truck", "lorry"] },
  { id: "boat",       emoji: "⛵", label: "Boat",       category: "machines", accept: ["boat", "sailboat", "ship", "yacht"] },
  { id: "phone",      emoji: "📱", label: "Phone",      category: "machines", accept: ["phone", "telephone", "cellphone", "smartphone", "mobile"] },
  { id: "laptop",     emoji: "💻", label: "Laptop",     category: "machines", accept: ["laptop", "computer", "notebook"] },
  { id: "camera",     emoji: "📷", label: "Camera",     category: "machines", accept: ["camera"] },
];

export const CATEGORIES = ["animals", "household", "machines"];

/* ---- Normalisation -------------------------------------------------------
   Lowercase, drop punctuation/digits, collapse whitespace. This mirrors how
   we clean the speech recogniser's raw transcript before matching.          */
export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Light singular/plural folding so "books" ⇄ "book", "frogs" ⇄ "frog" match
   without listing every plural. Only strips a trailing "s" on words long
   enough that doing so can't collapse a short distinct word.                */
function stem(word) {
  return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
}

function tokenEquals(a, b) {
  return a === b || stem(a) === stem(b);
}

/* True if `s` is `unit` repeated n times, 1 ≤ n ≤ maxRep, and nothing else.
   Safe by construction — the WHOLE string must be the unit repeated, so
   "monkey" never matches "key" (×2 = "keykey"). Kids naturally repeat the
   word, and the recognizer may return that glued ("frogfrog") or as one
   run-together token; this catches those. (Spaced repeats like
   "frog frog frog" are already caught token-by-token.) */
function isRepeatOf(s, unit, maxRep) {
  if (!unit || !s || unit.length > s.length || s.length % unit.length !== 0) return false;
  const n = s.length / unit.length;
  if (n < 1 || n > (maxRep || 5)) return false;
  return s === unit.repeat(n);
}

/* ---- The matcher ---------------------------------------------------------
   Does a (possibly messy) spoken transcript name `item`'s picture?

   - Multi-word accept entries ("alarm clock") match as a contiguous phrase.
   - Single-word entries match any token in the transcript, so leading
     articles / filler ("it's a dog", "the red car") still resolve.
   - Repetition-tolerant: 1–5 repetitions of a word — glued ("frogfrog") or
     run-together in one token — count as a hit, like the letter game.
   - Returns false for empty input.

   This is deliberately forgiving on the *accept* side (favouring no false
   negatives) while still requiring an actual vocabulary hit.                */
export function matchesWord(transcript, item) {
  const norm = normalize(transcript);
  if (!norm) return false;

  const tokens = norm.split(" ");
  const padded = " " + norm + " ";
  const glued = norm.replace(/ /g, "");

  for (const rawAlias of item.accept) {
    const alias = normalize(rawAlias);
    if (!alias) continue;

    if (alias.includes(" ")) {
      // Multi-word: require the phrase to appear with word boundaries.
      if (padded.includes(" " + alias + " ")) return true;
    } else {
      // Single word: any token may carry it.
      for (const tok of tokens) {
        if (tokenEquals(tok, alias)) return true;
      }
      // Repetition-tolerant pass (1–5×), spaced-then-glued or single token.
      if (isRepeatOf(glued, alias, 5)) return true;
      for (const tok of tokens) if (isRepeatOf(tok, alias, 5)) return true;
    }
  }
  return false;
}

/* Convenience: match a transcript against a vocabulary by id (used by the
   game's keyboard fallback and by tests). */
export function findById(id) {
  return WORDS.find((w) => w.id === id) || null;
}
