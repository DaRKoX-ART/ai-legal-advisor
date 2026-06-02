# יועץ משפטי AI — AI Legal Advisor

A premium Hebrew RTL mobile app prototype built with **Expo / React Native**, designed to simulate an AI-powered legal advisory system. Built as a university project demonstrating multi-agent AI architecture, modern mobile UI/UX, and Hebrew-first design.

> ⚠️ **Prototype Notice:** This app uses simulated AI responses. No real AI backend or legal database is connected. All legal information shown is fictional and for demonstration purposes only.

---

## Screenshots

| Login | Home | Ask | History | About |
|-------|------|-----|---------|-------|
| Premium login with animated card | Category selection | Question input + AI result | Past queries | App info & agents |

---

## Features

- 🔐 **Fake authentication** — username/password stored in `AsyncStorage` (no real backend)
- 🏠 **Home screen** — 5 legal category cards with icon badges
- 🤖 **Ask screen** — type a question, choose a category, get a simulated AI answer
- 📜 **History screen** — all past questions stored locally with date and category badge
- ℹ️ **About screen** — explains the multi-agent AI architecture and the 5 specialist bots
- 🌙 **Premium black & white theme** — fintech/legal-tech aesthetic with deep shadows, glass-effect card, and animated transitions
- 🔤 **Hebrew RTL throughout** — all text, layout, and navigation is right-to-left

---

## Screens

| Screen | Path | Description |
|--------|------|-------------|
| **Login** | `/login` | Animated login card with segmented tab (login / register), focus-aware inputs, shake-on-error, spring button animation |
| **Home** | `/(tabs)/home` | Greeting header with user avatar, 5 legal category cards, "How it works" section |
| **Ask** | `/(tabs)/ask` | 2×2 category grid, free-text question input, simulated 2s AI processing, multi-section result (explanation + next steps + disclaimer) |
| **History** | `/(tabs)/history` | FlatList of past questions with date, category badge, and answer preview — with clear-all action |
| **About** | `/(tabs)/about` | App identity card, 2×2 "how it works" grid, specialist bots list, legal disclaimer, logout |

---

## Simulated AI Architecture

The app simulates a **multi-agent AI system** where each legal domain has a specialist bot:

| Bot | Domain |
|-----|--------|
| בוט פלילי | Criminal law — charges, rights, defense |
| בוט משפחה | Family law — divorce, custody, relations |
| בוט חוזים | Contract law — agreements, disputes |
| בוט עבודה | Labor law — employee rights, termination |
| בוט כללי | General legal questions |

A central AI model aggregates their outputs into a structured response (simulated with hardcoded responses per category).

---

## Tech Stack

| Technology | Role |
|-----------|------|
| [Expo SDK 54](https://expo.dev) | App framework |
| [Expo Router v6](https://expo.github.io/router) | File-based navigation |
| [React Native](https://reactnative.dev) | UI rendering |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Local data persistence |
| [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) | Gradient backgrounds and buttons |
| [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | Tactile feedback on mobile |
| [@expo/vector-icons (Feather)](https://icons.expo.fyi) | Icon set |
| [Google Fonts — Heebo / Assistant](https://fonts.google.com) | Hebrew-optimized typography |
| TypeScript | Type safety throughout |

---

## Project Structure

```
artifacts/ai-legal-advisor/
├── app/
│   ├── +html.tsx           # Web HTML template (RTL, Google Fonts)
│   ├── _layout.tsx         # Root layout with safe area + auth guard
│   ├── index.tsx           # Entry redirect (checks AsyncStorage auth)
│   ├── login.tsx           # Login / Register screen
│   └── (tabs)/
│       ├── _layout.tsx     # Bottom tab bar configuration
│       ├── home.tsx        # Home — category cards
│       ├── ask.tsx         # Ask — question input + AI result
│       ├── history.tsx     # History — past questions
│       └── about.tsx       # About — app info & logout
├── context/
│   └── AppContext.tsx      # Auth, history, categories, AI responses
├── hooks/
│   └── useColors.ts        # Theme color hook
├── assets/
│   └── images/             # App icons and splash
├── app.json                # Expo configuration
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Expo CLI (`pnpm install -g expo-cli`)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-legal-advisor.git
cd ai-legal-advisor/artifacts/ai-legal-advisor

# Install dependencies
pnpm install

# Start the development server
pnpm run dev
```

Then open in:
- **Web:** `http://localhost:PORT` in your browser
- **iOS/Android:** Scan the QR code with the Expo Go app

### Login (Demo)
Enter **any username** and a **password of 4+ characters** — no real credentials needed.

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `#020202` | Near-black | App background |
| `#111111` | Dark surface | Header, card backs |
| `#1C1C1C` | Mid surface | Chips, secondary elements |
| `#FFFFFF` | White | Cards, buttons text |
| `#F7F7F7` | Off-white | Input backgrounds |
| `#AAAAAA` | Muted gray | Secondary text |

Typography uses **Heebo** and **Assistant** — both optimized for Hebrew and loaded via Google Fonts on web.

---

## Notes

- All AI responses are **hardcoded in `context/AppContext.tsx`** under `AI_RESPONSES`
- Real AI can be enabled through `POST /api/chat` in `server/serve.js`. Put `OPENROUTER_API_KEY` or `GEMINI_API_KEY` in `.env` on the server, never inside the mobile app.
- The Expo app reads `EXPO_PUBLIC_AI_API_URL`. For Expo Go on a physical phone, use your computer LAN IP, for example `http://192.168.1.20:3000/api/chat`.
- History is stored in `AsyncStorage` under the key `@legal_advisor_history`
- Auth state is stored under `@legal_advisor_user`
- The app is **portrait-only** (configured in `app.json`)
- Web build uses `dir="rtl"` on the HTML element for correct RTL layout

---

## License

This project was created for academic/university purposes. Not intended for production use or real legal advice.

---

*Built with ❤️ using Expo + React Native*
