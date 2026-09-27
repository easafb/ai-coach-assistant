<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/dumbbell.svg" alt="Logo" width="80" height="80">

  <h3 align="center">AI Coach Assistant</h3>

  <p align="center">
    A mobile-first, AI-powered full-stack fitness tracker built with Next.js & Supabase.
    <br />
    <a href="https://ai-coach-assistant-pi.vercel.app"><strong>View Live Demo »</strong></a>
    <br />
    <br />
  </p>
</div>

<!-- BADGES -->
<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini" />
</div>

---

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#-about-the-project">About The Project</a></li>
    <li><a href="#-key-features">Key Features</a></li>
    <li><a href="#-database-schema">Database Schema</a></li>
    <li><a href="#-getting-started">Getting Started</a></li>
    <li><a href="#-folder-structure">Folder Structure</a></li>
    <li><a href="#-architecture--security">Architecture & Security</a></li>
    <li><a href="#-privacy--kvkk">Privacy & KVKK</a></li>
  </ol>
</details>

## 🏋️ About The Project

**AI Coach Assistant** (Coach.ai) is a Turkish-language, mobile-first gym tracker that bridges the gap between interactive client-side user experiences and highly secure server-side data processing.

At its core is a **pure double-progression engine** (`src/lib/progression.ts`): targets are rep *ranges*, reps are added first, and weight only goes up once every set hits the top of the range. The engine has no database, network or framework dependencies, so every decision is testable and auditable.

On top of that, **Google's Gemini AI** (`gemini-2.5-flash-lite`) acts as a personal coach. It answers questions about your training from a pre-computed summary and reacts to how you feel (pain, fatigue, poor sleep) by adjusting your program. By design, **the AI picks an action, the code computes the number**: the model can say "lighten this", but it can never say "make it 80 kg". Weight decisions are never left to the LLM.

### 📱 Mobile-First Design
The UI is strictly engineered using a **Mobile-First** approach with Tailwind CSS 4. It installs as a PWA (web manifest + icons), keeps the screen awake during a workout (Wake Lock API), and scales cleanly from phones to desktop screens.

---

## ✨ Key Features

* **🔐 Secure Authentication:** Google OAuth 2.0 (and optional Sign in with Apple) via Supabase SSR.
* **📈 Double-Progression Engine:** Per-exercise prescriptions from your own history, with rep ranges, decimal weights, bodyweight and time-based (isometric) exercises. Every set records what the engine prescribed, so adherence can be measured.
* **🤖 Intelligent Coaching:** Gemini reads a training summary and returns structured adjustments (`reduce_load`, `swap`, `skip`). Each suggestion is validated against your real exercises and the exercise catalog; swaps must stay in the same muscle group.
* **🛡️ Graceful Degradation & Rate Limits:** Built-in AI fallbacks for API rate limits (HTTP 429) or overloads (HTTP 503), plus a per-user daily quota and a global daily circuit breaker on AI requests.
* **📶 Offline Set Logging:** Sets go to a local "outbox" (`localStorage`) first, the UI updates instantly, and the queue is retried in the background when the connection returns. Built for gym basements with no signal.
* **🗂️ Ready-Made Templates:** New users can copy a ready-to-run program into their account instead of starting from an empty dashboard, or build their own routines with a searchable exercise picker and custom exercises.
* **⏱️ Workout Flow:** Rest timer, resume an unfinished workout, and a post-workout summary with duration, set count and comparison with last time.
* **📝 Post-Workout Survey:** After the first workout (not at signup), users are asked their goal, experience level and how they heard about the app. It is asked once; answering or dismissing it both count.
* **📊 Funnel Analytics:** A single `events` table records key steps (signup, routine created, workout started/completed/abandoned, coach usage, survey answered). Tracking never throws and never blocks the user's flow. Page views come from Vercel Web Analytics.
* **💬 In-App Feedback:** A feedback button and client error reporting.
* **⚖️ KVKK Consent, Data Export & Account Deletion:** Versioned explicit consent, a readable JSON export of all your data, and full account deletion (see [Privacy & KVKK](#-privacy--kvkk)).

---

## 🗄️ Database Schema

The PostgreSQL database is hosted on Supabase and protected by **Row Level Security (RLS)** on every table.

1. `routines` - Stores user-created workout programs.
2. `routine_exercises` - Links exercises, set counts and rep ranges to a routine.
3. `workout_sessions` - Tracks active workouts, start/end times, and total volume.
4. `set_logs` - Individual sets (weight & reps) tied to a session, with a client ID for offline dedupe and the engine's prescription.
5. `exercise_adjustments` - Program changes suggested by the coach (reduce load, swap, skip).
6. `custom_exercises` - Exercises users add beyond the built-in catalog.
7. `feedback` - In-app feedback and client error reports.
8. `ai_requests` - AI usage log backing the daily rate limits.
9. `user_consents` - Versioned KVKK consent records.
10. `events` - Funnel analytics events.
11. `user_profiles` - Post-workout survey answers.

Schema changes live in `supabase/` as numbered migrations (`002_...` to `017_...`) alongside `policies.sql`. `supabase/BETA_METRICS.sql` holds aggregate beta queries (funnel, engine behavior) so nobody has to browse individual users' rows.

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v20.9 or higher, required by Next.js 16)
* A [Supabase](https://supabase.com/) account and project
* A [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. Clone the repo:
   ```sh
   git clone https://github.com/easafb/ai-coach-assistant.git
   cd ai-coach-assistant
   ```

2. Install NPM packages:
   ```sh
   npm install
   ```

3. Configure your Environment Variables:
   Create a `.env.local` file in the root directory. Never commit this file.
   ```sh
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   # Optional: show the "Sign in with Apple" button
   NEXT_PUBLIC_APPLE_AUTH_ENABLED=true
   ```

4. Set up the database:
   In the Supabase SQL Editor, run `supabase/policies.sql`, then the numbered migrations in `supabase/` in order.

5. Run the development server:
   ```sh
   npm run dev
   ```

6. Run the tests (Node's built-in test runner, covering the pure modules):
   ```sh
   npm test
   ```

---

## 📂 Folder Structure
```
📦 src
 ┣ 📂 app              # Next.js App Router (Pages, Layouts, API Routes)
 ┃ ┣ 📂 actions        # Server Actions (workout, account, consent, survey, feedback)
 ┃ ┣ 📂 api            # REST Endpoints (OAuth Callback)
 ┃ ┣ 📂 dashboard      # Protected user dashboard
 ┃ ┣ 📂 coach          # AI coach chat
 ┃ ┣ 📂 history        # Past workouts
 ┃ ┣ 📂 routines       # Create/edit routines, templates
 ┃ ┣ 📂 workout        # Active session & post-workout summary
 ┃ ┣ 📂 giris          # Login
 ┃ ┣ 📂 onay           # KVKK consent
 ┃ ┣ 📂 hesap          # Account: data export & deletion
 ┃ ┗ 📂 gizlilik       # Privacy notice
 ┣ 📂 components       # Reusable UI components, grouped by feature
 ┣ 📂 hooks            # Client hooks (e.g., useWakeLock)
 ┣ 📂 lib              # Pure logic (progression, adjustments, offline queue, survey) & data access
 ┣ 📂 services         # External integrations (aiService.ts → Gemini)
 ┣ 📂 types            # Shared TypeScript types
 ┗ 📜 proxy.ts         # Session refresh & optimistic redirects (Next 16's replacement for middleware.ts)
📦 supabase            # RLS policies, numbered migrations, beta metrics queries
```

---

## 🏗️ Architecture & Security

This project avoids exposing sensitive operations to the client browser by leveraging Next.js Server Actions.

* Database connections are instantiated per request on the server. The Supabase SSR package ensures that session cookies are securely exchanged and verified on the server.
* `src/proxy.ts` refreshes the Supabase session cookie and performs optimistic redirects; the real authorization check lives in the data access layer (`src/lib/dal.ts`).
* RLS is the second line of defense: the anon key reaches the browser, so the database protects itself regardless of application code.
* Account deletion uses a `SECURITY DEFINER` function that derives the user from `auth.uid()` and takes no parameters, so a user can only ever delete their own account and the service role key never leaves the server.
* The Gemini API key is server-only, and every AI request passes consent and rate-limit checks first.

---

## ⚖️ Privacy & KVKK

Coach.ai processes health-related data (pain reports written to the coach) and uses servers located abroad (Supabase, Vercel, Google), both of which require **explicit consent** under KVKK (Articles 6 and 9).

* **Versioned consent:** Consent is recorded along with the policy version. Bumping `CURRENT_POLICY_VERSION` in `src/lib/consent.ts` automatically asks existing users to consent again.
* **Data export:** Users can download all of their data as a readable JSON file from the account page (KVKK Art. 11, GDPR Art. 15).
* **Account deletion:** Users can permanently delete their account and all related data (GDPR Art. 17).
* **Privacy notice:** The full notice (aydınlatma metni) is available at `/gizlilik`.
