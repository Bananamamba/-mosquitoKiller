// Mosquito types: which ones unlock in endless, and how the next type is picked.

// Endless: order in which new types join, one per tier.
const ORDER = {
  bed: ["coward", "pair", "faker", "armored", "splitter"],
  beach: ["coward", "pair", "faker", "stuck", "armored", "splitter"]
};

// On-screen announcement per type. Text before " · " is the short title.
const TDESC = {
  coward: "Cowards join · they dodge your first slap",
  pair: "Pairs join · one slap, two kills",
  faker: "Fakers join · they flicker or zigzag in",
  stuck: "Belly stuckers join · they dig in. Press and hold to pull them out",
  armored: "Armored join · helmets take two hits",
  splitter: "Splitters join · kill one, three small ones fly out"
};

// Endless pick: weighted random among unlocked types. The newest type is a bit more common.
// A freshly unlocked type (S.intro) is always shown first; Golden hour = gold only.
function pickE() {
  if (S.ev && S.ev.k === "gold") return "gold";
  if (S.intro) { const t = S.intro; S.intro = null; return t; }
  const un = ORDER[STAGE].slice(0, S.tier);
  const w = { norm: .45, gold: .06 * (1 + (S.perks.gold || 0)) };
  un.forEach((k, i) => w[k] = i === un.length - 1 ? .22 : .13);
  let tot = 0;
  for (const k in w) tot += w[k];
  let r = Math.random() * tot;
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return "norm";
}

// Campaign / single room pick: fixed chances (gold ~7%, coward 12%, faker 10%, pair 10%).
function pickT() {
  const gc = .07 * (1 + (S.perks.gold || 0)), r = Math.random();
  return r < gc ? "gold" : r < gc + .12 ? "coward" : r < gc + .22 ? "faker" : r < gc + .32 ? "pair" : "norm";
}
