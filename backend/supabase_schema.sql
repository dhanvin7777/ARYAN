-- =======================================================
-- HackFlow Database Schema for Supabase
-- Paste this script into Supabase SQL Editor and click "Run"
-- =======================================================

-- 1. Create Hackathons Table
CREATE TABLE IF NOT EXISTS public.hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    organizer TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Unstop', -- 'Unstop', 'Devpost', 'Devfolio', 'MLH', etc.
    platform_url TEXT NOT NULL,
    banner_url TEXT,
    description TEXT,
    prize_pool TEXT DEFAULT '₹5,00,000',
    mode TEXT DEFAULT 'Online', -- 'Online', 'In-Person', 'Hybrid'
    location TEXT DEFAULT 'Virtual / Pan India',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    tags JSONB DEFAULT '[]'::jsonb,
    rounds JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Open', -- 'Open', 'Ongoing', 'Closed'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    role_title TEXT DEFAULT 'Full Stack Developer',
    college_or_company TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    hackathon_history JSONB DEFAULT '[]'::jsonb,
    current_hackathons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
    hackathon_title TEXT NOT NULL,
    leader_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    leader_name TEXT NOT NULL,
    pitch TEXT NOT NULL,
    roles_needed JSONB DEFAULT '[]'::jsonb,
    skills_needed JSONB DEFAULT '[]'::jsonb,
    max_size INTEGER DEFAULT 4,
    current_members JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Recruiting', -- 'Recruiting', 'Full', 'Submitted'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Match Requests Table
CREATE TABLE IF NOT EXISTS public.match_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    skills JSONB DEFAULT '[]'::jsonb,
    type TEXT DEFAULT 'join_request', -- 'join_request', 'invite'
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Hackathon Registrations Table (TinyFish Automated Records)
CREATE TABLE IF NOT EXISTS public.hackathon_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    registration_data JSONB DEFAULT '{}'::jsonb,
    tinyfish_run_id TEXT,
    status TEXT DEFAULT 'registered', -- 'registered', 'agent_in_progress', 'failed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_registrations ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (Development friendly)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access hackathons" ON public.hackathons;
    CREATE POLICY "Public access hackathons" ON public.hackathons FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access user_profiles" ON public.user_profiles;
    CREATE POLICY "Public access user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access teams" ON public.teams;
    CREATE POLICY "Public access teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access match_requests" ON public.match_requests;
    CREATE POLICY "Public access match_requests" ON public.match_requests FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access registrations" ON public.hackathon_registrations;
    CREATE POLICY "Public access registrations" ON public.hackathon_registrations FOR ALL USING (true) WITH CHECK (true);
END $$;

-- All hackathons are dynamically fetched live from Unstop / Devfolio using TinyFish!


-- Starter User Profiles
INSERT INTO public.user_profiles (username, full_name, email, avatar_url, bio, role_title, college_or_company, skills, hackathon_history, current_hackathons)
VALUES
(
    'aryan_dev',
    'Aryan Sharma',
    'aryan@example.com',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    'Full Stack Engineer & AI Enthusiast. Love building autonomous agents, low-latency microservices, and slick React interfaces.',
    'Full Stack & AI Engineer',
    'IIT Delhi',
    '["React", "Node.js", "Python", "PyTorch", "Supabase", "PostgreSQL", "Docker"]'::jsonb,
    '[
        {"name": "Smart India Hackathon 2025", "achievement": "Winner (1st Prize) 🏆", "category": "GovTech & AI", "year": "2025"},
        {"name": "HackOverflow 2.0", "achievement": "Best UI/UX Award 🎨", "category": "FinTech", "year": "2024"}
    ]'::jsonb,
    '[
        {"hackathon_title": "Flipkart GRiD 7.0", "team_name": "Team ByteForce", "role": "Team Lead & Backend", "next_round": "Round 1: Online Quiz"}
    ]'::jsonb
),
(
    'priya_ml',
    'Priya Patel',
    'priya.ml@example.com',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    'Computer Vision & Deep Learning researcher. Experienced in fine-tuning LLMs, PyTorch, LangChain, and medical imaging systems.',
    'Machine Learning Specialist',
    'BITS Pilani',
    '["Python", "PyTorch", "TensorFlow", "OpenCV", "LangChain", "FastAPI"]'::jsonb,
    '[
        {"name": "Kaggle HealthHack 2025", "achievement": "1st Runner Up 🥈", "category": "Healthcare AI", "year": "2025"}
    ]'::jsonb,
    '[
        {"hackathon_title": "Smart India Hackathon 2026", "team_name": "Team MedAI", "role": "ML Engineer", "next_round": "Idea PPT Submission"}
    ]'::jsonb
),
(
    'rohit_web3',
    'Rohit Verma',
    'rohit.v@example.com',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    'Smart contract developer specializing in Solidity, Foundry, and DeFi primitives. 3x hackathon bounty winner.',
    'Smart Contract & Web3 Dev',
    'NIT Trichy',
    '["Solidity", "Foundry", "Ethereum", "TypeScript", "Ethers.js", "Rust"]'::jsonb,
    '[
        {"name": "ETHIndia 2024", "achievement": "Uniswap Pool Bounty Winner 🏆", "category": "DeFi", "year": "2024"}
    ]'::jsonb,
    '[
        {"hackathon_title": "ETHIndia 2026", "team_name": "ZK-Rollers", "role": "Lead Smart Contract Engineer", "next_round": "Hacker Application"}
    ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Starter Teams
INSERT INTO public.teams (name, hackathon_title, leader_name, pitch, roles_needed, skills_needed, max_size, current_members, status)
VALUES
(
    'Team ByteForce',
    'Flipkart GRiD 7.0 — Software Development Track',
    'Aryan Sharma',
    'Building a distributed event-driven flash sale inventory management engine capable of handling 500k RPS with sub-10ms consistency.',
    '["Frontend React Dev", "Distributed Systems / Java Engineer"]'::jsonb,
    '["React", "TypeScript", "Java", "Redis", "Kafka"]'::jsonb,
    4,
    '[{"name": "Aryan Sharma", "role": "Leader & Backend", "skills": ["Node.js", "Python", "Supabase"]}]'::jsonb,
    'Recruiting'
),
(
    'KisanMitra AI',
    'Smart India Hackathon (SIH) 2026 — Software Edition',
    'Priya Patel',
    'Multilingual voice-first assistant powered by local small vision-language models for Indian farmers to diagnose crop diseases offline.',
    '["Flutter Mobile Developer", "Full Stack Node.js Engineer"]'::jsonb,
    '["Flutter", "Node.js", "React", "PostgreSQL", "FastAPI"]'::jsonb,
    6,
    '[{"name": "Priya Patel", "role": "Leader & ML Specialist", "skills": ["Python", "PyTorch", "Computer Vision"]}]'::jsonb,
    'Recruiting'
),
(
    'ZeroShield ZK',
    'ETHIndia 2026 Hackathon',
    'Rohit Verma',
    'Privacy-preserving compliance protocol using recursive SNARKs allowing institutional capital to utilize DeFi pools without KYC leaks.',
    '["Zero Knowledge / Rust Engineer", "Frontend Web3 Specialist"]'::jsonb,
    '["Solidity", "Rust", "Circom", "React", "TypeScript"]'::jsonb,
    4,
    '[{"name": "Rohit Verma", "role": "Leader & Smart Contracts", "skills": ["Solidity", "Foundry", "Ethereum"]}]'::jsonb,
    'Recruiting'
)
ON CONFLICT DO NOTHING;

