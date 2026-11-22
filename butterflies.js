// Paper butterflies drifting behind the page. Purely decorative: no interaction.
(function () {
  "use strict";

  // Pastel paper colors. The flock is always 10 butterflies: two of each color.
  var PALETTE = [
    { wing: "#f7b9cf", inner: "#fbdbe6", edge: "#de93ae", body: "#b9708c" }, // pink
    { wing: "#f4a5c0", inner: "#fad0de", edge: "#d9809f", body: "#a85a78" }, // pink (a touch deeper)
    { wing: "#dcc6f0", inner: "#efe4f8", edge: "#b9a0d6", body: "#8d72a8" }, // lilac
    { wing: "#dcc6f0", inner: "#efe4f8", edge: "#b9a0d6", body: "#8d72a8" },
    { wing: "#c9e3f2", inner: "#e6f2f9", edge: "#9fc3d8", body: "#6f93a8" }, // blue
    { wing: "#c9e3f2", inner: "#e6f2f9", edge: "#9fc3d8", body: "#6f93a8" },
    { wing: "#ffdcb8", inner: "#fff0e0", edge: "#e8b98a", body: "#b8875a" }, // peach
    { wing: "#ffdcb8", inner: "#fff0e0", edge: "#e8b98a", body: "#b8875a" },
    { wing: "#cfeedd", inner: "#e9f8ef", edge: "#a6d3ba", body: "#6f9c84" }, // mint
    { wing: "#cfeedd", inner: "#e9f8ef", edge: "#a6d3ba", body: "#6f9c84" },
  ];

  var UPPER = "M0 22 C4 6 22 -2 36 4 C42 8 37 20 24 24 C14 26 6 25 0 24Z";
  var LOWER = "M0 25 C8 27 22 30 24 40 C25 48 14 50 8 44 C3 39 1 31 0 27Z";
  var UPPER_INNER = "M3 21 C8 11 20 6 30 8 C33 11 28 18 20 21 C12 22 7 22 3 22Z";
  var LOWER_INNER = "M2 27 C9 29 18 32 19 39 C19 44 13 45 9 41 C5 37 3 32 2 28Z";

  // Right-hand wing pair; the body sits on the left edge (x = 0). The left wing reuses it mirrored.
  // Built like layered card stock: a darker offset copy reads as the paper's cut edge (thickness),
  // the inner panel is a second sheet glued on top, and #paperGrain adds fibrous texture.
  function wingSVG(c) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50">' + DEFS +
        // cut edge of the card stock, peeking out below/right
        '<g transform="translate(0.7 1.1)" fill="' + c.edge + '"><path d="' + UPPER + '"/><path d="' + LOWER + '"/></g>' +
        '<g filter="url(#paperGrain)">' +
          '<path d="' + UPPER + '" fill="' + c.wing + '"/>' +
          '<path d="' + LOWER + '" fill="' + c.wing + '"/>' +
          // shadow under the glued-on inner layer, then the layer itself
          '<g transform="translate(0.4 0.7)" fill="' + c.edge + '" opacity="0.45"><path d="' + UPPER_INNER + '"/><path d="' + LOWER_INNER + '"/></g>' +
          '<path d="' + UPPER_INNER + '" fill="' + c.inner + '"/>' +
          '<path d="' + LOWER_INNER + '" fill="' + c.inner + '"/>' +
        "</g>" +
        // light catching the top edge, sheen, and crease lines
        '<path d="' + UPPER + " " + LOWER + '" fill="url(#paperSheen)"/>' +
        '<path d="M2 21 C6 7 22 -1 35 4.5" stroke="#fff" stroke-opacity="0.7" stroke-width="0.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M0 23 L33 6 M0 26 L18 42" stroke="#fff" stroke-opacity="0.55" stroke-width="0.7" fill="none"/>' +
        '<path d="M0.4 23.4 L33.4 6.4 M0.4 26.4 L18.4 42.4" stroke="' + c.edge + '" stroke-opacity="0.35" stroke-width="0.5" fill="none"/>' +
      "</svg>"
    );
  }

  // Each wing is drawn once into an <img>, so flapping only turns a finished picture instead of
  // re-running the paper-grain filter every frame. Images can't see the page's <defs>, so each
  // wing carries its own copy.
  var defsEl = document.getElementById("paper-defs");
  var DEFS = defsEl ? defsEl.outerHTML : "";

  function wingImg(c) {
    return '<img alt="" src="data:image/svg+xml,' + encodeURIComponent(wingSVG(c)) + '">';
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  var layer = document.getElementById("butterflies");
  if (!layer) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = window.innerWidth;
  var H = window.innerHeight;
  var flock = [];

  for (var i = 0; i < PALETTE.length; i++) {
    var c = PALETTE[i];
    var size = rand(46, 68); // wingspan in px
    var el = document.createElement("div");
    el.className = "bf";
    el.style.setProperty("--s", size + "px");
    el.style.setProperty("--body", c.body);
    el.style.opacity = rand(0.75, 0.95).toFixed(2);
    var img = wingImg(c);
    el.innerHTML = '<div class="wing l">' + img + '</div><div class="body"></div><div class="wing r">' + img + "</div>";
    layer.appendChild(el);

    flock.push({
      el: el,
      wingL: el.firstChild,
      wingR: el.lastChild,
      w: size,
      h: size * 0.625,
      x: rand(0, W),
      y: rand(0, H),
      heading: rand(0, Math.PI * 2),
      turn: 0,
      speed: rand(16, 32),           // px per second
      bobFreq: rand(1.5, 3),
      bobAmp: rand(2, 5),
      phase: rand(0, Math.PI * 2),
      flap: rand(0.34, 0.56),        // seconds per downstroke
      flapPhase: rand(0, Math.PI * 2),
    });
  }

  function place(b, t, still) {
    // Wings swing between 8° (open) and 70° (nearly closed), easing at each end.
    var open = still ? 8 : 39 - 31 * Math.cos((Math.PI * t) / b.flap + b.flapPhase);
    b.wingL.style.transform = "rotateY(" + open.toFixed(1) + "deg)";
    b.wingR.style.transform = "rotateY(" + (-open).toFixed(1) + "deg)";

    var bob = Math.sin(t * b.bobFreq + b.phase) * b.bobAmp;
    var tilt = Math.sin(t * b.bobFreq * 0.5 + b.phase) * 8;
    var deg = (b.heading * 180) / Math.PI + 90 + tilt; // artwork faces up
    b.el.style.transform =
      "translate3d(" + (b.x - b.w / 2).toFixed(1) + "px," + (b.y - b.h / 2 + bob).toFixed(1) + "px,0) rotate(" + deg.toFixed(1) + "deg)";
  }

  window.addEventListener("resize", function () {
    W = window.innerWidth;
    H = window.innerHeight;
  });

  if (reduceMotion) {
    flock.forEach(function (b) { place(b, 0, true); });
    return;
  }

  var MARGIN = 60;

  window.onFrame(function (dt, t) {
    for (var i = 0; i < flock.length; i++) {
      var b = flock[i];

      // Wander: a slowly drifting turn rate gives soft, looping paths.
      b.turn += rand(-1, 1) * 3 * dt;
      b.turn *= 0.985;
      b.turn = Math.max(-1.4, Math.min(1.4, b.turn));

      // Steer gently back toward the screen when near an edge.
      var steerX = b.x < MARGIN ? 1 : b.x > W - MARGIN ? -1 : 0;
      var steerY = b.y < MARGIN ? 1 : b.y > H - MARGIN ? -1 : 0;
      if (steerX || steerY) {
        var target = Math.atan2(steerY, steerX);
        var diff = Math.atan2(Math.sin(target - b.heading), Math.cos(target - b.heading));
        b.turn += diff * 1.5 * dt;
      }

      b.heading += b.turn * dt;
      b.x += Math.cos(b.heading) * b.speed * dt;
      b.y += Math.sin(b.heading) * b.speed * dt;

      // Safety net after resizes / orientation changes.
      if (b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80) {
        b.x = rand(MARGIN, W - MARGIN);
        b.y = rand(MARGIN, H - MARGIN);
      }

      place(b, t);
    }
  });
})();
