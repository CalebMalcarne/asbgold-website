/* ASB shared nav: injects a hamburger toggle and wires open/close */
(function () {
  function init() {
    var nav = document.querySelector('.nav');
    var inner = nav && nav.querySelector('.nav-inner');
    var menu = inner && inner.querySelector('.nav-menu');
    if (!nav || !inner || !menu) return;

    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    inner.appendChild(btn);

    function close() {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) close();
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

/* === Live precious metals spot ticker (via ASB worker: spot + daily change) === */
(function () {
  var API = "https://asb-metals.manualjny.workers.dev/";
  var REFRESH_MS = 5 * 60 * 1000;
  var GAP = 46;     // must match the CSS gap on .asb-ticker-track / .tk-group
  var SPEED = 70;   // scroll speed in px per second (constant regardless of width)
  var lastItems = [];

  function fmt(n) {
    return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function arrow(dir) { return dir === "up" ? "\u25B2" : dir === "down" ? "\u25BC" : "\u2013"; }
  function dirClass(dir) { return dir === "up" ? "tk-up" : dir === "down" ? "tk-down" : "tk-flat"; }
  function itemHTML(p) {
    var chg = "";
    if (p.direction && p.changePct != null) {
      var pct = (p.changePct >= 0 ? "+" : "") + Number(p.changePct).toFixed(2) + "%";
      chg = '<span class="tk-chg ' + dirClass(p.direction) + '">' + arrow(p.direction) + " " + pct + '</span>';
    }
    return '<span class="tk-item"><span class="tk-name">' + p.name + '</span><span class="tk-price">' + fmt(p.price) + '</span>' + chg + '</span>';
  }
  function groupEl(track) { return track.querySelector(".tk-group"); }

  // Build two identical groups, each repeated enough times to exceed the
  // viewport width, so the -1 group-width loop never leaves an empty gap.
  function layout(track) {
    if (!lastItems.length) return;
    var ticker = track.parentNode;
    var containerW = (ticker && ticker.clientWidth) || window.innerWidth;
    var base = lastItems.map(function (p) { return itemHTML(p); }).join("");

    track.style.animation = "none";
    track.innerHTML = '<span class="tk-group">' + base + '</span>';
    var oneSet = groupEl(track).getBoundingClientRect().width;
    if (!oneSet) return;

    var reps = Math.max(1, Math.ceil((containerW + 160) / oneSet) + 1);
    var groupHTML = "";
    for (var i = 0; i < reps; i++) groupHTML += base;

    track.innerHTML = '<span class="tk-group">' + groupHTML + '</span><span class="tk-group">' + groupHTML + '</span>';
    var shift = groupEl(track).getBoundingClientRect().width + GAP;
    track.style.setProperty("--tk-shift", shift + "px");
    track.style.animationDuration = (shift / SPEED) + "s";
    track.style.animation = "";
  }

  function load(track) {
    fetch(API).then(function (r) { return r.json(); })
      .then(function (d) {
        var metals = (d && d.metals) || [];
        var ok = metals.filter(function (m) { return m && !m.error && m.price != null; })
          .map(function (m) {
            return { name: m.name, price: m.price, changePct: m.changePct, direction: m.direction };
          });
        if (ok.length) { lastItems = ok; layout(track); }
      })
      .catch(function () {});
  }

  function initTicker() {
    var track = document.getElementById("asb-ticker-track");
    if (!track) return;
    load(track);
    setInterval(function () { load(track); }, REFRESH_MS);
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { layout(track); }, 200);
    });
  }
  if (document.readyState !== 'loading') initTicker();
  else document.addEventListener('DOMContentLoaded', initTicker);
})();

/* BBB "As of <date>" - show today's date wherever .bbb-asof appears (trust strip + footer) */
(function () {
  function fmt(d){ return (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear(); }
  function run(){ var t=fmt(new Date()); var els=document.querySelectorAll('.bbb-asof'); for(var i=0;i<els.length;i++) els[i].textContent=t; }
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();

/* GHL form height: fixed floor, grow-only.
 *
 * Why not trust GHL's reported height: measured in production, the form document reports
 * document.body.scrollHeight = 224 while document.documentElement.scrollHeight = 731. The form
 * content is not inside the normal body flow, so the body measurement is meaningless. Since
 * iframe-resizer measures the body, every height GHL has ever posted (534, 364, 371) has been
 * far short of what the form actually occupies. That shortfall is the internal scrollbar.
 *
 * So: the CSS sets a floor tall enough for the real content. This listener only ever GROWS the
 * iframe, never shrinks it. If the confirmation screen needs more room it gets it; the frame can
 * never drop below the floor and produce a scrollbar.
 *
 * IMPORTANT: the floor is declared as `min-height: <n>px !important` in each page's CSS, not just
 * `height`. GHL's own form_embed.js writes its (too small) number straight onto the iframe's inline
 * style attribute, and an inline style beats a plain CSS `height`. That is why the old 640px floor
 * never held and the frame rendered at ~365px with an internal scrollbar. `min-height !important`
 * outranks the inline write, so GHL can no longer collapse the frame, while this listener can still
 * grow it past the floor.
 *
 * If a gap appears under the submit button, lower BOTH the height and the min-height in the CSS.
 * Do not add a timer, and do not set a height unconditionally from GHL's number: both were tried
 * and both made it worse.
 *
 * Add ?asbdebug=1 to any URL to log what GHL reports.
 */
(function () {
  var MAX_H = 1400;
  var DEBUG = window.location.search.indexOf('asbdebug=1') !== -1;

  window.addEventListener('message', function (e) {
    if (String(e.origin).indexOf('leadconnectorhq.com') === -1) return;
    var d = e.data;
    if (typeof d !== 'string' || d.indexOf('[iFrameSizer]') !== 0) return;

    var parts = d.replace('[iFrameSizer]', '').split(':');
    if (parts.length < 4) return;

    var id = parts[0];
    var h = parseInt(parts[1], 10);
    if (DEBUG) console.log('ASB GHL reports:', h, 'px, event:', parts[3]);
    if (!h || h > MAX_H) return;

    var frames = document.querySelectorAll('iframe[data-form-id]');
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (id && f.id !== id && f.getAttribute('data-layout-iframe-id') !== id) continue;
      var current = f.getBoundingClientRect().height;
      if (h > current) {
        f.style.height = h + 'px';
        if (DEBUG) console.log('ASB grew iframe to', h, 'px');
      } else if (DEBUG) {
        console.log('ASB kept floor of', Math.round(current), 'px');
      }
    }
  }, false);
})();
