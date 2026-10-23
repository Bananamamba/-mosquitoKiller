// Single room: play one night of one room, then show the result.
// (Reached from the "Play again" button on its own result screen.)

function playRoom(st) {
  audioOn();
  S.solo = true;
  S.endless = false;
  S.perks = {};
  S.taken = [];
  S.score = 0;
  S.kills = 0;
  startStage({ bed: 0, beach: 1, one: 2 }[st]);
}

function soloEnd(won, why, bonus) {
  const st = STAGE;
  const L = {
    bitten: `${S.bites} bites. You're one big itch.`,
    stung: "The Queen got you. She's still laughing.",
    wake: "All that slapping woke Moshe up.",
    face: "You slapped Moshe in the face. He's up, and he's furious.",
    noslap: "Out of slaps. It's still buzzing.",
    sunrise: "The sun came up. It won.",
    oneBitten: `It bit you ${S.oneBites} times and never got caught.`
  };
  ov.innerHTML = `<p>${ROOMS[st]}</p><h2>${won ? "Cleared!" : "Not this time."}</h2>`
    + `<p>${won ? `Room bonus +${bonus}` : (L[why] || "")}</p><div class="big">${S.score}</div>`
    + `<div class="btns"><button type="button" data-room="${st}">Play ${ROOMS[st]} again</button>`
    + `<button type="button" class="beach" data-menu="1">Pick another room</button></div>`;
  ov.hidden = false;
}
