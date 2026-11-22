(function () {
  "use strict";

  var P = window.PARTY;

  var STRINGS = {
    en: {
      title: "{name} is turning {age}",
      kicker: "Please join us to celebrate",
      turning: "turning",
      when: "When",
      where: "Where",
      maps: "Open in Google Maps",
      timeTbd: "Time to be announced",
      rsvpTitle: "Kindly reply",
      rsvpIntro: "Let us know if you can come, and tell us the little ones' names so we can prepare a small keepsake for each of them.",
      attendingQ: "Will you join us?",
      yes: "We'll be there!",
      no: "Can't make it",
      adultName: "Your name",
      phone: "Phone (optional)",
      adults: "Adults",
      children: "Children",
      childrenHint: "Children's names are used for their keepsake.",
      childName: "Child's name",
      childAge: "Age",
      submit: "Send RSVP",
      sending: "Sending…",
      thanksYes: "Thank you, {who}! We can't wait to celebrate with you.",
      thanksNo: "Thank you for letting us know, {who}. You'll be missed!",
      another: "Send another response",
      calTitle: "Add it to your calendar",
      calApple: "iPhone",
      calGoogle: "Google · Android",
      calEvent: "{name}'s {age} birthday",
      errRequired: "Please fill in the highlighted fields.",
      errNotSetup: "RSVPs aren't open yet. Please check back soon.",
      errNetwork: "Something went wrong. Please try again, or contact {contact}.",
      giftsTitle: "Wish list",
      giftsText: "Your presence is the best gift. If you'd like to bring something, here is her wish list.",
      giftsBtn: "See wish list",
      giftsSoon: "Wish list coming soon.",
      questionsTitle: "Questions?",
      questionsText: "Contact",
      privacyTitle: "Your privacy",
      privacyText: "This is our family's personal website, not a company's. What you share here goes only to our private family spreadsheet, is used just to plan the party and prepare the children's keepsakes, and is never sold or shared.",
      footer: "With love, {name}'s family",
      music: "Music",
    },
    es: {
      title: "{name} cumple {age}",
      kicker: "Acompáñanos a celebrar a",
      turning: "que cumple",
      when: "Cuándo",
      where: "Dónde",
      maps: "Abrir en Google Maps",
      timeTbd: "Hora por confirmar",
      rsvpTitle: "Confirma tu asistencia",
      rsvpIntro: "Cuéntanos si puedes venir y dinos los nombres de los pequeños para prepararle un recuerdito a cada uno.",
      attendingQ: "¿Nos acompañas?",
      yes: "¡Ahí estaremos!",
      no: "No podremos ir",
      adultName: "Tu nombre",
      phone: "Teléfono (opcional)",
      adults: "Adultos",
      children: "Niños",
      childrenHint: "Usaremos los nombres de los niños para su recuerdito.",
      childName: "Nombre del niño/a",
      childAge: "Edad",
      submit: "Enviar",
      sending: "Enviando…",
      thanksYes: "¡Gracias, {who}! Nos encantará celebrar contigo.",
      thanksNo: "Gracias por avisarnos, {who}. ¡Te vamos a extrañar!",
      another: "Enviar otra respuesta",
      calTitle: "Agrégalo a tu calendario",
      calApple: "iPhone",
      calGoogle: "Google · Android",
      calEvent: "Cumpleaños de {name} ({age} años)",
      errRequired: "Por favor completa los campos marcados.",
      errNotSetup: "Las confirmaciones aún no están abiertas. Vuelve pronto.",
      errNetwork: "Algo salió mal. Inténtalo de nuevo o contacta a {contact}.",
      giftsTitle: "Lista de deseos",
      giftsText: "Tu presencia es el mejor regalo. Si deseas traer algo, aquí está su lista de deseos.",
      giftsBtn: "Ver lista de deseos",
      giftsSoon: "La lista de deseos estará disponible pronto.",
      questionsTitle: "¿Preguntas?",
      questionsText: "Contacta a",
      privacyTitle: "Tu privacidad",
      privacyText: "Este es el sitio personal de nuestra familia, no de una empresa. Lo que compartas aquí llega solo a nuestra hoja de cálculo familiar privada, se usa únicamente para organizar la fiesta y preparar los recuerditos de los niños, y nunca se vende ni se comparte.",
      footer: "Con cariño, la familia de {name}",
      music: "Música",
    },
  };

  var LOCALES = { en: "en-US", es: "es-US" };
  var lang = initialLang();

  function initialLang() {
    try {
      var saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "es") return saved;
    } catch (e) {}
    return /^es\b/i.test(navigator.language || "") ? "es" : "en";
  }

  function t(key, vars) {
    var s = STRINGS[lang][key] || STRINGS.en[key] || "";
    return s.replace(/\{(\w+)\}/g, function (_, k) {
      return vars && vars[k] != null ? vars[k] : "";
    });
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function partyDate() {
    var d = P.date.split("-").map(Number);
    return new Date(d[0], d[1] - 1, d[2]);
  }

  function formatTime(hhmm) {
    var p = hhmm.split(":").map(Number);
    var d = partyDate();
    d.setHours(p[0], p[1] || 0);
    return new Intl.DateTimeFormat(LOCALES[lang], { hour: "numeric", minute: "2-digit" }).format(d);
  }

  // ---------- Static content ----------

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.title = t("title", { name: P.firstName, age: P.age });

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"), { name: P.firstName });
    });
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });

    var dateStr = new Intl.DateTimeFormat(LOCALES[lang], {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }).format(partyDate());
    document.getElementById("date-text").textContent = capitalize(dateStr);
    document.getElementById("time-text").textContent = P.startTime
      ? formatTime(P.startTime) + (P.endTime ? " – " + formatTime(P.endTime) : "")
      : t("timeTbd");

    if (!submitBtn.disabled) submitBtn.firstElementChild.textContent = t("submit");
    if (lastDone) showDone(lastDone);
    if (formMsg.dataset.key) showMsg(formMsg.dataset.key);
  }

  document.querySelectorAll("[data-party]").forEach(function (el) {
    el.textContent = P[el.getAttribute("data-party")];
  });
  document.getElementById("maps-link").href =
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(P.venue + ", " + P.address);
  document.getElementById("phone-link").href = "tel:" + P.contactPhone;

  var registry = document.getElementById("registry-link");
  if (P.registryUrl) {
    registry.href = P.registryUrl;
    registry.hidden = false;
  } else {
    document.getElementById("registry-soon").hidden = false;
  }

  document.querySelectorAll(".lang-toggle button").forEach(function (b) {
    b.addEventListener("click", function () {
      lang = b.getAttribute("data-lang");
      try { localStorage.setItem("lang", lang); } catch (e) {}
      applyLanguage();
    });
  });

  // ---------- RSVP form ----------

  var form = document.getElementById("rsvp-form");
  var rsvpDetails = document.getElementById("rsvp-details");
  var attendingFields = document.getElementById("attending-fields");
  var childrenList = document.getElementById("children-list");
  var childrenHint = document.getElementById("children-hint");
  var formMsg = document.getElementById("form-msg");
  var submitBtn = document.getElementById("submit-btn");
  var done = document.getElementById("rsvp-done");
  var lastDone = null;
  var counts = {};

  document.querySelectorAll(".stepper").forEach(function (s) {
    var name = s.getAttribute("data-name");
    var min = Number(s.getAttribute("data-min"));
    var max = Number(s.getAttribute("data-max"));
    var out = s.querySelector("output");
    var dec = s.querySelector('[data-step="-1"]');
    var inc = s.querySelector('[data-step="1"]');

    function set(v) {
      counts[name] = Math.max(min, Math.min(max, v));
      out.textContent = counts[name];
      dec.disabled = counts[name] <= min;
      inc.disabled = counts[name] >= max;
      if (name === "children") renderChildren();
    }
    dec.addEventListener("click", function () { set(counts[name] - 1); });
    inc.addEventListener("click", function () { set(counts[name] + 1); });
    set(Number(s.getAttribute("data-value")));
  });

  function ageOptions(selected) {
    var html = '<option value="">—</option><option value="<1"' + (selected === "<1" ? " selected" : "") + ">&lt;1</option>";
    for (var a = 1; a <= 17; a++) {
      html += '<option value="' + a + '"' + (String(a) === selected ? " selected" : "") + ">" + a + "</option>";
    }
    return html;
  }

  function renderChildren() {
    // Keep what was already typed when the count changes.
    var existing = Array.prototype.map.call(childrenList.querySelectorAll(".child"), function (row) {
      return { name: row.querySelector("input").value, age: row.querySelector("select").value };
    });
    childrenList.innerHTML = "";
    for (var i = 0; i < counts.children; i++) {
      var prev = existing[i] || { name: "", age: "" };
      var row = document.createElement("div");
      row.className = "child";
      row.innerHTML =
        '<span class="child-num" aria-hidden="true">' + (i + 1) + "</span>" +
        '<div class="field"><label for="child-name-' + i + '" data-i18n="childName"></label>' +
        '<input id="child-name-' + i + '" type="text" maxlength="60" autocomplete="off" required></div>' +
        '<div class="field child-age"><label for="child-age-' + i + '" data-i18n="childAge"></label>' +
        '<select id="child-age-' + i + '">' + ageOptions(prev.age) + "</select></div>";
      row.querySelector("input").value = prev.name;
      row.querySelectorAll("[data-i18n]").forEach(function (el) {
        el.textContent = t(el.getAttribute("data-i18n"));
      });
      childrenList.appendChild(row);
    }
    childrenHint.hidden = counts.children === 0;
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "attending") {
      rsvpDetails.hidden = false;
      attendingFields.hidden = e.target.value !== "yes";
      form.querySelector(".choice").classList.remove("invalid");
    }
  });
  form.addEventListener("input", function (e) {
    e.target.classList.remove("invalid");
  });

  function showMsg(key) {
    formMsg.dataset.key = key || "";
    formMsg.textContent = key ? t(key, { contact: P.contactName + " " + P.contactPhoneDisplay }) : "";
  }

  function validate() {
    var ok = true;
    form.querySelectorAll(".invalid").forEach(function (el) { el.classList.remove("invalid"); });

    var attending = form.querySelector('input[name="attending"]:checked');
    if (!attending) {
      form.querySelector(".choice").classList.add("invalid");
      ok = false;
    }
    var name = form.adultName;
    if (!name.value.trim()) { name.classList.add("invalid"); ok = false; }

    if (attending && attending.value === "yes") {
      childrenList.querySelectorAll("input").forEach(function (input) {
        if (!input.value.trim()) { input.classList.add("invalid"); ok = false; }
      });
    }
    return ok;
  }

  function collect() {
    var attending = form.querySelector('input[name="attending"]:checked').value === "yes";
    var kids = attending
      ? Array.prototype.map.call(childrenList.querySelectorAll(".child"), function (row) {
          return { name: row.querySelector("input").value.trim(), age: row.querySelector("select").value };
        })
      : [];
    return {
      attending: attending,
      adultName: form.adultName.value.trim(),
      phone: form.phone.value.trim(),
      adults: attending ? counts.adults : 0,
      children: kids,
      lang: lang,
      website: form.website.value, // honeypot
    };
  }

  function showDone(data) {
    lastDone = data;
    var first = data.adultName.split(/\s+/)[0];
    document.getElementById("done-text").textContent = t(data.attending ? "thanksYes" : "thanksNo", { who: first });
    document.getElementById("calendar").hidden = !(data.attending && P.startTime);
    document.getElementById("cal-apple").href = "party-" + lang + ".ics";
    document.getElementById("cal-google").href = googleCalendarUrl();
    form.hidden = true;
    done.hidden = false;
  }

  // Google Calendar's "add event" page; on Android it opens in the Calendar app.
  function googleCalendarUrl() {
    var day = P.date.replace(/-/g, "");
    var end = P.endTime || addHours(P.startTime, 2);
    var stamp = function (hhmm) { return day + "T" + hhmm.replace(":", "") + "00"; };
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(t("calEvent", { name: P.firstName, age: lang === "en" ? ordinal(P.age) : P.age })) +
      "&dates=" + stamp(P.startTime) + "/" + stamp(end) +
      "&ctz=" + encodeURIComponent(P.timeZone) +
      "&location=" + encodeURIComponent(P.venue + ", " + P.address) +
      "&details=" + encodeURIComponent(location.href.split("#")[0]);
  }

  function ordinal(n) { // 3 → "3rd"
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function addHours(hhmm, h) {
    var p = hhmm.split(":").map(Number);
    return ("0" + Math.min(23, p[0] + h)).slice(-2) + ":" + ("0" + (p[1] || 0)).slice(-2);
  }

  document.getElementById("rsvp-again").addEventListener("click", function () {
    lastDone = null;
    done.hidden = true;
    form.hidden = false;
    form.reset();
    rsvpDetails.hidden = true;
    attendingFields.hidden = true;
    childrenList.querySelectorAll("input").forEach(function (i) { i.value = ""; });
    childrenList.querySelectorAll("select").forEach(function (s) { s.value = ""; });
    showMsg("");
    document.getElementById("rsvp").scrollIntoView();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showMsg("");
    if (!validate()) { showMsg("errRequired"); return; }
    if (!P.rsvpEndpoint) { showMsg("errNotSetup"); return; }

    var data = collect();
    submitBtn.disabled = true;
    submitBtn.firstElementChild.textContent = t("sending");

    // Apps Script web apps don't send CORS headers for this request, so the response is opaque:
    // a resolved fetch means Google received it. text/plain avoids a CORS preflight.
    fetch(P.rsvpEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    })
      .then(function () {
        showDone(data);
        document.getElementById("rsvp").scrollIntoView();
      })
      .catch(function () { showMsg("errNetwork"); })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.firstElementChild.textContent = t("submit");
      });
  });

  applyLanguage();
})();
