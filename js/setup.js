// Setup: constants, canvas, the shared game state S, saved data and small shared helpers.

// ---------- constants ----------
const W = 360, H = 560;   // logical canvas size; everything is drawn in these units
const QHP = 40;           // Queen base hit points (after the first loop)
const QSTING = 16;        // seconds for "HER STING" to fill (after the first loop)
const DEBUG = /[?&]debug\b/.test(location.search);   // test mode: open the page with ?debug

// ---------- canvas ----------
const cv = document.getElementById("cv"), g = cv.getContext("2d"), ov = document.getElementById("ov");
const dpr = Math.min(2, window.devicePixelRatio || 1);
cv.width = W * dpr;
cv.height = H * dpr;
g.scale(dpr, dpr);

// Off-screen layer for darkness: filled black, then "holes" are cut out for light.
const dark = document.createElement("canvas");
dark.width = W * dpr;
dark.height = H * dpr;
const d = dark.getContext("2d");
d.scale(dpr, dpr);

const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;   // softer screen shake

const lampBtn = document.getElementById("lamp");

// ---------- game state ----------
let STAGE = "bed";   // id of the current place ("bed" | "beach" | "one" | ...)

// Everything that changes during play lives in S (the per-place part is reset in enterPlace).
let S = {
  bugs: [], fx: [], pops: [], slaps: [], marks: [], bumps: [], fatQ: [],
  t: 0, placeT: 0, score: 0, kills: 0, bites: 0,
  wake: 0, jig: 0, smile: 0, frown: 0, awakeT: 0, snoreT: 2,
  playing: false, spawn: 1, streak: 0,
  stop: 0, shake: 0, shakeA: 0, flash: 0, bitFlash: 0,
  q: null, queenDone: false, queenAt: 1e9,
  lvl: 0, placeIdx: 0, banner: null, banners: [], paused: false, wokeBy: null,
  effects: {}, trick: null, slowTaps: []
};

// ---------- saved data (localStorage) ----------
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

let BEST = load("mosq-best", { score: 0, place: "" });   // personal best run
let COINS = load("mosq-coins", 0);                       // total coins (for the future slipper shop)
const SEEN = load("mosq-seen", {});                      // explanations the player has already seen

// True only the first time ever for this key (then remembered), e.g. "trick:moth", "type:coward".
function firstTime(key) {
  if (SEEN[key]) return false;
  SEEN[key] = 1;
  save("mosq-seen", SEEN);
  return true;
}

// ---------- shared helpers ----------

// Seconds into the current place.
const elapsed = () => S.playing ? S.placeT : 0;
// Difficulty pressure: seconds in the place (times k) plus a bit per loop, capped (CFG.difficulty).
const pressure = (k = 1) => Math.min(CFG.difficulty.max, elapsed() * k + S.lvl * CFG.difficulty.perLoop);
// Streak multiplier: 5 in a row = x2, 10 = x3.
const mult = () => S.streak >= 10 ? 3 : S.streak >= 5 ? 2 : 1;

const maxBites = () => CFG.places.bed.maxBites;
const oneMax = () => CFG.places.one.maxBites;
// Pick a per-loop value from a config array (the last value repeats).
const byLoop = (arr, loop) => arr[Math.min(loop, arr.length - 1)];
const rand = ([a, b]) => a + Math.random() * (b - a);

// Floating text on the canvas (kept inside the screen edges).
function pop(x, y, txt, col, size) {
  S.pops.push({ x: Math.max(80, Math.min(W - 80, x)), y: Math.max(70, y), txt, col, size, life: 1 });
}

// Big centered title; the game waits while it shows. Banners queue up and show one after another.
// icon (optional): { kind: "type" | "trick", key } draws a picture above the text.
function banner(a, b, t, icon) {
  const bn = { a, b, t, max: t, icon };
  if (S.banner) S.banners.push(bn);
  else S.banner = bn;
}
