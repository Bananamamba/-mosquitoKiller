// HUD: drawn on top of everything and does not shake.
// Mode tints, fever bar, top bar (score/time), Queen bars, bottom bar, lives, banner.

const HUD_FONT = "'Rubik Mono One', sans-serif";

function drawHUD(now, BEACH, q) {
  drawModeTints(now);
  if (S.playing && S.endless && STAGE !== "one" && !(q && (q.phase === "fight" || q.phase === "dying"))) drawFeverBar();
  if (S.rage > 0) {
    g.strokeStyle = `rgba(255,138,61,${.5 + .4 * Math.sin(now * .03)})`;
    g.lineWidth = 10;
    g.strokeRect(0, 0, W, H);
  }
  if (S.playing) {
    drawTopBar(BEACH);
    if (q && (q.phase === "fight" || q.phase === "dying")) drawQueenBars(q);
    drawBottomBar(BEACH);
  }
  if (S.playing && !S.endless && !S.solo && S.lives) {
    for (let i = 0; i < 3; i++) headIcon(W / 2 - 22 + i * 22, 20, i < S.lives);
  }
  if (S.banner) drawBanner();
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

// Endless only: fever meter under the top bar, and the running event with seconds left.
function drawFeverBar() {
  const fv = S.feverT > 0 ? S.feverT / 6 : (S.fever || 0);
  g.fillStyle = "rgba(7,10,20,.7)";
  g.fillRect(0, 40, W, 16);
  g.fillStyle = "#3a1036";
  g.fillRect(64, 45, W - 76, 6);
  g.fillStyle = S.feverT > 0 ? "#ffc94d" : "#ff6ad5";
  g.fillRect(64, 45, (W - 76) * fv, 6);
  g.font = "9px " + HUD_FONT;
  g.textAlign = "left";
  g.fillStyle = "#ff9ae6";
  g.fillText("FEVER", 10, 52);
  if (S.ev) {
    g.textAlign = "center";
    g.font = "11px " + HUD_FONT;
    g.fillStyle = EVTXT[S.ev.k][1];
    g.fillText(EVTXT[S.ev.k][0].split("!")[0] + " " + Math.ceil(S.ev.t) + "s", W / 2, 72);
  }
}

// Score + streak on the left; time / tier / kills on the right; progress line under it.
function drawTopBar(BEACH) {
  const EN = S.endless && STAGE !== "one" && !S.blitz;   // endless with tiers (no clock)
  const k = EN ? tierProg() : S.left / S.dur;            // progress: to next tier, or time left
  g.fillStyle = "rgba(7,10,20,.75)";
  g.fillRect(0, 0, W, 40);
  g.fillStyle = BEACH ? "#2a9d8f" : k < .25 ? "#e2354b" : "#ffc94d";
  g.fillRect(0, 36, W * k, 4);

  g.font = "18px " + HUD_FONT;
  g.fillStyle = "#e8eef7";
  g.textAlign = "left";
  g.fillText(String(S.score), 14, 27);
  const mm = mult();
  if (mm > 1) {
    const sw = g.measureText(String(S.score)).width;
    g.font = "12px " + HUD_FONT;
    g.fillStyle = "#ffc94d";
    g.fillText("x" + mm + " STREAK", 22 + sw, 26);
  }

  g.textAlign = "right";
  g.font = "18px " + HUD_FONT;
  g.fillStyle = k < .25 ? "#ff8a8a" : "#e8eef7";
  if (S.blitz) {
    g.font = "14px " + HUD_FONT;
    g.fillStyle = k < .25 ? "#ff8a8a" : "#e8eef7";
    g.fillText(`${S.kills} KILLS · ${S.left.toFixed(1)}s`, W - 14, 26);
  } else if (EN) {
    g.font = "14px " + HUD_FONT;
    g.fillStyle = "#e8eef7";
    g.fillText(`TIER ${S.tier} · ${S.kills} kills`, W - 14, 26);
  } else if (S.endless) {
    g.font = "14px " + HUD_FONT;
    g.fillText(`CATCH ${S.catches + 1} · ${S.left.toFixed(0)}s`, W - 14, 26);
  } else g.fillText((BEACH ? "NAP " : "") + S.left.toFixed(1) + "s", W - 14, 27);
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

// Left: Moshe's wake meter / slaps left / night. Right: strikes (endless) or bites.
function drawBottomBar(BEACH) {
  g.fillStyle = "rgba(7,10,20,.78)";
  g.fillRect(0, H - 28, W, 28);
  g.font = "11px " + HUD_FONT;
  g.textAlign = "left";
  if (BEACH) {
    g.fillStyle = "#ffe0c0";
    g.fillText("MOSHE", 12, H - 10);
    g.fillStyle = "#2a2244";
    g.fillRect(74, H - 19, W - 190, 9);
    g.fillStyle = S.wake > .65 ? "#ff5a6e" : "#9fd6ff";
    g.fillRect(74, H - 19, (W - 190) * S.wake, 9);
    g.fillStyle = "#93a0c4";
    g.font = "9px " + HUD_FONT;
    g.fillText(S.wake > .65 ? "WAKING" : "ASLEEP", W - 110, H - 10);
  } else {
    g.fillStyle = "#93a0c4";
    g.fillText(STAGE === "one" ? "SLAPS LEFT " + S.slapsLeft : S.endless ? "ENDLESS" : "NIGHT " + (S.idx + 1), 12, H - 10);
  }

  g.font = "11px " + HUD_FONT;
  g.textAlign = "right";
  const ONE = STAGE === "one";
  g.fillStyle = ONE ? (S.oneBites >= oneMax() - 1 ? "#ff5a6e" : "#ff8a8a")
    : !BEACH && S.bites >= maxBites() - 2 ? "#ff5a6e" : "#ff8a8a";
  if (S.endless && !ONE) {
    // three strikes ✕✕✕
    g.font = "16px " + HUD_FONT;
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i < (S.strikes || 0) ? "#ff3b4f" : "rgba(255,255,255,.22)";
      g.fillText("✕", W - 12 - i * 22, H - 8);
    }
  } else g.fillText("BITES " + (ONE ? S.oneBites + "/" + oneMax() : S.bites + (BEACH ? "" : "/" + maxBites())), W - 12, H - 10);
}

// Big centered title that fades in and out ("NIGHT 2", "TIER 3", ...).
function drawBanner() {
  const bn = S.banner, a = Math.min(1, bn.t / .25, (bn.max - bn.t) / .2 + .2);
  g.save();
  g.globalAlpha = Math.max(0, a);
  g.fillStyle = "rgba(7,10,20,.55)";
  g.fillRect(0, 200, W, 96);
  g.textAlign = "center";
  g.font = "30px " + HUD_FONT;
  g.lineWidth = 6;
  g.strokeStyle = "#070a14";
  g.strokeText(bn.a, W / 2, 246);
  g.fillStyle = "#ffc94d";
  g.fillText(bn.a, W / 2, 246);
  g.font = "700 16px Rubik, sans-serif";
  g.fillStyle = "#e8eef7";
  g.fillText(bn.b, W / 2, 274);
  g.restore();
}
