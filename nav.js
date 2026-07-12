document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.ds-nav-toggle');
  var links = document.querySelector('.ds-nav-links');
  if (!toggle || !links) return;

  function closeMenu() {
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    var isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
});
