// Sprites: the mosquito, the slipper, the Queen's face, and the little life heads.

// One mosquito. face: 1 / -1 to mirror; landed: wings folded; sc: size;
// kind: mosquito type (changes colors/extras); blood: 0..1 how full its belly is.
function mosq(x, y, face, landed, t, ph, sc, kind, blood) {
  g.save();
  g.translate(x, y);
  g.scale(face * sc, sc);
  const gold = kind === "gold", fat = kind === "fat", cow = kind === "coward", spl = kind === "splitter";
  const flap = landed ? 0 : Math.sin(t * .09 + ph);
  const body = gold ? "#ffd34d" : cow ? "#7d6b6b" : "#3b2b2b";
  const leg = gold ? "#c79a1d" : "#2a1d1d";
  if (gold && !landed) { g.shadowColor = "#ffd34d"; g.shadowBlur = 12; }

  // legs
  g.strokeStyle = leg;
  g.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.moveTo(-2 + i * 3, 3);
    g.lineTo(-9 + i * 5, landed ? 9 : 14);
    g.stroke();
  }

  // wings: folded flat when landed, flapping when flying
  g.fillStyle = "rgba(210,230,255,.6)";
  if (landed) {
    g.beginPath(); g.ellipse(-8, -2, 10, 3, -.2, 0, 7); g.fill();
  } else {
    g.beginPath();
    g.ellipse(-3, -8, 4, 10 + flap * 3, -.6, 0, 7);
    g.ellipse(3, -8, 4, 9 + flap * 3, .5, 0, 7);
    g.fill();
  }

  // abdomen: the fat one is a red blood balloon
  if (fat) {
    g.fillStyle = "#b3172c";
    g.beginPath(); g.ellipse(-9, 2, 15, 9, -.15, 0, 7); g.fill();
    g.fillStyle = "rgba(255,180,180,.6)";
    g.beginPath(); g.ellipse(-12, -2, 5, 2.5, -.2, 0, 7); g.fill();
  } else {
    g.fillStyle = spl ? "#7a3bb5" : body;
    g.beginPath(); g.ellipse(-6, 1, spl ? 11 : 9, spl ? 5.5 : 4, -.15, 0, 7); g.fill();
  }
  // belly swelling while it bites
  if (blood > 0 && !fat) {
    g.fillStyle = `rgba(200,20,40,${.3 + .7 * blood})`;
    g.beginPath(); g.ellipse(-6 - 3 * blood, 1, 9 + 5 * blood, 4 + 4 * blood, -.15, 0, 7); g.fill();
  }

  // head, white stripes, needle, red eye
  g.fillStyle = body;
  g.beginPath(); g.arc(5, -1, 4.5, 0, 7); g.fill();
  if (!gold && !fat) {
    g.fillStyle = "#e8eef7";
    for (let i = 0; i < 3; i++) g.fillRect(-12 + i * 4, -1, 1.5, 4);
  }
  g.strokeStyle = body;
  g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(9, -1); g.lineTo(18, 2); g.stroke();
  g.fillStyle = "#e2354b";
  g.beginPath(); g.arc(7, -3, 1.8, 0, 7); g.fill();

  // armored: a little helmet
  if (kind === "armored") {
    g.fillStyle = "#9aa3b5";
    g.beginPath();
    g.arc(5, -2, 6.5, Math.PI, 0);
    g.lineTo(11.5, 0);
    g.lineTo(-1.5, 0);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(255,255,255,.7)";
    g.fillRect(2, -6, 3, 1.5);
  }
  // coward: a nervous sweat drop
  if (cow && !landed) {
    g.fillStyle = "#9fd6ff";
    g.beginPath();
    g.moveTo(10, -14);
    g.quadraticCurveTo(13, -9, 10, -8);
    g.quadraticCurveTo(7, -9, 10, -14);
    g.fill();
  }
  g.restore();
}

// The blue flip-flop that slams down on every tap. s: scale, rot: angle, a: opacity.
function slipper(x, y, s, rot, a) {
  g.save();
  g.globalAlpha = a;
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  // sole
  g.fillStyle = "#1d4f9c";
  g.beginPath(); g.roundRect(-19, -50, 38, 100, [19, 19, 16, 16]); g.fill();
  g.fillStyle = "#3d86e8";
  g.beginPath(); g.roundRect(-16, -47, 32, 93, [16, 16, 13, 13]); g.fill();
  g.fillStyle = "rgba(255,255,255,.13)";
  for (let yy = -36; yy < 40; yy += 9) g.fillRect(-11, yy, 22, 2);
  // V strap (dark outline under a white strap)
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-16, 4);
  g.quadraticCurveTo(-6, -14, 0, -28);
  g.quadraticCurveTo(6, -14, 16, 4);
  g.strokeStyle = "#0f2d5c";
  g.lineWidth = 9;
  g.stroke();
  g.strokeStyle = "#f2f0ea";
  g.lineWidth = 6;
  g.stroke();
  g.fillStyle = "#0f2d5c";
  g.beginPath(); g.arc(0, -28, 4, 0, 7); g.fill();
  g.restore();
}

// The Queen's huge face. mood: "scare" | "laugh" | "wind" (about to sting) | "hover".
function queenFace(x, y, s, mood, t, alpha) {
  g.save();
  g.globalAlpha = alpha ?? 1;
  g.translate(x, y);
  g.scale(s, s);
  if (mood === "scare" || mood === "laugh" || mood === "wind") g.translate((Math.random() - .5) * 5, (Math.random() - .5) * 5);

  // wings
  const fl = Math.sin(t * .12);
  g.fillStyle = "rgba(170,190,220,.16)";
  g.beginPath();
  g.ellipse(-112, -58, 92, 30 + fl * 9, -.5, 0, 7);
  g.ellipse(112, -58, 92, 30 + fl * 9, .5, 0, 7);
  g.fill();

  // feathery antennae
  g.strokeStyle = "#2a1414";
  [-1, 1].forEach(sd => {
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(sd * 25, -62);
    g.quadraticCurveTo(sd * 40, -130, sd * 85, -150);
    g.stroke();
    g.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const k = i / 9, ax = sd * (25 + k * 55), ay = -62 - k * 85;
      g.beginPath();
      g.moveTo(ax, ay); g.lineTo(ax + sd * 15, ay - 5);
      g.moveTo(ax, ay); g.lineTo(ax - sd * 6, ay - 15);
      g.stroke();
    }
  });

  // hairy head
  const hg = g.createRadialGradient(0, -10, 10, 0, 0, 100);
  hg.addColorStop(0, "#4a2a24");
  hg.addColorStop(1, "#120808");
  g.fillStyle = hg;
  g.beginPath(); g.ellipse(0, 0, 92, 78, 0, 0, 7); g.fill();
  g.strokeStyle = "#1a0c0a";
  g.lineWidth = 2;
  for (let i = 0; i < 44; i++) {
    const a = i / 44 * Math.PI * 2, cx = 92 * Math.cos(a), cy = 78 * Math.sin(a);
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx * 1.13, cy * 1.13); g.stroke();
  }

  // glowing red compound eyes
  const glow = mood === "wind" ? 1 : mood === "hover" ? .5 : .9;
  [-1, 1].forEach(sd => {
    g.save();
    g.translate(sd * 44, -14);
    g.rotate(sd * .25);
    g.shadowColor = "#ff1a2e";
    g.shadowBlur = 34 * glow;
    const eg = g.createRadialGradient(-sd * 8, -10, 4, 0, 0, 46);
    eg.addColorStop(0, glow > .9 ? "#ff8a8a" : "#ff4a4a");
    eg.addColorStop(.5, "#b5101e");
    eg.addColorStop(1, "#3a0006");
    g.fillStyle = eg;
    g.beginPath(); g.ellipse(0, 0, 38, 44, 0, 0, 7); g.fill();
    g.shadowBlur = 0;
    // facets
    g.save();
    g.beginPath(); g.ellipse(0, 0, 38, 44, 0, 0, 7); g.clip();
    g.fillStyle = "rgba(20,0,0,.35)";
    for (let fx = -40; fx < 44; fx += 8) {
      for (let fy = -48; fy < 48; fy += 7) {
        g.beginPath(); g.arc(fx + ((fy + 48) / 7 % 2 ? 4 : 0), fy, 2.2, 0, 7); g.fill();
      }
    }
    g.restore();
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath(); g.ellipse(-sd * 10, -20, 8, 4, -.4, 0, 7); g.fill();
    g.restore();
  });

  // mouth: wide open with teeth (scare/laugh) or a toothy grin
  if (mood === "laugh" || mood === "scare") {
    const open = mood === "laugh" ? 14 + Math.abs(Math.sin(t * .025)) * 18 : 28;
    g.fillStyle = "#2a0004";
    g.beginPath();
    g.moveTo(-56, 32);
    g.quadraticCurveTo(0, 32 + open * 2.6, 56, 32);
    g.quadraticCurveTo(0, 40, -56, 32);
    g.fill();
    g.fillStyle = "#e8dcc0";
    for (let i = 0; i < 10; i++) {
      const tx = -50 + i * 10.5;
      g.beginPath(); g.moveTo(tx, 34); g.lineTo(tx + 5, 46 + (i % 2) * 5); g.lineTo(tx + 10.5, 34); g.fill();
    }
    for (let i = 1; i < 9; i++) {
      const u = i / 9, bx = -56 + 112 * u, by = 32 + 2 * u * (1 - u) * open * 2.6 * .5 + 2;
      g.beginPath(); g.moveTo(bx - 5, by + 2); g.lineTo(bx, by - 9 - (i % 2) * 4); g.lineTo(bx + 5, by + 2); g.fill();
    }
  } else {
    g.strokeStyle = "#000";
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(-48, 34); g.quadraticCurveTo(0, 64, 48, 34); g.stroke();
    g.fillStyle = "#e8dcc0";
    for (let i = 1; i < 8; i++) {
      const u = i / 8, bx = -48 + 96 * u, by = 34 + 2 * u * (1 - u) * 30;
      g.beginPath(); g.moveTo(bx - 4, by - 1); g.lineTo(bx, by + 7); g.lineTo(bx + 4, by - 1); g.fill();
    }
  }

  // the long needle with a drop of blood (longer when she screams)
  g.strokeStyle = "#1a0c0a";
  g.lineWidth = 6;
  g.beginPath(); g.moveTo(0, 52); g.lineTo(0, mood === "scare" ? 200 : 150); g.stroke();
  g.strokeStyle = "#6a3a30";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#c4121f";
  g.beginPath(); g.arc(0, mood === "scare" ? 204 : 154, 4, 0, 7); g.fill();
  g.restore();
}

// Small mosquito head on the canvas = one campaign life (faded when lost).
function headIcon(x, y, on) {
  g.save();
  g.globalAlpha = on ? 1 : .22;
  g.translate(x, y);
  g.strokeStyle = "#3b2b2b";
  g.lineWidth = 1.5;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-5, -6); g.lineTo(-8, -11);
  g.moveTo(5, -6); g.lineTo(8, -11);
  g.moveTo(5, 3); g.lineTo(11, 8);
  g.stroke();
  g.fillStyle = "#4a3838";
  g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill();
  g.fillStyle = "#e2354b";
  g.beginPath(); g.arc(-3.2, -2, 2.8, 0, 7); g.arc(3.2, -2, 2.8, 0, 7); g.fill();
  g.strokeStyle = "#fff";
  g.lineWidth = 1.2;
  g.beginPath(); g.arc(0, 2, 3, .3, 2.8); g.stroke();
  g.restore();
}
