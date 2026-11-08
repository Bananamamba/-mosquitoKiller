// Place registry. Every place (room/level) registers itself here; the run visits them in order.
//
// Adding a place = one file in js/places/ + one <script> line in index.html + its numbers in config.js.
// A place definition:
//   id, name             "bed", "Bedroom swarm"
//   tag, hint            text above / below the canvas
//   threshold            true = reaching the score threshold moves on (uses CFG.places[id]);
//                        false = the place decides itself (calls placeCleared())
//   missions             mission ids from missions.js; one is drawn at random on entry
//   types                mosquito types that unlock one per visit (see CFG.types)
//   tricksters, events, fever   true = this place gets decoy bugs / random events / fever
//   enter(loop)          set up the place
//   leave()              clean up (optional)
//   update(dt)           per-frame logic while playing (optional)
//   spawnWave()          spawn the next mosquito(s); omit for places without normal spawning
//   spawnCap(e), spawnGap(e)   how many on screen / seconds between spawns (e = seconds + loop*10)
//   spawnFat()           a fat, blood-filled mosquito coming back after a bite
//   drawRoom(now)        the background
//   onPress(p, e), onMove(p), onRelease()   own touch handling (optional; return true from onPress = handled)

const PLACES = [];

function registerPlace(def) {
  PLACES.push(def);
}

const currentPlace = () => PLACES[S.placeIdx % PLACES.length];
const loopOf = i => Math.floor(i / PLACES.length);

// Score needed to leave the place (only for places with threshold: true).
function placeThreshold(place, loop) {
  const c = CFG.places[place.id];
  return Math.round(byLoop(c.pps, loop) * c.targetSeconds * Math.pow(c.growPerLoop, loop));
}
