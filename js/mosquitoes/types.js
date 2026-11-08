// Mosquito types: their announcement texts, and how the next type is picked.
// Which types a place has (and in what order they join) is set in the place file (types: [...]).

// Announcement per type (shown once ever). Text before " · " is the short title.
const TDESC = {
  coward: "Cowards join · they dodge your first slap",
  pair: "Pairs join · one slap, two kills",
  faker: "Fakers join · they flicker or zigzag in",
  stuck: "Belly stuckers join · they dig in. Press and hold to pull them out",
  armored: "Armored join · helmets take two hits",
  splitter: "Splitters join · kill one, three small ones fly out"
};

// Weighted random among the unlocked types. The newest type is a bit more common.
// A freshly unlocked type (S.intro) always comes first; golden hour = gold only;
// the active mission can add weights (e.g. more gold, or belly stuckers).
function pickE() {
  if (S.ev && S.ev.k === "gold") return "gold";
  if (S.intro) { const t = S.intro; S.intro = null; return t; }
  const un = (currentPlace().types || []).slice(0, S.unlocked);
  const w = { norm: .45, gold: .06 };
  un.forEach((k, i) => w[k] = i === un.length - 1 ? .22 : .13);
  Object.assign(w, missionWeights());
  let tot = 0;
  for (const k in w) tot += w[k];
  let r = Math.random() * tot;
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return "norm";
}
