/* Everest Craftria — progressive enhancement. Every form works without this file. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // --- Toast ---------------------------------------------------------------
  var toastTimer;
  function toast(message, linkHref, linkText) {
    var el = $('[data-toast]');
    if (!el) return;
    el.textContent = '';
    var span = document.createElement('span');
    span.textContent = message;
    el.appendChild(span);
    if (linkHref) {
      var a = document.createElement('a');
      a.href = linkHref;
      a.textContent = linkText;
      el.appendChild(a);
    }
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 4200);
  }

  // --- Auto-submitting selects (currency, sort, delivery country) ----------
  $$('form[data-autosubmit] select').forEach(function (sel) {
    sel.addEventListener('change', function () { sel.form.submit(); });
  });

  // --- Drawer --------------------------------------------------------------
  var drawer = $('#drawer');
  var opener = $('[data-drawer-open]');
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true;
    document.body.style.overflow = '';
    if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); }
  }
  if (drawer && opener) {
    opener.addEventListener('click', function () {
      drawer.hidden = false;
      document.body.style.overflow = 'hidden';
      opener.setAttribute('aria-expanded', 'true');
      var first = $('a, button', drawer);
      if (first) first.focus();
    });
    $$('[data-drawer-close]', drawer).forEach(function (b) { b.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  }

  // --- Search panel --------------------------------------------------------
  var searchBtn = $('[data-search-toggle]');
  var searchPanel = $('#search-panel');
  if (searchBtn && searchPanel) {
    searchBtn.addEventListener('click', function () {
      var open = searchPanel.hidden;
      searchPanel.hidden = !open;
      searchBtn.setAttribute('aria-expanded', String(open));
      if (open) $('input', searchPanel).focus();
    });
  }

  // --- Filters collapse on small screens -----------------------------------
  var filters = $('[data-filters]');
  if (filters && window.matchMedia('(max-width: 899px)').matches) filters.open = false;

  // --- Quantity steppers ---------------------------------------------------
  $$('[data-qty]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = $('input', btn.parentNode);
      var min = parseInt(input.min || '0', 10);
      var max = parseInt(input.max || '99', 10);
      var v = (parseInt(input.value, 10) || 0) + parseInt(btn.getAttribute('data-qty'), 10);
      input.value = String(Math.max(min, Math.min(max, v)));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  var cartForm = $('[data-cart-form]');
  if (cartForm) {
    var t;
    cartForm.addEventListener('change', function (e) {
      if (!e.target.matches('input[type=number]')) return;
      clearTimeout(t);
      t = setTimeout(function () { cartForm.submit(); }, 600);
    });
  }

  // --- Product: variants, gallery, add to bag ------------------------------
  var buy = $('form[data-buy]');
  if (buy) {
    var variants = [];
    try { variants = JSON.parse(buy.getAttribute('data-variants') || '[]'); } catch (e) { variants = []; }
    var idInput = $('[data-variant-id]', buy);
    var priceEl = $('[data-price]');
    var stockEl = $('[data-stock]', buy);
    var addBtn = $('[data-add]', buy);
    var skuEl = $('[data-sku]');
    var qtyInput = $('#qty', buy);
    var colourName = $('[data-colour-name]', buy);
    var sizeName = $('[data-size-name]', buy);

    var checked = function (name) {
      var el = $('input[name="' + name + '"]:checked', buy);
      return el ? el.value : '';
    };

    var sync = function () {
      var colour = checked('colour');
      var size = checked('size');
      var match = variants.filter(function (v) { return v.colour === colour && v.size === size; })[0];

      // Mark size options that don't exist or are sold out in this colour.
      $$('input[name="size"]', buy).forEach(function (r) {
        var v = variants.filter(function (x) { return x.colour === colour && x.size === r.value; })[0];
        r.parentNode.classList.toggle('is-unavailable', !v || !v.avail);
      });
      if (colourName) colourName.textContent = colour;
      if (sizeName) sizeName.textContent = size;

      if (!match) {
        idInput.value = '';
        stockEl.textContent = 'This combination isn’t available';
        stockEl.setAttribute('data-state', 'out');
        addBtn.disabled = true;
        addBtn.textContent = 'Unavailable';
        return;
      }
      idInput.value = match.id;
      priceEl.textContent = match.price;
      stockEl.textContent = match.stock.label;
      stockEl.setAttribute('data-state', match.stock.key);
      addBtn.disabled = !match.avail;
      addBtn.textContent = match.avail ? 'Add to bag' : 'Sold out';
      if (skuEl) skuEl.textContent = match.sku;
      qtyInput.max = String(match.max);
      if (parseInt(qtyInput.value, 10) > match.max) qtyInput.value = String(match.max);

      // Show the first image tagged with this colour, if any.
      var thumb = $$('[data-gallery] .gallery-thumbs button').filter(function (b) { return b.getAttribute('data-colour') === colour; })[0];
      if (thumb) thumb.click();
    };
    buy.addEventListener('change', function (e) {
      if (e.target.name === 'colour' || e.target.name === 'size') sync();
    });

    buy.addEventListener('submit', function (e) {
      if (!window.fetch || !idInput.value) return;
      e.preventDefault();
      addBtn.disabled = true;
      fetch(buy.action, {
        method: 'POST',
        body: new FormData(buy),
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      }).then(function (r) { return r.json(); }).then(function (data) {
        var count = $('[data-cart-count]');
        if (count && typeof data.count === 'number') {
          count.textContent = String(data.count);
          count.hidden = data.count === 0;
        }
        toast(data.message || 'Added to your bag.', data.ok ? buy.action.replace(/\/add$/, '') : null, 'View bag');
      }).catch(function () {
        buy.submit();
      }).then(function () { addBtn.disabled = false; });
    });
  }

  var gallery = $('[data-gallery]');
  if (gallery) {
    var main = $('.gallery-main img', gallery);
    $$('.gallery-thumbs button', gallery).forEach(function (b) {
      b.addEventListener('click', function () {
        main.removeAttribute('srcset');
        main.src = b.getAttribute('data-full');
        main.alt = b.getAttribute('data-alt') || main.alt;
        $$('.gallery-thumbs button', gallery).forEach(function (x) { x.setAttribute('aria-current', x === b ? 'true' : 'false'); });
      });
    });
  }

  // --- Wishlist hearts -----------------------------------------------------
  $$('form[data-wish]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.fetch) return;
      e.preventDefault();
      var btns = form.id ? $$('button[form="' + form.id + '"]') : $$('button', form);
      fetch(form.action, {
        method: 'POST', body: new FormData(form),
        headers: { 'Accept': 'application/json' }, credentials: 'same-origin'
      }).then(function (r) {
        if (r.status === 401) { return r.json().then(function (d) { window.location.href = d.login; }); }
        return r.json().then(function (d) {
          btns.forEach(function (b) { b.setAttribute('aria-pressed', String(!!d.saved)); });
          toast(d.saved ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
        });
      }).catch(function () { form.submit(); });
    });
  });

  // --- Checkout: recalculate delivery when the country changes -------------
  var checkout = $('form[data-checkout]');
  if (checkout) {
    var country = $('[data-country]', checkout);
    if (country) {
      country.addEventListener('change', function () {
        var h = document.createElement('input');
        h.type = 'hidden'; h.name = 'recalc'; h.value = '1';
        checkout.appendChild(h);
        checkout.submit();
      });
    }
  }
})();
