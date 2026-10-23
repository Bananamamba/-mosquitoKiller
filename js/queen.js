// The Queen (boss, bedroom). Jump scare, then a fight: many taps to kill her
// while "HER STING" fills. If it fills, she lunges and laughs = loss.
// Phases: black → scare → shrink → fight → (dying | lunge → laugh).

// Hit points: weaker on the first loop; in endless, +10 per previous visit.
const qhp = () => (S.lvl ? QHP + S.lvl * 10 : 30) + (S.endless ? Math.max(0, (S.queenCount || 1) - 1) * 10 : 0);

function queenStart() {
  S.bugs.forEach(b => buzzStop(b, true));
  S.bugs = [];
  S.slaps = [];
  S.fatQ = [];
  S.q = {
    phase: "black", t: 0, ft: 0, x: W / 2, y: 260, s: 2.6, hp: qhp(), max: qhp(),
    sting: 0, hurt: 0, vanish: 0, popT: 0,
    marks: [.75, .5, .25].map(f => Math.round(qhp() * f))   // at these HP she vanishes and pops up elsewhere
  };
}

function updQueen(dt) {
  const q = S.q;
  q.t += dt;
  q.hurt = Math.max(0, q.hurt - dt);
  if (q.phase === "black") {
    // lights cut...
    if (q.t > .35) { q.phase = "scare"; q.t = 0; sfx("screech"); S.shake = RM ? .1 : .8; S.shakeA = 0; }
  } else if (q.phase === "scare") {
    // ...huge face and screech
    if (q.t > 1.05) { q.phase = "shrink"; q.t = 0; droneStart(q); }
  } else if (q.phase === "shrink") {
    const k = Math.min(1, q.t / .5);
    q.s = 2.6 - 1.7 * k;
    q.y = 260 - 30 * k;
    if (k >= 1) { q.phase = "fight"; q.t = 0; }
  } else if (q.phase === "fight") {
    q.ft += dt;
    q.sting = Math.min(1, q.sting + dt / (S.lvl ? QSTING : 20));
    if (q.vanish > 0) {
      // hidden; when the timer ends she pops up at a random spot
      q.vanish -= dt;
      if (q.vanish <= 0) {
        q.x = 80 + Math.random() * 200;
        q.y = 160 + Math.random() * 200;
        q.popT = .3;
        sfx("mini");
        S.shake = RM ? .05 : .35;
        S.shakeA = 0;
      }
    } else {
      // drifts along a wavy looping path
      const tx = W / 2 + Math.sin(q.ft * .8) * 95, ty = 250 + Math.sin(q.ft * 1.25) * 120, k = Math.min(1, dt * 1.6);
      q.x += (tx - q.x) * k;
      q.y += (ty - q.y) * k;
    }
    q.popT = Math.max(0, q.popT - dt);
    q.s = .9 + q.popT * 2;
    if (q.sting >= 1) { q.phase = "lunge"; q.t = 0; q.vanish = 0; }
  } else if (q.phase === "lunge") {
    const k = Math.min(1, q.t / .45);
    q.s = .9 + 1.6 * k;
    q.x += (W / 2 - q.x) * k * .3;
    q.y += (260 - q.y) * k * .3;
    if (k >= 1) { q.phase = "laugh"; q.t = 0; sfx("laugh"); S.shake = RM ? .1 : .5; }
  } else if (q.phase === "laugh") {
    if (q.t > 2.6) { finish("stung"); return; }
  } else if (q.phase === "dying") {
    if (q.t > 1.4) {
      droneStop(q);
      S.q = null;
      S.queenDone = true;
      S.score += 50;
      pop(W / 2, 200, "QUEEN SLAIN +50", "#ffc94d", 22);
      return;
    }
  }
  droneUpd(q);
}

// One tap on her: -1 HP, +1 point, a few drops of blood.
function hitQueen(p) {
  const q = S.q;
  q.hp--;
  q.hurt = .12;
  S.score += 1;
  sfx("qhit");
  S.stop = .025;
  S.shake = RM ? .04 : .12;
  S.shakeA = Math.random() * 6.28;
  for (let i = 0; i < 8; i++) {
    const an = Math.random() * 6.28, sp = 120 + Math.random() * 260;
    S.fx.push({ kind: "drop", x: p.x, y: p.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 60, r: 1.5 + Math.random() * 3, life: .5 + Math.random() * .4 });
  }
  if (q.marks.length && q.hp <= q.marks[0]) { q.marks.shift(); q.vanish = .55; }
  if (q.hp <= 0) {
    q.phase = "dying";
    q.t = 0;
    q.vanish = 0;
    sfx("die");
    for (let i = 0; i < 60; i++) {
      const an = Math.random() * 6.28, sp = 120 + Math.random() * 420;
      S.fx.push({ kind: "drop", x: q.x, y: q.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 80, r: 1.5 + Math.random() * 3.5, life: .7 + Math.random() * .5 });
    }
  }
}
