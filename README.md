# FPL Balatro

A roguelike deck-building card game powered by your Fantasy Premier League squad. Built with Next.js, TypeScript, and Zustand.

## How It Works

Enter your FPL Manager ID and pick a gameweek. Your GW squad becomes your deck — each player card's chips are their actual GW points. Build scoring combos, buy jokers from the shop, and survive 8 antes of escalating blinds.

### Game Modes

- **Roguelike** — Start with your highest-scoring GW. Beat all 8 antes to unlock the next-highest GW, and so on. Progress is saved per manager ID.
- **Free Run** — All gameweeks available from the start.

### Core Mechanics

- **8 Antes × 3 Blinds** (Small → Big → Boss) with increasing score targets
- **18 Stacking Combos** — Point pairs, Formation, Dream Team, Full Squad, and more. Multiple combos trigger on the same hand for stacked multipliers
- **Jokers** — Manager cards from your other gameweeks that boost chips, mult, or apply multiplicative scaling
- **Sell Jokers** — Sell equipped jokers in the shop to free up slots and earn coins based on rarity
- **Tactic Cards** — Level up specific combos for permanent mult bonuses (+2 mult per level)
- **Transfer Cards** — Modify your deck (position swaps, point boosts) with previewed effects
- **League Mode** — Your FPL league rivals become boss blind opponents (leagues ≤50 members)
- **Boss Effects** — Position disabling, card limits, mult halving
- **Progress Tracking** — Per-manager-ID run history with wins, scores, and ante reached
- **Auto-save** — Resume interrupted runs from localStorage

### Scoring

```
Final Score = Chips × Mult
```

- **Chips** = sum of played cards' GW points + joker chip bonuses
- **Mult** = sum of matched combo mults + tactic levels + additive joker mults, then scaled by multiplicative joker effects

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your FPL Manager ID.

Find your ID on the [FPL website](https://fantasy.premierleague.com) under "My Team" in the URL.

## Tech Stack

- **Next.js 16** (App Router + API Routes as FPL proxy)
- **TypeScript**
- **Zustand** (state management)
- **Tailwind CSS v4**

## Deploy

Deploy to Vercel with zero config:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/fpl-balatro)

The API routes proxy FPL requests server-side to avoid CORS issues — works automatically as Vercel serverless functions.
