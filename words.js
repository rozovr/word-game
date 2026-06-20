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
  { id: "dog", emoji: "🐶", label: "Dog", category: "animals", accept: ["dog", "doggy", "doggie", "puppy", "pup", "hound"] },
  { id: "cat", emoji: "🐱", label: "Cat", category: "animals", accept: ["cat", "kitty", "kitten"] },
  { id: "frog", emoji: "🐸", label: "Frog", category: "animals", accept: ["frog", "toad", "froggy"] },
  { id: "fish", emoji: "🐟", label: "Fish", category: "animals", accept: ["fish", "fishy"] },
  { id: "bird", emoji: "🐦", label: "Bird", category: "animals", accept: ["bird", "birdie"] },
  { id: "cow", emoji: "🐮", label: "Cow", category: "animals", accept: ["cow", "cattle", "calf"] },
  { id: "pig", emoji: "🐷", label: "Pig", category: "animals", accept: ["pig", "piggy", "hog"] },
  { id: "horse", emoji: "🐴", label: "Horse", category: "animals", accept: ["horse", "pony"] },
  { id: "rabbit", emoji: "🐰", label: "Rabbit", category: "animals", accept: ["rabbit", "bunny", "hare"] },
  { id: "duck", emoji: "🦆", label: "Duck", category: "animals", accept: ["duck", "duckling"] },
  { id: "bear", emoji: "🐻", label: "Bear", category: "animals", accept: ["bear"] },
  { id: "lion", emoji: "🦁", label: "Lion", category: "animals", accept: ["lion", "cub"] },
  { id: "chair", emoji: "🪑", label: "Chair", category: "household", accept: ["chair", "seat", "stool"] },
  { id: "bed", emoji: "🛏️", label: "Bed", category: "household", accept: ["bed"] },
  { id: "door", emoji: "🚪", label: "Door", category: "household", accept: ["door"] },
  { id: "couch", emoji: "🛋️", label: "Couch", category: "household", accept: ["couch", "sofa", "settee"] },
  { id: "plate", emoji: "🍽️", label: "Plate", category: "household", accept: ["plate", "dish"] },
  { id: "spoon", emoji: "🥄", label: "Spoon", category: "household", accept: ["spoon"] },
  { id: "key", emoji: "🔑", label: "Key", category: "household", accept: ["key"] },
  { id: "book", emoji: "📚", label: "Book", category: "household", accept: ["book"] },
  { id: "pencil", emoji: "✏️", label: "Pencil", category: "household", accept: ["pencil"] },
  { id: "sock", emoji: "🧦", label: "Sock", category: "household", accept: ["sock"] },
  { id: "clock", emoji: "⏰", label: "Clock", category: "household", accept: ["clock", "alarm clock", "alarm"] },
  { id: "umbrella", emoji: "☂️", label: "Umbrella", category: "household", accept: ["umbrella", "brolly", "parasol"] },
  { id: "car", emoji: "🚗", label: "Car", category: "machines", accept: ["car", "automobile", "auto"] },
  { id: "bicycle", emoji: "🚲", label: "Bicycle", category: "machines", accept: ["bicycle", "bike", "cycle", "pushbike"] },
  { id: "bus", emoji: "🚌", label: "Bus", category: "machines", accept: ["bus", "coach"] },
  { id: "train", emoji: "🚂", label: "Train", category: "machines", accept: ["train", "locomotive"] },
  { id: "airplane", emoji: "✈️", label: "Airplane", category: "machines", accept: ["airplane", "aeroplane", "plane", "jet", "aircraft"] },
  { id: "helicopter", emoji: "🚁", label: "Helicopter", category: "machines", accept: ["helicopter", "chopper"] },
  { id: "rocket", emoji: "🚀", label: "Rocket", category: "machines", accept: ["rocket", "spaceship", "spacecraft"] },
  { id: "truck", emoji: "🚚", label: "Truck", category: "machines", accept: ["truck", "lorry"] },
  { id: "boat", emoji: "⛵", label: "Boat", category: "machines", accept: ["boat", "sailboat", "ship", "yacht"] },
  { id: "phone", emoji: "📱", label: "Phone", category: "machines", accept: ["phone", "telephone", "cellphone", "smartphone", "mobile"] },
  { id: "laptop", emoji: "💻", label: "Laptop", category: "machines", accept: ["laptop", "computer", "notebook"] },
  { id: "camera", emoji: "📷", label: "Camera", category: "machines", accept: ["camera"] },
  { id: "ant", emoji: "🐜", label: "Ant", category: "animals", accept: ["ant"] },
  { id: "bee", emoji: "🐝", label: "Bee", category: "animals", accept: ["bee", "bumblebee"] },
  { id: "butterfly", emoji: "🦋", label: "Butterfly", category: "animals", accept: ["butterfly"] },
  { id: "camel", emoji: "🐪", label: "Camel", category: "animals", accept: ["camel"] },
  { id: "eagle", emoji: "🦅", label: "Eagle", category: "animals", accept: ["eagle"] },
  { id: "elephant", emoji: "🐘", label: "Elephant", category: "animals", accept: ["elephant"] },
  { id: "flamingo", emoji: "🦩", label: "Flamingo", category: "animals", accept: ["flamingo"] },
  { id: "fox", emoji: "🦊", label: "Fox", category: "animals", accept: ["fox"] },
  { id: "hamster", emoji: "🐹", label: "Hamster", category: "animals", accept: ["hamster"] },
  { id: "koala", emoji: "🐨", label: "Koala", category: "animals", accept: ["koala"] },
  { id: "lizard", emoji: "🦎", label: "Lizard", category: "animals", accept: ["lizard"] },
  { id: "monkey", emoji: "🐒", label: "Monkey", category: "animals", accept: ["monkey"] },
  { id: "mouse", emoji: "🐭", label: "Mouse", category: "animals", accept: ["mouse"] },
  { id: "owl", emoji: "🦉", label: "Owl", category: "animals", accept: ["owl"] },
  { id: "panda", emoji: "🐼", label: "Panda", category: "animals", accept: ["panda"] },
  { id: "peacock", emoji: "🦚", label: "Peacock", category: "animals", accept: ["peacock"] },
  { id: "penguin", emoji: "🐧", label: "Penguin", category: "animals", accept: ["penguin"] },
  { id: "shark", emoji: "🦈", label: "Shark", category: "animals", accept: ["shark"] },
  { id: "snail", emoji: "🐌", label: "Snail", category: "animals", accept: ["snail"] },
  { id: "snake", emoji: "🐍", label: "Snake", category: "animals", accept: ["snake"] },
  { id: "spider", emoji: "🕷️", label: "Spider", category: "animals", accept: ["spider"] },
  { id: "swan", emoji: "🦢", label: "Swan", category: "animals", accept: ["swan"] },
  { id: "tiger", emoji: "🐯", label: "Tiger", category: "animals", accept: ["tiger"] },
  { id: "turtle", emoji: "🐢", label: "Turtle", category: "animals", accept: ["turtle", "tortoise"] },
  { id: "whale", emoji: "🐳", label: "Whale", category: "animals", accept: ["whale"] },
  { id: "wolf", emoji: "🐺", label: "Wolf", category: "animals", accept: ["wolf"] },
  { id: "zebra", emoji: "🦓", label: "Zebra", category: "animals", accept: ["zebra"] },
  { id: "chicken", emoji: "🐔", label: "Chicken", category: "animals", accept: ["chicken", "hen"] },
  { id: "crocodile", emoji: "🐊", label: "Crocodile", category: "animals", accept: ["crocodile", "alligator"] },
  { id: "gorilla", emoji: "🦍", label: "Gorilla", category: "animals", accept: ["gorilla"] },
  { id: "hippopotamus", emoji: "🦛", label: "Hippopotamus", category: "animals", accept: ["hippopotamus", "hippo"] },
  { id: "leopard", emoji: "🐆", label: "Leopard", category: "animals", accept: ["leopard"] },
  { id: "llama", emoji: "🦙", label: "Llama", category: "animals", accept: ["llama"] },
  { id: "otter", emoji: "🦦", label: "Otter", category: "animals", accept: ["otter"] },
  { id: "crab", emoji: "🦀", label: "Crab", category: "animals", accept: ["crab"] },
  { id: "lobster", emoji: "🦞", label: "Lobster", category: "animals", accept: ["lobster"] },
  { id: "jellyfish", emoji: "🪼", label: "Jellyfish", category: "animals", accept: ["jellyfish"] },
  { id: "badger", emoji: "🦡", label: "Badger", category: "animals", accept: ["badger"] },
  { id: "beaver", emoji: "🦫", label: "Beaver", category: "animals", accept: ["beaver"] },
  { id: "goose", emoji: "🪿", label: "Goose", category: "animals", accept: ["goose"] },
  { id: "sloth", emoji: "🦥", label: "Sloth", category: "animals", accept: ["sloth"] },
  { id: "skunk", emoji: "🦨", label: "Skunk", category: "animals", accept: ["skunk"] },
  { id: "scorpion", emoji: "🦂", label: "Scorpion", category: "animals", accept: ["scorpion"] },
  { id: "beetle", emoji: "🪲", label: "Beetle", category: "animals", accept: ["beetle", "bug"] },
  { id: "apple", emoji: "🍎", label: "Apple", category: "food", accept: ["apple"] },
  { id: "banana", emoji: "🍌", label: "Banana", category: "food", accept: ["banana"] },
  { id: "strawberry", emoji: "🍓", label: "Strawberry", category: "food", accept: ["strawberry"] },
  { id: "orange", emoji: "🍊", label: "Orange", category: "food", accept: ["orange"] },
  { id: "lemon", emoji: "🍋", label: "Lemon", category: "food", accept: ["lemon"] },
  { id: "pineapple", emoji: "🍍", label: "Pineapple", category: "food", accept: ["pineapple"] },
  { id: "corn", emoji: "🌽", label: "Corn", category: "food", accept: ["corn"] },
  { id: "broccoli", emoji: "🥦", label: "Broccoli", category: "food", accept: ["broccoli"] },
  { id: "cucumber", emoji: "🥒", label: "Cucumber", category: "food", accept: ["cucumber"] },
  { id: "potato", emoji: "🥔", label: "Potato", category: "food", accept: ["potato"] },
  { id: "mushroom", emoji: "🍄", label: "Mushroom", category: "food", accept: ["mushroom"] },
  { id: "pizza", emoji: "🍕", label: "Pizza", category: "food", accept: ["pizza"] },
  { id: "pretzel", emoji: "🥨", label: "Pretzel", category: "food", accept: ["pretzel"] },
  { id: "bagel", emoji: "🥯", label: "Bagel", category: "food", accept: ["bagel"] },
  { id: "hotdog", emoji: "🌭", label: "Hotdog", category: "food", accept: ["hotdog", "hot dog"] },
  { id: "burrito", emoji: "🌯", label: "Burrito", category: "food", accept: ["burrito"] },
  { id: "pepper", emoji: "🌶️", label: "Pepper", category: "food", accept: ["pepper", "chili", "chilli"] },
  { id: "broom", emoji: "🧹", label: "Broom", category: "household", accept: ["broom"] },
  { id: "bucket", emoji: "🪣", label: "Bucket", category: "household", accept: ["bucket", "pail"] },
  { id: "candle", emoji: "🕯️", label: "Candle", category: "household", accept: ["candle"] },
  { id: "mirror", emoji: "🪞", label: "Mirror", category: "household", accept: ["mirror"] },
  { id: "basket", emoji: "🧺", label: "Basket", category: "household", accept: ["basket"] },
  { id: "hammer", emoji: "🔨", label: "Hammer", category: "household", accept: ["hammer"] },
  { id: "saw", emoji: "🪚", label: "Saw", category: "household", accept: ["saw"] },
  { id: "lock", emoji: "🔒", label: "Lock", category: "household", accept: ["lock"] },
  { id: "mailbox", emoji: "📫", label: "Mailbox", category: "household", accept: ["mailbox"] },
  { id: "radio", emoji: "📻", label: "Radio", category: "household", accept: ["radio"] },
  { id: "lamp", emoji: "🪔", label: "Lamp", category: "household", accept: ["lamp"] },
  { id: "lantern", emoji: "🏮", label: "Lantern", category: "household", accept: ["lantern"] },
  { id: "telescope", emoji: "🔭", label: "Telescope", category: "household", accept: ["telescope"] },
  { id: "television", emoji: "📺", label: "Television", category: "household", accept: ["television", "tv", "telly"] },
  { id: "printer", emoji: "🖨️", label: "Printer", category: "household", accept: ["printer"] },
  { id: "pen", emoji: "🖋️", label: "Pen", category: "household", accept: ["pen"] },
  { id: "paintbrush", emoji: "🖌️", label: "Paintbrush", category: "household", accept: ["paintbrush"] },
  { id: "bottle", emoji: "🍼", label: "Bottle", category: "household", accept: ["bottle"] },
  { id: "glass", emoji: "🥛", label: "Glass", category: "household", accept: ["glass"] },
  { id: "bowl", emoji: "🍜", label: "Bowl", category: "household", accept: ["bowl"] },
  { id: "teapot", emoji: "🫖", label: "Teapot", category: "household", accept: ["teapot"] },
  { id: "bathtub", emoji: "🛁", label: "Bathtub", category: "household", accept: ["bathtub", "bath", "tub"] },
  { id: "cart", emoji: "🛒", label: "Cart", category: "household", accept: ["cart", "trolley"] },
  { id: "backpack", emoji: "🎒", label: "Backpack", category: "household", accept: ["backpack", "bag"] },
  { id: "microphone", emoji: "🎙️", label: "Microphone", category: "household", accept: ["microphone", "mic"] },
  { id: "hat", emoji: "👒", label: "Hat", category: "clothing", accept: ["hat"] },
  { id: "boot", emoji: "🥾", label: "Boot", category: "clothing", accept: ["boot"] },
  { id: "shoe", emoji: "👞", label: "Shoe", category: "clothing", accept: ["shoe"] },
  { id: "sandal", emoji: "🩴", label: "Sandal", category: "clothing", accept: ["sandal"] },
  { id: "helmet", emoji: "🪖", label: "Helmet", category: "clothing", accept: ["helmet"] },
  { id: "sunglasses", emoji: "🕶️", label: "Sunglasses", category: "clothing", accept: ["sunglasses", "shades"] },
  { id: "guitar", emoji: "🎸", label: "Guitar", category: "music", accept: ["guitar"] },
  { id: "violin", emoji: "🎻", label: "Violin", category: "music", accept: ["violin"] },
  { id: "flute", emoji: "🪈", label: "Flute", category: "music", accept: ["flute"] },
  { id: "banjo", emoji: "🪕", label: "Banjo", category: "music", accept: ["banjo"] },
  { id: "accordion", emoji: "🪗", label: "Accordion", category: "music", accept: ["accordion"] },
  { id: "ambulance", emoji: "🚑", label: "Ambulance", category: "machines", accept: ["ambulance"] },
  { id: "scooter", emoji: "🛵", label: "Scooter", category: "machines", accept: ["scooter"] },
  { id: "tractor", emoji: "🚜", label: "Tractor", category: "machines", accept: ["tractor"] },
  { id: "canoe", emoji: "🛶", label: "Canoe", category: "machines", accept: ["canoe"] },
  { id: "speedboat", emoji: "🚤", label: "Speedboat", category: "machines", accept: ["speedboat"] },
  { id: "volcano", emoji: "🌋", label: "Volcano", category: "nature", accept: ["volcano"] },
  { id: "coral", emoji: "🪸", label: "Coral", category: "nature", accept: ["coral"] },
];

export const CATEGORIES = ["animals", "food", "household", "clothing", "music", "machines", "nature"];

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
