// Tricksters: decoy bugs you must NOT hit. Every place with tricksters: true gets them.
// At most one on screen (S.trick). Each looks and moves very differently from a mosquito.
// The first time a player ever sees one, a short banner explains it (remembered in localStorage).

const TRICKS = {
  moth: {
    name: "MOTH",
    info: () => `Don't hit it! Bad luck: more mosquitoes for ${CFG.effects.moreEnemies.sec}s`,
    hit() { startEffect("moreEnemies", "moth"); pop(W / 2, 150, "BAD LUCK! More mosquitoes", "#d9c7a0", 17); },
    start(b) { flyIn(b, 140, 400); },
    move(b, dt) { b.x += b.dir * 60 * dt; b.y = b.y0 + Math.sin(b.t * 2.2) * 30; return offScreen(b); },
    draw: drawMoth
  },
  spider: {
    name: "SPIDER",
    info: () => `Don't hit it! Rain and fog for ${CFG.effects.fog.sec}s, and you lose coins`,
    hit() {
      startEffect("fog", "spider");
      const lost = Math.min(S.runCoins, CFG.tricksters.spiderCoins);
      S.runCoins -= lost;
      pop(W / 2, 150, "RAIN & FOG!" + (lost ? ` -${lost} coins` : ""), "#9fc3d9", 17);
    },
    // drops down on a thread, hangs for a while, climbs back up
    start(b) { b.x = 60 + Math.random() * 240; b.y = -20; b.y0 = 200 + Math.random() * 160; },
    move(b, dt) {
      const down = 1.5, hang = 3.5;
      if (b.t < down) b.y = -20 + (b.y0 + 20) * (b.t / down);
      else if (b.t < down + hang) b.y = b.y0 + Math.sin(b.t * 3) * 3;
      else b.y = b.y0 - (b.y0 + 30) * Math.min(1, (b.t - down - hang) / down);
      b.x += Math.sin(b.t * 1.3) * .2;
      return b.t > down * 2 + hang;
    },
    draw: drawSpider
  },
  cricket: {
    name: "CRICKET",
    info: () => "Don't hit it! You lose a life",
    hit() { pop(W / 2, 150, "CRICKET! You lost a life", "#9be59b", 17); loseLife("cricket", true); },
    // hops along the floor / sand
    start(b) { flyIn(b, 0, 0); b.y0 = STAGE === "beach" ? 496 : 470; b.y = b.y0; },
    move(b, dt) {
      b.x += b.dir * 55 * dt;
      b.y = b.y0 - Math.abs(Math.sin(b.t * 4.2)) * 38;
      return offScreen(b);
    },
    draw: drawCricket
  },
  bee: {
    name: "BEE",
    info: () => `Don't hit it! Your slipper gets slow for ${CFG.effects.slowSlipper.sec}s`,
    hit() { startEffect("slowSlipper", "bee"); pop(W / 2, 150, "STUNG! Slow slipper", "#ffd84a", 17); },
    // quick zigzag
    start(b) { flyIn(b, 130, 380); },
    move(b, dt) { b.x += b.dir * 85 * dt; b.y = b.y0 + (Math.abs((b.t * 1.6) % 2 - 1) - .5) * 70; return offScreen(b); },
    draw: drawBee
  },
};

// Enter from a random side at a random height.
function flyIn(b, yMin, yMax) {
  b.dir = Math.random() < .5 ? 1 : -1;
  b.x = b.dir > 0 ? -30 : W + 30;
  b.y = b.y0 = yMin + Math.random() * (yMax - yMin);
}
const offScreen = b => b.x < -40 || b.x > W + 40;

// ---------- spawning ----------

// Seconds until the next one: shorter as the run goes on.
function trickGap() {
  const c = CFG.tricksters, k = Math.min(1, S.placeIdx / c.rampPlaces);
  return rand([c.gapStart[0] + (c.gapEnd[0] - c.gapStart[0]) * k, c.gapStart[1] + (c.gapEnd[1] - c.gapStart[1]) * k]);
}

function pickTrick() {
  const w = CFG.tricksters.weights;
  let tot = 0;
  for (const k in w) tot += w[k];
  let r = Math.random() * tot;
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return "moth";
}

function spawnTrick() {
  const kind = pickTrick(), b = { kind, t: 0, dir: 1 };
  TRICKS[kind].start(b);
  S.trick = b;
  if (firstTime("trick:" + kind)) banner(TRICKS[kind].name, TRICKS[kind].info(), 1.8, { kind: "trick", key: kind });
}

// Not during the Queen or the fog, and only in places that have tricksters.
function updTricksters(dt) {
  if (!currentPlace().tricksters || S.q) return;
  if (S.trick) {
    const b = S.trick;
    b.t += dt;
    if (TRICKS[b.kind].move(b, dt)) S.trick = null;
    return;
  }
  if (effectOn("fog")) return;
  S.trickT -= dt;
  if (S.trickT <= 0) { S.trickT = trickGap(); spawnTrick(); }
}

// Distance from a tap to the trickster (Infinity if none).
const trickDist = p => S.trick ? Math.hypot(S.trick.x - p.x, S.trick.y - p.y) : Infinity;

// You hit it: its effect starts.
function trickHit() {
  const b = S.trick;
  S.trick = null;
  sfx("oops");
  breakStreak();
  S.shake = RM ? .05 : .2;
  S.shakeA = 0;
  TRICKS[b.kind].hit();
}

function drawTrick(now) {
  const b = S.trick;
  if (!b) return;
  if (b.kind === "spider") {
    // its thread
    g.strokeStyle = "rgba(230,230,240,.6)";
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(b.x, 0); g.lineTo(b.x, b.y - 8); g.stroke();
  }
  TRICKS[b.kind].draw(b.x, b.y, 1, b.dir, now);
}

// ---------- pictures (very different from a mosquito on purpose) ----------

// Moth: big pale wings, fuzzy brown body, feathery antennae.
function drawMoth(x, y, s, dir, now) {
  const fl = .6 + .4 * Math.abs(Math.sin(now * .012));
  g.save();
  g.translate(x, y);
  g.scale(s * dir, s);
  g.fillStyle = "#efe4c8";
  g.strokeStyle = "#8a7552";
  g.lineWidth = 1.5;
  [-1, 1].forEach(sd => {
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(sd * 26, -26 * fl, sd * 30, -4 * fl);
    g.quadraticCurveTo(sd * 24, 16 * fl, 0, 6);
    g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = "#b39a6a";
    g.beginPath(); g.arc(sd * 16, -6 * fl, 4, 0, 7); g.fill();
    g.fillStyle = "#efe4c8";
  });
  g.fillStyle = "#8a6a44";
  g.beginPath(); g.ellipse(0, 2, 4, 11, 0, 0, 7); g.fill();
  g.strokeStyle = "#8a6a44";
  g.lineWidth = 1.2;
  [-1, 1].forEach(sd => {
    g.beginPath(); g.moveTo(sd * 1, -8); g.quadraticCurveTo(sd * 6, -18, sd * 11, -20); g.stroke();
  });
  g.restore();
}

// Spider: round black body, eight bent legs, white eyes.
function drawSpider(x, y, s, dir, now) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = "#141414";
  g.lineWidth = 2.2;
  g.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const a = -.9 + i * .55, wig = Math.sin(now * .01 + i) * 2;
    [-1, 1].forEach(sd => {
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(sd * 12, a * 10 - 6 + wig);
      g.lineTo(sd * 20, a * 14 + 4);
      g.stroke();
    });
  }
  g.fillStyle = "#1b1b1b";
  g.beginPath(); g.arc(0, 2, 10, 0, 7); g.fill();
  g.beginPath(); g.arc(0, -9, 6, 0, 7); g.fill();
  g.fillStyle = "#c81e2a";
  g.beginPath(); g.moveTo(-3, 0); g.lineTo(3, 0); g.lineTo(0, 5); g.closePath(); g.fill();
  g.fillStyle = "#fff";
  g.beginPath(); g.arc(-2.5, -10, 1.8, 0, 7); g.arc(2.5, -10, 1.8, 0, 7); g.fill();
  g.restore();
}

// Cricket: green, long body, big folded jumping leg, long antennae.
function drawCricket(x, y, s, dir, now) {
  g.save();
  g.translate(x, y);
  g.scale(s * dir, s);
  g.fillStyle = "#4f9c35";
  g.beginPath(); g.ellipse(0, 0, 15, 6, -.1, 0, 7); g.fill();
  g.fillStyle = "#3d7d29";
  g.beginPath(); g.ellipse(13, -2, 6, 5, 0, 0, 7); g.fill();
  g.strokeStyle = "#2f6420";
  g.lineWidth = 2.5;
  g.lineCap = "round";
  g.beginPath(); g.moveTo(-4, 1); g.lineTo(-14, -12); g.lineTo(-20, 6); g.stroke();   // jumping leg
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(4, 4); g.lineTo(2, 10); g.moveTo(9, 4); g.lineTo(11, 10); g.stroke();
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(17, -5); g.quadraticCurveTo(26, -20, 34, -16); g.moveTo(16, -6); g.quadraticCurveTo(22, -24, 30, -24); g.stroke();
  g.fillStyle = "#111";
  g.beginPath(); g.arc(15, -3, 1.6, 0, 7); g.fill();
  g.restore();
}

// Bee: yellow with black stripes, round, small white wings, stinger.
function drawBee(x, y, s, dir, now) {
  const fl = Math.sin(now * .06);
  g.save();
  g.translate(x, y);
  g.scale(s * dir, s);
  g.fillStyle = "rgba(255,255,255,.75)";
  g.beginPath(); g.ellipse(-2, -10, 6, 9 + fl * 2, -.4, 0, 7); g.ellipse(5, -10, 5, 8 + fl * 2, .4, 0, 7); g.fill();
  g.fillStyle = "#ffcf2e";
  g.beginPath(); g.ellipse(0, 0, 13, 9, 0, 0, 7); g.fill();
  g.save();
  g.beginPath(); g.ellipse(0, 0, 13, 9, 0, 0, 7); g.clip();
  g.fillStyle = "#1a1a1a";
  [-6, 0, 6].forEach(sx => g.fillRect(sx - 1.6, -10, 3.2, 20));
  g.restore();
  g.fillStyle = "#1a1a1a";
  g.beginPath(); g.moveTo(-13, -2); g.lineTo(-19, 0); g.lineTo(-13, 2); g.closePath(); g.fill();   // stinger
  g.beginPath(); g.arc(12, -2, 4, 0, 7); g.fill();
  g.fillStyle = "#fff";
  g.beginPath(); g.arc(13.5, -3, 1.3, 0, 7); g.fill();
  g.restore();
}
