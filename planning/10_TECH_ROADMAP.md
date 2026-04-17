# Freewheeler — Technology Roadmap
<!-- AIRTABLE IMPORT: Table: Tech Roadmap | Key fields: Feature, Phase, Priority, Status, Owner, Target Date, Notes -->

---

## Technology Vision

Free Wheeler's technology should feel invisible to students and teachers — it just works. Behind the scenes, it provides a seamless connection between the physical experience (riding a Wattbike) and the digital experience (points, leaderboards, achievements). As the programme scales, the technology must scale with it without requiring proportional increases in developer time.

**Core Principle:** Technology should reduce friction — every extra tap, login, or step that students have to do is a drop in engagement.

---

## Current Stack (Phase 0 — April 2026)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + TypeScript + Vite (via Lovable.dev) | Hosted at freewheeler.lovable.app |
| UI Library | shadcn/ui + Tailwind CSS | Responsive design |
| Animations | Framer Motion | |
| Routing | React Router 6 | |
| Data fetching | TanStack Query | Caching + server sync |
| Authentication | Supabase Auth (JWT) | Email/password sign-in |
| Database | Airtable (base: app4IEpE10xJPsLxT) | Proxied via Supabase Edge Function |
| Edge Functions | Supabase Deno (TypeScript) | airtable-proxy function |
| Storage | Supabase Storage | Session screenshots |
| Session sync | Manual entry (student photographs MyWhoosh screen) | Primary friction point — see Phase 1 |

### Current Airtable Schema

| Table | Purpose |
|-------|---------|
| Student Registration | Student accounts, school links, consent status |
| Session Reflections | All ride session logs (manual entry) |
| Survey Questions | Survey definitions + student responses |
| Organisations | Schools — linked to students |

---

## Phase 1 — Pilot Stabilisation (Term 2 2026)

**Goal:** Fix all known bugs; make the app reliable for 100+ students across 7 schools.

| Feature / Fix | Priority | Status | Owner |
|--------------|----------|--------|-------|
| Auth race condition fix (role null on fresh login) | Critical | ✅ Done | Dev |
| Survey loop fix (student stuck after submission) | Critical | ✅ Done | Dev |
| Survey completion server-side check | High | ✅ Done | Dev |
| Screenshot optional for session log | High | ✅ Done | Dev |
| Welcome back [Name] on login screen | Medium | ✅ Done | Dev |
| Cancel button on Mid/Post surveys | Medium | ✅ Done | Dev |
| School leaderboard scoped to school only | High | ✅ Done | Dev |
| Dashboard server-side survey sync | High | ✅ Done | Dev |
| Active nav state (underline current page) | Low | ✅ Done | Dev |
| Mobile nav flattened for usability | Medium | ✅ Done | Dev |
| Admin hero: "Track your riders" | Low | ✅ Done | Dev |
| Empty state banner for first ride | Low | ✅ Done | Dev |
| Post Phase date/session threshold restored | Medium | ✅ Done | Dev |
| NFC session start flow | High | ✅ Done | Dev |

---

## Phase 2 — Enhanced Experience (Term 3 2026)

**Goal:** Improve session logging flow; add teacher dashboard; begin real-time leaderboard.

### P2.1 — Session Logging Improvements

| Feature | Description | Priority | Target Date |
|---------|-------------|----------|-------------|
| MyWhoosh screenshot auto-parse | Use OCR or image analysis to extract stats from MyWhoosh screenshot instead of manual entry | High | Q3 2026 |
| Session data auto-fill | Pre-fill session form from parsed screenshot data | High | Q3 2026 |
| Wattbike Bluetooth data capture | Explore direct Wattbike API / BLE connection to capture power, cadence, duration | Medium | Q4 2026 |
| Session log "quick mode" | Simplified 2-field form (duration + mood) as alternative to full form | Medium | Q3 2026 |

### P2.2 — Teacher Dashboard

| Feature | Description | Priority | Target Date |
|---------|-------------|----------|-------------|
| Teacher view: school overview | Sessions this week, active students, leaderboard for their school | High | Q3 2026 |
| Teacher view: individual student drill-down | See a specific student's session history | Medium | Q3 2026 |
| Teacher view: survey completion tracker | See which students have completed each survey phase | High | Q3 2026 |
| Teacher notifications | Email digest: "This week at [School Name]" with key stats | Medium | Q4 2026 |
| Export school data | Download CSV of school sessions, student list | Low | Q4 2026 |

### P2.3 — Leaderboard and Gamification Enhancements

| Feature | Description | Priority | Target Date |
|---------|-------------|----------|-------------|
| Real-time leaderboard | WebSocket or polling refresh so leaderboard updates live during session | Medium | Q3 2026 |
| Weekly challenge completion tracking | Show progress toward current week's challenge (e.g. "3/5 sprints done") | High | Q3 2026 |
| Season progress bar | Visual showing where student is in the 8-week season | Low | Q3 2026 |
| Achievement badges | Earn badges for milestones: first session, 5 sessions, Gold level, Legend level | Medium | Q3 2026 |
| Level-up animation | Celebratory animation when student reaches new level | Low | Q3 2026 |
| School vs school banner | "Your school is 3rd — can you move up this week?" contextual prompt | Medium | Q4 2026 |

---

## Phase 3 — Platform Scaling (2027)

**Goal:** Support 60+ schools, multiple RST admins, automated reporting, API integrations.

### P3.1 — Multi-Region Admin

| Feature | Description | Priority |
|---------|-------------|----------|
| RST admin role | Admin users scoped to their RST region only | Critical |
| Regional leaderboard | Leaderboard showing top schools within an RST region | High |
| National leaderboard | All-NZ leaderboard (top school per region) | High |
| RST dashboard | RST admin sees: schools in their region, participation rates, KPIs | High |
| Bulk school onboarding | CSV import to add 10+ schools at once | Medium |
| Bulk student import | CSV upload to pre-register students (via school roll) | Medium |

### P3.2 — MyWhoosh API Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| MyWhoosh OAuth connect | Student connects MyWhoosh account to Free Wheeler account | Critical |
| Auto session sync | Completed MyWhoosh rides auto-import to Free Wheeler as sessions | Critical |
| Session data mapping | Map MyWhoosh fields (time, distance, elevation, power) to Free Wheeler session record | High |
| Conflict handling | If student also manually logs a session, deduplicate | Medium |

*Note: Contact MyWhoosh Partnerships (partnerships@mywhoosh.com) to discuss API access. Wattbike may also have a direct sensor API — explore both.*

### P3.3 — Automated Reporting

| Feature | Description | Priority |
|---------|-------------|----------|
| Weekly report email | Auto-generated email to Grant + RST admin with key stats | High |
| KPI dashboard (live) | Public-facing dashboard (password protected) showing real-time season stats | Medium |
| Grant reporting export | One-click export of all KPI data in Sport NZ grant report format | Medium |
| End-of-season report generator | Auto-generate school-specific PDF reports from Airtable data | Medium |

### P3.4 — Technical Debt and Infrastructure

| Item | Action | Priority |
|------|--------|----------|
| Airtable rate limiting | Implement request queue + retry logic to handle Airtable API rate limits at scale | High |
| Supabase Edge Function resilience | Add error monitoring + alerting (e.g. Sentry) | High |
| Database migration | Evaluate moving from Airtable to Supabase Postgres at 100+ schools | Medium |
| CDN and caching | Implement CDN for static assets; improve load time on slow school networks | Medium |
| Accessibility (WCAG 2.1 AA) | Audit and fix accessibility — important for school context | Medium |
| Performance budget | All pages load in <3 seconds on 4G | Medium |

---

## Phase 4 — Mobile App (2028)

**Goal:** Native iOS and Android app to replace the web app as the primary student interface.

### Why a Mobile App
- Students can log sessions from their phone immediately after riding (no need to use school device)
- Push notifications for challenges, leaderboard updates, survey reminders
- Offline mode: log session without wifi, sync when connected
- Camera integration: take MyWhoosh screenshot in-app

### Mobile App Features (MVP)

| Feature | Description |
|---------|-------------|
| Student login | Same Supabase auth |
| Session logging | Take photo of MyWhoosh screen → auto-parse stats |
| Leaderboard | School + national leaderboard with pull-to-refresh |
| Points and level | My stats: sessions, points, level, level progress bar |
| Challenges | Current challenge progress, challenge history |
| Surveys | Complete surveys in-app with push notification prompt |
| Push notifications | Session reminders, leaderboard updates, challenge launches |

### Tech Stack (Mobile)
- React Native (Expo) — shares business logic with web app
- Supabase JS client (same auth + data layer)
- Expo Camera for screenshot capture
- Expo Notifications for push notifications

---

## Phase 5 — Advanced Features (2029+)

| Feature | Description | Value |
|---------|-------------|-------|
| Live race mode | Multiple students at one school can race each other live in MyWhoosh — visible in Free Wheeler with real-time positions | High engagement event feature |
| Inter-school virtual event | Scheduled race event where top riders from each school compete at the same time in MyWhoosh | National championship enabler |
| Coach / PE teacher session creation | Teachers can create custom challenges for their school | Teacher empowerment |
| AI-powered personalised challenges | Suggest challenges based on individual student's performance and history | Engagement at scale |
| Wearable integration | Connect Apple Watch / Garmin for heart rate data to session records | Data richness |
| Parent portal | Parents can see their child's participation (with student consent) | Community engagement |
| Multilingual support | Te Reo Māori + Pacific Island languages | Equity and inclusion |

---

## Technology Budget

| Phase | Period | Estimated Cost (NZD) | Notes |
|-------|--------|----------------------|-------|
| Phase 1 (stabilisation) | 2026 | $5,000–$10,000 | Bug fixes, minor features |
| Phase 2 (enhancements) | 2026–2027 | $20,000–$40,000 | Teacher dashboard, MyWhoosh screenshot parse |
| Phase 3 (scaling) | 2027 | $50,000–$80,000 | Multi-region, API integration, automated reporting |
| Phase 4 (mobile app) | 2028 | $80,000–$150,000 | MVP mobile app (iOS + Android) |
| Phase 5 (advanced) | 2029+ | $100,000+ | Live racing, AI features, integrations |

---

## Technology Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Airtable rate limits block the app at scale | Medium | High | Implement queuing; evaluate Postgres migration |
| MyWhoosh changes their API or pricing | Low | High | Manual entry fallback always maintained |
| Lovable.dev platform changes | Medium | Medium | Keep codebase portable; export to standard Vite/React if needed |
| Wattbike Bluetooth API not available | Medium | Medium | Screenshot parse as primary method; BLE as stretch goal |
| Developer availability bottleneck | High | High | Document everything; don't create one-person knowledge silos |

---

## Tech Decisions Log

| Decision | Rationale | Date | Alternatives Considered |
|----------|-----------|------|------------------------|
| Airtable as primary DB (not Supabase Postgres) | Grant can manage data directly without SQL; rapid iteration during pilot | 2026 | Supabase Postgres (harder to manage without a full-time dev) |
| Lovable.dev for frontend hosting | Fast iteration; non-technical deploys; integrates with React/Vite | 2026 | Vercel, Netlify |
| MyWhoosh as virtual platform | Free to use; good product; growing global user base | 2026 | Zwift (too expensive for school context) |
| Manual session logging (Phase 0) | Fast to build; no API dependency | 2026 | Auto-sync (Phase 2+ goal) |

---

*Last updated: April 2026 | Owner: Dev + Grant | Organisation: Sport Waikato | Review: Quarterly*
