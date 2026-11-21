# SAKHI — Women-First Campus Life + Wellbeing Platform

> **"Your campus. Your wellbeing. Your growth. Your people."**

Sakhi is a comprehensive, production-grade women-first campus life ecosystem designed to empower college students across wellbeing, academics, career placements, clubs, events, and community connection.

---

## 🌟 Core Features

- **Sakhi AI Companion**: Dynamic, context-aware companion (`SakhiGirl`) providing study guidance, period care, emotional support, and campus routing.
- **Home (Sakhi Today)**: Real-time personalized dashboard showing your daily schedule, upcoming placement deadlines, club events, and wellness state.
- **Circle (Community & Q&A)**: 1-to-1 real-time messaging, study group discovery ("Find My People"), community Q&A ("Ask the Girls"), and topic channels.
- **Campus Hub**: Multi-campus architecture supporting official announcements, club directories, campus events, and department resources.
- **Placement Ecosystem**: Placement prep dashboard, interview experiences, aptitude prep, resume tools, and company prep groups with Placement Cell verification badges.
- **Wellbeing Suite**: Local-first privacy-respecting tracking for mood, sleep, hydration, movement, activity sessions, and optional period/body care tracking.
- **Role-Based Security**: Scoped RBAC for `STUDENT`, `CAMPUS_ADMIN`, `CLUB_LEAD`, `PLACEMENT_CELL`, `COMMUNITY_LEAD`, and `MODERATOR`.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: The native reference app uses React Native, Expo SDK 57, and Expo Router. The new web frontend uses React, Vite, TypeScript, Tailwind, and React Router.
- **Styling & UI**: Custom design system (`src/components/sakhi-ui.tsx`), high-contrast dark mode support, fluid responsive design.
- **State & Storage**: Native app uses AsyncStorage and existing hooks. The web app uses TanStack Query and domain repositories under `src/data/`, with a browser-local demo adapter.
- **Backend & Database**: Supabase (Postgres, Row Level Security, Auth, Realtime, Storage), Node.js server endpoints for AI proxying.
- **Testing**: Node test runner, TypeScript strict checking, and ESLint.

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

---

## 🔐 Environment Variables

| Variable | Description |
| :--- | :--- |
| `EXPO_PUBLIC_SAKHI_API_URL` | Public API URL for Sakhi backend / AI proxy endpoint |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable anonymous key |
| `VITE_DATA_MODE` | Web data adapter (`local` by default; `supabase` is not implemented yet) |
| `VITE_SUPABASE_URL` | Public Supabase project URL for the future web adapter |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anonymous key for the future web adapter |
| `AI_PROVIDER` | AI service provider (e.g. Gemini, OpenAI) |
| `AI_API_KEY` | Server-side private API key for AI provider |

---

## 🛡️ Security & Role Model

- **Database RLS**: Production migration file available at [`server/supabase/schema.sql`](file:///C:/cherry/MIRA_AI-Assistance/Mira/server/supabase/schema.sql).
- **Strict Privacy**: Private wellness entries, memories, and 1-to-1 conversations are strictly isolated to the resource owner. Admin roles do NOT have access to private user data.
- **Content Verification**: Badges (`OFFICIAL`, `VERIFIED`, `COMMUNITY`, `AI-ASSISTED`) guarantee source authenticity.

---

## 📁 Repository Structure

```
C:\cherry\MIRA_AI-Assistance\Mira
├── src/
│   ├── web/                # Vite web app shell, routes, theme, and shared UI
│   ├── data/               # Web domain contracts and local/Supabase adapters
│   ├── app/                # Expo Router pages (index, campus, circle, wellness, chat, etc.)
│   ├── components/         # UI components & SakhiGirl companion animations
│   ├── hooks/              # Reactive hooks (useWellness, useCampus, useSakhiChat)
│   ├── services/           # Data services (AI, storage, activity engine, notifications)
│   ├── constants/          # Theme tokens (SakhiColors, spacing, fonts)
│   ├── data/               # Seed & catalog data
│   ├── types/              # TypeScript definitions
│   └── utils/              # Date formatting & helper functions
├── server/
│   ├── ai/                 # Sakhi system prompt & response parsers
│   ├── routes/             # API route handlers
│   └── supabase/           # SQL schema & RLS migration rules
└── tests/                  # Unit tests (node --test)
```
