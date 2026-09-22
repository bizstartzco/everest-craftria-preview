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
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    // The welcome offer is the one form worth demonstrating: show the code step
    // instead of a toast, so the client sees what a visitor would. Capturing
    // first and stopping here keeps site.js from posting to a server that isn't
    // there. The browser has already enforced a real email and the tick box.
    var f = e.target;
    if (f.hasAttribute('data-promo-form')) {
      e.stopPropagation();
      var p = f.closest('[data-promo]');
      p.querySelector('[data-promo-step="form"]').hidden = true;
      p.querySelector('[data-promo-step="done"]').hidden = false;
      try { localStorage.setItem('ec_promo_seen', String(Date.now())); } catch (err) { /* private window */ }
      return;
    }
    toast(msg);
  }, true);
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-preview]');
    if (a) { e.preventDefault(); toast(msg); }
    var b = e.target.closest('[data-add], .wish-btn, [data-search-toggle]');
    if (b && b.tagName === 'BUTTON' && b.type === 'submit') { e.preventDefault(); toast(msg); }
  }, true);
})();