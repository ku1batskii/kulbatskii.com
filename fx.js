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

  // ---------- Hero: морфящееся облако точек (авторский объект из набора) ----------
  // Сфера («система») → звезда-сигнал (мотив марки) → орбита. Придаём хаосу форму.
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
    var M = 440;

    function sphere() {
      var a = [], ga = Math.PI * (3 - Math.sqrt(5)), i;
      for (i = 0; i < M; i++) {
        var y = 1 - (i / (M - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = i * ga;
        a.push([Math.cos(th) * rr * 0.5, y * 0.5, Math.sin(th) * rr * 0.5]);
      }
      return a;
    }
    function burst() {
      var axes = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[0.7,0.7,0],[-0.7,-0.7,0],[0.7,-0.7,0],[-0.7,0.7,0]];
      var a = [], per = Math.ceil(M / axes.length), i;
      for (i = 0; i < M; i++) {
        var ax = axes[i % axes.length], t = 0.07 + (Math.floor(i / axes.length) / per) * 0.45;
        a.push([ax[0] * t, ax[1] * t, ax[2] * t]);
      }
      return a;
    }
    function torus() {
      var a = [], R = 0.36, rr = 0.11, i;
      for (i = 0; i < M; i++) {
        var u = (i / M) * Math.PI * 6, v = i * 2.3999;
        a.push([(R + rr * Math.cos(v)) * Math.cos(u), rr * Math.sin(v), (R + rr * Math.cos(v)) * Math.sin(u)]);
      }
      return a;
    }
    var shapes = [sphere(), burst(), torus()];
    var accent = []; for (var ai = 0; ai < M; ai++) accent.push(ai % 6 === 0);

    var rotX = -0.5, targetOX = 0, targetOY = 0, ox = 0, oy = 0, rot = -0.6;
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

    function render(ay, ax, e) {
      ctx.clearRect(0, 0, w, h);
      var A = shapes[from], B = shapes[to];
      var cy1 = Math.cos(ay), sy1 = Math.sin(ay), cx1 = Math.cos(ax), sx1 = Math.sin(ax);
      var arr = [], i;
      for (i = 0; i < M; i++) {
        var px = A[i][0] + (B[i][0] - A[i][0]) * e;
        var py = A[i][1] + (B[i][1] - A[i][1]) * e;
        var pz = A[i][2] + (B[i][2] - A[i][2]) * e;
        var X = px * cy1 + pz * sy1, Z = -px * sy1 + pz * cy1;
        var Y = py * cx1 - Z * sx1; Z = py * sx1 + Z * cx1;
        var persp = 2.6 / (2.6 - Z);
        arr.push({ sx: cx + X * scale * persp, sy: cy + Y * scale * persp, z: Z, persp: persp, a: accent[i] });
      }
      arr.sort(function (p, q) { return p.z - q.z; });
      var glow = dim === 1;
      for (i = 0; i < arr.length; i++) {
        var s = arr[i], d = (s.z + 0.9) / 1.8;
        var r = Math.max(1.0, 2.4 * s.persp * (0.4 + d * 0.8));
        var al = Math.min(0.22 + d * 0.6, 0.9) * dim;
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

    function frame() {
      if (!running) return;
      rot += 0.0028;
      ox += (targetOX - ox) * 0.06; oy += (targetOY - oy) * 0.06;
      if (hold > 0) hold--;
      else {
        morphT += 0.018;
        if (morphT >= 1) { morphT = 0; from = to; to = (to + 1) % shapes.length; hold = 80; }
      }
      var e = morphT * morphT * (3 - 2 * morphT);
      render(rot + ox, rotX + oy, e);
      requestAnimationFrame(frame);
    }

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      targetOX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.9;
      targetOY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.7;
    });

    resize();
    window.addEventListener('resize', resize);
    if (reduce) { render(-0.6, rotX, 0); return; } // статичный объект (сфера)
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
