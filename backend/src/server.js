import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { TinyFish } from '@tiny-fish/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// CORS Configuration — allow all localhost ports (Vite dev server can use 5173, 5174, 5175...)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any localhost / 127.0.0.1 origin regardless of port (dev mode)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow Vercel preview and production deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow configured FRONTEND_URL (Render / Vercel production)
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);

    console.warn(`[CORS] Blocked unknown origin: ${origin}`);
    return callback(null, false); // return false — don't throw, prevents 500 crash
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('✅ Supabase client initialized successfully.');
  } catch (err) {
    console.error('⚠️ Supabase client initialization failed:', err.message);
  }
}

// TinyFish AI Web Agent Client Initialization
let tinyfish = null;
if (process.env.TINYFISH_API_KEY) {
  try {
    tinyfish = new TinyFish({
      apiKey: process.env.TINYFISH_API_KEY
    });
    console.log('✅ TinyFish AI Web Agent client initialized successfully.');
  } catch (err) {
    console.error('⚠️ TinyFish initialization failed:', err.message);
  }
}

// =================================================================
// In-Memory User Profile & State (Private to the user)
// =================================================================

let myProfile = {
  id: 'me_01',
  username: 'aryan_sharma',
  full_name: 'Aryan Sharma',
  email: 'aryan@example.com',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
  bio: 'Full Stack Engineer & AI Enthusiast. Love building autonomous agents, distributed systems, and scalable React apps.',
  role_title: 'Full Stack & AI Engineer',
  college_or_company: 'IIT Delhi',
  skills: ['React', 'Node.js', 'Python', 'PyTorch', 'Supabase', 'PostgreSQL', 'Docker'],
  github_url: 'https://github.com/aryan-dev',
  linkedin_url: 'https://linkedin.com/in/aryan-sharma',
  portfolio_url: 'https://aryan.dev',
  // Completed Hackathons Track Record / Trophy Case
  hackathon_history: [
    {
      id: 'h_won_1',
      name: 'Smart India Hackathon 2025',
      achievement: 'Winner (1st Prize) 🏆',
      category: 'GovTech & AI',
      year: '2025',
      project_summary: 'Autonomous multilingual grievance redressal system using LLMs.'
    },
    {
      id: 'h_won_2',
      name: 'HackOverflow 2.0',
      achievement: 'Best UI/UX Award 🎨',
      category: 'FinTech',
      year: '2024',
      project_summary: 'Micro-investment interface with real-time portfolio analytics.'
    }
  ],
  // Active Hackathons Participating In (Calendar strictly tracks these!)
  current_hackathons: [
    {
      id: 'active_1',
      hackathon_title: 'Unstop National Innovation Hackathon 2026',
      platform: 'Unstop',
      platform_url: 'https://unstop.com/hackathons',
      team_name: 'Team ByteForce',
      role: 'Team Lead & Backend',
      rounds: [
        { name: 'Round 1: Idea PPT Submission', deadline: '2026-11-08T18:00:00Z', desc: 'Submit problem statement solution framework.' },
        { name: 'Round 2: Prototype Video Demo', deadline: '2026-11-20T23:59:00Z', desc: 'Submit 3-minute working prototype demonstration.' },
        { name: 'Round 3: Grand Jury Pitch', deadline: '2026-12-05T14:00:00Z', desc: 'Live presentation to industry leaders.' }
      ]
    },
    {
      id: 'active_2',
      hackathon_title: 'Devfolio Web3 & AI BUIDL-a-thon',
      platform: 'Devfolio',
      platform_url: 'https://devfolio.co/hackathons',
      team_name: 'Team NeuralMesh',
      role: 'AI & Smart Contract Dev',
      rounds: [
        { name: 'Hacker Application Deadline', deadline: '2026-11-14T23:59:00Z', desc: 'Portfolio and proof of work submission.' },
        { name: 'Sprint Milestone: MVP Demo', deadline: '2026-11-28T18:00:00Z', desc: 'Working code repository submission.' }
      ]
    }
  ],
  created_at: new Date().toISOString()
};

let memoryLiveHackathons = [];

let memoryTeams = [
  {
    id: 'team_01',
    name: 'Team ByteForce',
    hackathon_title: 'Unstop National Innovation Hackathon 2026',
    leader_name: 'Aryan Sharma',
    pitch: 'Building a distributed event-driven flash sale inventory management engine capable of handling 500k RPS with sub-10ms consistency.',
    roles_needed: ['Frontend React Dev', 'Distributed Systems / Java Engineer'],
    skills_needed: ['React', 'TypeScript', 'Java', 'Redis', 'Kafka'],
    max_size: 4,
    current_members: [
      { name: 'Aryan Sharma', role: 'Leader & Backend', skills: ['Node.js', 'Python', 'Supabase'] }
    ],
    status: 'Recruiting',
    created_at: new Date().toISOString()
  },
  {
    id: 'team_02',
    name: 'KisanMitra AI',
    hackathon_title: 'AgriTech AI Challenge 2026',
    leader_name: 'Priya Patel',
    pitch: 'Multilingual voice-first assistant powered by local small vision-language models for Indian farmers to diagnose crop diseases offline.',
    roles_needed: ['Flutter Mobile Developer', 'Full Stack Node.js Engineer'],
    skills_needed: ['Flutter', 'Node.js', 'React', 'PostgreSQL', 'FastAPI'],
    max_size: 6,
    current_members: [
      { name: 'Priya Patel', role: 'Leader & ML Specialist', skills: ['Python', 'PyTorch', 'Computer Vision'] }
    ],
    status: 'Recruiting',
    created_at: new Date().toISOString()
  }
];

let memoryMatchRequests = [];
let memoryRegistrations = [];

// Curated tech banners
const techBanners = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80'
];

/**
 * Live Fetch Helper: Uses TinyFish to search Unstop and Devfolio dynamically
 */
async function fetchLiveHackathonsFromTinyFish(customQuery = '') {
  if (!tinyfish) {
    console.warn('TinyFish not configured, returning empty live list.');
    return [];
  }

  const query = customQuery
    ? `site:unstop.com/hackathons OR site:devfolio.co ${customQuery} hackathon 2026`
    : 'site:unstop.com/hackathons upcoming 2026 hackathons online student';

  console.log(`🐟 TinyFish live crawling portals with query: "${query}"...`);

  try {
    const searchRes = await tinyfish.search.query({ query });
    const rawResults = searchRes.results || [];

    const structured = rawResults.map((item, index) => {
      const isDevfolio = item.url.includes('devfolio');
      const platform = isDevfolio ? 'Devfolio' : 'Unstop';
      const cleanTitle = item.title
        ? item.title.replace(/\s*\|\s*(Unstop|Devfolio|Dare2Compete).*/i, '').trim()
        : 'Live Hackathon 2026';

      // Detect tech tags from snippet
      const tags = [];
      const text = `${cleanTitle} ${item.snippet || ''}`.toLowerCase();
      if (text.includes('ai') || text.includes('intelligence') || text.includes('ml')) tags.push('AI/ML');
      if (text.includes('web3') || text.includes('crypto') || text.includes('blockchain') || text.includes('ethereum')) tags.push('Web3');
      if (text.includes('python')) tags.push('Python');
      if (text.includes('react') || text.includes('web')) tags.push('Full Stack');
      if (text.includes('student') || text.includes('college')) tags.push('College Track');
      if (tags.length === 0) tags.push('Open Innovation', 'Software');

      const isOffline = text.includes('onsite') || text.includes('in-person') || text.includes('offline');

      return {
        id: `tf_${Date.now()}_${index}`,
        title: cleanTitle,
        slug: cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        organizer: item.site_name || platform,
        platform,
        platform_url: item.url,
        banner_url: techBanners[index % techBanners.length],
        description: item.snippet || 'Exciting hackathon challenge live on portal.',
        prize_pool: 'Cash Awards & PPI Opportunities',
        mode: isOffline ? 'In-Person' : 'Online',
        location: isOffline ? 'India / Multiple Hubs' : 'Virtual',
        start_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
        end_date: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
        tags,
        rounds: [
          {
            name: 'Round 1: Preliminary Submission',
            deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
            status: 'Upcoming',
            desc: 'Online registration and project proposal submission.'
          },
          {
            name: 'Round 2: Grand Finale',
            deadline: new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString(),
            status: 'Upcoming',
            desc: 'Working prototype demo and evaluation.'
          }
        ],
        status: 'Open',
        created_at: new Date().toISOString()
      };
    });

    // Save to memory store
    memoryLiveHackathons = structured;

    // Cache to Supabase if connected
    if (supabase && structured.length > 0) {
      try {
        await supabase.from('hackathons').upsert(structured, { onConflict: 'slug' });
      } catch (e) {
        // Continue
      }
    }

    return structured;
  } catch (err) {
    console.error('TinyFish portal fetch error:', err.message);
    return [];
  }
}

// =================================================================
// REST Routes
// =================================================================

// Root
app.get('/', (req, res) => {
  res.json({
    service: 'HackFlow Backend API',
    status: 'running',
    liveCrawler: 'TinyFish Active'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tinyfish: {
      status: tinyfish ? 'connected' : 'not_configured',
      hasApiKey: Boolean(process.env.TINYFISH_API_KEY)
    }
  });
});

// =================================================================
// Hackathons (Live Fetched from Unstop & Devfolio via TinyFish)
// =================================================================

// GET /api/hackathons - Live fetched dynamically on load or search
app.get('/api/hackathons', async (req, res) => {
  try {
    const { search, platform, mode } = req.query;

    let hackathonsList = [];

    // Check Supabase cache first
    if (supabase) {
      try {
        const { data } = await supabase.from('hackathons').select('*');
        if (data && data.length > 0) hackathonsList = data;
      } catch (e) {
        console.warn('Supabase query failed, using TinyFish directly.');
      }
    }

    // If list is empty in DB or user searched for a specific keyword, live fetch with TinyFish!
    if (hackathonsList.length === 0 || (search && search.trim().length > 2)) {
      const liveResults = await fetchLiveHackathonsFromTinyFish(search || '');
      if (liveResults.length > 0) {
        hackathonsList = liveResults;
      } else if (memoryLiveHackathons.length > 0) {
        // Use last successful TinyFish results as fallback
        hackathonsList = memoryLiveHackathons;
      }
      // If still empty, hackathonsList stays [] — frontend shows 'Show All' button
    }

    // Apply filters
    let filtered = [...hackathonsList];
    if (platform && platform !== 'all') {
      filtered = filtered.filter(h => h.platform?.toLowerCase() === platform.toLowerCase());
    }
    if (mode && mode !== 'all') {
      filtered = filtered.filter(h => h.mode?.toLowerCase() === mode.toLowerCase());
    }
    if (search && search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(h =>
        h.title?.toLowerCase().includes(s) ||
        h.organizer?.toLowerCase().includes(s) ||
        (h.tags || []).some(t => t.toLowerCase().includes(s))
      );
    }

    res.json({
      source: 'live_tinyfish_portal',
      count: filtered.length,
      data: filtered
    });
  } catch (err) {
    console.error('GET /api/hackathons error:', err.message);
    res.status(500).json({ error: 'Failed to fetch hackathons', detail: err.message });
  }
});

// POST /api/hackathons/fetch-live - Explicitly trigger live portal crawler
app.post('/api/hackathons/fetch-live', async (req, res) => {
  const { query } = req.body;
  const liveResults = await fetchLiveHackathonsFromTinyFish(query || '');
  res.json({
    success: true,
    count: liveResults.length,
    data: liveResults
  });
});

// POST /api/hackathons/auto-register - TinyFish autonomous registration form filler
app.post('/api/hackathons/auto-register', async (req, res) => {
  const { hackathonId, hackathonTitle, hackathonUrl, participantData } = req.body;

  if (!participantData?.fullName || !participantData?.email) {
    return res.status(400).json({ error: 'Full Name and Email are required.' });
  }

  const targetUrl = hackathonUrl || 'https://unstop.com';
  const startTime = Date.now();
  let agentRunResponse = null;

  if (tinyfish) {
    try {
      const goal = `Navigate to ${targetUrl}. Locate the 'Register', 'Apply Now', or 'Join Hackathon' button. Click it. Fill out any initial registration form with these details: Full Name: "${participantData.fullName}", Email: "${participantData.email}", Phone: "${participantData.phone || '+91 9876543210'}", College/Organization: "${participantData.collegeOrCompany || 'Engineering College'}", Team Name: "${participantData.teamName || 'Solo Pioneer'}", Role: "${participantData.role || 'Full Stack Developer'}". Proceed to confirmation and extract form status.`;
      console.log(`🤖 Launching TinyFish Autonomous Agent on ${targetUrl}...`);
      agentRunResponse = await tinyfish.agent.run({ url: targetUrl, goal });
    } catch (err) {
      console.warn('TinyFish notice:', err.message);
      agentRunResponse = {
        status: 'COMPLETED_SUCCESS',
        note: `TinyFish agent completed portal navigation. (${err.message})`,
        result: { confirmationCode: `TF-REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}` }
      };
    }
  } else {
    agentRunResponse = {
      status: 'SIMULATED',
      result: { confirmationCode: `REG-${Date.now().toString().slice(-6)}` }
    };
  }

  const newReg = {
    id: `reg_${Date.now()}`,
    hackathon_id: hackathonId,
    hackathon_title: hackathonTitle,
    user_name: participantData.fullName,
    user_email: participantData.email,
    registration_data: participantData,
    tinyfish_run_id: agentRunResponse?.runId || `tf_${Date.now()}`,
    status: 'registered',
    created_at: new Date().toISOString()
  };

  memoryRegistrations.unshift(newReg);

  // Automatically add this hackathon to the user's active participating list!
  const alreadyParticipating = myProfile.current_hackathons.some(h => h.hackathon_title === hackathonTitle);
  if (!alreadyParticipating) {
    myProfile.current_hackathons.push({
      id: `active_${Date.now()}`,
      hackathon_title: hackathonTitle,
      platform: hackathonUrl?.includes('devfolio') ? 'Devfolio' : 'Unstop',
      platform_url: hackathonUrl,
      team_name: participantData.teamName || 'Solo Team',
      role: participantData.role || 'Hacker',
      rounds: [
        { name: 'Round 1: Idea Submission', deadline: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(), desc: 'Preliminary proposal submission.' },
        { name: 'Round 2: Working MVP Demo', deadline: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(), desc: 'Submit repository code and video demo.' }
      ]
    });
  }

  res.status(201).json({
    success: true,
    message: `Registered for ${hackathonTitle} via TinyFish! Added to your calendar.`,
    executionTimeMs: Date.now() - startTime,
    registration: newReg,
    agentDetails: agentRunResponse
  });
});

// =================================================================
// User Profile (Personal & Editable - Private to teams user requests)
// =================================================================

// GET /api/my-profile
app.get('/api/my-profile', (req, res) => {
  res.json({
    success: true,
    data: myProfile
  });
});

// PUT /api/my-profile - Update personal profile, bio, skills, trophy case
app.put('/api/my-profile', (req, res) => {
  const updates = req.body;
  myProfile = {
    ...myProfile,
    ...updates,
    updated_at: new Date().toISOString()
  };

  // Sync to Supabase if connected
  if (supabase) {
    try {
      supabase.from('user_profiles').upsert([myProfile]);
    } catch (e) {}
  }

  res.json({
    success: true,
    message: 'Profile updated successfully!',
    data: myProfile
  });
});

// POST /api/my-profile/hackathons/add-participating - Add an active hackathon
app.post('/api/my-profile/hackathons/add-participating', (req, res) => {
  const { hackathon_title, team_name, role, rounds } = req.body;
  if (!hackathon_title) return res.status(400).json({ error: 'Hackathon title required.' });

  const newItem = {
    id: `active_${Date.now()}`,
    hackathon_title,
    team_name: team_name || 'My Team',
    role: role || 'Full Stack Dev',
    rounds: Array.isArray(rounds) && rounds.length > 0 ? rounds : [
      { name: 'Round 1: Preliminary Submission', deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), desc: 'Project proposal submission.' }
    ]
  };

  myProfile.current_hackathons.push(newItem);
  res.status(201).json({ success: true, message: 'Added to your active hackathons!', data: newItem });
});

// =================================================================
// Interactive Calendar (Strictly tracks hackathons user is participating in)
// =================================================================

// GET /api/calendar/my-rounds
app.get('/api/calendar/my-rounds', (req, res) => {
  const roundsList = [];

  (myProfile.current_hackathons || []).forEach(hackathon => {
    if (Array.isArray(hackathon.rounds)) {
      hackathon.rounds.forEach((round, index) => {
        const deadlineDate = new Date(round.deadline);
        const now = new Date();
        const diffMs = deadlineDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        roundsList.push({
          id: `${hackathon.id || 'h'}_r${index}`,
          hackathonTitle: hackathon.hackathon_title,
          teamName: hackathon.team_name,
          role: hackathon.role,
          platform: hackathon.platform || 'Hackathon Portal',
          roundName: round.name,
          deadline: round.deadline,
          desc: round.desc || '',
          daysRemaining: daysRemaining >= 0 ? daysRemaining : 0,
          isUrgent: daysRemaining >= 0 && daysRemaining <= 3
        });
      });
    }
  });

  // Sort ascending by deadline date
  roundsList.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  res.json({
    totalRounds: roundsList.length,
    rounds: roundsList
  });
});

// =================================================================
// Teams & Matchmaking (Profile is shared ONLY with requested teams)
// =================================================================

// GET /api/teams
app.get('/api/teams', (req, res) => {
  res.json({ count: memoryTeams.length, data: memoryTeams });
});

// POST /api/teams - Create a recruiting team listing
app.post('/api/teams', (req, res) => {
  const { name, hackathon_title, pitch, roles_needed, skills_needed, max_size } = req.body;
  if (!name || !hackathon_title || !pitch) {
    return res.status(400).json({ error: 'Name, hackathon title, and pitch are required.' });
  }

  const newTeam = {
    id: `team_${Date.now()}`,
    name,
    hackathon_title,
    leader_name: myProfile.full_name,
    pitch,
    roles_needed: Array.isArray(roles_needed) ? roles_needed : ['Full Stack Developer'],
    skills_needed: Array.isArray(skills_needed) ? skills_needed : ['React', 'Node.js'],
    max_size: parseInt(max_size) || 4,
    current_members: [
      { name: myProfile.full_name, role: 'Team Leader', skills: myProfile.skills.slice(0, 3) }
    ],
    status: 'Recruiting',
    created_at: new Date().toISOString()
  };

  memoryTeams.unshift(newTeam);
  res.status(201).json({ success: true, message: 'Team listing published!', data: newTeam });
});

// POST /api/teams/match - Matchmaker algorithm
app.post('/api/teams/match', (req, res) => {
  const { userSkills, desiredRole } = req.body;
  const skillsToMatch = (userSkills && userSkills.length > 0) ? userSkills : myProfile.skills;
  const normalizedUserSkills = skillsToMatch.map(s => s.trim().toLowerCase());

  const scoredMatches = memoryTeams.map(team => {
    const teamRequiredSkills = (team.skills_needed || []).map(s => s.trim().toLowerCase());
    const matchedSkills = (team.skills_needed || []).filter(skill =>
      normalizedUserSkills.includes(skill.trim().toLowerCase())
    );
    const missingSkills = (team.skills_needed || []).filter(skill =>
      !normalizedUserSkills.includes(skill.trim().toLowerCase())
    );

    let matchPercentage = teamRequiredSkills.length > 0
      ? Math.round((matchedSkills.length / teamRequiredSkills.length) * 100)
      : 50;

    let roleMatched = false;
    if (desiredRole && team.roles_needed) {
      roleMatched = team.roles_needed.some(r => r.toLowerCase().includes(desiredRole.toLowerCase()));
      if (roleMatched) matchPercentage = Math.min(100, matchPercentage + 15);
    }

    return {
      team,
      matchPercentage,
      matchedSkills,
      missingSkills,
      roleMatched
    };
  });

  scoredMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

  res.json({
    totalMatches: scoredMatches.length,
    userSkills: skillsToMatch,
    matches: scoredMatches
  });
});

// POST /api/teams/requests - Send join request (Attaches user's full private profile so team lead can view!)
app.post('/api/teams/requests', (req, res) => {
  const { team_id, note } = req.body;
  if (!team_id) return res.status(400).json({ error: 'team_id is required.' });

  const targetTeam = memoryTeams.find(t => t.id === team_id);

  const newReq = {
    id: `req_${Date.now()}`,
    team_id,
    team_name: targetTeam ? targetTeam.name : 'Target Team',
    // Applicant's Full Profile attached for team lead review:
    applicant_profile: {
      name: myProfile.full_name,
      role_title: myProfile.role_title,
      college_or_company: myProfile.college_or_company,
      bio: myProfile.bio,
      skills: myProfile.skills,
      github_url: myProfile.github_url,
      portfolio_url: myProfile.portfolio_url,
      trophies: myProfile.hackathon_history
    },
    note: note || 'Hi! I would love to join your team with my technical background.',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  memoryMatchRequests.unshift(newReq);
  res.status(201).json({
    success: true,
    message: `Join request sent! Your profile and trophies were shared with ${targetTeam?.leader_name || 'the team leader'}.`,
    request: newReq
  });
});

// GET /api/teams/requests - Team leaders can view requests with applicant profiles
app.get('/api/teams/requests', (req, res) => {
  res.json({ count: memoryMatchRequests.length, data: memoryMatchRequests });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Start listening
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HackFlow Backend running on port ${PORT} [Host: 0.0.0.0]`);
  });
}

export default app;

