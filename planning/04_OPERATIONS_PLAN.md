# Freewheeler — Operations Plan
<!-- AIRTABLE IMPORT: Table: Operations Plan | Key fields: Process, Step, Owner, Timing, Status, Notes -->

---

## Operations Overview

Free Wheeler runs on a "set it up and step back" model. The programme is designed so that after installation and induction, it requires zero ongoing teacher effort. Operations are managed centrally by Sport Waikato, with schools only needing to direct students to the bikes and share occasional communications.

**Operational Principle:** If a school is doing more than 2 hours of admin per term, we have failed.

---

## 1. School Onboarding Process

### Step-by-Step School Onboarding

| Step | Action | Owner | Timing | Status Check |
|------|--------|-------|--------|-------------|
| 1 | Principal agrees to participate | Grant | Pre-season | Verbal confirmation |
| 2 | MOU sent and signed | Grant | Pre-season | Signed MOU on file |
| 3 | School contact / champion identified (PE Teacher) | Grant | Pre-season | Name + email confirmed |
| 4 | Physical space confirmed (near power outlet, accessible) | Teacher | Pre-season | Space confirmed in writing |
| 5 | Wattbikes ordered / scheduled for delivery | Grant | Pre-season | Delivery date confirmed |
| 6 | NFC tokens ordered | Grant | Pre-season | Tokens on hand |
| 7 | Wattbikes delivered and installed | Grant | Week before season | Installation checklist signed |
| 8 | Wattbikes tested (MyWhoosh login, power calibration) | Grant | Week before season | Test session completed |
| 9 | Teacher induction (30 min) — Zoom or in-person | Grant | Week before season | Induction completed |
| 10 | Student registration QR codes printed and displayed | Teacher | Day 1 of season | Poster displayed at bike |
| 11 | School announcement made (assembly, email, class) | Teacher | Week 1 | Announcement confirmed |
| 12 | First students register and ride | Students | Week 1–2 | First session logged in app |

### Wattbike Installation Checklist

- [ ] Bikes delivered and unboxed
- [ ] Assembled per Wattbike instructions
- [ ] Power cables routed to outlet
- [ ] Both bikes connected to wifi (school network)
- [ ] MyWhoosh app loaded on display device (iPad or school TV)
- [ ] MyWhoosh test account logged in and functional
- [ ] NFC reader positioned near bike
- [ ] NFC tokens programmed and functional
- [ ] QR code poster printed and displayed
- [ ] Emergency stop tested on both bikes
- [ ] Seat height adjustment demonstrated to teacher
- [ ] Wattbike support contact left with school

---

## 2. Student Onboarding Process

### Student Registration Flow

1. Student sees QR code poster at the bike
2. Scans QR → freewheeler.lovable.app
3. Clicks "Create Account" → enters name + school email
4. System checks against Student Registration list in Airtable
5. If approved: account active, directed to Pre Phase survey
6. If not found: message displayed — "Contact your teacher to add you to the programme"
7. Pre Phase survey completed → student enters the app
8. First session: tap NFC or scan QR at bike → log session in app

### Pre Phase Survey Requirements

- Pre Phase survey is **mandatory** before first dashboard access
- Survey gate enforced in app — cannot skip
- Questions cover baseline fitness confidence, prior cycling experience, sport participation, and wellbeing

---

## 3. Weekly Operations Schedule

### Grant's Weekly Task List (During Season)

| Day | Task | Time Required |
|-----|------|---------------|
| Monday | Review weekend session logs in Airtable | 15 min |
| Monday | Check for any tech support requests via email | 10 min |
| Wednesday | Send weekly update email to schools (use template) | 20 min |
| Wednesday | Post weekly social media content | 15 min |
| Thursday | Update KPI dashboard in Airtable | 20 min |
| Friday | Check leaderboard accuracy, flag anomalies | 10 min |
| End of Week 4 | Trigger Mid Phase survey in app | 5 min |
| End of Week 7 | Trigger Post Phase survey in app | 5 min |

**Total weekly operations time: ~1.5 hours per week**

---

## 4. Mid-Season Check-in Process

At Week 4, Grant conducts a brief check-in with each school contact:

**Check-in topics:**
1. Session volume — are students riding?
2. Any technical issues at the bike?
3. Any concerns from students or teachers?
4. Any upcoming school events that might affect participation?

**Check-in method:** Phone call (preferred) or email using template in `05_EMAIL_SERIES.md`

---

## 5. Incident Management

### Issue Categories and Response

| Category | Examples | Response Time | Owner | Resolution |
|----------|---------|--------------|-------|-----------|
| Critical — student safety | Injury at bike, bike malfunction causing fall | Immediate | Grant | Call school immediately, remove bike from use, file incident report |
| High — complete tech failure | App inaccessible, all logins fail | 2 hours | Dev | Hotfix deployment via Lovable/Supabase |
| Medium — partial tech issue | Session not logging, survey stuck, leaderboard not updating | Same day | Dev | Fix + notify affected students |
| Low — minor UX issue | Confusing copy, button misalignment | Within 1 week | Dev | Log in GitHub issues, fix in next sprint |
| School-related — low engagement | No sessions logged in 2 weeks | Within 2 days | Grant | Check-in call with teacher |
| School-related — equipment | Bike out of alignment, pedal issue | Within 48 hours | Grant | Site visit or Wattbike support call |

### Incident Report Template

```
DATE: 
SCHOOL:
INCIDENT TYPE: Safety / Tech / Engagement / Equipment
DESCRIPTION:
IMMEDIATE ACTION TAKEN:
FOLLOW-UP REQUIRED:
RESOLVED: Yes / No / In Progress
RESOLUTION DATE:
NOTES:
```

---

## 6. Technology Operations

### App Stack

| Component | Tool | Owner | Access |
|-----------|------|-------|--------|
| Frontend | Lovable.dev (React/Vite) | Dev | lovable.dev dashboard |
| Auth + Storage | Supabase | Dev | supabase.com project dashboard |
| Database | Airtable (app4IEpE10xJPsLxT) | Grant | airtable.com |
| Edge Functions | Supabase Deno functions | Dev | Supabase functions dashboard |
| Domain | freewheeler.lovable.app | Dev | Lovable settings |

### Airtable Table Reference

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| Student Registration | Student accounts, school links, consent | Name, Email, School, Consent Status |
| Session Reflections | All logged ride sessions | Student, Date, Duration, Distance, Points |
| Survey Questions | Survey question definitions AND student responses | Phase, Question, Student Name, Answer |
| Organisations | Schools / partner organisations | School Name, Student Registration links |

### Routine Maintenance

| Task | Frequency | Owner |
|------|-----------|-------|
| Check Supabase error logs | Weekly | Dev |
| Verify Airtable sync (sessions logging correctly) | Weekly | Grant |
| Test NFC at all schools (start of each term) | Term start | Grant |
| Update app to latest version (push via Lovable) | As needed | Dev |
| Back up Airtable data (CSV export) | Monthly | Grant |

---

## 7. End of Season Process

### Season Wrap-Up Checklist

| Task | Owner | Timing |
|------|-------|--------|
| Post Phase surveys triggered and reminder sent | Grant | Week 8 |
| Final leaderboard screenshot taken | Grant | Final day |
| Season summary report generated from Airtable | Grant | Week 8+1 |
| All KPI data exported and saved | Grant | Week 8+1 |
| End-of-pilot school survey sent to all teachers | Grant | Week 8+1 |
| Thank-you email sent to all teachers | Grant | Week 8+1 |
| Student achievement certificates generated (if applicable) | Dev | Week 8+1 |
| Wattbike condition checked at each school | Grant | Week 8+2 |
| Decision made on continuing vs pausing next season | Grant + Sport Waikato | End of Term 2 |
| Pilot wrap-up report completed and sent to Sport NZ | Grant | 2 weeks post-season |

### Season Close Report Template

```
SEASON: Term [X] [Year]
SCHOOLS ACTIVE: X of X
TOTAL REGISTERED STUDENTS: 
TOTAL SESSIONS LOGGED:
AVERAGE SESSIONS PER STUDENT:
PRE PHASE SURVEY COMPLETION:
MID PHASE SURVEY COMPLETION:
POST PHASE SURVEY COMPLETION:
STUDENT NPS (Q9 Post Survey avg):
TOP 3 SCHOOLS BY SESSIONS:
KEY WINS:
KEY ISSUES:
RECOMMENDATIONS FOR NEXT SEASON:
CONTINUATION DECISION:
```

---

## 8. MOU Template (Summary)

*Full MOU is a separate document. Key terms:*

- School receives 2 x Wattbike smart bikes at no cost for the duration of the pilot
- School provides a suitable space with power and wifi access
- School agrees to basic promotional duties (one announcement, QR code poster displayed)
- Sport Waikato retains ownership of all equipment
- School may withdraw at any time with 2 weeks notice
- Data collection and consent managed by Sport Waikato / Freewheeler app
- No financial obligation to school during pilot phase

---

*Last updated: April 2026 | Owner: Grant | Organisation: Sport Waikato | Review: Pre-season*
