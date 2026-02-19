# CLAUDE.md — RosterFlow (Duty Roster Maker)

## Project Overview

**RosterFlow** is a free, church-focused (but universally usable) duty roster/schedule maker. It allows organizations to create teams (e.g., Music Ministry, Ushers, Prayer Team, Pastoral), add members, define roles per team, manage member availability, and auto-generate fair rosters with smart shuffle distribution. Members receive email invites, can view rosters, and download beautifully designed PDF/PNG schedules.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast, modern, free hosting on Netlify |
| Styling | Tailwind CSS 3 | Rapid UI, responsive, clean design |
| State Management | Zustand | Lightweight, simple |
| Routing | React Router v6 | Standard SPA routing |
| Backend / DB | Supabase (PostgreSQL) | Free tier: auth, DB, edge functions, email |
| Auth | Supabase Auth (magic link + email/password) | Zero cost, built-in |
| Email | Supabase Edge Functions + Resend (free tier) | 100 emails/day free on Resend |
| PDF Generation | @react-pdf/renderer | Beautiful PDF templates in React |
| Image Export | html-to-image | PNG export of roster views |
| Hosting | Netlify | Free tier, auto-deploy from Git |
| Icons | Lucide React | Clean, consistent icon set |

---

## User Roles (3 Levels)

### Super Admin
- Creates the organization/church
- Manages all teams
- Assigns Team Admins
- Views all rosters across all teams
- Can do everything a Team Admin can

### Team Admin
- Manages their assigned team(s) only
- Adds/removes members to their team
- Creates and publishes rosters
- Uses shuffle/auto-assign
- Sends email invitations to members

### Member
- Receives email invite → clicks link → lands on roster view
- Enters email to view their personal schedule
- Downloads general roster (PDF/PNG) or personal schedule (PDF/PNG)
- Submits availability (marks dates they're available/unavailable)

---

## Core Features

### 1. Organization Setup
- Super Admin creates an org (e.g., "Grace Community Church")
- Org has a name, logo (optional), and settings
- Org acts as the top-level container for all teams

### 2. Team Management
- Create teams: Music Ministry, Ushers, Prayer Warriors, Pastoral, Custom...
- Each team has:
  - **Name** (e.g., "Music Ministry")
  - **Roster Type** (template): Music | Church/Event | Custom
  - **Roles** defined per team:
    - Music template default roles: Lead Singer, Backup Vocalist, Instrumentalist (with sub-categories: keys, guitar, drums, bass, etc.)
    - Church/Event template: Team Lead, Member, Support
    - Custom: Admin defines roles freely
  - **Members** assigned to the team with their role(s)
  - **Team Admin(s)** assigned

### 3. Member Management
- Add member by: Name + Email + Phone (optional)
- Member can belong to multiple teams with different roles
- Invite via email: member clicks link → sees roster page
- Member profile stores: name, email, phone, roles per team, availability

### 4. Availability Management
- Members submit availability per roster period
- Calendar-style UI: mark available/unavailable dates
- Admin can also set availability on behalf of members
- Availability feeds into the shuffle algorithm

### 5. Roster Creation & Scheduling
- **Time Periods**: Weekly | Monthly | Custom date range | Yearly plan
- Admin selects:
  - Team
  - Time period
  - Events/services within that period (e.g., "Sunday Service", "Wednesday Bible Study", "Special Event: Easter")
- For each event/service date, assign people to roles

### 6. Smart Shuffle Algorithm
**Priority order:**
1. **Respect availability** — never assign someone to a date they marked unavailable
2. **Fair distribution** — spread duty evenly so no one is overworked
3. **Role matching** — only assign people to roles they're tagged for
4. **Spacing** — try to give people gaps between duties (avoid back-to-back weeks)
5. **Variety** — for music, mix up combinations so it's not always the same band

**Algorithm approach:**
```
function shuffleRoster(team, events, members):
  for each event in events:
    for each role in team.roles:
      eligibleMembers = members.filter(m => 
        m.hasRole(role) && 
        m.isAvailable(event.date) &&
        !m.isAlreadyAssigned(event)
      )
      // Sort by least assignments first (fair distribution)
      eligibleMembers.sort(by: assignmentCount ASC, lastAssignedDate ASC)
      // Pick the top candidate
      assign(eligibleMembers[0], event, role)
```

### 7. Manual Override
- Admin can drag-and-drop or manually select people for any slot
- Mix of auto-shuffle + manual tweaks
- Visual indicator showing which assignments are manual vs auto

### 8. Roster Publishing & Sharing
- **Publish** button makes roster visible to members
- **Email notification** sent to all team members on publish
- **WhatsApp share link** — generates a public link with roster preview
- **PDF Download** — beautifully designed template (see below)
- **PNG/Image Download** — for quick sharing

### 9. Download Templates (Beautiful UI)
The PDF/PNG download should look professional and polished:

**General Roster PDF Layout:**
```
┌─────────────────────────────────────────────┐
│  [Org Logo]     ORGANIZATION NAME            │
│                 Team: Music Ministry          │
│                 Period: March 2026            │
├─────────────────────────────────────────────┤
│  DATE        │ LEAD SINGER │ BACKUP │ INSTRUMENTS │
│  Mar 2 (Sun) │ John D.     │ Mary K.│ Keys: Paul  │
│              │             │ Sarah L│ Guitar: Tim │
│              │             │        │ Drums: Ben  │
│  Mar 9 (Sun) │ Mary K.     │ John D.│ Keys: Grace │
│              │             │ Ruth A.│ Guitar: Tim │
│              │             │        │ Drums: Olu  │
│  ...         │             │        │             │
├─────────────────────────────────────────────┤
│                                             │
│  Prepared by: _____________                 │
│  Approved by: _____________                 │
│  Team Lead Signature: _____________         │
│  Pastor's Signature:  _____________         │
│  Date: _____________                        │
│                                             │
│  [Org Footer / Contact Info]                │
└─────────────────────────────────────────────┘
```

**Personal Schedule PDF Layout:**
```
┌─────────────────────────────────────────────┐
│  [Org Logo]     PERSONAL SCHEDULE            │
│                 Name: John Doe               │
│                 Team: Music Ministry          │
│                 Role: Lead Singer, Backup     │
│                 Period: March 2026            │
├─────────────────────────────────────────────┤
│  YOUR DUTY DATES:                            │
│                                              │
│  ✓ Mar 2 (Sun)  — Lead Singer               │
│  ✓ Mar 16 (Sun) — Backup Vocalist           │
│  ✓ Mar 30 (Sun) — Lead Singer               │
│                                              │
│  Total duties this month: 3                  │
├─────────────────────────────────────────────┤
│  Signature: _____________                    │
│  [Org Footer]                                │
└─────────────────────────────────────────────┘
```

### 10. Member Portal (Public Page)
- No login required for viewing
- Member enters their email on the roster page
- Sees: their personal schedule + general team roster
- Can download either as PDF or PNG
- Simple, clean, mobile-friendly

---

## Database Schema (Supabase / PostgreSQL)

### Tables

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users / Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization Memberships (links users to orgs with roles)
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'team_admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('music', 'church_event', 'custom')),
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team Roles (dynamic roles per team)
CREATE TABLE team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Lead Singer", "Backup Vocalist", "Keys"
  category TEXT, -- e.g., "vocals", "instruments" (for grouping in UI)
  sort_order INT DEFAULT 0,
  min_required INT DEFAULT 1, -- minimum people needed for this role per event
  max_allowed INT, -- max people for this role per event (NULL = unlimited)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team Members (links users to teams with specific roles)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_team_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Member Roles (which roles a member can fill in a team)
CREATE TABLE member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  team_role_id UUID REFERENCES team_roles(id) ON DELETE CASCADE,
  proficiency TEXT DEFAULT 'standard', -- 'beginner', 'standard', 'advanced'
  UNIQUE(team_member_id, team_role_id)
);

-- Rosters (a schedule for a time period)
CREATE TABLE rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g., "March 2026 Schedule"
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'custom', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  share_token TEXT UNIQUE, -- for public sharing link
  signature_fields JSONB DEFAULT '[]', -- configurable signature lines
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roster Events (individual services/events within a roster period)
CREATE TABLE roster_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL, -- e.g., "Sunday Service", "Bible Study"
  event_date DATE NOT NULL,
  event_time TIME,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Roster Assignments (who is assigned to what role for which event)
CREATE TABLE roster_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_event_id UUID REFERENCES roster_events(id) ON DELETE CASCADE,
  team_role_id UUID REFERENCES team_roles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_manual BOOLEAN DEFAULT false, -- true if manually assigned, false if auto-shuffled
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(roster_event_id, team_role_id, user_id)
);

-- Availability
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, team_id, date)
);

-- Invitations (pending email invites)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);
```

### Row Level Security (RLS) Policies
- Organization data: visible to org members only
- Team data: visible to team members + org super admins
- Roster data: draft = team admins only; published = all team members
- Public share: anyone with share_token can view published roster
- Availability: users can edit their own; admins can view all team members

---

## App Routes / Pages

```
/                           → Landing page (marketing/info)
/login                      → Login (email/password or magic link)
/signup                     → Sign up
/invite/:token              → Accept invitation

/dashboard                  → Main dashboard (role-dependent view)

/org/settings               → Organization settings (Super Admin)
/org/members                → All org members (Super Admin)

/teams                      → List all teams user has access to
/teams/:teamId              → Team overview
/teams/:teamId/members      → Team member management
/teams/:teamId/roles        → Team role configuration
/teams/:teamId/availability → Team availability calendar view

/rosters                    → List all rosters
/rosters/new                → Create new roster
/rosters/:rosterId          → View/edit roster (grid editor)
/rosters/:rosterId/preview  → Preview before publishing
/rosters/:rosterId/publish  → Publish confirmation

/r/:shareToken              → Public roster view (no auth required)
/r/:shareToken/me           → Enter email → personal schedule

/schedule/download/:rosterId → Download options (PDF/PNG)
```

---

## Project Structure

```
rosterflow/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css                    # Tailwind imports
│   │
│   ├── lib/
│   │   ├── supabase.js              # Supabase client init
│   │   ├── constants.js             # App constants, role definitions
│   │   └── utils.js                 # Helper functions
│   │
│   ├── stores/
│   │   ├── authStore.js             # Zustand auth state
│   │   ├── orgStore.js              # Organization state
│   │   ├── teamStore.js             # Team state
│   │   └── rosterStore.js           # Roster state
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useTeam.js
│   │   ├── useRoster.js
│   │   ├── useAvailability.js
│   │   └── useShuffle.js            # Shuffle algorithm hook
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx        # Main app shell (sidebar + content)
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── PublicLayout.jsx     # Layout for public roster pages
│   │   │
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── InviteAccept.jsx
│   │   │
│   │   ├── org/
│   │   │   ├── OrgSettings.jsx
│   │   │   └── OrgMemberList.jsx
│   │   │
│   │   ├── teams/
│   │   │   ├── TeamList.jsx
│   │   │   ├── TeamCard.jsx
│   │   │   ├── TeamDetail.jsx
│   │   │   ├── TeamMemberManager.jsx
│   │   │   ├── TeamRoleEditor.jsx
│   │   │   └── InviteMemberModal.jsx
│   │   │
│   │   ├── roster/
│   │   │   ├── RosterList.jsx
│   │   │   ├── RosterCreator.jsx     # New roster wizard
│   │   │   ├── RosterGrid.jsx        # Main grid editor (drag & drop)
│   │   │   ├── RosterCell.jsx        # Individual assignment cell
│   │   │   ├── ShuffleButton.jsx     # Trigger auto-assign
│   │   │   ├── RosterPreview.jsx     # Preview before publish
│   │   │   └── RosterPublish.jsx     # Publish + notify
│   │   │
│   │   ├── availability/
│   │   │   ├── AvailabilityCalendar.jsx
│   │   │   └── AvailabilityEditor.jsx
│   │   │
│   │   ├── public/
│   │   │   ├── PublicRoster.jsx      # Public roster view
│   │   │   ├── PersonalSchedule.jsx  # Email lookup → personal view
│   │   │   └── EmailLookup.jsx       # Enter email form
│   │   │
│   │   └── download/
│   │       ├── RosterPDF.jsx         # React-PDF template (general)
│   │       ├── PersonalPDF.jsx       # React-PDF template (personal)
│   │       ├── RosterImage.jsx       # PNG export wrapper
│   │       ├── SignatureBlock.jsx    # Reusable signature section
│   │       └── DownloadOptions.jsx   # Download format picker
│   │
│   └── pages/
│       ├── Landing.jsx
│       ├── Login.jsx
│       ├── Signup.jsx
│       ├── Dashboard.jsx
│       ├── TeamsPage.jsx
│       ├── TeamDetailPage.jsx
│       ├── RostersPage.jsx
│       ├── RosterEditorPage.jsx
│       ├── PublicRosterPage.jsx
│       ├── InvitePage.jsx
│       └── NotFound.jsx
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # All tables above
│   └── functions/
│       ├── send-invite/index.ts      # Edge function: send invite email
│       ├── send-roster-notification/index.ts  # Edge function: notify on publish
│       └── shared/email-templates.ts  # Beautiful HTML email templates
│
├── .env.example
├── .env                              # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml
├── CLAUDE.md                         # This file
└── README.md
```

---

## Implementation Phases

### Phase 1: Foundation (Do First)
1. Scaffold Vite + React + Tailwind project
2. Set up Supabase project + run migration SQL
3. Implement Supabase auth (signup, login, magic link)
4. Create AppLayout, Sidebar, Header
5. Build ProtectedRoute + role-based access
6. Create organization setup flow

### Phase 2: Teams & Members
7. Team CRUD (create, edit, delete teams)
8. Team role configuration (add/remove/reorder roles per team)
9. Team member management (add via email, assign roles)
10. Email invitation system (Supabase edge function + Resend)
11. Invite acceptance flow

### Phase 3: Availability
12. Availability calendar component
13. Member availability submission
14. Admin availability overview per team

### Phase 4: Roster Building (Core Feature)
15. Roster creation wizard (select team, period, add events)
16. Roster grid editor (table: rows = events, columns = roles)
17. Manual assignment (click cell → pick member)
18. Shuffle algorithm implementation
19. Shuffle button integration
20. Visual distinction: manual vs auto assignments
21. Roster preview page

### Phase 5: Publishing & Sharing
22. Publish flow (change status, generate share token)
23. Email notification on publish (edge function)
24. Public roster page (no auth, share token)
25. WhatsApp share link generation

### Phase 6: Downloads
26. General roster PDF template (React-PDF)
27. Personal schedule PDF template
28. PNG/Image export
29. Signature block component
30. Download options page

### Phase 7: Member Portal
31. Email lookup on public page
32. Personal schedule view
33. Personal download options

### Phase 8: Polish & Deploy
34. Landing page
35. Mobile responsive pass
36. Error handling & loading states
37. Netlify deployment config
38. Environment variable setup
39. Final testing

---

## Key Design Decisions

### UI/UX
- **Color scheme**: Clean, modern — primary blue (#3B82F6) with warm accents. Appropriate for church but not overly religious
- **Typography**: Inter font (clean, professional)
- **Mobile-first**: Must work well on phones since members will check schedules on mobile
- **Dark mode**: Nice to have but not required for v1

### Shuffle Algorithm Notes
- Use a **weighted round-robin** approach
- Track `assignment_count` per member per roster period
- When shuffling, sort eligible members by (assignment_count ASC, last_assigned_date ASC)
- This ensures even distribution while respecting availability
- Allow re-shuffling (clears auto-assignments, keeps manual ones)

### Email Templates
- Keep it simple and beautiful
- Invite email: "You've been added to [Team] at [Org]. Click to view your schedule."
- Roster published email: "The [Month] roster for [Team] is ready. View your schedule."
- Include direct link to personal schedule

### PDF Design Principles
- Clean, printable layout (A4)
- Organization branding (logo, name) at top
- Clear table with good spacing
- Signature block at bottom with configurable fields:
  - "Prepared by" (auto-filled with admin name)
  - "Approved by" (blank line)
  - "Team Lead Signature" (blank line)
  - "Pastor's Signature" (blank line)
  - "Date" (blank line)
- Footer with org contact info

---

## Environment Variables

```
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173  # or production URL
```

For Supabase Edge Functions:
```
RESEND_API_KEY=your-resend-key
```

---

## Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod

# Run Supabase locally (optional)
npx supabase start
npx supabase db reset  # Apply migrations
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.4.0",
    "@react-pdf/renderer": "^3.1.0",
    "html-to-image": "^1.11.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^3.0.0",
    "clsx": "^2.0.0",
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## Template Presets

### Music Ministry Template
Default roles:
- Lead Vocalist (min: 1, max: 1)
- Backup Vocalist (min: 1, max: 3)
- Keys/Piano (min: 0, max: 1)
- Guitar (min: 0, max: 2)
- Bass Guitar (min: 0, max: 1)
- Drums (min: 1, max: 1)
- Sound Engineer (min: 0, max: 1)

### Church/Event Template
Default roles:
- Team Lead (min: 1, max: 1)
- Assistant Lead (min: 0, max: 1)
- Member (min: 1, max: null)
- Support (min: 0, max: null)

### Custom Template
- No default roles — admin defines all roles from scratch

---

## Notes for Claude Code

- **Start with Phase 1** — get the foundation solid before building features
- **Supabase migrations** should be run first to set up the database
- **RLS policies are critical** — implement them from the start for security
- **The shuffle algorithm** is the most complex piece — test it thoroughly
- **PDF templates** should be pixel-perfect — this is a key selling point
- **Mobile responsiveness** is essential — members will primarily use phones
- **Keep components small and composable** — easier to iterate
- **Use TypeScript if comfortable**, but plain JS is fine for speed
- **Error boundaries** around critical sections (roster grid, PDF generation)
- **Optimistic UI updates** where possible for snappy feel