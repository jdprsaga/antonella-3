// One shared animation clock for everything that moves (butterflies, glitter).
// It ticks 30 times a second instead of the screen's 60+: everything drifts slowly, so it looks
// the same, and it roughly halves the CPU the page uses. Sharing one clock keeps separate effects
// from landing on alternate frames, which would push Chrome back up to drawing every frame.
(function () {
  "use strict";

  var FRAME_MS = 1000 / 30;
  var subscribers = [];
  var last = 0;

  function tick(now) {
    if (last && now - last < FRAME_MS - 4) {
      requestAnimationFrame(tick);
      return;
    }
    var dt = last ? Math.min(0.08, (now - last) / 1000) : 0;
    last = now;
    var t = now / 1000;
    for (var i = 0; i < subscribers.length; i++) subscribers[i](dt, t);
    requestAnimationFrame(tick);
  }

  // onFrame(fn): fn(dt, t) runs every tick; dt = seconds since the last tick, t = seconds now.
  window.onFrame = function (fn) {
    if (subscribers.push(fn) === 1) requestAnimationFrame(tick);
  };
})();
