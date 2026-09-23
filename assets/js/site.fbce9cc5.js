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
          count.classList.add('is-bump');
          setTimeout(function () { count.classList.remove('is-bump'); }, 320);
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
  // --- Motion --------------------------------------------------------------
  // Only enhance when the browser can do it and the visitor hasn't asked for
  // less motion. Without this class every animated rule is inert, so the page
  // is complete with JavaScript off.
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (window.IntersectionObserver && !calm.matches) {
    document.documentElement.classList.add('anim');

    var groups = ['.section-head', '.cat-tile', '.card', '.promise', '.craft-media', '.craft-steps li', '.post-card', '.newsletter form', '.spec', '.review'];
    groups.forEach(function (sel) {
      // Never inside a <details>: a closed one is skipped rendering, the observer
      // never fires for it, and the content stays faded out even after the
      // visitor opens the panel. The accordion has its own open animation.
      var items = $$(sel).filter(function (el) { return !el.closest('.hero') && !el.closest('details'); });
      items.forEach(function (el, i) {
        el.setAttribute('data-reveal', '');
        // Stagger within a row, then reset, so a long grid never waits seconds.
        el.style.setProperty('--reveal-delay', (i % 4) * 70 + 'ms');
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });

    // Belt and braces for anything revealed by opening a panel later: show it
    // outright rather than trusting an observer that may never fire.
    document.addEventListener('toggle', function (e) {
      if (e.target.tagName === 'DETAILS' && e.target.open) {
        $$('[data-reveal]:not(.is-in)', e.target).forEach(function (el) { el.classList.add('is-in'); });
      }
    }, true);

    // Anything still unseen after load (print, find-in-page, tall screens) shows anyway.
    setTimeout(function () {
      $$('[data-reveal]:not(.is-in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('is-in');
      });
    }, 1200);
  }

  var header = $('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- Welcome-offer popup -------------------------------------------------
  var promo = $('[data-promo]');
  if (promo) {
    var KEY = 'ec_promo_seen';
    var days = parseInt(promo.getAttribute('data-days'), 10) || 30;
    var delay = (parseInt(promo.getAttribute('data-delay'), 10) || 9) * 1000;
    var lastFocus = null;
    var shown = false;

    var seenRecently = function () {
      try {
        var v = parseInt(window.localStorage.getItem(KEY) || '0', 10);
        return v > 0 && Date.now() - v < days * 86400000;
      } catch (e) { return false; }
    };
    var remember = function () {
      try { window.localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* private window */ }
    };
    var close = function () {
      promo.hidden = true;
      document.body.classList.remove('promo-open');
      remember();
      if (lastFocus) lastFocus.focus();
    };
    var open = function () {
      if (shown || seenRecently()) return;
      shown = true;
      lastFocus = document.activeElement;
      promo.hidden = false;
      document.body.classList.add('promo-open');
      var first = $('#promo-email', promo) || $('[data-promo-close]', promo);
      if (first) first.focus({ preventScroll: true });
    };

    if (!seenRecently()) {
      var timer = setTimeout(open, delay);
      // Or sooner, if they head for the tab bar or read half the page.
      document.addEventListener('mouseout', function (e) {
        if (!e.relatedTarget && e.clientY <= 0) { clearTimeout(timer); open(); }
      });
      window.addEventListener('scroll', function onHalf() {
        var read = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
        if (read > 0.55) { clearTimeout(timer); open(); window.removeEventListener('scroll', onHalf); }
      }, { passive: true });
    }

    $$('[data-promo-close]', promo).forEach(function (b) { b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !promo.hidden) close();
      if (e.key === 'Tab' && !promo.hidden) {
        // Keep the keyboard inside the dialog while it is open.
        var f = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', promo)
          .filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    var form = $('[data-promo-form]', promo);
    if (form) {
      form.addEventListener('submit', function (e) {
        if (!window.fetch) return;
        e.preventDefault();
        var err = $('.promo-error', promo);
        var btn = $('button[type=submit]', form);
        err.hidden = true;
        btn.disabled = true;
        fetch(form.action, {
          method: 'POST', body: new FormData(form),
          headers: { 'Accept': 'application/json' }, credentials: 'same-origin'
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (!d.ok) {
            err.textContent = d.message || 'Something went wrong. Please try again.';
            err.hidden = false;
            return;
          }
          if (d.code) $('[data-promo-code]', promo).textContent = d.code;
          $('[data-promo-step="form"]', promo).hidden = true;
          $('[data-promo-step="done"]', promo).hidden = false;
          remember();
        }).catch(function () {
          err.textContent = 'We could not reach the shop. Please try again.';
          err.hidden = false;
        }).then(function () { btn.disabled = false; });
      });
    }

    var copy = $('[data-promo-copy]', promo);
    if (copy) {
      copy.addEventListener('click', function () {
        var code = $('[data-promo-code]', promo).textContent.trim();
        var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy'; }, 2000); };
        if (navigator.clipboard) { navigator.clipboard.writeText(code).then(done, done); return; }
        var t = document.createElement('textarea');
        t.value = code; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (e) { /* nothing to do */ }
        document.body.removeChild(t);
        done();
      });
    }
  }

  // --- Shop assistant ------------------------------------------------------
  // Every reply is data from the server, rendered with textContent — nothing
  // the visitor types, and nothing the server sends, is ever parsed as HTML.
  var assist = $('[data-assist]');
  if (assist) {
    var launch = $('[data-assist-open]');
    var log = $('[data-assist-log]', assist);
    var chipBar = $('[data-assist-chips]', assist);
    var askForm = $('[data-assist-form]', assist);
    var input = $('[data-assist-input]', assist);
    var trackForm = $('[data-assist-track]', assist);
    var handoffForm = $('[data-assist-handoff]', assist);
    var busy = false;

    // The whole middle region scrolls, not just the transcript, so a form the
    // assistant opens can never be pushed out of reach.
    var body = $('[data-assist-body]', assist) || log;
    var scrollLog = function () { body.scrollTop = body.scrollHeight; };

    var bubble = function (kind) {
      var el = document.createElement('div');
      el.className = 'assist-msg assist-msg--' + kind;
      log.appendChild(el);
      return el;
    };

    var say = function (text) {
      var el = bubble('bot');
      var p = document.createElement('p');
      p.textContent = text;
      el.appendChild(p);
      scrollLog();
    };

    var openPanel = function () {
      assist.hidden = false;
      launch.setAttribute('aria-expanded', 'true');
      launch.classList.add('is-hidden');
      try { window.sessionStorage.setItem('ec_assist_open', '1'); } catch (e) { /* private window */ }
      if (input) input.focus({ preventScroll: true });
      scrollLog();
    };
    var closePanel = function () {
      assist.hidden = true;
      launch.setAttribute('aria-expanded', 'false');
      launch.classList.remove('is-hidden');
      try { window.sessionStorage.removeItem('ec_assist_open'); } catch (e) { /* private window */ }
      launch.focus();
    };

    launch.addEventListener('click', openPanel);
    $$('[data-assist-close]', assist).forEach(function (b) { b.addEventListener('click', closePanel); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !assist.hidden) closePanel();
    });

    // Render one reply: text, links, product cards, and whichever form it asks for.
    var render = function (reply) {
      var el = bubble('bot');
      (reply.blocks || []).forEach(function (b) {
        if (b.type === 'text') {
          var p = document.createElement('p');
          p.textContent = b.text;
          el.appendChild(p);
        } else if (b.type === 'link') {
          var a = document.createElement('a');
          a.className = 'assist-source';
          a.href = b.href;
          a.textContent = b.label + ' →';
          el.appendChild(a);
        } else if (b.type === 'products') {
          var wrap = document.createElement('div');
          wrap.className = 'assist-cards';
          (b.items || []).forEach(function (it) {
            var card = document.createElement('a');
            card.className = 'assist-card';
            card.href = it.href;
            if (it.image) {
              var img = document.createElement('img');
              img.src = it.image;
              img.alt = it.alt || '';
              img.loading = 'lazy';
              card.appendChild(img);
            }
            var text = document.createElement('div');
            var name = document.createElement('b');
            name.textContent = it.name;
            var price = document.createElement('span');
            price.textContent = it.price;
            text.appendChild(name);
            text.appendChild(price);
            card.appendChild(text);
            wrap.appendChild(card);
          });
          el.appendChild(wrap);
        }
      });

      chipBar.textContent = '';
      (reply.chips || []).forEach(function (c) {
        var b = document.createElement('button');
        b.className = 'assist-chip';
        b.type = 'button';
        b.setAttribute('data-assist-chip', '');
        b.textContent = c;
        chipBar.appendChild(b);
      });

      trackForm.hidden = reply.form !== 'track';
      handoffForm.hidden = reply.form !== 'handoff';
      scrollLog();
    };

    var typing = function () {
      var el = document.createElement('div');
      el.className = 'assist-typing';
      el.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(el);
      scrollLog();
      return el;
    };

    var send = function (form, echo) {
      if (busy) return;
      busy = true;
      if (echo) {
        var mine = bubble('you');
        var p = document.createElement('p');
        p.textContent = echo;
        mine.appendChild(p);
      }
      var dots = typing();
      // The static preview copy has no server; it installs its own answer
      // function instead, returning the same shape this code already handles.
      var ask = typeof window.EC_ASSIST_OFFLINE === 'function'
        ? window.EC_ASSIST_OFFLINE(new FormData(form))
        : fetch(form.action, {
            method: 'POST', body: new FormData(form),
            headers: { 'Accept': 'application/json' }, credentials: 'same-origin'
          }).then(function (r) { return r.json(); });
      ask.then(function (d) {
        dots.remove();
        if (!d.ok) {
          say(d.message || 'Something went wrong there. Please try again.');
          return;
        }
        render(d.reply);
      }).catch(function () {
        dots.remove();
        say('I could not reach the shop just then. Please try again, or use the contact page.');
      }).then(function () { busy = false; });
    };

    askForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      send(askForm, text);
      input.value = '';
    });

    chipBar.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-assist-chip]');
      if (!chip || busy) return;
      input.value = chip.textContent;
      askForm.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    [trackForm, handoffForm].forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!f.checkValidity()) { f.reportValidity(); return; }
        send(f, null);
        f.hidden = true;
        f.reset();
      });
    });

    // Reopen if they were mid-conversation when they changed page.
    try {
      if (window.sessionStorage.getItem('ec_assist_open') === '1') openPanel();
    } catch (e) { /* private window */ }
  }
})();
