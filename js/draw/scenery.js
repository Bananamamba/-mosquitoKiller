// Room backgrounds: the dark bedroom and the sunny beach.

function bedroom() {
  // wall with faint stripes
  g.fillStyle = "#2b3462";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,.04)";
  for (let x = 0; x < W; x += 30) g.fillRect(x, 0, 14, 390);

  // window with the moon (a crescent: light circle covered by a sky-colored one)
  g.fillStyle = "#3e5fa8";
  g.fillRect(208, 46, 120, 140);
  g.fillStyle = "#f3efd6";
  g.beginPath(); g.arc(290, 86, 16, 0, 7); g.fill();
  g.fillStyle = "#3e5fa8";
  g.beginPath(); g.arc(298, 80, 14, 0, 7); g.fill();
  g.strokeStyle = "#55629a";
  g.lineWidth = 6;
  g.strokeRect(208, 46, 120, 140);
  g.beginPath();
  g.moveTo(268, 46); g.lineTo(268, 186);
  g.moveTo(208, 116); g.lineTo(328, 116);
  g.stroke();

  // lamp
  g.fillStyle = "#7a6b4a";
  g.beginPath();
  g.moveTo(38, 280); g.lineTo(86, 280); g.lineTo(76, 250); g.lineTo(48, 250);
  g.closePath();
  g.fill();
  g.fillStyle = "#6b5a3a";
  g.fillRect(59, 280, 6, 60);
  g.fillRect(44, 338, 36, 6);

  // bed: headboard, pillow, blanket with folds
  g.fillStyle = "#4a5a9a";
  g.fillRect(0, 400, W, H - 400);
  g.fillStyle = "#5a6cb4";
  g.beginPath(); g.roundRect(-10, 380, W + 20, 70, 18); g.fill();
  g.fillStyle = "#e8eef7";
  g.beginPath(); g.roundRect(24, 368, 96, 40, 16); g.fill();
  g.fillStyle = "#6a7fd0";
  g.beginPath(); g.roundRect(-10, 412, W + 20, 160, 24); g.fill();
  g.strokeStyle = "rgba(255,255,255,.1)";
  g.lineWidth = 3;
  for (let y = 440; y < H; y += 26) {
    g.beginPath();
    g.moveTo(0, y);
    g.quadraticCurveTo(W / 2, y + 10, W, y);
    g.stroke();
  }
}

function beach(now) {
  // sky and sun
  const sk = g.createLinearGradient(0, 0, 0, 210);
  sk.addColorStop(0, "#6fc0ef");
  sk.addColorStop(1, "#d4f0ff");
  g.fillStyle = sk;
  g.fillRect(0, 0, W, 212);
  g.fillStyle = "rgba(255,230,120,.35)";
  g.beginPath(); g.arc(300, 78, 46, 0, 7); g.fill();
  g.fillStyle = "#ffd84a";
  g.beginPath(); g.arc(300, 78, 30, 0, 7); g.fill();

  // drifting clouds: [start x, y, speed]
  g.fillStyle = "rgba(255,255,255,.92)";
  [[40, 70, 1], [200, 120, .6]].forEach(([cx, cy, sp]) => {
    const x = (cx + now * .006 * sp) % (W + 90) - 45;
    g.beginPath();
    g.ellipse(x, cy, 30, 11, 0, 0, 7);
    g.ellipse(x + 16, cy - 8, 20, 11, 0, 0, 7);
    g.fill();
  });

  // sea and moving foam line
  g.fillStyle = "#2a8fb5";
  g.fillRect(0, 206, W, 48);
  g.fillStyle = "#1f7aa0";
  g.fillRect(0, 206, W, 6);
  const wv = Math.sin(now * .002) * 4;
  g.fillStyle = "#f2fbff";
  g.beginPath();
  g.moveTo(0, 250);
  for (let x = 0; x < W; x += 24) g.quadraticCurveTo(x + 12, 258 + wv, x + 24, 250);
  g.lineTo(W, 262);
  g.lineTo(0, 262);
  g.closePath();
  g.fill();

  // sand with grain dots
  g.fillStyle = "#efd49c";
  g.fillRect(0, 258, W, H - 258);
  g.fillStyle = "rgba(170,130,70,.25)";
  for (let i = 0; i < 120; i++) g.fillRect((i * 67) % W, 264 + (i * 131) % (H - 264), 2, 2);

  // small red radio
  g.fillStyle = "#d64545";
  g.beginPath(); g.roundRect(286, 494, 48, 28, 5); g.fill();
  g.fillStyle = "#2b2b2b";
  g.beginPath(); g.arc(300, 508, 8, 0, 7); g.arc(320, 508, 8, 0, 7); g.fill();
  g.strokeStyle = "#2b2b2b";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(292, 494); g.lineTo(300, 482); g.lineTo(320, 482); g.lineTo(328, 494);
  g.stroke();
}
