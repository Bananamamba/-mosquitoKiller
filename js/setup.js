// Setup: constants, canvas, the shared game state S, saved records and small shared helpers.

// ---------- constants ----------
const W = 360, H = 560;   // logical canvas size; everything is drawn in these units
const DUR = 30;           // default night length (seconds)
const QHP = 40;           // Queen base hit points (after the first loop)
const QSTING = 16;        // seconds for "HER STING" to fill (after the first loop)

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

// ---------- buttons under the canvas ----------
const sprayBtn = document.getElementById("spray");
const lampBtn = document.getElementById("lamp");

// ---------- game state ----------
let STAGE = "bed";   // current room: "bed" | "beach" | "one"

// Everything that changes during play lives in S (reset per night in startStage).
let S = {
  bugs: [], fx: [], pops: [], slaps: [], marks: [], bumps: [], fatQ: [],
  t: 0, left: DUR, score: 0, kills: 0, bites: 0,
  wake: 0, jig: 0, smile: 0, frown: 0, awakeT: 0, snoreT: 2,
  playing: false, spawn: 1, streak: 0,
  stop: 0, shake: 0, shakeA: 0, flash: 0, bitFlash: 0,
  q: null, queenDone: false, queenAt: 99,
  perks: {}, dur: 30, lvl: 0, idx: 0, banner: null, paused: false,
  sprayCD: 0, rage: 0, steadyUsed: 0, wokeBy: null
};

// ---------- saved records (localStorage) ----------
let BESTRUN = 0, BESTN = 0;   // campaign: best score, most nights reached
try {
  BESTRUN = +localStorage.getItem("mosq-run-best") || 0;
  BESTN = +localStorage.getItem("mosq-run-nights") || 0;
} catch (e) {}

let EREC = {};   // endless records per room
try { EREC = JSON.parse(localStorage.getItem("mosq-endless") || "{}") || {}; } catch (e) {}

// ---------- shared helpers ----------
const ROOMS = { bed: "Bedroom swarm", beach: "Big Moshe", one: "The One" };
const NEXT = { bed: "the bedroom swarm", beach: "Big Moshe on the beach", one: "The One: a single mosquito in the dark" };

// Seconds into the night. Endless rooms (except The One) have no clock, so 0.
const elapsed = () => S.playing ? (S.endless && STAGE !== "one" ? 0 : S.dur - S.left) : 0;
// Streak multiplier: 5 in a row = x2, 10 = x3.
const mult = () => S.streak >= 10 ? 3 : S.streak >= 5 ? 2 : 1;

const stageOf = i => ["bed", "beach", "one"][i % 3];
const maxBites = () => Math.max(2, 6 + 2 * (S.perks.thick || 0));
const oneMax = () => Math.max(1, 3 + (S.perks.thick || 0));
const sprayMax = () => Math.max(5, 16 - 4 * ((S.perks.spray || 1) - 1));

// Floating text on the canvas (kept inside the screen edges).
function pop(x, y, txt, col, size) {
  S.pops.push({ x: Math.max(80, Math.min(W - 80, x)), y: Math.max(70, y), txt, col, size, life: 1 });
}

// Big centered title; the game waits while it shows.
function banner(a, b, t, next) {
  S.banner = { a, b, t, max: t, next };
  S.phase = "banner";
}
