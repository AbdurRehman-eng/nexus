# 🗺️ NEXUS Platform - Complete Route Map

## Public Routes (No Auth Required)

### Landing & Information
- **`/`** - Landing Page
  - Hero: "WORK SMARTER, NOT HARDER"
  - Feature cards
  - Get Started button

- **`/about`** - About Us
  - Mission statement
  - Features overview
  - Company story

- **`/contact`** - Contact Us
  - Contact form
  - Contact information
  - Office details

- **`/solutions`** - Solutions
  - Solutions overview page

- **`/resources`** - Resources
  - Resources page

## Authentication Routes

- **`/register`** - User Registration
  - Split-screen design
  - Email/Password signup
  - Google OAuth (UI ready)
  - Link to login

- **`/login`** - User Login
  - Split-screen design
  - Email/Password login
  - Google OAuth (UI ready)
  - Forgot password link
  - Link to register

## Protected Routes (After Auth)

### Dashboard
- **`/homepage`** - User Dashboard
  - Workspace list
  - Create workspace button
  - Empty state
  - Workspace cards

### Workspace Management
- **`/workspace/create`** - Create Workspace
  - Step 1: Name & Type
  - Step 2: Add Coworkers
  - 2-step wizard flow

### Communication
- **`/chat/[id]`** - Chat Interface
  - Dynamic route: `[id]` = workspace ID
  - 3-column layout
  - Sidebar with channels
  - Message area
  - Input with emoji picker
  - File upload
  - Examples:
    - `/chat/1`
    - `/chat/aurora-digital`

- **`/call/[id]`** - Video Call
  - Dynamic route: `[id]` = workspace ID
  - Video grid
  - Control bar
  - Participant management
  - Examples:
    - `/call/1`
    - `/call/aurora-digital`

### Search
- **`/ai-search`** - AI Search
  - Centered AI brain icon
  - Search input
  - Result display
  - Suggested queries

## Route Parameters

### Dynamic Routes
All routes using `[id]` accept:
- Numeric IDs: `/chat/1`, `/call/1`
- String slugs: `/chat/workspace-name`, `/call/workspace-name`

## Navigation Hierarchy

```
┌─────────────────────────────────────────────┐
│ Navbar (Global)                             │
│ - Homepage | Solutions | Resources |        │
│   About Us | Contact Us | Login/Get Started │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    Landing (/)            Auth Pages
        │                /login /register
        ↓                       │
   Get Started ──────────────→  │
        │                       │
        └───────────────────────┘
                    │
                    ↓
              Homepage
             /homepage
                    │
        ┌───────────┴───────────┐
        │                       │
   Create Workspace      Select Workspace
  /workspace/create            │
        │                       │
        └───────────────────────┘
                    │
                    ↓
            Chat Interface
             /chat/[id]
                    │
        ┌───────────┴───────────────┐
        │           │               │
   Video Call   AI Search     Continue Chat
   /call/[id]  /ai-search
```

## URL Structure Examples

### Real Usage Flow
1. User visits: `http://localhost:3000/`
2. Clicks "Get Started": `http://localhost:3000/register`
3. After registration: `http://localhost:3000/homepage`
4. Creates workspace: `http://localhost:3000/workspace/create`
5. Opens chat: `http://localhost:3000/chat/1`
6. Starts call: `http://localhost:3000/call/1`
7. Uses AI search: `http://localhost:3000/ai-search`

### Quick Access Links
- Landing: `http://localhost:3000/`
- Login: `http://localhost:3000/login`
- Register: `http://localhost:3000/register`
- Dashboard: `http://localhost:3000/homepage`
- Create Workspace: `http://localhost:3000/workspace/create`
- Chat (example): `http://localhost:3000/chat/1`
- Call (example): `http://localhost:3000/call/1`
- AI Search: `http://localhost:3000/ai-search`
- About: `http://localhost:3000/about`
- Contact: `http://localhost:3000/contact`

## Route Protection Status

### Current Implementation
All routes are currently **accessible** (UI only).

### Recommended Protection (for production)
- ✅ Public: `/`, `/login`, `/register`, `/about`, `/contact`, `/solutions`, `/resources`
- 🔒 Protected: `/homepage`, `/workspace/*`, `/chat/*`, `/call/*`, `/ai-search`

### Protection Implementation (Next Steps)
```typescript
// middleware.ts (to be created)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/homepage')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

## API Routes (Future)

When backend is added, suggested API routes:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/workspaces`
- `GET /api/workspaces/:id`
- `POST /api/messages`
- `GET /api/messages/:channelId`
- `POST /api/search`
- `POST /api/upload`

## Route File Structure

```
src/app/
├── page.tsx                      → /
├── layout.tsx                    → Root layout for all routes
├── login/
│   └── page.tsx                  → /login
├── register/
│   └── page.tsx                  → /register
├── homepage/
│   └── page.tsx                  → /homepage
├── workspace/
│   └── create/
│       └── page.tsx              → /workspace/create
├── chat/
│   └── [id]/
│       └── page.tsx              → /chat/[id]
├── call/
│   └── [id]/
│       └── page.tsx              → /call/[id]
├── ai-search/
│   └── page.tsx                  → /ai-search
├── about/
│   └── page.tsx                  → /about
├── contact/
│   └── page.tsx                  → /contact
├── solutions/
│   └── page.tsx                  → /solutions
└── resources/
    └── page.tsx                  → /resources
```

## Accessible From Each Page

### From Navbar (All Pages)
- Homepage
- Solutions
- Resources
- About Us
- Contact Us
- Login
- Get Started (Register)

### From Chat Interface
- Back to Homepage
- AI Search
- Start Call
- Channel switching
- DM switching

### From Call Page
- End Call → Returns to Chat

### From Any Page
- Navigation via browser back/forward
- Direct URL access

## Testing Routes

To test all routes, visit in order:
1. ✅ `http://localhost:3000/` - Landing
2. ✅ `http://localhost:3000/register` - Register
3. ✅ `http://localhost:3000/login` - Login
4. ✅ `http://localhost:3000/homepage` - Dashboard
5. ✅ `http://localhost:3000/workspace/create` - Create Workspace
6. ✅ `http://localhost:3000/chat/1` - Chat
7. ✅ `http://localhost:3000/call/1` - Call
8. ✅ `http://localhost:3000/ai-search` - AI Search
9. ✅ `http://localhost:3000/about` - About
10. ✅ `http://localhost:3000/contact` - Contact

---

**All 12 routes are fully implemented and accessible!** 🎉
