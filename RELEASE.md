# FOLIO — Google Play Release Runbook (v1.0)

> Goal of this document: produce a reproducible Google Play release of FOLIO
> without surprises. Every command below has been validated against the
> current `app.json`, `eas.json`, and `package.json`. Follow the sections
> top-to-bottom for a first release; for subsequent releases jump to
> "Version bump procedure" and "EAS build & submit".

---

## 0 · Identity

| Field | Value |
|------|------|
| App name (store) | **FOLIO — עוזר משפטי** |
| Display name | `FOLIO` |
| Android package | `com.folio.legaladvisor` |
| Initial release | `versionName 1.0.0`, `versionCode 1` |
| `runtimeVersion` policy | `appVersion` (each `versionName` is its own OTA channel) |
| `userInterfaceStyle` | `dark` (NOCTURNE) |
| Build engine | EAS Build (managed workflow — no `android/` directory committed) |

The `android/` and `ios/` directories are intentionally not in git. EAS
runs `expo prebuild` for every build, so the source of truth is `app.json`.

---

## 1 · Environment variables checklist

Two `.env` files exist. They are **not** interchangeable.

### `.env` — client (bundled into the app)
Only values prefixed `EXPO_PUBLIC_*` are ever read by the Expo bundler.

| Key | Required | Notes |
|-----|----------|------|
| `EXPO_PUBLIC_AI_API_URL` | ✅ | Public HTTPS URL of the FOLIO proxy (e.g. `https://api.folio.example.com/api/chat`). Localhost values must not ship in a production build. |
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Public Supabase project URL. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase **anon/publishable** key. Never the service-role key. |
| `EXPO_PUBLIC_AI_PROXY_TOKEN` | optional | Shared secret with the server. When set, the client sends `X-FOLIO-Token` on every `/api/chat` call. Must match `AI_PROXY_TOKEN` on the server. |
| `EXPO_PUBLIC_ALLOW_DEMO` | optional | `true` to expose the demo-answer button in builds. Leave unset for store builds. |

### `.env.server` — server (`server/serve.js`)
Loaded only by the Node proxy. **Gitignored.** Never reaches the client bundle.

| Key | Required | Notes |
|-----|----------|------|
| `AI_PROVIDER` | ✅ | `openrouter` or `gemini`. |
| `OPENROUTER_API_KEY` | ✅ (if `AI_PROVIDER=openrouter`) | Live OpenRouter key. |
| `OPENROUTER_MODEL` | optional | Defaults to `openai/gpt-oss-20b:free`. |
| `GEMINI_API_KEY` | ✅ (if `AI_PROVIDER=gemini`) | Google AI Studio key. |
| `GEMINI_MODEL` | optional | Defaults to `gemini-2.5-flash-lite`. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side analytics insert. **Never** put this in `.env`. |
| `AI_PROXY_TOKEN` | optional | Must match `EXPO_PUBLIC_AI_PROXY_TOKEN` when used. |
| `AI_RATE_WINDOW_MS` | optional | Default `60000`. |
| `AI_RATE_MAX_PER_WINDOW` | optional | Default `30`. |
| `AI_MAX_BODY_BYTES` | optional | Default `65536`. |
| `PORT` | optional | Default `3000`. |

Pre-flight: before any production build, confirm that the file `.env`
contains **no** `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, or
`SUPABASE_SERVICE_ROLE_KEY`. These belong only in `.env.server`.

```powershell
# Quick local sanity check (Windows PowerShell)
Select-String -Path .env -Pattern "OPENROUTER_API_KEY|GEMINI_API_KEY|SERVICE_ROLE"
# Expected output: nothing.
```

---

## 2 · Key rotation reminders

Treat these credentials as compromised the moment any of them ends up in
git, a log, a screenshot, or a third-party chat:

1. **OpenRouter key** — rotate in the OpenRouter dashboard, paste new value
   into `.env.server`, restart `server/serve.js`. Old key stops working
   instantly; no client change required.
2. **Gemini key** — rotate at <https://aistudio.google.com/>, then same as above.
3. **Supabase service-role key** — rotate in Supabase → Project Settings →
   API. Update `.env.server`. The anon key in `.env` is **public by design**
   and does not need rotation here.
4. **`AI_PROXY_TOKEN`** — change in both `.env.server` and the client `.env`
   together, then rebuild + redeploy the client; otherwise client traffic
   will start hitting `401`.
5. **Google Play upload key / service account** — see Google Play Console
   → Setup → API access. Rotate annually or sooner if compromise suspected.
   Update the JSON path referenced by `submit:android`.

Recommended cadence: rotate AI provider keys every 90 days, Supabase
service-role key every 180 days, and immediately on personnel changes.

---

## 3 · Privacy policy URL checklist

Before submitting:

- [ ] Host `legal/PRIVACY_POLICY_HE.md` and `legal/PRIVACY_POLICY_EN.md`
      as public HTTPS URLs. Any static host (GitHub Pages, Vercel, the
      `server/serve.js` instance) is fine.
- [ ] Open both URLs in a private browser window and confirm they render
      without auth and without 404 dependencies.
- [ ] Update the URL in Google Play Console → App content → **Privacy policy**.
- [ ] Update the in-app "About → מדיניות פרטיות" link (currently linked
      via `Linking.openURL` in `app/(tabs)/about.tsx`) to the same HTTPS
      URL if it isn't already.
- [ ] Re-fill **Data safety** in Play Console using the exact disclosures
      from the Hebrew policy: account email + question text, stored locally
      and on Supabase; analytics events; no advertising IDs; no third-party
      trackers.

If you change the policy text materially, also bump `DISCLAIMER_VERSION`
in `constants/legal.ts`. The app will re-prompt onboarding consent.

---

## 4 · EAS build commands

All commands assume `npx eas-cli` is available (no global install required).

### One-time setup

```bash
# Authenticate (opens browser)
npx eas-cli login

# Link this project to an EAS project. Only needed once.
npx eas-cli init
```

### Local sanity build (no upload)

Useful for catching native-config errors before burning EAS credits.

```bash
npx expo prebuild --platform android --clean
```

A successful prebuild proves `app.json` is valid and all native plugins
resolve. No artifact ships from this step — wipe the generated `android/`
directory afterwards (it's gitignored).

### Internal QA build (APK)

```bash
pnpm build:android:preview
# equivalent to:
# npx eas-cli build --profile preview --platform android
```

Produces a signed APK that installs over USB / Internal App Sharing.
Use this for last-mile manual QA before promoting to production.

### Production build (AAB for Play Store)

```bash
pnpm build:android
# equivalent to:
# npx eas-cli build --profile production --platform android
```

Produces a signed `.aab`. With `appVersionSource: "remote"` and
`autoIncrement: true` (already configured in `eas.json`), EAS handles
the `versionCode` bump automatically. You only need to bump
`expo.version` in `app.json` for the user-visible `versionName`.

---

## 5 · Google Play upload steps

### First-time setup

1. Create the app entry in **Google Play Console** with package name
   `com.folio.legaladvisor`. Choose "App" (not "Game").
2. **App access** → confirm there are no login walls (FOLIO supports guest
   mode, so this is "All functionality is available without restrictions").
3. **Content rating** → fill the questionnaire. FOLIO is informational and
   contains no user-generated public content, no ads, no in-app purchases.
4. **Target audience** → 18+ (legal information context).
5. **Data safety** → fill from `legal/PRIVACY_POLICY_HE.md`.
6. **App content** → declare ads = no, in-app purchases = no, financial
   features = no, government app = no.
7. **Store listing** → app name, short description, full description,
   feature graphic, phone screenshots (≥ 4). Use Hebrew as primary locale.

### Per-release upload (recommended path: EAS submit)

```bash
# Build first, then submit the latest build to internal track.
pnpm build:android
pnpm submit:android
# equivalent to:
# npx eas-cli submit --platform android --latest
```

`eas.json` is configured with `track: "internal"` and
`releaseStatus: "draft"` — the AAB lands in **Internal testing → drafts**
without being released. You promote to Closed / Open / Production from
inside Play Console once smoke-tested.

### Per-release upload (manual path)

If you prefer not to use `eas submit`:

1. Download the `.aab` artifact from the EAS build page.
2. Play Console → **Internal testing** → **Create new release** → upload
   the AAB.
3. Add release notes (`Hebrew` locale required, `English` recommended).
4. Save as draft → roll out to Internal testing → smoke-test on at least
   two real devices via the opt-in link.
5. Promote the same release to **Production** once accepted.

---

## 6 · Version bump procedure

Run this every release. There are two numbers and they are not the same.

| Number | Where | What it does | Who bumps it |
|-------|------|------|------|
| `expo.version` (a.k.a. `versionName`) | `app.json` | User-visible string ("1.0.0") | **You — manually.** |
| `expo.android.versionCode` | `app.json` (and overridden by EAS in production) | Integer Play Store uses to identify build | **EAS — automatic** because `eas.json` production has `autoIncrement: true`. |

For a normal release:

1. Decide the new `versionName` (semver: patch / minor / major).
2. Edit `app.json` → `expo.version` to the new value.
3. **Do not** touch `expo.android.versionCode` for production builds —
   EAS bumps it on the remote. For preview/development builds that go
   outside EAS, increment it manually.
4. Optionally update `CHANGELOG.md` / release notes locally.
5. Commit, tag (`git tag v1.0.1`), then run `pnpm build:android` and
   `pnpm submit:android`.

Because `runtimeVersion.policy = "appVersion"`, each `versionName`
defines its own OTA channel. Native changes therefore always require a
fresh store upload — there is no risk of pushing JS that targets a
different native runtime.

---

## 7 · Manual QA checklist

Run this against the **preview APK** on a real Android device (not just
the simulator) before promoting to production.

### Cold-start & onboarding
- [ ] Fresh install boots within ~3 s on a mid-range device.
- [ ] Dark splash (`assets/images/splash-icon.png` on `#0A0908`) appears,
      no flash of white.
- [ ] Onboarding modal shows the four disclaimer points in Hebrew, RTL.
- [ ] "המשך כאורח" (continue as guest) lands on the home tab.
- [ ] Account sign-in / sign-up flow works for at least one new email.

### Ask flow
- [ ] Composer accepts Hebrew text, cursor sits on the right.
- [ ] Submitting a 7-character question is blocked (min length).
- [ ] Submitting > 2000 characters is blocked.
- [ ] Submitting a question containing an Israeli ID / phone / email /
      credit-card triggers the PII confirmation alert.
- [ ] After PII confirmation, the answer screen loads with the Hebrew
      "FOLIO · ניתוח" status strip and live region.
- [ ] Answer renders sections (תקציר / זכויות / צעדים) right-to-left,
      with the urgency badge and category chip.
- [ ] Disclaimer card appears at the bottom of every AI answer.

### Save & history flow
- [ ] Tapping "שמור" persists the answer; "ההיסטוריה" tab now shows it.
- [ ] Tapping a saved row opens the detail screen with full answer.
- [ ] Detail screen menu offers "שתף את התיק" and "מחק" with proper
      screen-reader labels (TalkBack).
- [ ] Deleting a saved item updates the list immediately.
- [ ] "מחק את הכל" with confirmation clears the entire history.

### Settings flow
- [ ] About tab shows correct app name, version, Hebrew "FOLIO · חשבון" eyebrow.
- [ ] Toggle "שיפור האפליקציה" (analytics) flips state and persists across restarts.
- [ ] Toggle "מצב הדגמה" works when `EXPO_PUBLIC_ALLOW_DEMO=true`.
- [ ] "מדיניות פרטיות" opens the hosted privacy policy URL externally.
- [ ] "יציאה מהחשבון" signs out an authenticated user cleanly.

### Failure modes
- [ ] Airplane-mode + ask → app shows `NETWORK_OFFLINE` error card in
      Hebrew, no crash, "נסה שוב" button visible.
- [ ] Server returning 5xx → `AI_UNAVAILABLE` error card.
- [ ] Server enforcing rate limit → `RATE_LIMITED` Hebrew error card.
- [ ] Killing the server mid-request → request aborts cleanly after
      timeout, error card visible, no orphaned spinner.

### Performance & polish
- [ ] Switching tabs feels < 100 ms.
- [ ] Aurora background animation pauses when the screen is not focused
      (verify via Android Studio CPU profiler or by eye).
- [ ] Reduce-motion accessibility setting kills the Aurora breath loop.
- [ ] TalkBack reads buttons / Switch / links in Hebrew with meaningful
      labels and hints.
- [ ] Tapping outside a modal dismisses it; back button works on every
      screen, never closes the app from a non-root tab.

### Security spot-checks
- [ ] APK does **not** contain `OPENROUTER_API_KEY`, `GEMINI_API_KEY`,
      or `SUPABASE_SERVICE_ROLE_KEY`. Confirm with:
      `apkanalyzer files cat app-release.apk assets/index.android.bundle | findstr "OPENROUTER GEMINI SERVICE_ROLE"`
      → no matches.
- [ ] App requests no runtime permissions on launch (only `INTERNET`
      and `ACCESS_NETWORK_STATE`, both normal-level).
- [ ] HTTPS scheme on every outbound URL when inspected through a proxy.

---

## 8 · Post-release sanity

Within 24 h of pushing to Production:

- [ ] Play Console → **Statistics** shows installs trickling in (Internal
      tester at minimum).
- [ ] Play Console → **Android vitals** shows zero ANRs, zero crashes.
- [ ] Supabase `request_events` table receives expected event volume.
      A large drop suggests the `EXPO_PUBLIC_AI_API_URL` is wrong.
- [ ] Spot-check that opt-out users do **not** appear in analytics.

---

## 9 · Rollback

If a release misbehaves:

1. **Play Console** → the production track → halt the active rollout.
2. Re-promote the previous AAB (still in the build history) to 100 %.
3. Hotfix the issue on a branch, bump `versionName`, rebuild, resubmit.

OTA via Expo Updates is **not configured** in v1.0. JS-only hotfixes
therefore require a fresh store upload. This is intentional: it keeps
the runtime / JS contract simple for the first release. Adding OTA is a
candidate for v1.1.
