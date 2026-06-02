# FOLIO — AI Legal Advisor

<p align="center">
  <b>Hebrew-first, mobile-native legal intelligence</b><br>
  <sub>Built with Expo · React Native · Supabase · OpenRouter AI</sub>
</p>

<p align="center">
  <a href="#key-features">Features</a> ·
  <a href="#tech-stack">Stack</a> ·
  <a href="#local-development-setup">Setup</a> ·
  <a href="#environment-variables">Env</a> ·
  <a href="#database-migrations">DB</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

---

## Project Overview

**FOLIO** is an AI-powered legal advisory platform designed for Hebrew-speaking users. It combines a cinematic, premium mobile experience with real-time AI legal question answering, secure cloud-backed accounts, and an admin reporting layer — all built on a modern React Native / Expo foundation.

The platform supports both **guest exploration** and **authenticated accounts** with persistent cloud history, analytics, and cross-device sync via Supabase.

> ⚠️ **FOLIO is an academic demonstration and research prototype.** It is **not** a substitute for advice from a licensed attorney. All AI-generated responses are informational only and should be verified with a qualified legal professional before any action is taken.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **AI Legal Q&A** | Natural-language questions across 5 domains — Criminal, Family, Contract, Labor, and General law. Answers are streamed from OpenRouter (GPT-OSS / Gemini) with structured explanations, next steps, and disclaimers. |
| **Guest Mode** | Users can explore the app and receive AI answers without creating an account. Local history persists on-device. |
| **Authenticated Accounts** | Full Supabase Auth (email/password) with JWT sessions, password reset, and profile management. |
| **Cloud Sync** | Authenticated users get cross-device history sync, persistent profiles, and secure data storage in Supabase PostgreSQL. |
| **Analytics Tracking** | Privacy-respecting event tracking for product insights — login flows, question categories, feature usage, and error rates. |
| **Admin Dashboard** | Protected `/admin` routes with user management and legal request reporting for operational oversight. |
| **Hebrew RTL-First UX** | 100 % right-to-left layout, Hebrew-optimized typography (Heebo / Assistant), and native RTL navigation. |
| **NOCTURNE Design System** | Premium dark-mode aesthetic — near-black surfaces, glassmorphism cards, cinematic gradients, and tactile haptic feedback. |
| **Responsive Simulations** | Graceful offline degradation with clearly labeled demo answers when AI services are unavailable. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile Framework** | Expo SDK 54 + React Native 0.81 |
| **Navigation** | Expo Router v6 (file-based) |
| **Language** | TypeScript 5.9 |
| **Backend & Auth** | Supabase (PostgreSQL + Auth + Realtime) |
| **AI Orchestration** | OpenRouter API / Google Gemini via Node server |
| **State & Sync** | TanStack Query, AsyncStorage (local), Supabase (cloud) |
| **UI & Motion** | React Native Reanimated, Expo Linear Gradient, Expo Blur, Expo Haptics |
| **Validation** | Zod |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Expo)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Auth    │  │  Ask AI  │  │  History │  │   Admin    │  │
│  │  Screens │  │  Screen  │  │  + Saved │  │  Dashboard │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │             │             │               │          │
│  ┌────▼─────────────▼─────────────▼───────────────▼──────┐  │
│  │              Context Layer (Auth / App / Intake)       │  │
│  └────┬─────────────────────────────┬────────────────────┘  │
│       │                             │                       │
│  ┌────▼──────┐               ┌──────▼──────┐               │
│  │ AsyncStorage│ (guest)     │  Supabase   │ (auth)        │
│  └───────────┘               │  Client SDK │               │
│                              └──────┬──────┘               │
└─────────────────────────────────────┼───────────────────────┘
                                      │
                        ┌─────────────▼─────────────┐
                        │      Supabase Cloud       │
                        │  (Auth · Postgres · Edge) │
                        └─────────────┬─────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│                    Node AI Server (local / cloud)           │
│              ┌─────────────────────────────────┐            │
│              │  OpenRouter  ·  Gemini  ·  Demo  │            │
│              └─────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

- **Guest users** interact entirely on-device via AsyncStorage.
- **Authenticated users** sync profiles, history, and analytics events to Supabase.
- **AI requests** are proxied through a lightweight Node server to keep API keys server-side.
- **Admin routes** are gated behind role checks and protected layouts.

---

## Authentication & Supabase

FOLIO uses **Supabase Auth** for production-grade identity management:

- **Email / password** sign-up and sign-in with secure hashing.
- **JWT session** restoration on app launch.
- **Password reset** via secure email flow.
- **Graceful degradation** — if Supabase is not configured, the app falls back to guest mode without crashing.

### Guest vs. Authenticated

| Capability | Guest | Authenticated |
|------------|-------|---------------|
| Ask AI questions | ✅ | ✅ |
| View history | ✅ (local) | ✅ (cloud + local) |
| Cross-device sync | ❌ | ✅ |
| Profile & saved items | ❌ | ✅ |
| Admin access | ❌ | ✅ (role-based) |

---

## Admin Dashboard / Reports

The `/admin` namespace provides operational visibility:

- **Users Report** — view registered users, onboarding status, and activity metrics.
- **Legal Requests Report** — audit questions asked, categories used, and AI response outcomes.
- **Protected Access** — admin routes are isolated in `app/admin/` with layout-level guards.

> Admin features are intended for platform operators and researchers evaluating usage patterns in controlled demo environments.

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Expo CLI (`pnpm install -g @expo/cli`)
- A Supabase project (free tier is sufficient)
- An OpenRouter or Google AI Studio API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-legal-advisor.git
cd ai-legal-advisor

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Supabase and AI provider credentials

# 4. Start the Expo development server
pnpm run dev
```

Then open the app:
- **Web:** visit the localhost URL printed in your terminal
- **iOS / Android:** scan the QR code with the **Expo Go** app

### Running the AI Server

```bash
# In a separate terminal
pnpm run serve
```

> **Note:** When testing on a physical phone via Expo Go, set `EXPO_PUBLIC_AI_API_URL` to your computer's LAN IP (e.g., `http://192.168.1.20:3000/api/chat`), not `localhost`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Purpose | Required |
|----------|---------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | For cloud sync |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | For cloud sync |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only) | For server admin ops |
| `AI_PROVIDER` | `openrouter` or `gemini` | For AI answers |
| `OPENROUTER_API_KEY` / `GEMINI_API_KEY` | Provider API key | For AI answers |
| `EXPO_PUBLIC_AI_API_URL` | URL to the local AI server | Yes |
| `JWT_SECRET` | JWT verification secret for Node server | Yes |
| `EXPO_PUBLIC_ALLOW_DEMO` | Enables explicit demo-answer button (`true` for dev) | Dev only |

> 🔒 **Never commit `.env` to version control.** It is already listed in `.gitignore`.
> Treat `SUPABASE_SERVICE_ROLE_KEY` and API keys as secrets — they grant elevated access.

---

## Database Migrations

All schema changes are managed through SQL migration files in `supabase/migrations/`:

| File | Description |
|------|-------------|
| `001_init_auth.sql` | Supabase Auth triggers and base setup |
| `002_profiles.sql` | Public user profiles table |
| `003_legal_requests.sql` | Legal questions, answers, and category tracking |
| `004_analytics.sql` | Event and usage analytics tables |
| `006_admin.sql` | Admin role policies and protected views |

Apply migrations via the Supabase CLI or Dashboard SQL Editor.

---

## Security Notes

- **API keys are server-side only.** The mobile app never holds OpenRouter or Gemini keys directly.
- **Row Level Security (RLS)** is enabled on all Supabase tables. Users can only read and write their own data.
- **Service Role Key** should only be used in server contexts (`server/serve.js`). Do not expose it in the client bundle.
- **JWT tokens** are validated by both Supabase Auth and the local Node AI server.
- **Portrait-only orientation** is enforced in `app.json` to maintain UI consistency.
- **Zod validation** is used on all external inputs (AI responses, form data, deep links).

---

## Roadmap

- [ ] Push notifications for legal updates
- [ ] Offline-first AI with on-device model (small LLM)
- [ ] Multi-language support (Arabic, English)
- [ ] Lawyer marketplace integration
- [ ] Document upload & contract analysis
- [ ] End-to-end encryption for sensitive legal queries

---

## Screenshots

> Screenshots will be added below to showcase the app experience.

| Welcome & Onboarding | Home | Ask AI | History | Admin Dashboard |
|----------------------|------|--------|---------|-----------------|
| *placeholder* | *placeholder* | *placeholder* | *placeholder* | *placeholder* |

---

## Academic / Demo Disclaimer

This project was developed for **academic and demonstration purposes** as part of a university program in software engineering. While it uses production-grade technologies and real AI providers, it operates in a **controlled, non-commercial capacity**.

**FOLIO does not provide legally binding advice.** All responses generated by the AI are for educational and exploratory purposes only. Always consult a qualified, licensed attorney before making legal decisions.

---

<p align="center">
  <sub>Built with precision — Expo · React Native · Supabase · OpenRouter</sub>
</p>
