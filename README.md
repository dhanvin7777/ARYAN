# HackFlow — AI Hackathon Discovery, Team Matchmaker & Autonomous Registration

A next-generation full-stack platform for hackers, developers, and students to **discover hackathons**, **autonomously register via TinyFish AI web agents**, **match with ideal teammates based on skills**, **showcase public hacker portfolios**, and **track round deadlines on a live interactive calendar**.

---

## 🏛️ System Architecture

```
 ┌────────────────────────────────────────────────────────┐
 │                    Vercel Frontend                     │
 │          (React + Vite Modern Glassmorphic UI)         │
 │          https://aryan-frontend.vercel.app             │
 └───────────────────────────┬────────────────────────────┘
                             │
                             │ HTTPS API Requests (with CORS)
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                    Render Backend                      │
 │          (Node.js Express REST API & Workers)          │
 │          https://aryan-backend.onrender.com            │
 └──────────────┬──────────────────────────┬──────────────┘
                │                          │
   PostgreSQL   │                          │ TinyFish Agent API
  (Supavisor)   ▼                          ▼
 ┌──────────────────────┐       ┌──────────────────────┐
 │  Supabase Database   │       │     TinyFish AI      │
 │ (PostgreSQL + RLS)   │       │  (Web Agent Engine)  │
 └──────────────────────┘       └──────────────────────┘
```

---

## 🚀 Key Features

### 1. 🚀 Hackathon Discovery & Search
- Discover top hackathons across **Unstop**, **Devpost**, and **Devfolio**.
- Filter by portal, mode (**Online**, **Hybrid**, **In-Person**), and tech stack tags.
- Detailed round breakdown modals with eligibility, rules, and jury criteria.

### 2. 🤖 TinyFish Autonomous Registration & Form Filling
- Users provide their participant info (Full Name, Email, Phone, College/Org, Team Name, Role, GitHub).
- The **TinyFish Cloud Browser Agent** navigates to the target hackathon portal (e.g. Unstop), finds the registration button, automatically fills all required input fields, proceeds to review/confirmation, and returns a verified run ID.
- Includes a live step-by-step terminal log streaming agent execution.

### 3. ⚡ Team & Teammate Matchmaking Engine
- **For Team Leads**: Post what roles you need (e.g. Frontend Dev, ML Engineer) and desired skills.
- **For Hackers**: Enter your technical skills and desired role.
- **Smart Matchmaker**: Computes real-time percentage compatibility based on skill overlap ($Match \% = \frac{|User \cap Needed|}{|Needed|} \times 100$).
- One-click join requests sent directly to the team leader.

### 4. 👤 Public Hacker Profiles & Track Record
- Dedicated public profiles showing technical bio, role title, and contact links.
- **Trophy Case**: Past hackathon achievements (🏆 Winners, 🥈 Runners Up, 🏅 Finalists).
- **Active Competitions**: Current hackathons in progress with team name and next deliverable.
- Hacker directory to discover potential collaborators.

### 5. 📅 Hackathon Rounds Calendar & Deadlines Tracker
- Chronological timeline tracking every round milestone (Round 1: Online Quiz, Round 2: Prototype Video, Round 3: Grand Finale Pitch).
- Urgency countdown timers (flags deadlines occurring within 72 hours).

---

## 📁 Repository Structure

```
ARYAN/
├── backend/                       # Node.js Express REST API (Deployed to Render)
│   ├── src/
│   │   └── server.js              # Server, Hackathons, TinyFish Agent, Teams, Profiles & Calendar routes
│   ├── .env                       # Local environment variables (git-ignored)
│   ├── .env.example               # Backend environment variables template
│   ├── package.json               # Backend dependencies (@tiny-fish/sdk, @supabase/supabase-js, express)
│   ├── render.yaml                # Render Blueprint Infrastructure-as-Code
│   └── supabase_schema.sql        # Database tables (hackathons, user_profiles, teams, match_requests, registrations)
│
├── frontend/                      # React + Vite Application (Deployed to Vercel)
│   ├── src/
│   │   ├── App.jsx                # HackFlow main multi-tab interface
│   │   ├── api.js                 # Centralized API client
│   │   ├── index.css              # Custom design system with glassmorphism
│   │   └── main.jsx               # Application entrypoint
│   ├── .env.example               # Frontend environment variables template
│   ├── package.json               # Frontend dependencies
│   ├── vercel.json                # Single Page App rewrite rules for Vercel
│   └── vite.config.js             # Vite configuration
│
└── README.md
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. Database (Supabase)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** → click **New Query**.
3. Copy the full contents of [`backend/supabase_schema.sql`](./backend/supabase_schema.sql), paste into the editor, and click **Run**.
4. Retrieve your `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and PostgreSQL connection string.

### 2. TinyFish AI Web Agent
1. Create an account at [agent.tinyfish.ai](https://agent.tinyfish.ai).
2. Go to [agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys) and copy your secret key (`sk-tinyfish-...`).
3. Set `TINYFISH_API_KEY` in `backend/.env`.

### 3. Local Development
```powershell
# In terminal 1: Start Backend (Port 5000)
cd backend
npm run dev

# In terminal 2: Start Frontend (Port 5173)
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Production Deployment

### Render (Backend API)
Add the following in your **Render Web Service Environment Variables**:
- `PORT`: `10000`
- `NODE_ENV`: `production`
- `FRONTEND_URL`: `https://your-app.vercel.app`
- `SUPABASE_URL`: `https://your-project.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: `your-supabase-service-role-key`
- `DATABASE_URL`: `postgresql://postgres...supabase.com:6543/postgres`
- `TINYFISH_API_KEY`: `sk-tinyfish-...`

### Vercel (Frontend Client)
Add the following in your **Vercel Project Environment Variables**:
- `VITE_API_URL`: `https://your-render-backend.onrender.com/api`
