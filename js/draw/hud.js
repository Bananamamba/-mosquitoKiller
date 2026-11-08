// HUD: drawn on top of everything and does not shake. Kept small so it doesn't hide the game:
// top bar (score · lives · goal, with thin progress and fever lines under it);
// bottom bar (Moshe's wake meter, or bites / slaps) with the effect timers. Banners in the middle.

const HUD_FONT = "'Rubik Mono One', sans-serif";

function drawHUD(now, BEACH, q) {
  drawModeTints(now);
  if (S.playing) {
    const queenBars = q && (q.phase === "fight" || q.phase === "dying");
    drawTopBar(BEACH);
    if (queenBars) drawQueenBars(q);
    else if (currentPlace().fever) drawFeverLine();
    drawBottomBar(BEACH, now);
    for (let i = 0; i < CFG.run.lives; i++) headIcon(W / 2 - 22 + i * 22, 20, i < S.lives);
  }
  if (S.banner) drawBanner(now);
  drawDebug();
}

// Fever = pink screen with a pulsing frame; events tint the screen gold or orange.
function drawModeTints(now) {
  if (S.feverT > 0) {
    g.fillStyle = `rgba(255,80,200,${.1 + .07 * Math.sin(now * .025)})`;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = `rgba(255,106,213,${.6 + .3 * Math.sin(now * .04)})`;
    g.lineWidth = 8;
    g.strokeRect(0, 0, W, H);
  }
  if (S.ev && S.ev.k === "gold") { g.fillStyle = "rgba(255,210,80,.1)"; g.fillRect(0, 0, W, H); }
  if (S.ev && S.ev.k === "heat") { g.fillStyle = "rgba(255,120,40,.09)"; g.fillRect(0, 0, W, H); }
}

// Score + streak on the left; progress to the threshold (or time left) on the right; progress line under it.
function drawTopBar(BEACH) {
  const place = currentPlace(), got = S.score - S.placeStart;
  const k = place.threshold ? Math.min(1, got / S.threshold) : S.left / S.dur;
  g.fillStyle = "rgba(7,10,20,.75)";
  g.fillRect(0, 0, W, 40);
  g.fillStyle = BEACH ? "#2a9d8f" : !place.threshold && k < .25 ? "#e2354b" : "#ffc94d";
  g.fillRect(0, 36, W * k, 4);

  g.font = "18px " + HUD_FONT;
  g.fillStyle = "#e8eef7";
  g.textAlign = "left";
  g.fillText(String(S.score), 14, 27);
  const mm = mult();
  if (mm > 1) {
    const sw = g.measureText(String(S.score)).width;
    g.font = "11px " + HUD_FONT;
    g.fillStyle = "#ffc94d";
    g.fillText("x" + mm, 20 + sw, 26);
  }

  g.textAlign = "right";
  g.font = "13px " + HUD_FONT;
  if (place.threshold) {
    g.fillStyle = "#e8eef7";
    g.fillText(`${Math.max(0, got)}/${S.threshold}`, W - 12, 26);
    g.font = "8px " + HUD_FONT;
    g.fillStyle = "#93a0c4";
    g.fillText("GOAL", W - 12, 11);
  } else {
    g.fillStyle = k < .25 ? "#ff8a8a" : "#e8eef7";
    g.fillText(`${S.left.toFixed(0)}s`, W - 12, 26);
  }
}

// Fever: a thin pink line right under the top bar (gold while fever is on).
function drawFeverLine() {
  const fv = S.feverT > 0 ? S.feverT / CFG.fever.sec : (S.fever || 0);
  if (fv <= 0) return;
  g.fillStyle = S.feverT > 0 ? "#ffc94d" : "#ff6ad5";
  g.fillRect(0, 40, W * fv, 3);
}

// Running event and active effects, short: e.g. "BAD LUCK 7 · GOLDEN HOUR 3".
function statusText() {
  const items = [];
  if (S.ev) items.push([EVTXT[S.ev.k][0].split("!")[0], EVTXT[S.ev.k][1], S.ev.t]);
  for (const id in S.effects) items.push([EFFECTS[id].label, EFFECTS[id].color, S.effects[id].t]);
  return items;
}

// Draws the status items centered at (cx, y).
function drawStatus(cx, y) {
  const items = statusText();
  if (!items.length) return;
  g.font = "9px " + HUD_FONT;
  const parts = items.map(([label, color, t]) => [`${label} ${Math.ceil(t)}`, color]);
  const total = parts.reduce((sum, [txt]) => sum + g.measureText(txt).width, 0) + 14 * (parts.length - 1);
  let x = cx - total / 2;
  g.textAlign = "left";
  parts.forEach(([txt, color]) => {
    g.fillStyle = color;
    g.fillText(txt, x, y);
    x += g.measureText(txt).width + 14;
  });
}

// The Queen's health and the "HER STING" timer (fills up; full = she lunges).
function drawQueenBars(q) {
  g.fillStyle = "rgba(7,10,20,.8)";
  g.fillRect(0, 40, W, 44);
  g.font = "10px " + HUD_FONT;
  g.textAlign = "left";
  g.fillStyle = "#ff8a8a";
  g.fillText("THE QUEEN", 12, 58);
  g.fillStyle = "#3a0a12";
  g.fillRect(100, 50, W - 114, 9);
  g.fillStyle = "#e2354b";
  g.fillRect(100, 50, (W - 114) * Math.max(0, q.hp) / q.max, 9);
  g.fillStyle = "#c8b6ee";
  g.fillText("HER STING", 12, 77);
  g.fillStyle = "#2a2244";
  g.fillRect(100, 69, W - 114, 9);
  g.fillStyle = q.sting > .7 ? "#ff5a6e" : "#b9a4ff";
  g.fillRect(100, 69, (W - 114) * q.sting, 9);
}

// Beach: a big wake meter (red and flashing when he is about to wake).
// Other places: left = loop / slaps left, right = bites.
function drawBottomBar(BEACH, now) {
  if (BEACH) { drawWakeMeter(now); return; }
  g.fillStyle = "rgba(7,10,20,.78)";
  g.fillRect(0, H - 28, W, 28);
  g.font = "11px " + HUD_FONT;
  g.textAlign = "left";
  g.fillStyle = "#93a0c4";
  const ONE = STAGE === "one";
  g.fillText(ONE ? "SLAPS LEFT " + S.slapsLeft : "LOOP " + (S.lvl + 1), 12, H - 10);
  g.textAlign = "right";
  const bites = ONE ? S.oneBites : S.bites, max = ONE ? oneMax() : maxBites();
  g.fillStyle = bites >= max - 1 ? "#ff5a6e" : "#ff8a8a";
  g.fillText(`BITES ${bites}/${max}`, W - 12, H - 10);
  drawStatus(W / 2, H - 10);
}

function drawWakeMeter(now) {
  const x = 84, w = W - 96, y = H - 30, h = 18, danger = S.wake > .65, status = statusText().length;
  g.fillStyle = "rgba(7,10,20,.85)";
  g.fillRect(0, H - (status ? 52 : 40), W, status ? 52 : 40);
  if (status) drawStatus(W / 2, H - 38);
  g.font = "12px " + HUD_FONT;
  g.textAlign = "left";
  g.fillStyle = "#ffe0c0";
  g.fillText("MOSHE", 10, H - 15);
  g.fillStyle = "#2a2244";
  g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill();
  g.fillStyle = danger ? (Math.sin(now * .025) > 0 ? "#ff3b4f" : "#b3172c") : S.wake > .4 ? "#ffc94d" : "#9fd6ff";
  if (S.wake > .01) { g.beginPath(); g.roundRect(x, y, Math.max(12, w * S.wake), h, 6); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.35)";
  g.lineWidth = 1.5;
  g.beginPath(); g.roundRect(x, y, w, h, 6); g.stroke();
  // halfway mark (for the "meter below half" mission)
  g.strokeStyle = "rgba(255,255,255,.4)";
  g.beginPath(); g.moveTo(x + w / 2, y + 3); g.lineTo(x + w / 2, y + h - 3); g.stroke();
  g.font = "10px " + HUD_FONT;
  g.textAlign = "center";
  g.fillStyle = danger ? "#fff" : "#1a1f33";
  g.fillText(danger ? "WAKING UP!" : "ASLEEP", x + w / 2, y + 13);
}

// Big centered title that fades in and out. With an icon: a picture above the text.
// b is a text, or a list of [text, color] lines (e.g. goal + mission).
function drawBanner(now) {
  const bn = S.banner, a = Math.min(1, bn.t / .25, (bn.max - bn.t) / .2 + .2);
  const font = "700 17px Rubik, sans-serif";
  const lines = (Array.isArray(bn.b) ? bn.b : [[bn.b, "#e8eef7"]])
    .flatMap(([txt, col]) => wrapText(txt, W - 36, font).map(ln => [ln, col]));
  const top = bn.icon ? 160 : 190, hgt = (bn.icon ? 116 : 72) + lines.length * 23;
  g.save();
  g.globalAlpha = Math.max(0, a);
  g.fillStyle = "rgba(7,10,20,.7)";
  g.fillRect(0, top, W, hgt);
  let y = top + 44;
  if (bn.icon) {
    if (bn.icon.kind === "trick") TRICKS[bn.icon.key].draw(W / 2, top + 34, 1.6, 1, now);
    else mosq(W / 2, top + 34, 1, false, now, 0, 2.2, bn.icon.key);
    y = top + 92;
  }
  g.textAlign = "center";
  g.font = "28px " + HUD_FONT;
  g.lineWidth = 6;
  g.strokeStyle = "#070a14";
  g.strokeText(bn.a, W / 2, y);
  g.fillStyle = "#ffc94d";
  g.fillText(bn.a, W / 2, y);
  g.font = font;
  lines.forEach(([ln, col], i) => { g.fillStyle = col; g.fillText(ln, W / 2, y + 32 + i * 23); });
  g.restore();
}

// Split text into lines that fit maxW.
function wrapText(text, maxW, font) {
  g.save();
  g.font = font;
  const lines = [];
  let cur = "";
  (text || "").split(" ").forEach(word => {
    const t = cur ? cur + " " + word : word;
    if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = word; } else cur = t;
  });
  if (cur) lines.push(cur);
  g.restore();
  return lines;
}
