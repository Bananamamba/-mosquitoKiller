// Menu and overlay buttons: the main menu, and one click handler for every overlay button.

function showMenu() {
  const best = BEST.score ? `<p>Best: <b>${BEST.score}</b> · ${BEST.place}</p>` : "";
  ov.innerHTML = `<h2>Something's<br>buzzing.</h2>`
    + `<p>One run through every room. Three lives. How far can you get?</p>`
    + `<div class="btns"><button type="button" data-run="1">Start run</button></div>`
    + best
    + `<p class="small">Coins: ${COINS}</p>`
    + `<p class="small">Sound on. Headphones help.</p>`;
  ov.hidden = false;
  setPlaying(false);
  document.getElementById("tag").textContent = "3:07 AM · Lights off";
  document.getElementById("hint").textContent = "Don't hit the moth, the spider, the cricket or the bee.";
}

// Every overlay button says what it does with a data-* attribute.
ov.addEventListener("click", e => {
  if (e.target.closest("button[data-run]")) startRun();
  else if (e.target.closest("button[data-menu]")) showMenu();
});
