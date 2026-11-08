// Timed effects (fog, slow slipper, more enemies). Any source can start one:
// a trickster today, a curse or a special slipper later. Durations come from CFG.effects.
// Other code only asks effectOn(id); each effect's meaning lives where it is used
// (spawning reads moreEnemies, input reads slowSlipper, tricksters/render read fog).

const EFFECTS = {
  moreEnemies: { label: "BAD LUCK", color: "#d9c7a0" },
  fog: { label: "RAIN & FOG", color: "#9fc3d9" },
  slowSlipper: { label: "SLOW SLIPPER", color: "#ffd84a" },
};

// source: who started it ("moth", "curse:...", ...), kept for future use / debugging.
function startEffect(id, source) {
  const sec = CFG.effects[id].sec;
  S.effects[id] = { t: sec, max: sec, source };
}

const effectOn = id => !!S.effects[id];

function updEffectTimers(dt) {
  for (const id in S.effects) {
    S.effects[id].t -= dt;
    if (S.effects[id].t <= 0) delete S.effects[id];
  }
}

// Slow slipper: taps wait in S.slowTaps and land after a delay (where the mosquito may no longer be).
function updSlowTaps(dt) {
  S.slowTaps.forEach(s => s.t -= dt);
  const due = S.slowTaps.filter(s => s.t <= 0);
  S.slowTaps = S.slowTaps.filter(s => s.t > 0);
  due.forEach(s => { if (S.playing) tap(s.p); });
}

// ---------- drawing ----------

// Rain streaks and drifting fog patches, fading in/out at the edges of the effect.
function drawFog(now) {
  const f = S.effects.fog;
  if (!f) return;
  const k = Math.min(1, (f.max - f.t) / .6, f.t / .6);   // fade in / out
  g.save();
  g.globalAlpha = .55 * k;
  g.strokeStyle = "rgba(200,220,240,.7)";
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i < 70; i++) {
    const x = (i * 53 + now * .05) % (W + 40) - 20, y = (i * 97 + now * .6) % (H + 40) - 20;
    g.moveTo(x, y);
    g.lineTo(x - 4, y + 14);
  }
  g.stroke();
  g.globalAlpha = k;
  for (let i = 0; i < 6; i++) {
    const x = (i * 83 + now * .012 * (i % 2 ? 1 : -1)) % (W + 160) - 80, y = 120 + i * 70;
    const gr = g.createRadialGradient(x, y, 10, x, y, 120);
    gr.addColorStop(0, "rgba(190,200,215,.42)");
    gr.addColorStop(1, "rgba(190,200,215,0)");
    g.fillStyle = gr;
    g.fillRect(x - 120, y - 120, 240, 240);
  }
  g.restore();
}

// Slow slipper: a slipper slowly coming down where you tapped.
function drawSlowTaps() {
  S.slowTaps.forEach(s => {
    const k = 1 - s.t / s.max;
    slipper(s.p.x, s.p.y - 40 * (1 - k), .9 + .7 * (1 - k), -.3, .35 + .4 * k, currentSlipper().id);
  });
}
