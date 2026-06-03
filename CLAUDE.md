# exam-reviews — projekt kontext

## Čo to je
Jednoduchá веб stránka kde ľudia môžu zanechať správu/review. Reviews floatujú v pozadí ako animované pill-y. V strede je modal s inputmi. Pod kartou je počítadlo spokojných.

Live URL: https://lukspie.github.io/exam-reviews/

## Tech stack
- **Frontend:** Vanilla HTML / CSS / JS — žiadny framework
- **Hosting:** GitHub Pages (repo: github.com/Lukspie/exam-reviews)
- **Databáza:** Supabase (PostgreSQL, REST API)
- **Fonty:** Syne (headings, bold) + DM Mono (mono, subtitles, inputs)

## Supabase
- **Project URL:** `https://ymdchsvjlommtwyzvpyy.supabase.co`
- **Anon key:** v `app.js` a `admin.js` ako `SUPABASE_ANON`
- **Tabuľka:** `reviews`

### Schéma tabuľky `reviews`
| Stĺpec | Typ | Default |
|--------|-----|---------|
| id | bigserial | auto |
| name | text | — |
| comment | text | — |
| created_at | timestamptz | now() |
| approved | boolean | true |

### RLS policies
- `anon can select` — SELECT WHERE true
- `anon can insert` — INSERT WITH CHECK true
- GRANT: SELECT, INSERT, DELETE na anon

## Súbory
```
index.html    — hlavná stránka (modal + floating pills + counter)
style.css     — všetky štýly (dark theme, grain, animácie)
app.js        — fetch reviews, floating pills logika, submit review
admin.html    — admin dashboard (login + tabuľka reviews)
admin.js      — admin login, load/toggle reviews
```

## Design systém
Tmavý minimalistický štýl — šedo-čierny.

### CSS premenné
```css
--bg: #0d0d0d
--surface: #141414
--border: #242424
--border2: #2e2e2e
--text: #e8e8e8
--muted: #555
--muted2: #3a3a3a
--success: #4ade80
```

### Komponenty
- `.card` — hlavný modal box, max-width 420px
- `.tag` — malý uppercase monospace label (napr. "MESSAGE")
- `.float-pill` — animovaný floating review v pozadí
- `.counter` — "Je vás tu X spokojných" pod kartou
- `.center` — fixed fullscreen flex column center

## app.js — kľúčové funkcie
- `fetchReviews()` — GET z Supabase, nastaví `reviews[]` a počítadlo
- `startFloating()` — spustí interval spawnovania pills
- `spawnPill()` — vytvorí jeden floating pill na random pozícii (vyhýba sa stredu 30%)
- `submitReview()` — POST do Supabase, po úspechu zobrazí success state

## admin.js — kľúčové funkcie
- `tryLogin()` — porovná heslo s `ADMIN_PASSWORD`
- `loadReviews()` — GET všetky reviews (aj neschválené)
- `toggleApproved(id, current)` — PATCH approved true/false
- `updateStats(data)` — nastaví celkom/dnes/schválených

## Admin prístup
- URL: `/admin.html`
- Heslo: `neuhadnes123` (toto je v kóde — verejné)
- Mazanie: priamo v Supabase Table Editor (nie cez web UI)

## Dôležité poznámky
- `anon` key je verejný v kóde — je to ok, má len SELECT + INSERT prístup
- Admin heslo je v JS — ktokoľvek môže vidieť dashboard, ale mazanie nie je možné cez web
- Floating pills sa spawnujú len na ľavej (0–32%) a pravej (58–90%) strane — stred je voľný pre modal
- Animácia pills trvá 12–22s, interval spawnu je 3500ms
- Char limit pre comment je 100 znakov (aj v DB aj v UI)
- `approved = false` správy sa nezobrazujú v floating pills (filter v GET query)

## Čo ešte chýba / možné vylepšenia
- [ ] Spam protection (rate limiting)
- [ ] Možnosť zmeniť achievement text dynamicky (teraz nie je žiadny)
- [ ] Mobile optimalizácia
- [ ] Animácia počítadla (count-up efekt)
