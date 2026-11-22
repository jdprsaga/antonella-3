// Subtle glitter: tiny sparkles that twinkle in and out at random spots. Purely decorative.
(function () {
  "use strict";

  var COUNT = 22;
  // Mostly warm gold, with a touch of rose and lilac. (Pale or white sparkles vanish on the cream paper.)
  var COLORS = ["#e3b54f", "#e3b54f", "#eac46d", "#d9a441", "#e99ab3", "#c9a6e6"];

  var STAR = "M0 -10 C1 -2.5 2.5 -1 10 0 C2.5 1 1 2.5 0 10 C-1 2.5 -2.5 1 -10 0 C-2.5 -1 -1 -2.5 0 -10Z";

  // Each sparkle is drawn once into an <img>; twinkling only changes its opacity and size.
  function sparkleImg(color, dot) {
    var shape = dot
      ? '<circle r="4" fill="url(#c)"/>'
      : '<path d="' + STAR + '" fill="url(#c)"/>';
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24">' +
        '<defs><radialGradient id="c"><stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="' + color + '"/>' +
        '<stop offset="1" stop-color="' + color + '" stop-opacity="0.85"/></radialGradient>' +
        '<radialGradient id="g"><stop offset="0" stop-color="' + color + '" stop-opacity="0.55"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient></defs>' +
        '<circle r="12" fill="url(#g)"/>' + shape +
      "</svg>";
    return '<img alt="" src="data:image/svg+xml,' + encodeURIComponent(svg) + '">';
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  var layer = document.getElementById("glitter");
  if (!layer || !window.onFrame) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var sparkles = [];
  for (var i = 0; i < COUNT; i++) {
    var dot = Math.random() < 0.3;
    var el = document.createElement("div");
    el.className = "sparkle";
    el.innerHTML = sparkleImg(COLORS[Math.floor(Math.random() * COLORS.length)], dot);
    layer.appendChild(el);
    var s = { el: el, dot: dot, wait: rand(0, 2.5) };
    reset(s);
    sparkles.push(s);
  }

  function reset(s) {
    s.x = rand(0, window.innerWidth);
    s.y = rand(0, window.innerHeight);
    s.size = s.dot ? rand(6, 9) : rand(11, 19);
    s.life = rand(1.4, 2.6);  // seconds from fade-in to fade-out
    s.age = 0;
    s.peak = rand(0.75, 1);
    s.spin = rand(0, 45);
    s.el.style.width = s.el.style.height = s.size + "px";
    s.el.style.opacity = 0;
  }

  window.onFrame(function (dt) {
    for (var i = 0; i < sparkles.length; i++) {
      var s = sparkles[i];
      if (s.wait > 0) { s.wait -= dt; continue; }

      s.age += dt;
      var p = s.age / s.life;
      if (p >= 1) {
        reset(s);
        s.wait = rand(0.3, 2.5); // rest before twinkling somewhere else
        continue;
      }

      // Swell in and out, turning a little as it glints.
      var glow = Math.sin(Math.PI * p);
      var scale = 0.35 + 0.65 * glow;
      s.el.style.opacity = (s.peak * glow * glow).toFixed(2);
      s.el.style.transform =
        "translate3d(" + (s.x - s.size / 2).toFixed(1) + "px," + (s.y - s.size / 2).toFixed(1) + "px,0) rotate(" +
        (s.spin + 40 * p).toFixed(1) + "deg) scale(" + scale.toFixed(2) + ")";
    }
  });
})();
