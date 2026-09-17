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
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</div>

---

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#database-schema">Database Schema</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#folder-structure">Folder Structure</a></li>
    <li><a href="#architecture--security">Architecture & Security</a></li>
  </ol>
</details>

## 🏋️ About The Project

**AI Coach Assistant** is a modern fitness application that bridges the gap between interactive client-side user experiences and highly secure server-side data processing. 

Instead of just tracking workouts, this app integrates **Google's Gemini AI** (`gemini-2.5-flash-lite`) to act as a personal coach. It analyzes your current workout, experience level, and feedback to generate contextual, real-time advice without ever compromising performance or security.

### 📱 Mobile-First Design
The UI is strictly engineered using a **Mobile-First** approach. By utilizing Tailwind CSS's `min-width` media queries (e.g., `md:`, `lg:`), the application guarantees an extremely lightweight footprint on mobile devices while scaling beautifully to desktop screens.

---

## ✨ Key Features

* **🔐 Secure Authentication:** Seamless Google OAuth 2.0 integration via Supabase SSR.
* **🤖 Intelligent Coaching:** Dynamic prompt engineering feeding workout context to Gemini AI for personalized feedback.
* **⚡ Optimistic UI:** Instant visual feedback for CRUD operations utilizing Next.js `revalidatePath` and parallel data fetching.
* **📊 Relational Tracking:** Comprehensive logging of routines, active sessions, and individual sets.
* **🛡️ Graceful Degradation:** Built-in AI fallback mechanisms to prevent app crashes during API rate limits (HTTP 429) or server overloads (HTTP 503).

---

## 🗄️ Database Schema

The PostgreSQL database is hosted on Supabase and protected by **Row Level Security (RLS)**. It consists of four main relational tables:

1. `routines` - Stores user-created workout programs.
2. `routine_exercises` - Links specific exercises and default sets/reps to a routine.
3. `workout_sessions` - Tracks active workouts, start/end times, and total volume.
4. `set_logs` - Real-time logging of individual sets (weight & reps) tied to a session.

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v18 or higher)
* A [Supabase](https://supabase.com/) account and project
* A [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. Clone the repo:
   ```sh
   git clone [https://github.com/easafb/ai-coach-assistant.git](https://github.com/easasfb/ai-coach-assistant.git)
   cd ai-coach-assistant
