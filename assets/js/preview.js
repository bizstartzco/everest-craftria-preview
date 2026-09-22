/* Static preview: intercept anything that needs a server and say so. */
(function () {
  var msg = 'This is a preview copy — buying, accounts and search are switched off here.';
  function toast(text) {
    var el = document.querySelector('[data-toast]');
    if (!el) { window.location.href = 'preview.html'; return; }
    el.textContent = text;
    el.classList.add('is-on');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('is-on'); }, 3800);
  }
  document.addEventListener('submit', function (e) { e.preventDefault(); toast(msg); }, true);
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-preview]');
    if (a) { e.preventDefault(); toast(msg); }
    var b = e.target.closest('[data-add], .wish-btn, [data-search-toggle]');
    if (b && b.tagName === 'BUTTON' && b.type === 'submit') { e.preventDefault(); toast(msg); }
  }, true);
})();