/* KULBATSKII — визуальные эффекты: анимированный герой + reveal при скролле.
   Прогрессивное улучшение: без JS и при prefers-reduced-motion всё видно и статично. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('fx');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ---------- Scroll reveal ----------
  function setupReveal() {
    var targets = Array.prototype.slice.call(document.querySelectorAll(
      '.ds-block .ds-block-head, .ds-block .card, .ds-block .stat-card, ' +
      '.ds-block .member-card, .ds-block .row, .ds-block .cta-band, ' +
      '.ds-block .list-bare, .ds-block .tags, .statement h2'
    ));
    if (!targets.length) return;

    if (reduce) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    targets.forEach(function (el) { el.classList.add('reveal'); });

    // Мягкая лесенка внутри одного контейнера (карточки в сетке).
    var groups = [];
    targets.forEach(function (el) {
      var g = null;
      for (var i = 0; i < groups.length; i++) { if (groups[i].parent === el.parentNode) { g = groups[i]; break; } }
      if (!g) { g = { parent: el.parentNode, items: [] }; groups.push(g); }
      g.items.push(el);
    });
    groups.forEach(function (g) {
      g.items.forEach(function (el, i) { el.style.transitionDelay = Math.min(i * 55, 220) + 'ms'; });
    });

    // Проверка по позиции: всё, что в зоне видимости или выше её, гарантированно
    // становится видимым — ничего не может «застрять» невидимым (в т.ч. при переходе по якорю).
    var ticking = false;
    function check() {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = 0; i < targets.length; i++) {
        var el = targets[i];
        if (el.classList.contains('is-visible')) continue;
        if (el.getBoundingClientRect().top < vh * 0.9) el.classList.add('is-visible');
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', check);
    check();
  }

  // ---------- Hero: единый массив частиц, морфящийся между объектами ----------
  // Сфера («система») → цилиндр (база данных) → документ. Один массив точек:
  // каждая частица притягивается к своей цели (easing) + живой микрошум/мерцание.
  function setupHero() {
    var hero = document.querySelector('.ds-hero');
    if (!hero) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'fx-hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, cx = 0, cy = 0, scale = 0, dim = 1, running = true;
    var M = 520;

    function ellipse(cx0, cy0, rx, ry, n) {
      var p = [], k;
      for (k = 0; k <= n; k++) { var an = (k / n) * Math.PI * 2; p.push([cx0 + rx * Math.cos(an), cy0 + ry * Math.sin(an)]); }
      return p;
    }
    // Дискретизация иконки (набор ломаных) в M точек + лёгкая толщина по z (объём).
    function icon(polys, depth) {
      var segs = [], lens = [], total = 0, pi, k;
      for (pi = 0; pi < polys.length; pi++) {
        var P = polys[pi];
        for (k = 0; k < P.length - 1; k++) {
          segs.push([P[k], P[k + 1]]);
          var L = Math.hypot(P[k + 1][0] - P[k][0], P[k + 1][1] - P[k][1]); lens.push(L); total += L;
        }
      }
      var a = [], i;
      for (i = 0; i < M; i++) {
        var dp = (i / M) * total, acc = 0, si = 0;
        while (si < segs.length - 1 && acc + lens[si] < dp) { acc += lens[si]; si++; }
        var tt = lens[si] > 0 ? (dp - acc) / lens[si] : 0;
        a.push([
          segs[si][0][0] + (segs[si][1][0] - segs[si][0][0]) * tt,
          -(segs[si][0][1] + (segs[si][1][1] - segs[si][0][1]) * tt), // ось Y вверх → экранная Y вниз
          (i % 2 ? depth : -depth)
        ]);
      }
      return a;
    }
    function docIcon() { // документ
      var W = 0.24, T = 0.38, c = 0.12, m = 0.05;
      var polys = [[[-W, T], [W - c, T], [W, T - c], [W, -T], [-W, -T], [-W, T]], [[W - c, T], [W - c, T - c], [W, T - c]]];
      var rows = [0.20, 0.09, -0.02, -0.13, -0.24, -0.32], r;
      for (r = 0; r < rows.length; r++) polys.push([[-W + m, rows[r]], [(r % 2 ? W - m - 0.07 : W - m), rows[r]]]);
      return icon(polys, 0.02);
    }
    function folderIcon() { // папка: корпус + приподнятая вкладка-трапеция сверху слева
      var W = 0.34, H = 0.22, tw = 0.20, th = 0.11, sl = 0.05;
      return icon([[[-W, H + th], [-W + tw, H + th], [-W + tw + sl, H], [W, H], [W, -H], [-W, -H], [-W, H + th]]], 0.02);
    }
    function dbIcon() { // база данных
      var R = 0.30, T = 0.29, ry = 0.11;
      return icon([ellipse(0, T, R, ry, 30), ellipse(0, 0, R, ry, 30), ellipse(0, -T, R, ry, 30), [[-R, T], [-R, -T]], [[R, T], [R, -T]]], 0.02);
    }
    function terminalIcon() { // терминал
      var W = 0.36, H = 0.26;
      return icon([[[-W, -H], [W, -H], [W, H], [-W, H], [-W, -H]], [[-W, H - 0.09], [W, H - 0.09]],
      [[-W + 0.10, 0.05], [-W + 0.19, -0.02], [-W + 0.10, -0.09]], [[-W + 0.23, -0.10], [-W + 0.35, -0.10]]], 0.02);
    }
    var shapes = [docIcon(), folderIcon(), dbIcon(), terminalIcon()];
    var accent = []; for (var ai = 0; ai < M; ai++) accent.push(ai % 6 === 0);

    var rotX = -0.4, targetOX = 0, targetOY = 0, ox = 0, oy = 0;
    var from = 0, to = 1, morphT = 0, hold = 70;

    function resize() {
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var wide = w > 760, side = Math.min(w, h);
      cx = w * 0.5;
      cy = wide ? h * 0.36 : h * 0.30;
      scale = side * (wide ? 0.52 : 0.44);
      dim = wide ? 1 : 0.85;
    }

    function render(ay, ax, e, tick) {
      ctx.clearRect(0, 0, w, h);
      var A = shapes[from], B = shapes[to];
      var cy1 = Math.cos(ay), sy1 = Math.sin(ay), cx1 = Math.cos(ax), sx1 = Math.sin(ax);
      var arr = [], i, jt = 0.008;
      for (i = 0; i < M; i++) {
        // положение = интерполяция к цели + «живой» микрошум
        var px = A[i][0] + (B[i][0] - A[i][0]) * e + Math.sin(tick * 0.04 + i) * jt;
        var py = A[i][1] + (B[i][1] - A[i][1]) * e + Math.sin(tick * 0.04 + i * 1.7) * jt;
        var pz = A[i][2] + (B[i][2] - A[i][2]) * e + Math.sin(tick * 0.04 + i * 2.3) * jt;
        var X = px * cy1 + pz * sy1, Z = -px * sy1 + pz * cy1;
        var Y = py * cx1 - Z * sx1; Z = py * sx1 + Z * cx1;
        var persp = 2.6 / (2.6 - Z);
        arr.push({ sx: cx + X * scale * persp, sy: cy + Y * scale * persp, z: Z, persp: persp, a: accent[i], id: i });
      }
      arr.sort(function (p, q) { return p.z - q.z; });
      var glow = dim === 1;
      for (i = 0; i < arr.length; i++) {
        var s = arr[i], d = (s.z + 0.9) / 1.8;
        var r = Math.max(1.0, 2.4 * s.persp * (0.4 + d * 0.8));
        var fl = 0.78 + 0.22 * Math.sin(tick * 0.07 + s.id * 1.3); // мерцание
        var al = Math.min(0.22 + d * 0.6, 0.9) * dim * fl;
        if (s.a) {
          ctx.shadowColor = 'rgba(229,83,43,0.9)';
          ctx.shadowBlur = glow ? 7 * s.persp : 0;
          ctx.fillStyle = 'rgba(229,83,43,' + al + ')';
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(240,238,232,' + (al * 0.5) + ')';
        }
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, r, 0, 6.283);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    var tick = 0;
    function frame() {
      if (!running) return;
      tick++;
      ox += (targetOX - ox) * 0.06; oy += (targetOY - oy) * 0.06;
      if (hold > 0) hold--;
      else {
        morphT += 0.018;
        if (morphT >= 1) { morphT = 0; from = to; to = (to + 1) % shapes.length; hold = 80; }
      }
      var e = morphT * morphT * (3 - 2 * morphT);   // easing притяжения к цели
      var yaw = Math.sin(tick * 0.006) * 0.5;        // мягкое покачивание — объект не уходит «в ребро»
      render(yaw + ox, rotX + oy, e, tick);
      requestAnimationFrame(frame);
    }

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      targetOX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.9;
      targetOY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.7;
    });

    resize();
    window.addEventListener('resize', resize);
    if (reduce) { render(0.35, rotX, 0, 0); return; } // статичный объект (сфера)
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }

  // ---------- Форма: валидация, отправка через AJAX, success-состояние ----------
  function setupForm() {
    var form = document.querySelector('form[action*="formsubmit"]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Нативная валидация: показывает ошибки и фокусирует первое невалидное поле.
      if (!form.reportValidity()) return;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.setAttribute('disabled', ''); btn.classList.add('no-arrow'); btn.textContent = 'Отправляем…'; }
      var url = form.getAttribute('action').replace('formsubmit.co/', 'formsubmit.co/ajax/');
      fetch(url, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function () { showSuccess(); })
        .catch(function () { form.submit(); }); // фолбэк — обычная отправка
    });
    function showSuccess() {
      var box = document.createElement('div');
      box.className = 'form-success';
      box.setAttribute('role', 'status');
      box.innerHTML = '<strong>Спасибо — заявка отправлена.</strong><br>Мы прочитаем её и свяжемся, чтобы уточнить детали и предложить следующий шаг.';
      form.replaceWith(box);
      box.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  // ---------- Фирменный курсор-кольцо ----------
  function setupCursor() {
    if (reduce) return;
    if (!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches)) return;
    var ring = document.createElement('div');
    ring.className = 'fx-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    var x = window.innerWidth / 2, y = window.innerHeight / 2, rx = x, ry = y, shown = false;
    var HOVER = 'a,button,input,textarea,select,label,.card';
    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; ring.classList.add('is-visible'); }
      ring.classList.toggle('is-hover', !!(e.target.closest && e.target.closest(HOVER)));
    });
    (function loop() {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  ready(function () { setupReveal(); setupHero(); setupForm(); setupCursor(); });
})();
