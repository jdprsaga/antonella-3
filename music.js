// Background song, looping. Browsers only allow sound after a tap, so it starts from the ♪ button.
// The MP3 is fetched on the first tap (not on page load) and played through Web Audio, which loops
// without a gap and can fade in and out on every phone (iOS ignores <audio> volume changes).
(function () {
  "use strict";

  var SRC = "HolidayJazzAntonella.mp3";
  var VOLUME = 0.6;

  var ctx = null;
  var out = null;
  var buffer = null;
  var source = null;
  var loading = false;
  var playing = false;

  function setup() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
    return true;
  }

  function load(done) {
    loading = true;
    fetch(SRC)
      .then(function (res) { return res.arrayBuffer(); })
      .then(function (data) {
        // Older Safari only has the callback form of decodeAudioData.
        ctx.decodeAudioData(data, function (decoded) {
          buffer = decoded;
          loading = false;
          done();
        }, function () { loading = false; });
      })
      .catch(function () { loading = false; });
  }

  function begin() {
    if (!playing || source) return; // stopped while loading, or already running
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(out);
    source.start();
    fade(VOLUME, 1.2);
  }

  function fade(to, seconds) {
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
    out.gain.linearRampToValueAtTime(to, ctx.currentTime + seconds);
  }

  function start() {
    if (!ctx && !setup()) return;
    ctx.resume();
    playing = true;
    if (source) fade(VOLUME, 1.2);
    else if (buffer) begin();
    else if (!loading) load(begin);
  }

  function stop() {
    if (!ctx) return;
    playing = false;
    fade(0, 0.4);
    // Pause where it is, so the next tap picks the song up from the same spot.
    setTimeout(function () { if (!playing) ctx.suspend(); }, 450);
  }

  var button = document.getElementById("music-toggle");
  if (!button) return;
  if (!(window.AudioContext || window.webkitAudioContext) || !window.fetch) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", function () {
    if (playing) stop(); else start();
    button.setAttribute("aria-pressed", String(playing));
  });

  // Don't keep playing in a background tab.
  document.addEventListener("visibilitychange", function () {
    if (!ctx || !playing) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
})();
