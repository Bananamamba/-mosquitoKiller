// Missions: each place draws one at random on entry. The game reports what happens with
// missionEvent(type, data) and the active mission listens. Numbers come from CFG.missions.
//
// A mission definition:
//   n(loop)            the target number for this loop (omit for yes/no missions)
//   text(n), short(n)  banner text / HUD text
//   on(m, type, data)  react to an event; set m.progress, m.done or m.failed
//                      (by default the mission completes when progress reaches n)
//   weights            optional: extra spawn weights while this mission runs (e.g. more gold)

const mcfg = id => CFG.missions[id];
const grow = (id, loop) => {
  const c = mcfg(id);
  return Math.max(c.min ?? 1, c.base + c.perLoop * loop);
};

const MISSIONS = {
  // ---------- bedroom ----------
  killN: {
    n: loop => grow("killN", loop),
    text: n => `Squash ${n} mosquitoes`,
    short: n => `Squash ${n}`,
    on(m, type) { if (type === "kill") m.progress++; }
  },
  streakN: {
    n: loop => grow("streakN", loop),
    text: n => `${n} in a row without a miss`,
    short: n => `${n} in a row`,
    on(m, type) {
      if (type === "kill") m.progress = Math.max(m.progress, S.streak);
      if (type === "miss" && !m.done) m.progress = 0;
    }
  },
  goldN: {
    n: loop => grow("goldN", loop),
    text: n => `Squash ${n} golden mosquitoes`,
    short: n => `${n} golden`,
    weights: () => ({ gold: mcfg("goldN").goldWeight }),
    on(m, type, d) { if (type === "kill" && d.bug.type === "gold") m.progress++; }
  },

  // ---------- beach ----------
  calmN: {
    n: loop => grow("calmN", loop),
    text: n => `${n} kills before Moshe's meter passes half`,
    short: n => `${n} kills, meter < ½`,
    on(m, type) {
      if (type === "kill") m.progress++;
      if (type === "tick" && S.wake > mcfg("calmN").maxWake) m.failed = true;
    }
  },
  pullN: {
    n: loop => grow("pullN", loop),
    text: n => `Pull out ${n} belly stuckers (press and hold)`,
    short: n => `Pull ${n} stuckers`,
    weights: () => ({ stuck: mcfg("pullN").stuckWeight }),
    on(m, type) { if (type === "pull") m.progress++; }
  },
  airN: {
    n: loop => grow("airN", loop),
    text: n => `${n} kills in mid-air`,
    short: n => `${n} mid-air`,
    on(m, type, d) { if (type === "kill" && d.air) m.progress++; }
  },

  // ---------- The One ----------
  slapsN: {
    n: loop => grow("slapsN", loop),
    auto: false,   // progress = slaps used, not a goal to reach
    text: n => `Catch it with at most ${n} slap${n === 1 ? "" : "s"}`,
    short: n => `Max ${n} slap${n === 1 ? "" : "s"}`,
    on(m, type) {
      if (type === "slap") { m.progress++; if (m.progress > m.n) m.failed = true; }
      if (type === "catch") m.done = true;
    }
  },
  noLamp: {
    text: () => "Catch it without the lamp",
    short: () => "No lamp",
    on(m, type) {
      if (type === "lamp") m.failed = true;
      if (type === "catch") m.done = true;
    }
  },
  airCatch: {
    text: () => "Catch it in mid-air, not while it sits",
    short: () => "Mid-air catch",
    on(m, type, d) {
      if (type === "catch") { if (d.air) m.done = true; else m.failed = true; }
    }
  },
};

// Draw a mission for the place. S.mission = { id, def, n, progress, done, failed }.
function pickMission(place, loop) {
  const id = place.missions[Math.random() * place.missions.length | 0], def = MISSIONS[id];
  S.mission = { id, def, n: def.n ? def.n(loop) : 0, progress: 0, done: false, failed: false };
}

// Report something that happened; the mission may complete (reward now) or fail.
function missionEvent(type, data) {
  const m = S.mission;
  if (!m || m.done || m.failed || !S.playing) return;
  m.def.on(m, type, data || {});
  if (!m.done && m.def.n && m.def.auto !== false && m.progress >= m.n) m.done = true;
  if (m.done) missionReward();
  else if (m.failed) pop(W / 2, 170, "Mission failed", "#93a0c4", 15);
}

// Completed: coins + bonus points right away.
function missionReward() {
  const c = CFG.missions, loop = S.lvl;
  const coins = c.coins + c.coinsPerLoop * loop, pts = c.bonus + c.bonusPerLoop * loop;
  S.runCoins += coins;
  S.score += pts;
  sfx("gold");
  pop(W / 2, 160, `MISSION COMPLETE! +${pts}`, "#9be59b", 18);
  pop(W / 2, 186, `+${coins} coins`, "#ffc94d", 15);
}

// Extra spawn weights requested by the active mission (e.g. more gold).
const missionWeights = () => S.mission && S.mission.def.weights && !S.mission.done ? S.mission.def.weights() : {};

// Text for the HUD line, e.g. "Squash 20 · 7/20".
function missionHUD() {
  const m = S.mission;
  if (!m) return "";
  const tail = m.done ? " ✓" : m.failed ? " ✗" : m.def.n ? ` · ${Math.min(m.progress, m.n)}/${m.n}` : "";
  return m.def.short(m.n) + tail;
}
