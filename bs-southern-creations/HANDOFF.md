# B's Southern Creations — full handoff

**This project is NOT FlashTrack.** Do not mix the two.

Use this file + the photo packs to continue in a **new Cursor chat** (or any other tool).

---

## Paste into a new Cursor chat

```
This chat is ONLY for B's Southern Creations — not FlashTrack, not Notion.

Brand: B's Southern Creations — handmade blankets, scarves, hats, custom knit gifts.
Site folder: bs-southern-creations/ (plain HTML/CSS/JS)
Branch: cursor/bs-southern-creations-1ab4
PR: https://github.com/Mia-Cran/flashtrack-ai-learning-platform/pull/14
(Note: files are currently parked inside the FlashTrack repo; move to its own repo when ready.)

Photos & logos:
- Site assets: bs-southern-creations/assets/
- Full photo export: bs-southern-creations/_export/ (logos, products, stamp-ready, mockups)
- Zips (if available in this agent): /opt/cursor/artifacts/bs-southern-creations-handoff.zip and bs-southern-creations-photos.zip

Decisions:
- Host: Vercel free (static). Root directory = bs-southern-creations
- Domain for business card: bsoutherncreations.com (ONE s after b)
- Buy domain at GoDaddy (domain only — skip hosting upsells), point DNS to Vercel
- Cloudflare trycloudflare tunnels are temporary — never for a business card
- Business cards: Layout A = centered logo; Layout B = split mark + name. Tagline on B was "Custom orders & textiles" (optional)
- Selling later: Big Cartel (free ≤5 products), Square, Stripe Payment Links, or Etsy — site has no cart yet
- No admin CMS — edit index.html / assets, or ask Cursor

Continue from this handoff. Keep FlashTrack out of this chat.
```

---

## What the site is

One-page marketing site for **B's Southern Creations**.

- Hero: logo + “Handmade warmth, southern heart.”
- Shop grid: blankets, scarves, hats, sets
- Nav: Shop · What we make (dropdown) · Custom · Say hello
- Custom orders section
- Contact form (demo — not wired to email yet)
- Soft cream / pastel floral brand look

### Preview locally

```bash
cd bs-southern-creations
python3 -m http.server 5174
```

Open http://localhost:5174

---

## File map

```
bs-southern-creations/
  index.html
  css/styles.css
  js/main.js
  README.md
  HANDOFF.md          ← this file
  assets/
    logo.png / logo.svg     full lockup (flower + BSC + name)
    mark.png / mark.svg     flower mark only
    favicon.png / favicon.svg
    logo-source.jpg         original phone photo of logo (moiré — do not print)
    products/
      blanket.jpg
      scarf.jpg
      hat.jpg
      set.jpg
    stamp-ready/            print / stamp / packaging PNGs
  _export/                  same photos + business card & stamp mockups (all in one place)
```

---

## Photo inventory

### Logos (use these for web + print)

| File | Use |
| --- | --- |
| `assets/logo.png` / `logo.svg` | Full brand lockup |
| `assets/mark.png` / `mark.svg` | Icon / favicon-style mark |
| `assets/favicon.png` | Browser tab |
| `assets/logo-source.jpg` | Original screen photo — reference only |

### Product photos (on the live page)

| File | Product |
| --- | --- |
| `assets/products/blanket.jpg` | Blankets & throws |
| `assets/products/scarf.jpg` | Scarves |
| `assets/products/hat.jpg` | Hats & beanies |
| `assets/products/set.jpg` | Sets & extras |

### Stamp-ready (packaging / rubber stamp / print)

In `assets/stamp-ready/`:

- `BSC-logo-color-transparent.png`
- `BSC-logo-color-white-bg.png`
- `BSC-logo-stamp-black.png`
- `BSC-logo-stamp-black-transparent.png`
- `BSC-mark-color-transparent.png`
- `BSC-mark-stamp-black.png`

### Mockups (cards, stamps, heated foil)

In `_export/mockups/`:

- Business cards: `bsc-business-card-mockup.png` (A), `bsc-business-card-alt.png` (B), `bsc-business-card-compare.png`
- Stamp scenes: `bsc-stamp-mockup.png`, `bsc-stamp-ink.png`, `bsc-stamp-kraft.png`, `bsc-stamp-blanket-tag.png`, `bsc-stamp-gift-box.png`
- Heated: `bsc-heated-stamp.png`, `bsc-heated-foil.png`
- Clean exports: `bsc-logo-clean.png`, `bsc-logo-transparent.png`, `bsc-mark-clean.png`, `BSC-logo-stamp-black-clean.png`

### Downloadable zips (this environment)

- Full site (no `.vercel`): `/opt/cursor/artifacts/bs-southern-creations-handoff.zip`
- All photos/export: `/opt/cursor/artifacts/bs-southern-creations-photos.zip`

---

## Hosting & domain

1. Deploy on **Vercel** (free Hobby) — Root Directory = `bs-southern-creations`
2. Buy **`bsoutherncreations.com`** at GoDaddy (domain only)
3. Vercel → Domains → add domain → copy DNS records into GoDaddy
4. Print that URL on the business card

Cloudflare `*.trycloudflare.com` links die when the session ends.

---

## Business card

- **A — Centered:** full logo, site under it  
- **B — Split:** mark left; name + `bsoutherncreations.com` right  
- Optional line on B: “Custom orders & textiles” = made-to-order + fabric/knit goods (can remove)

---

## Selling options (when ready)

| Option | Cost shape |
| --- | --- |
| Big Cartel Gold | Free up to 5 products; paid plans for more |
| Square Online | Free plan; % when you sell |
| Stripe Payment Links | $0/mo; Buy buttons on this site |
| Etsy | Listing + % fees; good for discovery |
| Shopify | Monthly fee — skip for now |

Site has **no cart / no admin login**. Edit files, or add Big Cartel/Square links later.

---

## How to change the site

1. Ask Cursor in a BSC-only chat  
2. Or edit `index.html` / drop new photos in `assets/products/` on GitHub  
3. If Vercel is linked to the repo, it redeploys after push  

---

## Suggested next steps

1. Own GitHub repo (leave FlashTrack alone)  
2. Permanent Vercel deploy  
3. Domain + DNS  
4. Pick card layout A or B and print  
5. Optional: Big Cartel / Square / Etsy buy links  
6. Optional later: CMS if you want a click-to-edit admin  

---

## Brand notes

- Soft cream paper background, pastel floral logo  
- Fonts: Great Vibes (script), Cormorant Garamond, Outfit  
- Copy tone: warm, handmade, southern, cozy — not corporate  
