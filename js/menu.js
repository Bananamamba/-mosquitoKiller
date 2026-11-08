// Menu and overlay buttons: the main menu, and one click handler for every overlay button.

function showMenu() {
  const best = BEST.score ? `<p>Best: <b>${BEST.score}</b> · ${BEST.place}</p>` : "";
  ov.innerHTML = `<h2>Something's<br>buzzing.</h2>`
    + `<p>One run through every room. Three lives. How far can you get?</p>`
    + `<div class="btns"><button type="button" data-run="1">Start run</button>`
    + `<button type="button" class="beach" data-shop="1">Shop</button></div>`
    + best
    + `<p>Your coins: <b class="coins">${COINS}</b></p>`
    + `<p class="small">Sound on. Headphones help.</p>`;
  ov.hidden = false;
  setPlaying(false);
  document.getElementById("tag").textContent = "3:07 AM · Lights off";
  document.getElementById("hint").textContent = "Don't hit the moth, the spider, the cricket or the bee.";
}

// Every overlay button says what it does with a data-* attribute.
ov.addEventListener("click", e => {
  const btn = sel => e.target.closest(sel);
  let b;
  if (btn("button[data-run]")) showPicker();          // "Start run" / "Run again": pick a slipper first
  else if (btn("button[data-go]")) startRun();
  else if ((b = btn("button[data-pick]"))) pickSlipper(b.dataset.pick);
  else if ((b = btn("button[data-buy]"))) buySlipper(b.dataset.buy);
  else if (btn("button[data-shop]")) showShop();
  else if (btn("button[data-menu]")) showMenu();
});
