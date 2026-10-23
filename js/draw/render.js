// Draws one full frame: room, mosquitoes, darkness, effects, then the HUD (hud.js).
// The order of the layers matters: later calls paint over earlier ones.

function draw(now) {
  const BEACH = STAGE === "beach";
  const q = S.q, fightVis = q && q.phase === "fight" && q.vanish <= 0;

  // Everything except the HUD shakes with the screen.
  g.save();
  if (S.shake > 0) {
    const m = S.shake * 45 * (Math.random() - .5);
    g.translate(Math.cos(S.shakeA) * m + (Math.random() - .5) * 3, Math.sin(S.shakeA) * m + (Math.random() - .5) * 3);
  }
  drawRoom(now, BEACH);
  if (fightVis || (q && q.phase === "dying")) {
    const mood = q.phase === "dying" || q.hurt > 0 ? "scare" : q.sting > .75 ? "wind" : "hover";
    queenFace(q.x, q.y, q.s, mood, now, q.phase === "dying" ? Math.max(0, 1 - q.t / 1.4) : 1);
  }
  if (STAGE === "one" && S.one && !S.one.dead) {
    const o = S.one;
    mosq(o.x, o.y, o.face, o.landed, now, o.ph, 1.5, "norm");
  }
  drawBugs(now);
  if (!BEACH || (q && q.phase === "black")) drawDarkness(BEACH, q, fightVis);
  drawListening(now);
  if (BEACH && S.flash > 0) {
    g.fillStyle = `rgba(255,255,255,${.3 * Math.min(1, S.flash / .08)})`;
    g.fillRect(0, 0, W, H);
  }
  drawMosheDamage();
  drawFlashlightRims();
  drawRemains(now);
  if (S.bitFlash > 0) {
    // red vignette when bitten
    const v = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75);
    v.addColorStop(0, "rgba(200,20,40,0)");
    v.addColorStop(1, `rgba(200,20,40,${S.bitFlash})`);
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
  }
  if (S.awakeT > 0) {
    g.fillStyle = "rgba(200,40,40,.18)";
    g.fillRect(0, 0, W, H);
  }
  if (q) drawQueenOverlays(now, q, fightVis);
  drawParticles();
  drawSlaps();
  drawPops();
  g.restore();

  drawHUD(now, BEACH, q);
}

// Background. On the beach Moshe is mirrored when he lies the other way,
// and squeezed through a cosine during the roll-over animation.
function drawRoom(now, BEACH) {
  if (BEACH) {
    beach(now);
    g.save();
    const sxf = S.flipT > 0 ? (S.flip ? -1 : 1) * Math.cos((1 - S.flipT / .5) * Math.PI) : (S.flip ? -1 : 1);
    g.translate(W / 2, 0);
    g.scale(sxf, 1);
    g.translate(-W / 2, 0);
    moshe(now);
    g.restore();
  } else bedroom();
}

// Live mosquitoes, plus the beach warnings (face circle, dig-in ring, biting ring).
function drawBugs(now) {
  S.bugs.forEach(b => {
    g.save();
    if (b.beach) {
      // beach bugs are rotated toward where they fly / the skin they sit on
      const sit = b.state === "land" || b.state === "bite", an = sit ? b.ang : b.hd, fl = Math.cos(an) < 0;
      g.globalAlpha = b.a;
      g.translate(b.x, b.y);
      g.rotate(fl ? an + Math.PI : an);
      const sk = b.state === "stuck";
      if (sk) g.translate(8 * b.sc, 0);
      mosq(0, 0, fl ? -1 : 1, sit || sk, now, b.ph, b.sc * (sk ? .9 : 1), b.armor > 0 ? "armored" : b.type, b.blood);
    } else {
      g.globalAlpha = b.state === "fake" ? b.a : Math.max(.15, b.a);
      const sc = b.type === "fat" ? 2 : b.type === "coward" ? 1.25 : b.type === "mini" ? 1 : b.type === "splitter" ? 1.9 : 1.5;
      mosq(b.x, b.y, b.face, false, now, b.ph, sc, b.armor > 0 ? "armored" : b.type);
    }
    g.restore();

    // a mosquito on Moshe's face: dashed warning circle
    if (b.beach && b.zone === "face" && b.state !== "out") {
      g.save();
      g.setLineDash([6, 5]);
      g.strokeStyle = `rgba(255,60,70,${.6 + .3 * Math.sin(now * .02)})`;
      g.lineWidth = 3;
      g.beginPath(); g.arc((S.flip ? W - 76 : 76), 413, 32, 0, 7); g.stroke();
      g.setLineDash([]);
      g.font = "11px 'Rubik Mono One', sans-serif";
      g.textAlign = "center";
      g.fillStyle = "#ff5a6e";
      g.fillText("CAREFUL: FACE", (S.flip ? W - 76 : 76), 370);
      g.restore();
    }
    // belly stucker: dashed ring + hold-to-pull progress
    if (b.beach && b.state === "stuck") {
      const pr = S.pull && S.pull.b === b ? S.pull.t / .5 : 0;
      g.strokeStyle = "rgba(255,180,160,.6)";
      g.lineWidth = 2;
      g.setLineDash([4, 4]);
      g.beginPath(); g.arc(b.hx, b.hy, 22, 0, 7); g.stroke();
      g.setLineDash([]);
      if (pr > 0) {
        g.strokeStyle = "#ffc94d";
        g.lineWidth = 4;
        g.beginPath(); g.arc(b.hx, b.hy, 22, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2); g.stroke();
      }
    }
    // biting right now: pulsing red ring that grows with the blood
    if (b.beach && b.state === "bite") {
      g.strokeStyle = `rgba(255,50,60,${.55 + .45 * Math.sin(now * .03)})`;
      g.lineWidth = 2.5;
      g.beginPath(); g.arc(b.hx, b.hy, 9 + 7 * b.blood, 0, 7); g.stroke();
    }
  });
}

// Darkness layer: fill the off-screen canvas, cut soft light holes, then paint it over the room.
function drawDarkness(BEACH, q, fightVis) {
  const darkEv = S.ev && S.ev.k === "dark";   // "Lights out" event
  d.globalCompositeOperation = "source-over";
  d.clearRect(0, 0, W, H);
  d.fillStyle = q && q.phase === "black" ? "#000"
    : S.awakeT > 0 ? "rgba(8,6,22,.25)"
    : STAGE === "one" ? `rgba(2,3,8,${(S.lampT > 0 ? .3 : .985 - .05 * (S.perks.vision || 0)) * (1 - (S.lightsOn || 0))})`
    : BEACH ? "rgba(8,6,22,.72)"
    : `rgba(3,4,10,${(darkEv ? 1 : .975 - .07 * (S.perks.vision || 0))})`;
  d.fillRect(0, 0, W, H);
  d.globalCompositeOperation = "destination-out";

  // soft round hole: a = how much light gets through
  const hole = (x, y, r, a) => {
    if (r <= 1) return;
    const gr = d.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${a})`);
    gr.addColorStop(.6, `rgba(0,0,0,${a * .75})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    d.fillStyle = gr;
    d.beginPath(); d.arc(x, y, r, 0, 7); d.fill();
  };
  // sun / window glow
  if (!(q && q.phase === "black")) {
    if (BEACH) hole(300, 90, 135, .55);
    else if (!darkEv) hole(268, 116, 95, q ? .25 : .4);
  }
  // the flashlight finds each mosquito
  S.bugs.forEach(b => hole(b.x, b.y, 64 * b.a * (1 + .25 * (S.perks.vision || 0)) * (darkEv ? .55 : 1), b.a));
  if (S.slapLight) hole(S.slapLight.x, S.slapLight.y, 70, .95 * S.slapLight.t / .25);
  if (fightVis) hole(q.x, q.y, 125 * q.s, .8);
  if (q && q.phase === "dying") hole(q.x, q.y, 135 * q.s, .85 * Math.max(0, 1 - q.t / 1.4));
  // hit flash briefly lights the whole room
  if (S.flash > 0) {
    d.fillStyle = `rgba(0,0,0,${.8 * Math.min(1, S.flash / .08)})`;
    d.fillRect(0, 0, W, H);
  }
  g.drawImage(dark, 0, 0, W, H);
}

// The One: a blue glow on the side the buzz comes from, and a ring under the listening finger.
function drawListening(now) {
  if (!(STAGE === "one" && S.one && !S.one.dead && S.playing)) return;
  const o = S.one, ear = S.hold && S.ear ? S.ear : { x: 180, y: 450 };
  if (o.near > 0) {
    const left = o.x < ear.x, gr = g.createLinearGradient(left ? 0 : W, 0, left ? 70 : W - 70, 0);
    gr.addColorStop(0, `rgba(150,170,255,${.3 * o.near})`);
    gr.addColorStop(1, "rgba(150,170,255,0)");
    g.fillStyle = gr;
    g.fillRect(left ? 0 : W - 70, 0, 70, H);
  }
  if (S.hold && S.ear) {
    // pulses faster and turns red as the mosquito gets close
    const nr = o.near, rr = 26 + 5 * Math.sin(now * (.004 + .035 * nr));
    g.strokeStyle = nr > .6 ? `rgba(255,90,100,${.5 + .5 * nr})` : `rgba(160,185,255,${.35 + .5 * nr})`;
    g.lineWidth = 2 + 3 * nr;
    g.beginPath(); g.arc(S.ear.x, S.ear.y, rr, 0, 7); g.stroke();
    g.fillStyle = "rgba(232,238,247,.7)";
    g.beginPath(); g.arc(S.ear.x, S.ear.y, 3, 0, 7); g.fill();
  }
}

// Red slipper marks on Moshe's skin and red bite bumps.
function drawMosheDamage() {
  S.marks.forEach(m => {
    g.save();
    g.globalAlpha = .4 * Math.min(1, m.life / 1.2);
    g.fillStyle = "#ff5a5a";
    g.translate(m.x, m.y);
    g.rotate(m.rot);
    g.beginPath(); g.roundRect(-15, -40, 30, 80, 15); g.fill();
    g.restore();
  });
  S.bumps.forEach(u => {
    if (u.r < .5) return;
    g.fillStyle = "rgba(225,55,55,.85)";
    g.beginPath(); g.arc(u.x, u.y, u.r, 0, 7); g.fill();
    g.fillStyle = "rgba(255,190,180,.85)";
    g.beginPath(); g.arc(u.x - 1.5, u.y - 1.5, u.r * .4, 0, 7); g.fill();
  });
}

// Bedroom: colored rim around each flashlight circle (gold / fat / faker get their own color).
function drawFlashlightRims() {
  S.bugs.forEach(b => {
    if (b.state === "out" || b.beach) return;
    g.strokeStyle = b.type === "gold" ? `rgba(255,211,77,${.5 * b.a})`
      : b.type === "fat" ? `rgba(255,80,90,${.55 * b.a})`
      : b.state === "fake" ? `rgba(185,164,255,${.6 * b.a})`
      : `rgba(255,226,160,${.28 * b.a})`;
    g.lineWidth = 2;
    g.beginPath(); g.arc(b.hx, b.hy, (b.type === "fat" ? 62 : 52) * Math.max(b.a, .5), 0, 7); g.stroke();
  });
}

// Squashed mosquitoes: a blood splat plus the flattened body (falling ones were killed mid-air).
function drawRemains(now) {
  S.fx.forEach(f => {
    if (f.kind !== "splat") return;
    g.save();
    g.globalAlpha = Math.min(.85, f.life);
    g.fillStyle = "#b3172c";
    if (!f.fall) {
      g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill();
      f.dots.forEach(([a, b, r]) => { g.beginPath(); g.arc(f.x + a, f.y + b, r, 0, 7); g.fill(); });
    }
    g.translate(f.x, f.y);
    g.scale(1, .4);
    mosq(0, 0, f.face, true, now, 0, f.type === "fat" ? 2 : 1.5, f.type);
    g.restore();
  });
}

// The Queen's scenes: red glow, sting warning, jump scare, lunge and the "HA HA HA" loss.
function drawQueenOverlays(now, q, fightVis) {
  if (fightVis) {
    const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 130 * q.s);
    gr.addColorStop(0, "rgba(255,30,50,.14)");
    gr.addColorStop(1, "rgba(255,30,50,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  if (q.phase === "fight" && q.sting > .7) {
    // pulsing red edges: she is about to sting
    const k = (q.sting - .7) / .3, v = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75);
    v.addColorStop(0, "rgba(160,0,15,0)");
    v.addColorStop(1, `rgba(160,0,15,${(.35 + .25 * Math.sin(now * .02)) * k})`);
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
  }
  if (q.phase === "scare") {
    // white flash, then dark red, with the huge face
    g.fillStyle = q.t < .1 ? "rgba(255,255,255,.92)" : "rgba(90,0,8,.6)";
    g.fillRect(0, 0, W, H);
    queenFace(W / 2, 260, 2.6 + Math.sin(q.t * 30) * .06, "scare", now, 1);
  }
  if (q.phase === "shrink") queenFace(q.x, q.y, q.s, "scare", now, 1);
  if (q.phase === "fight" && q.popT > 0) queenFace(q.x, q.y, q.s, "scare", now, 1);
  if (q.phase === "lunge") {
    const k = Math.min(1, q.t / .45);
    g.fillStyle = `rgba(90,0,8,${.6 * k})`;
    g.fillRect(0, 0, W, H);
    queenFace(q.x, q.y, q.s, "scare", now, 1);
  }
  if (q.phase === "laugh") {
    g.fillStyle = "rgba(90,0,8,.65)";
    g.fillRect(0, 0, W, H);
    queenFace(W / 2, 260, 2.4, "laugh", now, 1);
    g.save();
    g.font = "34px 'Rubik Mono One', sans-serif";
    g.textAlign = "center";
    g.lineWidth = 6;
    g.strokeStyle = "#070a14";
    const yy = 96 + Math.sin(now * .03) * 4;
    g.strokeText("HA HA HA", W / 2, yy);
    g.fillStyle = "#ff5a6e";
    g.fillText("HA HA HA", W / 2, yy);
    g.restore();
  }
}

// Blood drops, spray clouds and Moshe's snore "z"s.
function drawParticles() {
  S.fx.forEach(f => {
    if (f.kind === "drop") {
      g.fillStyle = `rgba(205,24,44,${Math.min(1, f.life * 2.5)})`;
      g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill();
    }
    if (f.kind === "cloud") {
      g.fillStyle = `rgba(205,245,205,${.4 * Math.min(1, f.life)})`;
      g.beginPath(); g.arc(f.x, f.y, f.r * (1.6 - f.life * .5), 0, 7); g.fill();
    }
    if (f.kind === "z") {
      g.globalAlpha = Math.min(1, f.life);
      g.font = "16px 'Rubik Mono One', sans-serif";
      g.textAlign = "left";
      g.fillStyle = "#e8eef7";
      g.fillText("z", f.x, f.y);
      g.font = "12px 'Rubik Mono One', sans-serif";
      g.fillText("z", f.x + 12, f.y - 12);
      g.globalAlpha = 1;
    }
  });
}

// Slipper animation: drops in big from above (first 0.07 s), stays, then fades out.
function drawSlaps() {
  S.slaps.forEach(s => {
    const t = s.t;
    let sc = 1, off = 0, a = 1;
    if (t < .07) {
      const k = t / .07;
      sc = 1.9 - .9 * k;
      off = -50 * (1 - k);
      a = .5 + .5 * k;
    } else if (t > .3) a = Math.max(0, 1 - (t - .3) / .15);
    // shadow
    g.save();
    g.globalAlpha = .35 * a;
    g.fillStyle = "#000";
    g.translate(s.x + 6, s.y + 8);
    g.rotate(s.rot);
    g.beginPath(); g.ellipse(0, 0, 19 * sc, 44 * sc, 0, 0, 7); g.fill();
    g.restore();
    slipper(s.x, s.y + off, sc * (s.big ? 1.6 : .9), s.rot, a);
  });
}

// Floating texts ("+5", "Whiff", ...).
function drawPops() {
  S.pops.forEach(p => {
    g.globalAlpha = Math.min(1, p.life * 1.5);
    g.font = `${p.size}px 'Rubik Mono One', sans-serif`;
    g.textAlign = "center";
    g.lineWidth = 4;
    g.strokeStyle = "#070a14";
    g.strokeText(p.txt, p.x, p.y);
    g.fillStyle = p.col;
    g.fillText(p.txt, p.x, p.y);
  });
  g.globalAlpha = 1;
}
