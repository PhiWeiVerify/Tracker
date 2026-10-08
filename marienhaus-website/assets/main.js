// Mobile Navigation + Schriftgrößen-Umschalter. Kein Tracking, keine externen Skripte.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var KEY = 'mh-large-text';
  var root = document.documentElement;
  try { if (localStorage.getItem(KEY) === '1') root.classList.add('large-text'); } catch (e) {}

  var fontBtn = document.querySelector('.font-toggle');
  if (fontBtn) {
    var sync = function () {
      var on = root.classList.contains('large-text');
      fontBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      fontBtn.textContent = on ? 'A− Normale Schrift' : 'A+ Größere Schrift';
    };
    sync();
    fontBtn.addEventListener('click', function () {
      root.classList.toggle('large-text');
      try { localStorage.setItem(KEY, root.classList.contains('large-text') ? '1' : '0'); } catch (e) {}
      sync();
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
