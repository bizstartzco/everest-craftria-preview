# Everest Craftria — shop preview

A read-only preview of the Everest Craftria online shop while it is being built. These are static
pages exported from the working site, so anyone with the link can browse it — no account needed.

**Preview link:** https://KiranKauri012.github.io/everest-craftria-preview/
*(live once GitHub Pages is switched on for this repository)*

## What you can do here

Browse the homepage, all four categories, all twelve products with their photos and colour options,
the journal, and every policy page — delivery, returns, care guide, terms, privacy and cookies.
It works on a phone.

## What is switched off

The bag, checkout, customer accounts, search and the currency switch all need a live server, which a
static copy cannot provide. Tapping one shows a short note. **All of it works in the real shop** —
payment, order emails, order tracking, accounts and the admin dashboard are built and tested.

## What is not final

- **Products are samples.** Names, prices, sizes and stock are placeholders for design review.
- **Photographs are licensed stock images**, not Everest Craftria's products. Each product page says
  so and credits the photographer; see [photo-credits.html](photo-credits.html). They will be
  replaced with real product photography before launch.
- **Fibre composition shows "To be confirmed"** on every product. UK labelling rules require the real
  blend (for example "70% cashmere, 30% silk"), so it stays blank until the client confirms it.
- **Policy pages are drafts** and carry `[TO CONFIRM]` notes where details are still needed. They
  need a professional review before launch.
- **Delivery rates are marked "sample"** until real carrier prices are set.

## Still needed before the shop can go live

1. Namecheap contact verification, so everestcraftria.com stops being suspended
2. The product list with fibre blends, sizes, prices and stock
3. Real product photographs
4. A Stripe or PayPal account in Everest Craftria LTD's name
5. Hosting access

## Refreshing this preview

From the site folder, with the local server running:

```bash
php tools/export-preview.php
```

Then copy the contents of `preview/` over this repository and push.
