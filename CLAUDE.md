# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Style Forage is a personal styling and wardrobe consultation services website. It includes a public-facing marketing site, a booking/payment flow, an AI stylist chat, and a CMS-powered lookbook system for sharing curated outfits with clients.

## Commands

- **`netlify dev`** — Run full dev environment (frontend + serverless functions, port 8888). Preferred for development.
- **`npm run dev`** — Vite dev server only (port 3000, no serverless functions).
- **`npm run build`** — Production build via Vite (output to `dist/`).
- **`npm run preview`** — Preview the production build locally.

There are no test or lint commands configured.

## Tech Stack

- **React 18** with TypeScript, built with **Vite**
- **Tailwind CSS v4** (theme tokens defined in `index.css` via `@theme` blocks, NOT `tailwind.config.js`)
- **React Router DOM 6** with lazy-loaded pages
- **Netlify** hosting with serverless functions (`netlify/functions/`) and **Netlify Blobs** for data storage
- **Stripe** (Payment Intents + Elements) for bookings
- **Google Gemini** (`@google/genai`) for AI stylist chat
- **Resend** for booking confirmation emails
- **Sharp** for server-side image resizing
- **@dnd-kit** for drag-and-drop reordering in admin
- **Lucide React** for icons

## Architecture

### Routing & Layouts

Routes are defined in `App.tsx`. Pages are lazy-loaded via `React.lazy` + `Suspense`. Three layout modes:
- **Main site** (`/`, `/contact`): Header + Footer chrome
- **Booking flow** (`/book/:serviceId`): No site chrome, focused checkout
- **Standalone** (`/admin`, `/admin/:slug`, `/lookbook`, `/lookbook/:slug`): Own layouts, no site chrome

### Data Flow

Frontend → Netlify Functions (via `/api/*` redirects in `netlify.toml`) → Netlify Blobs (JSON storage).

All serverless functions are in `netlify/functions/`. They share a storage abstraction at `netlify/functions/lib/storage.ts`. Functions authenticate via `X-Admin-Passcode` header checked against `ADMIN_PASSCODE` env var.

### Key Pages

- **`pages/Admin.tsx`** — CMS for managing lookbooks. Handles CRUD for lookbook entries, shopping items, shopping links, and tips. The admin has a tab-based UI (`looks`, `shopping`, `tips`). Two views: lookbook list (at `/admin`) and lookbook detail (at `/admin/:slug`).
- **`pages/Lookbook.tsx`** — Client-facing lookbook viewer. Displays photo gallery, shopping list, and tips via slide-up action sheets.
- **`pages/BookingPage.tsx`** — Multi-step booking wizard with Stripe payment integration.

### State Management

Local `useState` only — no Redux or Context. The `BookingWizard` uses a single state object for its multi-step funnel. Admin page manages extensive local state for CRUD operations on multiple entity types.

### Serverless Functions

CMS functions follow a pattern: single function per entity type handling GET/POST/PATCH/DELETE via method switching. Key functions:
- `cms-auth.ts` — Passcode validation (admin + lookbook codes)
- `cms-lookbooks.ts` — Lookbook CRUD
- `cms-shopping.ts` — Shopping list items
- `cms-links.ts` — Shopping links
- `cms-tips.ts` — Style tips
- `cms-upload.ts` — Image upload with Sharp resizing
- `create-payment-intent.ts` — Stripe Payment Intents
- `fetch-link-preview.ts` — OG metadata scraping for link previews

## Design System

### Colors & Typography

- **Palette**: Sage (brand green, `sage-500: #8cae8c`), Stone (text/neutral), Sand (warm accents)
- **Fonts**: Playfair Display (serif, headings) + Inter (sans, body)
- **Borders**: Soft `border-stone-100`, large radii (`rounded-2xl`/`rounded-3xl` for cards, `rounded-full` for buttons)

### UI Patterns

- **Action sheets**: Slide-up mobile modals with swipe-to-close. Pattern defined in `.cursor/rules/design-system.mdc`. Use the shared `ActionSheet` component in `Lookbook.tsx`.
- **Selection chips**: `rounded-full border-2` pills. Selected = `border-stone-900 bg-white`, default = `border-transparent bg-stone-50`.
- **Admin cards**: Content left + action buttons right. Edit = sage hover, Delete = red hover.
- **All interactive elements** must use `cursor-pointer`. Disabled elements use `cursor-not-allowed`.

### Tailwind v4

Custom theme tokens are in `index.css` `@theme` blocks, not a config file:
```css
@theme {
  --color-sage-500: #8cae8c;
  --font-serif: 'Playfair Display', serif;
}
```

## Environment Variables

Required in `.env` (server-side unless `VITE_` prefixed):
- `ADMIN_PASSCODE` — Admin CMS access code
- `GEMINI_API_KEY` — Google Gemini API
- `STRIPE_SECRET_KEY` — Stripe secret key
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (client-side)
- `RESEND_API_KEY` — Resend email API
- `RESEND_FROM_EMAIL` — Sender email address (optional)
