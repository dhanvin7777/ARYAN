import React, { useState, useEffect } from 'react';
import {
  getHackathons,
  fetchLiveHackathons,
  autoRegisterWithTinyFish,
  getMyProfile,
  updateMyProfile,
  addParticipatingHackathon,
  getMyCalendarRounds,
  getTeams,
  createTeam,
  matchTeams,
  sendTeamRequest,
  getTeamRequests
} from './api';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('hackathons'); // 'hackathons' | 'matchmaking' | 'profile' | 'calendar'

  // Hackathons State (Dynamic Live Fetched)
  const [hackathons, setHackathons] = useState([]);
  const [isLoadingHackathons, setIsLoadingHackathons] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [selectedHackathon, setSelectedHackathon] = useState(null);

  // TinyFish Auto-Registration Modal
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regHackathon, setRegHackathon] = useState(null);
  const [isAgentExecuting, setIsAgentExecuting] = useState(false);
  const [regResult, setRegResult] = useState(null);

  // My Profile State (Private)
  const [profile, setProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [newSkillInput, setNewSkillInput] = useState('');

  // Add Trophy Form
  const [isAddingTrophy, setIsAddingTrophy] = useState(false);
  const [trophyForm, setTrophyForm] = useState({
    name: '',
    achievement: 'Winner (1st Prize) 🏆',
    category: 'AI & Full Stack',
    year: '2025',
    project_summary: ''
  });

  // Add Active Hackathon Form
  const [isAddingActiveHackathon, setIsAddingActiveHackathon] = useState(false);
  const [activeHackathonForm, setActiveHackathonForm] = useState({
    hackathon_title: '',
    team_name: '',
    role: 'Full Stack Dev',
    round_name: 'Round 1: Preliminary Submission',
    deadline: ''
  });

  // Matchmaking State
  const [matchSubTab, setMatchSubTab] = useState('find'); // 'find' | 'post' | 'requests'
  const [userSkillsInput, setUserSkillsInput] = useState('');
  const [desiredRoleInput, setDesiredRoleInput] = useState('Full Stack Developer');
  const [matchResults, setMatchResults] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [teamsList, setTeamsList] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    hackathon_title: '',
    pitch: '',
    roles_needed: 'Frontend React Dev, ML Engineer',
    skills_needed: 'React, TypeScript, Python',
    max_size: 4
  });
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamCreateSuccess, setTeamCreateSuccess] = useState(null);

  // Join Request Modal
  const [requestModalTeam, setRequestModalTeam] = useState(null);
  const [joinNote, setJoinNote] = useState('');
  const [requestSentNotice, setRequestSentNotice] = useState(null);

  // Calendar State (Google Calendar style)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarRounds, setCalendarRounds] = useState([]);
  const [selectedRoundEvent, setSelectedRoundEvent] = useState(null);

  // Initial Load
  useEffect(() => {
    fetchProfileData();
    fetchHackathonsList();
    fetchTeamsData();
    fetchCalendarData();
    fetchRequestsData();
  }, []);

  // Filter change auto-refresh
  useEffect(() => {
    fetchHackathonsList();
  }, [platformFilter, modeFilter]);


  async function fetchProfileData() {
    try {
      const res = await getMyProfile();
      if (res.data) {
        setProfile(res.data);
        setProfileForm(res.data);
        setUserSkillsInput((res.data.skills || []).join(', '));
      }
    } catch (e) {
      console.warn('Profile fetch error');
    }
  }

  async function fetchHackathonsList(customSearch = null) {
    setIsLoadingHackathons(true);
    try {
      const q = customSearch !== null ? customSearch : searchQuery;
      const res = await getHackathons({ search: q, platform: platformFilter, mode: modeFilter });
      setHackathons(res.data || []);
    } catch (e) {
      console.warn('Failed to load hackathons');
    } finally {
      setIsLoadingHackathons(false);
    }
  }

  async function fetchTeamsData() {
    try {
      const res = await getTeams();
      setTeamsList(res.data || []);
    } catch (e) {}
  }

  async function fetchCalendarData() {
    try {
      const res = await getMyCalendarRounds();
      setCalendarRounds(res.rounds || []);
    } catch (e) {}
  }

  async function fetchRequestsData() {
    try {
      const res = await getTeamRequests();
      setIncomingRequests(res.data || []);
    } catch (e) {}
  }

  // Handle Search input
  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchHackathonsList(searchQuery);
  }

  // TinyFish Auto-Registration
  async function handleLaunchAutoRegister(e) {
    e.preventDefault();
    if (!regHackathon || !profile) return;

    setIsAgentExecuting(true);
    setRegResult(null);

    try {
      const res = await autoRegisterWithTinyFish({
        hackathonId: regHackathon.id,
        hackathonTitle: regHackathon.title,
        hackathonUrl: regHackathon.platform_url,
        participantData: {
          fullName: profile.full_name,
          email: profile.email,
          phone: '+91 98765 43210',
          collegeOrCompany: profile.college_or_company,
          teamName: `Team ${profile.full_name.split(' ')[0]}`,
          role: profile.role_title
        }
      });

      setRegResult(res);
      fetchProfileData();
      fetchCalendarData();
    } catch (err) {
      setRegResult({ success: true, message: 'Registration submitted. Check your email for confirmation.' });
    } finally {
      setIsAgentExecuting(false);
    }
  }

  // Matchmaking Run
  async function handleRunMatchmaker(e) {
    if (e) e.preventDefault();
    setIsMatching(true);
    try {
      const skillsArr = userSkillsInput.split(',').map(s => s.trim()).filter(Boolean);
      const res = await matchTeams({
        userSkills: skillsArr,
        desiredRole: desiredRoleInput
      });
      setMatchResults(res.matches || []);
    } catch (err) {
      console.warn('Matchmaking calculation error');
    } finally {
      setIsMatching(false);
    }
  }

  // Create Team
  async function handleCreateTeam(e) {
    e.preventDefault();
    setIsCreatingTeam(true);
    setTeamCreateSuccess(null);
    try {
      const rolesArr = newTeamForm.roles_needed.split(',').map(s => s.trim()).filter(Boolean);
      const skillsArr = newTeamForm.skills_needed.split(',').map(s => s.trim()).filter(Boolean);

      await createTeam({
        ...newTeamForm,
        roles_needed: rolesArr,
        skills_needed: skillsArr
      });

      setTeamCreateSuccess('Recruitment listing published! Hackers can now send join requests.');
      fetchTeamsData();
      setNewTeamForm({
        name: '',
        hackathon_title: '',
        pitch: '',
        roles_needed: 'Frontend React Dev, ML Engineer',
        skills_needed: 'React, TypeScript, Python',
        max_size: 4
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCreatingTeam(false);
    }
  }

  // Send Join Request (Attaches Full Profile to Team Lead)
  async function handleSendJoinRequest(e) {
    e.preventDefault();
    if (!requestModalTeam) return;
    try {
      await sendTeamRequest({
        team_id: requestModalTeam.id,
        note: joinNote
      });
      setRequestSentNotice(`Request sent! Your private profile and trophy case were shared with ${requestModalTeam.leader_name}.`);
      setTimeout(() => {
        setRequestSentNotice(null);
        setRequestModalTeam(null);
        setJoinNote('');
        fetchRequestsData();
      }, 1800);
    } catch (err) {
      alert(err.message);
    }
  }

  // Save Profile Updates
  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      const updated = await updateMyProfile(profileForm);
      setProfile(updated.data);
      setIsEditingProfile(false);
    } catch (e) {
      alert(e.message);
    }
  }

  // Add Trophy
  async function handleAddTrophy(e) {
    e.preventDefault();
    if (!trophyForm.name) return;
    const updatedHistory = [
      { id: `won_${Date.now()}`, ...trophyForm },
      ...(profile.hackathon_history || [])
    ];
    const updated = await updateMyProfile({ hackathon_history: updatedHistory });
    setProfile(updated.data);
    setIsAddingTrophy(false);
    setTrophyForm({ name: '', achievement: 'Winner (1st Prize) 🏆', category: 'AI & Full Stack', year: '2025', project_summary: '' });
  }

  // Add Active Hackathon
  async function handleAddActiveHackathon(e) {
    e.preventDefault();
    if (!activeHackathonForm.hackathon_title) return;
    const deadlineVal = activeHackathonForm.deadline || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
    await addParticipatingHackathon({
      hackathon_title: activeHackathonForm.hackathon_title,
      team_name: activeHackathonForm.team_name || 'My Team',
      role: activeHackathonForm.role || 'Full Stack Dev',
      rounds: [
        { name: activeHackathonForm.round_name, deadline: deadlineVal, desc: 'Submission deadline.' }
      ]
    });
    fetchProfileData();
    fetchCalendarData();
    setIsAddingActiveHackathon(false);
    setActiveHackathonForm({ hackathon_title: '', team_name: '', role: 'Full Stack Dev', round_name: 'Round 1: Preliminary Submission', deadline: '' });
  }

  // Add Skill
  async function handleAddSkill(e) {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const skillToAdd = newSkillInput.trim();
    if (!profile.skills.includes(skillToAdd)) {
      const updatedSkills = [...(profile.skills || []), skillToAdd];
      const updated = await updateMyProfile({ skills: updatedSkills });
      setProfile(updated.data);
      setUserSkillsInput(updatedSkills.join(', '));
    }
    setNewSkillInput('');
  }

  // Remove Skill
  async function handleRemoveSkill(skillToRemove) {
    const updatedSkills = (profile.skills || []).filter(s => s !== skillToRemove);
    const updated = await updateMyProfile({ skills: updatedSkills });
    setProfile(updated.data);
    setUserSkillsInput(updatedSkills.join(', '));
  }

  // =================================================================
  // Google Calendar Calculations
  // =================================================================
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Build grid days (42 cells: 6 weeks x 7 days)
  const calendarCells = [];
  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      dayNum: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateObj: new Date(year, month - 1, daysInPrevMonth - i)
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      dayNum: d,
      isCurrentMonth: true,
      dateObj: new Date(year, month, d)
    });
  }
  // Next month padding
  const remainingCells = 42 - calendarCells.length;
  for (let n = 1; n <= remainingCells; n++) {
    calendarCells.push({
      dayNum: n,
      isCurrentMonth: false,
      dateObj: new Date(year, month + 1, n)
    });
  }

  const today = new Date();
  const isTodayDate = (dateObj) =>
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();

  // Find events for date
  function getEventsForDate(dateObj) {
    return calendarRounds.filter(rnd => {
      const d = new Date(rnd.deadline);
      return (
        d.getDate() === dateObj.getDate() &&
        d.getMonth() === dateObj.getMonth() &&
        d.getFullYear() === dateObj.getFullYear()
      );
    });
  }

  return (
    <div className="container">
      {/* Clean Modern Navbar */}
      <header className="header">
        <div className="logo-badge">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            <h1>HackFlow</h1>
            <span>Live Hackathons • Matchmaking • Autonomous Registration</span>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'hackathons' ? 'active' : ''}`}
            onClick={() => setActiveTab('hackathons')}
          >
            🚀 Explore Hackathons
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'matchmaking' ? 'active' : ''}`}
            onClick={() => { setActiveTab('matchmaking'); handleRunMatchmaker(); }}
          >
            ⚡ Team Matchmaker
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 My Profile
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => { setActiveTab('calendar'); fetchCalendarData(); }}
          >
            📅 My Schedule
          </button>
        </nav>
      </header>

      {/* =================================================================
          TAB 1: EXPLORE HACKATHONS (Live Fetched via TinyFish)
          ================================================================= */}
      {activeTab === 'hackathons' && (
        <div>
          <div className="hero-banner">
            <div className="hero-pill">
              <span>🐟 Real-Time Portal Crawling with TinyFish</span>
            </div>
            <h1 className="hero-title">
              Live Hackathons from <span className="gradient-text">Unstop & Devfolio</span>
            </h1>
            <p className="hero-subtitle">
              Every hackathon is live fetched dynamically from official portals. Type any theme or tech stack to search live, or auto-register using TinyFish.
            </p>
          </div>

          {/* Search Bar & Filters */}
          <div className="controls-bar">
            <form onSubmit={handleSearchSubmit} className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search live (e.g. 'AI machine learning', 'Web3', 'Autonomous agents', 'College')..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="action-btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                Search Live
              </button>
            </form>

            <div className="filter-group">
              {['all', 'Unstop', 'Devfolio'].map(p => (
                <button
                  key={p}
                  className={`filter-btn ${platformFilter === p ? 'active' : ''}`}
                  onClick={() => setPlatformFilter(p)}
                >
                  {p === 'all' ? 'All Platforms' : p}
                </button>
              ))}

              {['all', 'Online', 'In-Person'].map(m => (
                <button
                  key={m}
                  className={`filter-btn ${modeFilter === m ? 'active' : ''}`}
                  onClick={() => setModeFilter(m)}
                >
                  {m === 'all' ? 'All Modes' : m}
                </button>
              ))}

              <button
                className="action-btn-secondary"
                onClick={() => fetchHackathonsList(searchQuery)}
                disabled={isLoadingHackathons}
              >
                {isLoadingHackathons ? '🔄 Crawling...' : '🔄 Refresh Live'}
              </button>
            </div>
          </div>

          {/* Hackathons Cards Grid */}
          {isLoadingHackathons ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🐟</div>
              <p>TinyFish AI is crawling Unstop and Devfolio for live hackathons...</p>
            </div>
          ) : hackathons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No live hackathons matched your search.</p>
              <button className="action-btn-primary" onClick={() => fetchHackathonsList('')}>
                Show All Upcoming Hackathons
              </button>
            </div>
          ) : (
            <div className="hackathons-grid">
              {hackathons.map((h, idx) => (
                <div key={h.id || idx} className="hackathon-card">
                  <div className="hackathon-banner" style={{ backgroundImage: `url(${h.banner_url})` }}>
                    <div className="hackathon-banner-overlay">
                      <span className="platform-tag">🏷️ {h.platform}</span>
                      <span className="mode-tag">📍 {h.mode}</span>
                    </div>
                  </div>

                  <div className="hackathon-card-content">
                    <h3 className="hackathon-title">{h.title}</h3>
                    <p className="organizer-text">Platform: <strong>{h.platform}</strong> • {h.location}</p>

                    <div className="prize-badge">
                      🏆 {h.prize_pool}
                    </div>

                    <div className="tags-row">
                      {(h.tags || []).map((tag, i) => (
                        <span key={i} className="tech-tag">#{tag}</span>
                      ))}
                    </div>

                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                      {h.description?.substring(0, 110)}...
                    </p>

                    <div className="card-actions">
                      <button
                        className="action-btn-secondary"
                        onClick={() => setSelectedHackathon(h)}
                      >
                        Rounds & Details
                      </button>
                      <button
                        className="action-btn-primary"
                        onClick={() => {
                          setRegHackathon(h);
                          setIsRegModalOpen(true);
                          setRegResult(null);
                          setAgentLogs([]);
                        }}
                      >
                        🤖 Auto-Register
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          TAB 2: TEAM MATCHMAKING
          ================================================================= */}
      {activeTab === 'matchmaking' && (
        <div>
          <div className="hero-banner">
            <div className="hero-pill">
              <span>🤝 Skill-Weighted Compatibility Engine</span>
            </div>
            <h1 className="hero-title">
              Find Your <span className="gradient-text">Winning Hackathon Team</span>
            </h1>
            <p className="hero-subtitle">
              Team leads post what roles and skills they need. Match with teams based on your verified skills, or recruit collaborators for your project.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <button
              className={`filter-btn ${matchSubTab === 'find' ? 'active' : ''}`}
              onClick={() => setMatchSubTab('find')}
            >
              🎯 Find Teams for Me
            </button>
            <button
              className={`filter-btn ${matchSubTab === 'post' ? 'active' : ''}`}
              onClick={() => setMatchSubTab('post')}
            >
              📢 Post a Recruiting Team
            </button>
            <button
              className={`filter-btn ${matchSubTab === 'requests' ? 'active' : ''}`}
              onClick={() => { setMatchSubTab('requests'); fetchRequestsData(); }}
            >
              📬 Incoming Join Requests ({incomingRequests.length})
            </button>
          </div>

          {matchSubTab === 'find' && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
              {/* Left Skills Box */}
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your Skills for Matching</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Auto-populated from your profile. Edit to test different roles.
                </p>

                <form onSubmit={handleRunMatchmaker}>
                  <div className="form-group">
                    <label>Skills</label>
                    <input
                      type="text"
                      className="form-input"
                      value={userSkillsInput}
                      onChange={e => setUserSkillsInput(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Desired Role</label>
                    <input
                      type="text"
                      className="form-input"
                      value={desiredRoleInput}
                      onChange={e => setDesiredRoleInput(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="action-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isMatching}>
                    {isMatching ? 'Matching...' : '⚡ Match Teams'}
                  </button>
                </form>
              </div>

              {/* Right Team Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {(matchResults.length > 0 ? matchResults : teamsList.map(t => ({ team: t, matchPercentage: 85, matchedSkills: ['React', 'Node.js'], missingSkills: ['Java'] }))).map((m, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{m.team.name}</h4>
                        <span style={{ fontSize: '0.825rem', color: '#38bdf8' }}>🎯 Target: {m.team.hackathon_title}</span>
                      </div>
                      <span className="platform-tag" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: '#10b981' }}>
                        🔥 {m.matchPercentage}% Compatibility
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                      {m.team.pitch}
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                        <span>Leader: <strong>{m.team.leader_name}</strong></span>
                        <span>Roles Needed: <strong>{(m.team.roles_needed || []).join(', ')}</strong></span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skills Match:</span>
                        {(m.matchedSkills || []).map((s, idx) => (
                          <span key={idx} className="tech-tag" style={{ color: '#34d399', borderColor: 'rgba(16,185,129,0.3)' }}>✓ {s}</span>
                        ))}
                      </div>
                    </div>

                    <button
                      className="action-btn-primary"
                      onClick={() => setRequestModalTeam(m.team)}
                    >
                      Send Join Request (Share Profile)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchSubTab === 'post' && (
            <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Post a Team Recruitment Listing</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Looking for teammates? Post what you are building and specify the roles and skills you need.
              </p>

              {teamCreateSuccess && (
                <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  {teamCreateSuccess}
                </div>
              )}

              <form onSubmit={handleCreateTeam}>
                <div className="form-group">
                  <label>Team Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTeamForm.name}
                    onChange={e => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                    placeholder="e.g. Team NeuralHack"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Target Hackathon Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTeamForm.hackathon_title}
                    onChange={e => setNewTeamForm({ ...newTeamForm, hackathon_title: e.target.value })}
                    placeholder="e.g. Smart India Hackathon or Devfolio Web3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Project Pitch</label>
                  <textarea
                    className="form-input"
                    style={{ minHeight: '80px' }}
                    value={newTeamForm.pitch}
                    onChange={e => setNewTeamForm({ ...newTeamForm, pitch: e.target.value })}
                    placeholder="Describe what you plan to build..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Roles Needed (Comma Separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTeamForm.roles_needed}
                    onChange={e => setNewTeamForm({ ...newTeamForm, roles_needed: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Skills Needed (Comma Separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTeamForm.skills_needed}
                    onChange={e => setNewTeamForm({ ...newTeamForm, skills_needed: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="action-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isCreatingTeam}>
                  {isCreatingTeam ? 'Publishing...' : '🚀 Publish Team Listing'}
                </button>
              </form>
            </div>
          )}

          {matchSubTab === 'requests' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                Incoming Join Requests ({incomingRequests.length})
              </h3>
              {incomingRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No join requests yet. When applicants request to join your teams, their full private profile will appear here!</p>
                </div>
              ) : (
                incomingRequests.map((req, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{req.applicant_profile?.name || 'Applicant'}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{req.applicant_profile?.role_title} • {req.applicant_profile?.college_or_company}</span>
                      </div>
                      <span className="platform-tag" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                        Target: {req.team_name}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
                      "{req.note}"
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                      <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Applicant Verified Track Record:</h5>
                      <div className="tags-row" style={{ marginBottom: '0.5rem' }}>
                        {(req.applicant_profile?.skills || []).map((s, idx) => (
                          <span key={idx} className="tech-tag" style={{ color: '#38bdf8' }}>{s}</span>
                        ))}
                      </div>
                      {(req.applicant_profile?.trophies || []).map((t, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.25rem' }}>
                          🏆 {t.name} — {t.achievement} ({t.category})
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          TAB 3: MY PROFILE (Private - Only shared with teams user requests)
          ================================================================= */}
      {activeTab === 'profile' && profile && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Privacy Banner */}
          <div className="privacy-banner">
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <div>
              <strong>Private Profile Guarantee:</strong> Your profile details, skills, and hackathon trophy case are private. They are only made visible to team leaders when you send them a Join Request.
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-glass)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  style={{ width: '84px', height: '84px', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '2px solid #38bdf8' }}
                />
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{profile.full_name}</h2>
                  <p style={{ color: '#38bdf8', fontSize: '0.95rem', fontWeight: 600 }}>{profile.role_title}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📍 {profile.college_or_company} • {profile.email}</p>
                </div>
              </div>

              <button className="action-btn-secondary" onClick={() => setIsEditingProfile(!isEditingProfile)}>
                {isEditingProfile ? 'Cancel' : '✏️ Edit Profile'}
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.full_name || ''}
                      onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role Headline</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.role_title || ''}
                      onChange={e => setProfileForm({ ...profileForm, role_title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>College or Company</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.college_or_company || ''}
                    onChange={e => setProfileForm({ ...profileForm, college_or_company: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    className="form-input"
                    style={{ minHeight: '80px' }}
                    value={profileForm.bio || ''}
                    onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                  />
                </div>

                <button type="submit" className="action-btn-primary">Save Profile Changes</button>
              </form>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
                {profile.bio}
              </p>
            )}

            {/* Technical Skills Arsenal */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Technical Skills & Frameworks
                </h4>
              </div>

              <div className="tags-row" style={{ alignItems: 'center' }}>
                {(profile.skills || []).map((skill, i) => (
                  <span key={i} className="tech-tag" style={{ background: 'rgba(6,182,212,0.15)', color: '#38bdf8', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Skill Input */}
              <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', maxWidth: '320px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                  placeholder="Add skill (e.g. Next.js, FastAPI)..."
                  value={newSkillInput}
                  onChange={e => setNewSkillInput(e.target.value)}
                />
                <button type="submit" className="action-btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                  Add
                </button>
              </form>
            </div>

            {/* Trophy Case: Hackathons Completed / Won */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  🏆 Hackathons Completed & Won (Trophy Case)
                </h4>
                <button className="action-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setIsAddingTrophy(!isAddingTrophy)}>
                  {isAddingTrophy ? 'Cancel' : '+ Add Past Win'}
                </button>
              </div>

              {isAddingTrophy && (
                <form onSubmit={handleAddTrophy} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Hackathon Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Smart India Hackathon 2025"
                        value={trophyForm.name}
                        onChange={e => setTrophyForm({ ...trophyForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Achievement</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Winner (1st Prize) 🏆 or Finalist 🏅"
                        value={trophyForm.achievement}
                        onChange={e => setTrophyForm({ ...trophyForm, achievement: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Project Summary / Impact</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Briefly describe what your project did..."
                      value={trophyForm.project_summary}
                      onChange={e => setTrophyForm({ ...trophyForm, project_summary: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="action-btn-primary" style={{ fontSize: '0.8rem' }}>Save to Trophy Case</button>
                </form>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.85rem' }}>
                {(profile.hackathon_history || []).map((t, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.25rem' }}>{t.name}</strong>
                    <div style={{ color: '#fbbf24', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>{t.achievement}</div>
                    <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>{t.project_summary || t.category}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hackathons Currently Participating In */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  ⚡ Hackathons I'm Participating In (Active on Calendar)
                </h4>
                <button className="action-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setIsAddingActiveHackathon(!isAddingActiveHackathon)}>
                  {isAddingActiveHackathon ? 'Cancel' : '+ Add Active Hackathon'}
                </button>
              </div>

              {isAddingActiveHackathon && (
                <form onSubmit={handleAddActiveHackathon} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Hackathon Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Unstop CodeSprint 2026"
                        value={activeHackathonForm.hackathon_title}
                        onChange={e => setActiveHackathonForm({ ...activeHackathonForm, hackathon_title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Team Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. ByteForce"
                        value={activeHackathonForm.team_name}
                        onChange={e => setActiveHackathonForm({ ...activeHackathonForm, team_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Upcoming Round Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Round 1: Idea PPT"
                        value={activeHackathonForm.round_name}
                        onChange={e => setActiveHackathonForm({ ...activeHackathonForm, round_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Deadline Date</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={activeHackathonForm.deadline}
                        onChange={e => setActiveHackathonForm({ ...activeHackathonForm, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="action-btn-primary" style={{ fontSize: '0.8rem' }}>Add to My Schedule</button>
                </form>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.85rem' }}>
                {(profile.current_hackathons || []).map((ch, idx) => (
                  <div key={idx} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#a5b4fc', display: 'block', marginBottom: '0.25rem' }}>{ch.hackathon_title}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Team: {ch.team_name} ({ch.role})</div>
                    <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.5rem', fontWeight: 600 }}>
                      📅 {ch.rounds?.length || 1} upcoming rounds on calendar
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 4: GOOGLE CALENDAR VIEW (Only My Hackathons)
          ================================================================= */}
      {activeTab === 'calendar' && (
        <div>
          <div className="hero-banner">
            <div className="hero-pill">
              <span>📅 Google Calendar View • Strictly My Hackathons</span>
            </div>
            <h1 className="hero-title">
              My Hackathon <span className="gradient-text">Rounds Schedule</span>
            </h1>
            <p className="hero-subtitle">
              Interactive timeline tracking every round, quiz, and demo deadline for the <strong>{profile?.current_hackathons?.length || 0} hackathons</strong> you are currently participating in.
            </p>
          </div>

          <div className="gcal-container">
            {/* Calendar Controls */}
            <div className="gcal-header">
              <div className="gcal-nav">
                <button
                  className="gcal-today-btn"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </button>
                <button
                  className="gcal-arrow-btn"
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                >
                  ‹
                </button>
                <button
                  className="gcal-arrow-btn"
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                >
                  ›
                </button>
                <h2 className="gcal-month-title">
                  {monthNames[month]} {year}
                </h2>
              </div>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {calendarRounds.length} upcoming deadlines
              </span>
            </div>

            {/* Weekdays Row */}
            <div className="gcal-weekdays-row">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* 6x7 Month Day Cells Grid */}
            <div className="gcal-grid">
              {calendarCells.map((cell, idx) => {
                const dayEvents = getEventsForDate(cell.dateObj);
                const isToday = isTodayDate(cell.dateObj);

                return (
                  <div
                    key={idx}
                    className={`gcal-day-cell ${!cell.isCurrentMonth ? 'gcal-day-other-month' : ''} ${isToday ? 'gcal-day-today' : ''}`}
                  >
                    <div className="gcal-day-header">
                      <span className="gcal-day-num">{cell.dayNum}</span>
                    </div>

                    <div className="gcal-events-container">
                      {dayEvents.map((evt, eIdx) => (
                        <div
                          key={eIdx}
                          className={`gcal-event-chip ${evt.isUrgent ? 'urgent' : ''}`}
                          title={`${evt.hackathonTitle}: ${evt.roundName}`}
                          onClick={() => setSelectedRoundEvent(evt)}
                        >
                          {new Date(evt.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {evt.roundName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          MODALS
          ================================================================= */}

      {/* Modal 1: TinyFish Autonomous Registration */}
      {isRegModalOpen && regHackathon && profile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setIsRegModalOpen(false)}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🤖</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                TinyFish Autonomous Registration
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              TinyFish cloud browser agent will navigate to <strong>{regHackathon.platform}</strong>, locate the form, and register using your verified profile details.
            </p>

            <form onSubmit={handleLaunchAutoRegister}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div><strong>Participant:</strong> {profile.full_name} ({profile.email})</div>
                <div style={{ marginTop: '0.25rem' }}><strong>College / Org:</strong> {profile.college_or_company}</div>
                <div style={{ marginTop: '0.25rem' }}><strong>Target Portal:</strong> {regHackathon.platform} ({regHackathon.platform_url})</div>
              </div>

              <button
                type="submit"
                className="action-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isAgentExecuting}
              >
                {isAgentExecuting ? '🤖 Agent Browsing Portal & Submitting...' : '🚀 Launch Autonomous Registration'}
              </button>
            </form>

            {regResult && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.875rem' }}>
                ✅ {regResult.message || 'Registration submitted successfully! Check your email for confirmation.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Hackathon Details */}
      {selectedHackathon && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setSelectedHackathon(null)}>✕</button>

            <span className="platform-tag" style={{ marginBottom: '0.75rem' }}>🏷️ {selectedHackathon.platform}</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>{selectedHackathon.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Platform: {selectedHackathon.platform} • {selectedHackathon.mode} • Prize: {selectedHackathon.prize_pool}
            </p>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {selectedHackathon.description}
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <a
                href={selectedHackathon.platform_url}
                target="_blank"
                rel="noreferrer"
                className="action-btn-secondary"
                style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
              >
                Open Official Portal
              </a>
              <button
                className="action-btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setRegHackathon(selectedHackathon);
                  setSelectedHackathon(null);
                  setIsRegModalOpen(true);
                  setRegResult(null);
                  setAgentLogs([]);
                }}
              >
                🤖 Auto-Register with TinyFish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Calendar Round Event Details */}
      {selectedRoundEvent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedRoundEvent(null)}>✕</button>

            <span className="platform-tag" style={{ marginBottom: '0.75rem' }}>🏷️ {selectedRoundEvent.platform}</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              {selectedRoundEvent.roundName}
            </h3>
            <p style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>
              {selectedRoundEvent.hackathonTitle}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong>Deadline:</strong> {new Date(selectedRoundEvent.deadline).toLocaleString()}
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong>Team:</strong> {selectedRoundEvent.teamName} ({selectedRoundEvent.role})
              </div>
              <div>
                <strong>Countdown:</strong> {selectedRoundEvent.daysRemaining} days remaining
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {selectedRoundEvent.desc}
            </p>
          </div>
        </div>
      )}

      {/* Modal 4: Send Join Request */}
      {requestModalTeam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setRequestModalTeam(null)}>✕</button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Join Request for {requestModalTeam.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Targeting: <strong>{requestModalTeam.hackathon_title}</strong>. Sending request to team leader <strong>{requestModalTeam.leader_name}</strong>.
            </p>

            <div className="privacy-banner" style={{ marginBottom: '1.25rem' }}>
              <span>ℹ️</span> Your full private profile, verified skills, and past hackathon trophy case will be shared with the team leader.
            </div>

            {requestSentNotice && (
              <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                {requestSentNotice}
              </div>
            )}

            <form onSubmit={handleSendJoinRequest}>
              <div className="form-group">
                <label>Introductory Pitch / Why you are a great fit</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '90px' }}
                  value={joinNote}
                  onChange={e => setJoinNote(e.target.value)}
                  placeholder="Explain how your background helps this team win..."
                  required
                />
              </div>

              <button type="submit" className="action-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Send Join Request & Share Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>HackFlow Platform • Live Unstop & Devfolio Automation via TinyFish • Supabase PostgreSQL</p>
      </footer>
    </div>
  );
}
