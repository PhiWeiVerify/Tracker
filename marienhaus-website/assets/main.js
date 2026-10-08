/* Marienhaus St. Johann – Interaktion. Kein Tracking, keine externen Skripte. */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");
  if (!reduced) root.classList.add("motion");

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Theme & Schriftgröße ---------- */
  var savedTheme = store("mh-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  if (store("mh-large") === "1") root.classList.add("large-text");

  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var themeBtns = [].slice.call(document.querySelectorAll("[data-theme-toggle]"));
    var syncT = function () { themeBtns.forEach(function (b) { b.setAttribute("aria-label", isDark() ? "Helles Design" : "Dunkles Design"); b.setAttribute("aria-pressed", isDark()); }); };
    syncT();
    themeBtns.forEach(function (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        var apply = function () { root.setAttribute("data-theme", next); store("mh-theme", next); syncT(); };
        if (document.startViewTransition && !reduced) document.startViewTransition(apply); else apply();
      });
    });
    var fontBtns = [].slice.call(document.querySelectorAll("[data-font-toggle]"));
    var syncF = function () { var on = root.classList.contains("large-text"); fontBtns.forEach(function (b) { b.setAttribute("aria-pressed", on); b.textContent = on ? "A−" : "A+"; b.setAttribute("aria-label", on ? "Normale Schriftgröße" : "Größere Schrift"); }); };
    syncF();
    fontBtns.forEach(function (b) { b.addEventListener("click", function () { root.classList.toggle("large-text"); store("mh-large", root.classList.contains("large-text") ? "1" : "0"); syncF(); }); });

    /* ---------- Mobilmenü ---------- */
    var toggle = document.querySelector(".nav-toggle"), nav = document.getElementById("main-nav");
    if (toggle && nav) toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });

    var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

    /* ---------- Reveal & Zähler ---------- */
    var counters = [].slice.call(document.querySelectorAll("[data-count]"));
    function runCount(el) {
      var end = +el.getAttribute("data-count"), t0 = null, dur = 1400;
      if (reduced) { el.firstChild.nodeValue = end; return; }
      (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.firstChild.nodeValue = Math.round(end * e); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          if (en.target.hasAttribute("data-count")) runCount(en.target);
          io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      document.querySelectorAll("[data-reveal], [data-count]").forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
      counters.forEach(runCount);
    }

    renderStatus();
    initCalc();
    initMap();
    initHero();
  });

  /* ---------- Live-Status freie Plätze ---------- */
  function renderStatus() {
    var list = document.getElementById("status-list"), D = window.MH_DATA;
    if (!list || !D) return;
    var cls = { frei: "free", warteliste: "wait", belegt: "full" };
    list.innerHTML = "";
    D.plaetze.forEach(function (p) {
      var li = document.createElement("li");
      var n = document.createElement("span"); n.textContent = p.haus;
      var s = document.createElement("span"); s.className = "pill " + (cls[p.status] || "wait"); s.textContent = p.text;
      li.appendChild(n); li.appendChild(s); list.appendChild(li);
    });
    var st = document.getElementById("status-stand"); if (st) st.textContent = D.stand;
  }

  /* ---------- Kostenrechner ---------- */
  var eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  function initCalc() {
    var D = window.MH_DATA;
    if (!D) return;
    [].slice.call(document.querySelectorAll("[data-calc]")).forEach(function (form) {
      var box = form.parentNode, out = {};
      ["big", "sub", "eee", "zu", "uv", "inv", "tot", "kasse", "heim", "insight", "b1", "b2", "b3", "b4"].forEach(function (k) { out[k] = box.querySelector('[data-c="' + k + '"]'); });
      var shown = 0;
      function animateTo(v) {
        if (reduced) { out.big.textContent = eur.format(v); shown = v; return; }
        var from = shown, t0 = null;
        (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - p, 3);
          shown = from + (v - from) * e; out.big.textContent = eur.format(shown); if (p < 1) requestAnimationFrame(step); })(performance.now());
      }
      function calc() {
        var f = new FormData(form);
        var h = D.kosten[f.get("haus")], z = D.zuschlag[+f.get("dauer")], pg = +f.get("pg");
        var zu = Math.round(h.eee * z.pct);
        var eigen = h.eee - zu + h.uv + h.invest;
        var kasse = D.leistung[pg] + zu;
        animateTo(eigen);
        out.sub.textContent = "pro Monat Eigenanteil · " + h.name;
        out.eee.textContent = eur.format(h.eee);
        out.zu.textContent = "− " + eur.format(zu) + " (" + Math.round(z.pct * 100) + " %)";
        out.uv.textContent = eur.format(h.uv);
        out.inv.textContent = eur.format(h.invest);
        out.tot.textContent = eur.format(eigen);
        out.kasse.textContent = eur.format(kasse);
        out.heim.textContent = eur.format(kasse + eigen);
        out.b1.style.flexGrow = h.eee - zu; out.b2.style.flexGrow = h.uv; out.b3.style.flexGrow = h.invest; out.b4.style.flexGrow = kasse;
        out.insight.textContent = "Gut zu wissen: Ihr Eigenanteil ist bei Pflegegrad 2 bis 5 gleich hoch – ein höherer Pflegegrad erhöht nur den Anteil der Pflegekasse (hier " + eur.format(D.leistung[pg]) + "). Je länger Sie bei uns wohnen, desto höher der Zuschlag.";
      }
      form.addEventListener("change", calc);
      calc();
    });
  }

  /* ---------- Standortkarte ---------- */
  function initMap() {
    var pins = [].slice.call(document.querySelectorAll(".pin")), btns = [].slice.call(document.querySelectorAll(".map-legend button"));
    if (!pins.length) return;
    function select(id) {
      pins.forEach(function (p) { p.classList.toggle("active", p.getAttribute("data-id") === id); });
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-id") === id); });
    }
    pins.forEach(function (p) {
      var go = function () { select(p.getAttribute("data-id")); var b = document.querySelector('.map-legend button[data-id="' + p.getAttribute("data-id") + '"]'); if (b) b.focus({ preventScroll: true }); };
      p.addEventListener("click", go);
      p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    btns.forEach(function (b) { b.addEventListener("click", function () { select(b.getAttribute("data-id")); }); });
  }

  /* ---------- Hero: Aurora-Canvas ---------- */
  function initHero() {
    var c = document.querySelector(".hero-canvas");
    if (!c || !c.getContext) return;
    // Weiche Verläufe brauchen keine volle Auflösung: 1/4 rendern, CSS skaliert hoch. Spart ~95 % Pixelarbeit.
    var ctx = c.getContext("2d"), w, h, SCALE = .25, raf = null, visible = true, last = 0;
    var blobs = [
      { x: .78, y: .25, r: .55, c: [217, 141, 43], sx: .00011, sy: .00017, p: 0 },
      { x: .18, y: .80, r: .60, c: [45, 91, 215],  sx: .00009, sy: .00013, p: 2 },
      { x: .55, y: .65, r: .45, c: [111, 143, 122], sx: .00014, sy: .00008, p: 4 },
      { x: .95, y: .90, r: .40, c: [45, 91, 215],  sx: .00012, sy: .00010, p: 1 }
    ];
    function size() { w = c.clientWidth; h = c.clientHeight; c.width = Math.ceil(w * SCALE); c.height = Math.ceil(h * SCALE); ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); }
    function draw(t) {
      var dark = isDark(), a = dark ? .42 : .30;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
      blobs.forEach(function (b) {
        var x = (b.x + Math.sin(t * b.sx + b.p) * .08) * w, y = (b.y + Math.cos(t * b.sy + b.p) * .1) * h, r = b.r * Math.max(w, h);
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(" + b.c + "," + a + ")"); g.addColorStop(1, "rgba(" + b.c + ",0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
    }
    function loop(t) { if (t - last > 33) { draw(t); last = t; } raf = visible ? requestAnimationFrame(loop) : null; }
    size(); draw(0);
    window.addEventListener("resize", function () { size(); draw(performance.now()); });
    if (reduced) return;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(c);
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; if (visible && !raf) raf = requestAnimationFrame(loop); });
  }
})();
