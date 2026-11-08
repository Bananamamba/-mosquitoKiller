// Tricksters: decoy bugs you must NOT hit. Every place with tricksters: true gets them.
// At most one on screen (S.trick). They LOOK very different from a mosquito (color, shape),
// but MOVE like the place's mosquitoes, so they are easy to slap by mistake:
//   place.trickArrive = "pop"  appears in place and hovers (like a bedroom mosquito)
//   place.trickArrive = "fly"  flies in, sits on its spot, flies off (like a beach mosquito)
//   place.trickSpot()          where it sits (default: a random spot)
// At least CFG.tricksters.minPerLoop show up in every loop of the run.
// The first time a player ever sees one, a short banner explains it (remembered in localStorage).

const TRICKS = {
  moth: {
    name: "MOTH",
    info: () => `Don't hit it! Bad luck: more mosquitoes for ${CFG.effects.moreEnemies.sec}s`,
    hit() { startEffect("moreEnemies", "moth"); pop(W / 2, 150, "BAD LUCK! More mosquitoes", "#d9c7a0", 17); },
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
    draw: drawSpider
  },
  cricket: {
    name: "CRICKET",
    info: () => "Don't hit it! You lose a life",
    hit() { pop(W / 2, 150, "CRICKET! You lost a life", "#9be59b", 17); loseLife("cricket", true); },
    draw: drawCricket
  },
  bee: {
    name: "BEE",
    info: () => `Don't hit it! Your slipper gets slow for ${CFG.effects.slowSlipper.sec}s`,
    hit() { startEffect("slowSlipper", "bee"); pop(W / 2, 150, "STUNG! Slow slipper", "#ffd84a", 17); },
    draw: drawBee
  },
};

// ---------- how often ----------

// Seconds until the next one: shorter as the run goes on.
function trickGap() {
  const c = CFG.tricksters, k = Math.min(1, S.placeIdx / c.rampPlaces);
  return rand([c.gapStart[0] + (c.gapEnd[0] - c.gapStart[0]) * k, c.gapStart[1] + (c.gapEnd[1] - c.gapStart[1]) * k]);
}

// Places with tricksters left in this loop, including the current one.
function trickPlacesLeft() {
  let n = 0;
  for (let i = S.placeIdx % PLACES.length; i < PLACES.length; i++) if (PLACES[i].tricksters) n++;
  return n;
}

// On entering a place: if the loop still owes tricksters (minPerLoop), bring them early in this visit.
function trickPlanVisit(place) {
  if (S.trickLoop !== S.lvl) { S.trickLoop = S.lvl; S.trickCount = 0; }
  S.trickDue = 0;
  if (!place.tricksters) return;
  const need = CFG.tricksters.minPerLoop - S.trickCount;
  if (need <= 0) return;
  S.trickDue = Math.ceil(need / trickPlacesLeft());
  S.trickT = Math.min(S.trickT, rand(CFG.tricksters.dueAfter));
}

function pickTrick() {
  const w = CFG.tricksters.weights;
  let tot = 0;
  for (const k in w) tot += w[k];
  let r = Math.random() * tot;
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return "moth";
}

// ---------- spawning and movement ----------

function spawnTrick() {
  const kind = pickTrick(), place = currentPlace(), c = CFG.tricksters;
  const spot = place.trickSpot ? place.trickSpot() : { x: 40 + Math.random() * 280, y: 110 + Math.random() * 320 };
  const b = {
    kind, style: place.trickArrive || "fly", state: "in", st: 0, ph: Math.random() * 9,
    hx: spot.x, hy: spot.y, x: spot.x, y: spot.y, a: 0, dir: Math.random() < .5 ? 1 : -1, stay: rand(c.stay),
    flash: slipperPerk("trickFlash", 0)   // Eagle Eye slipper: flashes when it appears
  };
  if (b.style === "fly") {
    // enter from the left, the right or the top, like a beach mosquito
    const sd = Math.random();
    if (sd < .35) { b.sx = -30; b.sy = 120 + Math.random() * 300; }
    else if (sd < .7) { b.sx = W + 30; b.sy = 120 + Math.random() * 300; }
    else { b.sx = 30 + Math.random() * 300; b.sy = -30; }
    b.x = b.sx;
    b.y = b.sy;
    b.a = 1;
  }
  S.trick = b;
  S.trickCount = (S.trickCount || 0) + 1;
  if (S.trickDue > 0) S.trickDue--;
  if (firstTime("trick:" + kind)) banner(TRICKS[kind].name, TRICKS[kind].info(), 1.8, { kind: "trick", key: kind });
}

// in → on (hover / sit for a while) → out (flies off). Returns true when it is gone.
function moveTrick(b, dt) {
  b.st += dt;
  b.ph += dt;
  b.flash = Math.max(0, b.flash - dt);
  if (b.state === "in") {
    if (b.style === "pop") {
      b.a = Math.min(1, b.st / .1);
      if (b.st >= .1) { b.state = "on"; b.st = 0; }
    } else {
      // eased flight to the spot with a sideways wobble that fades out on arrival
      const k = Math.min(1, b.st / 1.1), e = 1 - (1 - k) * (1 - k);
      const dx = b.hx - b.sx, dy = b.hy - b.sy, L = Math.hypot(dx, dy) || 1, w = Math.sin(b.st * 7) * 22 * (1 - k);
      b.x = b.sx + dx * e - dy / L * w;
      b.y = b.sy + dy * e + dx / L * w;
      b.dir = dx > 0 ? 1 : -1;
      if (k >= 1) { b.state = "on"; b.st = 0; }
    }
  } else if (b.state === "on") {
    // hovering like a bedroom mosquito, or sitting still like a beach one
    if (b.style === "pop") {
      b.x = b.hx + Math.sin(b.ph * 5) * 6;
      b.y = b.hy + Math.cos(b.ph * 4) * 4;
    } else {
      b.x = b.hx + Math.sin(b.ph * 30) * .6;
      b.y = b.hy;
    }
    if (b.st >= b.stay) {
      b.state = "out";
      b.st = 0;
      const an = Math.random() * 6.28;
      b.vx = Math.cos(an) * 380;
      b.vy = Math.sin(an) * 380 - 100;
      b.dir = b.vx > 0 ? 1 : -1;
    }
  } else {
    b.a = Math.max(0, 1 - b.st / .35);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    return b.st >= .35;
  }
  return false;
}

// Not during the Queen or the fog, and only in places that have tricksters.
function updTricksters(dt) {
  if (!currentPlace().tricksters || S.q) return;
  if (S.trick) {
    if (moveTrick(S.trick, dt)) S.trick = null;
    return;
  }
  if (effectOn("fog")) return;
  S.trickT -= dt;
  if (S.trickT <= 0) {
    spawnTrick();
    S.trickT = S.trickDue > 0 ? rand(CFG.tricksters.dueGap) : trickGap();
  }
}

// Distance from a tap to the trickster (Infinity if none, or if it is already fading away).
const trickDist = p => S.trick && S.trick.a > .5 ? Math.hypot(S.trick.x - p.x, S.trick.y - p.y) : Infinity;

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
  g.save();
  g.globalAlpha = b.a;
  if (b.flash > 0 && Math.floor(b.flash / .08) % 2 === 0) {
    // Eagle Eye: a blinking white glow around it
    const gr = g.createRadialGradient(b.x, b.y, 4, b.x, b.y, 38);
    gr.addColorStop(0, "rgba(255,255,255,.9)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath(); g.arc(b.x, b.y, 38, 0, 7); g.fill();
  }
  TRICKS[b.kind].draw(b.x, b.y, 1, b.dir, now);
  g.restore();
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
  g.beginPath();
  g.moveTo(17, -5); g.quadraticCurveTo(26, -20, 34, -16);
  g.moveTo(16, -6); g.quadraticCurveTo(22, -24, 30, -24);
  g.stroke();
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
