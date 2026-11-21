# SAKHI — Women-First Campus Life + Wellbeing Platform

> **"Your campus. Your wellbeing. Your growth. Your people."**

Sakhi is a women-first campus buddy prototype. The web frontend is currently a
local-first demo; it is not production-ready until its Supabase adapter, project
configuration, and live service integrations are completed and verified.

---

## 🌟 Core Features

- **Sakhi chat**: Scripted local demo replies, cancellation, and a crisis-support path. It is not connected to an AI provider.
- **Home and planner**: Local check-ins, personal plans, generated sample deadlines, and supportive wellbeing snapshots.
- **Circle**: Demo posts, comments, reactions, reports, opt-in buddy discovery, and local direct messages.
- **Campus**: Clearly labelled demo announcements, clubs, events, and placement listings; no real campus or employer facts are seeded.
- **Growth**: Local DSA/aptitude tracking, resume editing/print-to-PDF, and mock-interview practice.
- **Privacy controls**: Opt-in cycle tracking, AI memory, and discoverability; consent withdrawal removes local records.
- **Trust labels**: Shared content is labelled Official, Verified, Community, or AI-assisted.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: The native reference app uses React Native, Expo SDK 57, and Expo Router. The new web frontend uses React, Vite, TypeScript, Tailwind, and React Router.
- **Styling & UI**: Custom design system (`src/components/sakhi-ui.tsx`), high-contrast dark mode support, fluid responsive design.
- **State & Storage**: Native app uses AsyncStorage and existing hooks. The web app uses TanStack Query and domain repositories under `src/data/`, with a browser-local demo adapter.
- **Backend & Database**: Supabase (Postgres, Row Level Security, Auth, Realtime, Storage), Node.js server endpoints for AI proxying.
- **Testing**: Node unit tests, Vitest component tests, Playwright end-to-end test, TypeScript strict checking, and ESLint.

---

## 🚀 Getting Started

### Prerequisites

- Node.js v22.12+
- npm v10+

### Installation & Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Run the web frontend:
   ```bash
   npm run web
   ```

   The web app defaults to local demo mode (`VITE_DATA_MODE=local`). The Supabase web adapter is currently a typed stub; do not select `supabase` expecting a live connection yet.

4. The retained native Expo app can still be started with:
   ```bash
   npm run ios
   npm run android
   ```

5. Run checks and create a production web bundle:
   ```bash
   npm test
   npm run lint
   npm run build
   ```
6. To run the browser flow, install the Playwright browser once and run:
   ```bash
   npx playwright install chromium
   npm run test:e2e
   ```

---

## 🔐 Environment Variables

| Variable | Description |
| :--- | :--- |
| `EXPO_PUBLIC_SAKHI_API_URL` | Public API URL for Sakhi backend / AI proxy endpoint |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable anonymous key |
| `VITE_DATA_MODE` | Web data adapter (`local` by default; `supabase` is not implemented yet) |
| `VITE_SUPABASE_URL` | Reserved for the future web adapter; currently unused |
| `VITE_SUPABASE_ANON_KEY` | Reserved for the future web adapter; currently unused |
| `AI_PROVIDER` | AI service provider (e.g. Gemini, OpenAI) |
| `AI_API_KEY` | Server-side private API key for AI provider |

---

## 🛡️ Security & Role Model

- **Database RLS**: Versioned migrations live in [`supabase/migrations/`](supabase/migrations/); validate them against a configured Supabase project before launch.
- **Strict Privacy**: Backend migrations define owner-only policies for sensitive data. The local browser demo is not encrypted and must not be used for real sensitive data.
- **Content Trust**: Trust badges report the row's label; they do not independently verify sources.
- **Frontend integration gaps**: See [`docs/FRONTEND_STATUS.md`](docs/FRONTEND_STATUS.md) before selecting Supabase mode or using real data.

---

## 📁 Repository Structure

```
src/
├── web/                    # Vite routes, screens, shell, theme, and shared UI
├── data/                   # Typed domain repositories and local/Supabase adapters
└── types/                  # Generated Supabase database types
supabase/
├── migrations/             # Database source of truth
└── functions/              # Authenticated Edge Functions
server/                     # Retained legacy/reference server and schema
tests/                      # Backend, local adapter, component, and browser tests
```
