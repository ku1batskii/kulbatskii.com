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

  ready(function () { setupReveal(); setupForm(); setupCursor(); });
})();
