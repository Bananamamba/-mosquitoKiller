// Drawing Big Moshe: asleep on a towel, side view, head on the left (the canvas is mirrored when he rolls over).

function moshe(now) {
  const br = Math.sin(S.t * 1.6);                                // breathing
  const j = 1 + br * .025 + Math.sin(now * .045) * .07 * S.jig;  // belly scale: breath + jiggle after a slap
  const skin = "#eaa27e", skinD = "#c97f5c", line = "rgba(90,45,25,.55)";
  const mood = S.awakeT > 0 ? "angry" : S.wake > .65 ? "stir" : S.smile > 0 ? "smile" : S.frown > 0 ? "frown" : "sleep";

  // striped towel
  g.fillStyle = "#e85d4a";
  g.fillRect(14, 468, 342, 14);
  g.fillStyle = "#f6efe2";
  for (let x = 14; x < 356; x += 36) g.fillRect(x + 18, 468, 18, 14);

  // legs and foot (right side)
  g.lineWidth = 2.5;
  g.strokeStyle = line;
  g.lineJoin = "round";
  g.fillStyle = skin;
  g.beginPath();
  g.moveTo(296, 430); g.lineTo(340, 436); g.lineTo(340, 468); g.lineTo(296, 468);
  g.closePath();
  g.fill(); g.stroke();
  g.beginPath(); g.ellipse(346, 446, 9, 22, -.12, 0, 7); g.fill(); g.stroke();

  // the big belly (clipped at the towel line)
  g.save();
  g.beginPath(); g.rect(0, 0, W, 469); g.clip();
  const rx = 118 * (1 + (j - 1) * .5), ry = 165 * j;
  const bg = g.createRadialGradient(175, 350, 20, 205, 450, 200);
  bg.addColorStop(0, "#f6bea0");
  bg.addColorStop(1, skinD);
  g.fillStyle = bg;
  g.beginPath(); g.ellipse(205, 468, rx, ry, 0, 0, 7); g.fill(); g.stroke();
  // sunburn band
  g.save();
  g.beginPath(); g.ellipse(205, 468, rx, ry, 0, 0, 7); g.clip();
  g.fillStyle = "rgba(240,100,80,.32)";
  g.fillRect(80, 295, 260, 46);
  g.restore();
  // shine, navel, chest hair
  g.fillStyle = "rgba(255,255,255,.25)";
  g.beginPath(); g.ellipse(170, 360, 32, 14, -.5, 0, 7); g.fill();
  g.fillStyle = "#9c5a3c";
  g.beginPath(); g.ellipse(205 + rx * .5, 468 - ry * .866 + 5, 4, 6, .6, 0, 7); g.fill();
  g.strokeStyle = "rgba(80,40,20,.5)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.arc(112 + (i % 3) * 12, 388 + Math.floor(i / 3) * 14, 3, 0, 3.5);
    g.stroke();
  }
  g.restore();

  // swim trunks with bubbles
  g.fillStyle = "#2a9d8f";
  g.strokeStyle = line;
  g.lineWidth = 2.5;
  g.beginPath(); g.roundRect(278, 428, 48, 40, [14, 10, 0, 0]); g.fill(); g.stroke();
  g.fillStyle = "rgba(255,255,255,.75)";
  [[290, 442], [308, 456], [316, 438]].forEach(([a, b]) => {
    g.beginPath(); g.arc(a, b, 4, 0, 7); g.fill();
  });

  // neck, head, hair, ear, nose
  g.fillStyle = skin;
  g.beginPath(); g.ellipse(112, 440, 42, 34, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(64, 436, 34, 0, 7); g.fill(); g.stroke();
  g.fillStyle = "#2b1a12";
  g.beginPath();
  g.moveTo(64, 436);
  g.arc(64, 436, 35, Math.PI * .55, Math.PI * 1.25);
  g.closePath();
  g.fill();
  g.fillStyle = skinD;
  g.beginPath(); g.ellipse(50, 448, 6, 9, 0, 0, 7); g.fill();
  g.fillStyle = skin;
  g.beginPath(); g.arc(77, 403, 8, 0, 7); g.fill(); g.stroke();

  // sunglasses (they slip down when he is angry, showing an open eye)
  const ang = mood === "angry";
  if (ang) {
    g.fillStyle = "#fff";
    g.beginPath(); g.arc(60, 401, 5, 0, 7); g.fill();
    g.fillStyle = "#3a2014";
    g.beginPath(); g.arc(61, 401, 2.2, 0, 7); g.fill();
  }
  g.strokeStyle = "#111";
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(50, ang ? 420 : 414); g.lineTo(47, 442); g.stroke();
  g.save();
  g.translate(60, ang ? 417 : 411);
  g.rotate(-.35);
  g.fillStyle = "#111";
  g.beginPath(); g.roundRect(-14, -7, 28, 14, 6); g.fill();
  g.strokeStyle = "rgba(255,255,255,.65)";
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(-8, -3); g.lineTo(1, -3); g.stroke();
  g.restore();

  // eyebrow
  g.strokeStyle = "#2b1a12";
  g.lineWidth = 3;
  g.lineCap = "round";
  if (ang) {
    g.beginPath(); g.moveTo(50, 390); g.lineTo(68, 397); g.stroke();
  } else if (mood === "frown" || mood === "stir") {
    g.beginPath(); g.moveTo(50, 398); g.lineTo(66, mood === "stir" ? 396 : 401); g.stroke();
  }

  // mustache and mouth (by mood)
  g.fillStyle = "#2b1a12";
  g.beginPath(); g.ellipse(86, 411, 9, 5, .6, 0, 7); g.fill();
  g.fillStyle = "#5a1a14";
  g.strokeStyle = "#5a1a14";
  g.lineWidth = 2.5;
  if (mood === "sleep") {
    g.beginPath(); g.ellipse(92, 421, 3.5, 2.5 + 2 * (.5 + .5 * br), .6, 0, 7); g.fill();
  } else if (mood === "smile") {
    g.beginPath(); g.arc(90, 416, 7, .4, 1.9); g.stroke();
  } else if (mood === "frown") {
    g.beginPath(); g.moveTo(87, 418); g.quadraticCurveTo(91, 423, 95, 420); g.stroke();
  } else if (mood === "stir") {
    g.beginPath(); g.moveTo(88, 418); g.lineTo(95, 424); g.stroke();
  } else {
    g.beginPath(); g.ellipse(93, 421, 6, 8, .6, 0, 7); g.fill();
  }

  // arm resting along the belly
  g.strokeStyle = line;
  g.lineWidth = 24;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(110, 456);
  g.quadraticCurveTo(160, 468, 212, 460);
  g.stroke();
  g.strokeStyle = skin;
  g.lineWidth = 19;
  g.stroke();
  g.fillStyle = skin;
  g.beginPath(); g.arc(216, 459, 11, 0, 7); g.fill();
}
