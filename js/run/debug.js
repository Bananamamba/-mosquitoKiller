// Test mode (open the game with ?debug): shows how many seconds each place took,
// so the thresholds in config.js can be tuned after playtesting. Also printed to the console.

function drawDebug() {
  if (!DEBUG || !S.placeTimes) return;
  const rows = S.placeTimes.slice(-6).map(t => `${t.name} L${t.loop}: ${t.sec.toFixed(1)}s${t.cleared ? "" : " ✗"}`);
  const place = currentPlace();
  rows.unshift(`NOW ${place.name} L${S.lvl + 1}: ${S.placeT.toFixed(1)}s` + (place.threshold ? ` · ${S.score - S.placeStart}/${S.threshold}` : ""));
  g.save();
  g.fillStyle = "rgba(0,0,0,.6)";
  g.fillRect(4, 96, 200, 14 * rows.length + 8);
  g.font = "10px monospace";
  g.textAlign = "left";
  g.fillStyle = "#7fe0ff";
  rows.forEach((r, i) => g.fillText(r, 10, 110 + i * 14));
  g.restore();
}
