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
  // --- Shop assistant, offline ---------------------------------------------
  // The panel normally posts to the shop. Here it asks this function instead,
  // which answers from assistant.json — the same sections, delivery rates and
  // products the real assistant uses, exported at build time. Order lookup and
  // the message form need a server, so they say so rather than pretending.
  var kb = null;
  var kbLoad = fetch('assistant.json').then(function (r) { return r.json(); }).then(function (d) { kb = d; }).catch(function () { kb = false; });

  var norm = function (s) {
    s = (s || '').toLowerCase().replace(/[‘’]/g, "'");
    s = s.replace(/[^a-z0-9\s'-]+/g, ' ').replace(/\s+/g, ' ').trim();
    var swap = { shipping: 'delivery', ship: 'delivery', postage: 'delivery', post: 'delivery',
      colour: 'color', colours: 'color', colors: 'color', refund: 'return', refunds: 'return',
      returns: 'return', returning: 'return', washing: 'wash', clean: 'wash', cleaning: 'wash',
      cost: 'price', costs: 'price', prices: 'price', pricing: 'price', pashmina: 'cashmere',
      material: 'composition', fabric: 'composition', orders: 'order', parcel: 'order', package: 'order' };
    return s.split(' ').map(function (w) { return swap[w] || w; }).join(' ');
  };

  var keywords = function (n) {
    var stop = {};
    (kb.stopwords || []).forEach(function (w) { stop[w] = 1; });
    var seen = {};
    return n.split(' ').filter(function (w) {
      if (w.length <= 2 || stop[w] || seen[w]) return false;
      seen[w] = 1;
      return true;
    });
  };

  var scoreIntents = function (n) {
    var best = '', bestScore = 0, greetingOnly = true, hits = 0;
    Object.keys(kb.intents || {}).forEach(function (name) {
      var score = 0;
      kb.intents[name].forEach(function (t) {
        if (t.indexOf(' ') > -1) { if (n.indexOf(t) > -1) score += 3; }
        else if (new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(n)) score += 2;
      });
      if (score > 0) { hits++; if (name !== 'greeting') greetingOnly = false; }
      if (score > bestScore) { bestScore = score; best = name; }
    });
    if (best === 'greeting' && !greetingOnly) {
      bestScore = 0; best = '';
      Object.keys(kb.intents).forEach(function (name) {
        if (name === 'greeting') return;
        var score = 0;
        kb.intents[name].forEach(function (t) {
          if (new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(n)) score += 2;
        });
        if (score > bestScore) { bestScore = score; best = name; }
      });
    }
    return best;
  };

  var bestSection = function (keys, prefer) {
    var best = null, bestScore = 0;
    (kb.sections || []).forEach(function (s) {
      var score = 0;
      keys.forEach(function (k) {
        var re = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (re.test(s.haystack)) score += re.test(norm(s.heading)) ? 5 : 1;
      });
      if (prefer && s.page === prefer) score += 2;
      if (score > bestScore) { bestScore = score; best = s; }
    });
    return bestScore >= 3 ? best : null;
  };

  var quote = function (s) {
    var text = (s.heading ? s.heading + '\n' : '') + s.text;
    if (text.length > 460) {
      var cut = text.slice(0, 460);
      var stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n'));
      text = (stop > 180 ? cut.slice(0, stop + 1) : cut) + '…';
    }
    var blocks = [{ type: 'text', text: text }];
    if (s.unfinished) blocks.push({ type: 'text', text: 'Some details on that page are still being finalised. If you need the exact answer, the contact page reaches a person.' });
    blocks.push({ type: 'link', label: 'Read ' + s.page_title, href: s.page + '.html' });
    return blocks;
  };

  var findProducts = function (keys) {
    var asking = { show: 1, find: 1, looking: 1, look: 1, want: 1, need: 1, buy: 1, recommend: 1, suggest: 1, sell: 1, have: 1, got: 1, any: 1, something: 1, anything: 1, piece: 1, pieces: 1, please: 1 };
    var terms = keys.filter(function (k) { return !asking[k]; });
    if (!terms.length) return [];
    return (kb.products || []).filter(function (p) {
      return terms.every(function (t) { return p.terms.indexOf(t) > -1; });
    }).slice(0, 3);
  };

  var answer = function (intent, blocks, chips) {
    return { intent: intent, blocks: blocks, chips: chips || [], form: null };
  };

  var noServer = function (what) {
    return answer('preview', [
      { type: 'text', text: 'This is a preview copy of the shop, so ' + what + ' is switched off here. On the live site this works normally.' }
    ], ['Delivery and costs', 'Returns', 'How do I wash it?']);
  };

  var offlineReply = function (message) {
    var n = norm(message);
    if (!n) return answer('empty', [{ type: 'text', text: 'Ask me about delivery, returns or care.' }]);
    var keys = keywords(n);
    var intent = scoreIntents(n);

    if (intent === 'greeting') return answer('greeting', [{ type: 'text', text: 'Hello. What can I help you with?' }], ['Delivery and costs', 'Returns', 'How do I wash it?']);
    if (intent === 'thanks') return answer('thanks', [{ type: 'text', text: 'You’re very welcome. Anything else?' }]);
    if (intent === 'track') return noServer('checking an order');
    if (intent === 'human') {
      // WhatsApp works from a static copy — it is just a link.
      if (kb.whatsapp) {
        return answer('human', [
          { type: 'text', text: 'WhatsApp is the quickest way to reach someone — the button is just below the suggestions. The message form on the live site is switched off in this preview copy.' },
          { type: 'link', label: 'Chat on WhatsApp', href: kb.whatsapp.href, external: true }
        ], ['Delivery and costs', 'Returns']);
      }
      return noServer('sending a message to the team');
    }

    if (intent === 'delivery') {
      // Named a country? Answer for that country, as the live shop does.
      var hit = null;
      Object.keys(kb.country_zone || {}).forEach(function (c) {
        if (hit) return;
        if (new RegExp('\\b' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(n)) hit = kb.country_zone[c];
      });
      if (hit && kb.zones && kb.zones[hit.zone]) {
        return answer('delivery', [
          { type: 'text', text: 'Delivery to ' + hit.name + ':\n• ' + kb.zones[hit.zone].join('\n• ') },
          { type: 'link', label: 'Delivery Information', href: 'delivery.html' }
        ], ['Returns', 'How do I wash it?']);
      }
      var lines = kb.delivery || [];
      return answer('delivery', [
        { type: 'text', text: lines.length ? 'Here’s what delivery costs today:\n• ' + lines.join('\n• ') : 'Delivery rates are set per country at checkout.' },
        { type: 'link', label: 'Delivery Information', href: 'delivery.html' }
      ], ['Returns', 'How do I wash it?']);
    }

    if (intent === 'composition') {
      var c = kb.compositions || [];
      return answer('composition', [
        { type: 'text', text: c.length === 1
            ? 'Every piece currently lists its composition as: ' + c[0] + '. You’ll find it on each product page under Specification.'
            : (c.length ? 'Composition varies by piece — it’s listed on each product page under Specification. Across the range today: ' + c.slice(0, 4).join('; ') + '.'
                        : 'Each piece lists its own composition on its product page. I won’t guess at fibre content — it’s the one thing worth getting exactly right.') },
        { type: 'link', label: 'Browse the shop', href: 'shop.html' }
      ], ['How do I wash it?']);
    }

    if (intent === 'find') {
      var items = findProducts(keys);
      if (items.length) {
        return answer('find', [{ type: 'text', text: 'Here’s what matches.' }, { type: 'products', items: items }], ['Delivery and costs']);
      }
    }

    var prefer = intent === 'returns' ? 'returns' : (intent === 'care' ? 'care-guide' : null);
    var s = bestSection(keys, prefer);
    if (s) return answer(intent || 'page', quote(s));

    var found = findProducts(keys);
    if (found.length) {
      return answer('find', [{ type: 'text', text: 'Here’s what matches.' }, { type: 'products', items: found }], []);
    }
    return answer('miss', [
      { type: 'text', text: 'I don’t know that one, and I’d rather say so than guess. On the live site I’d offer to pass it to the team — in this preview copy, the contact page is the place to ask.' },
      { type: 'link', label: 'Contact', href: 'contact.html' }
    ], ['Delivery and costs', 'Returns', 'How do I wash it?']);
  };

  window.EC_ASSIST_OFFLINE = function (data) {
    return kbLoad.then(function () {
      if (!kb) {
        return { ok: false, message: 'The preview could not load its answers. Try reloading the page.' };
      }
      var form = data.get('form');
      if (form === 'track') return { ok: true, reply: noServer('checking an order') };
      if (form === 'handoff') return { ok: true, reply: noServer('sending a message to the team') };
      return { ok: true, reply: offlineReply(data.get('message') || '') };
    });
  };

  document.addEventListener('submit', function (e) {
    // The assistant's own forms are handled by the offline engine above.
    if (e.target.closest('[data-assist]')) return;
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