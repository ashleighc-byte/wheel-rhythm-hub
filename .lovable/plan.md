## Plan: Dynamic Airtable-Driven Survey System

### 1. Remove Old Surveys
- Delete `src/pages/PrePilotSurvey.tsx`, `src/pages/PostPilotSurvey.tsx`, `src/pages/FourWeekCheckIn.tsx`
- Remove their routes from `App.tsx`
- Remove survey gate logic from `ProtectedRoute` in `App.tsx`
- Remove `hasCompletedPrePilotSurvey`, `hasCompletedFourWeekCheckIn`, `hasDeferredFourWeekCheckIn`, `deferFourWeekCheckIn`, `markFourWeekCheckInCompleted` helpers from `src/lib/airtable.ts`

### 2. Create Airtable Helpers
- Add `fetchSurveyQuestions(phase: string)` — fetches from "Survey Questions" table filtered by Phase
- Add `submitSurveyResponses(studentId, phase, responses)` — POSTs to "Survey Responses" table
- Add `fetchSurveyCompletions(studentRecordId)` — checks which phases are completed
- Update edge function proxy to allow these new tables

### 3. New Dynamic Survey Component
- Create `src/components/DynamicSurvey.tsx` — renders questions dynamically based on field type:
  - Single select → radio buttons
  - Multi select → checkbox group
  - Rating → star/slider
  - Text → textarea
  - Number → number input
- Progress indicator ("Question 3 of 10")
- Mobile-first, smooth transitions
- On submit: save to "Survey Responses" table

### 4. Survey Triggers & Pages
- Create `src/pages/SurveyPage.tsx` — wrapper that loads questions for a given phase and renders DynamicSurvey
- **Pre Phase**: Show as full-screen blocker on first login (replaces old pre-pilot gate in App.tsx ProtectedRoute)
- **Mid Phase**: Check if 4 weeks since student Start Date; show modal/banner on dashboard
- **Post Phase**: Shown as checklist item on dashboard, opens survey on click

### 5. Dashboard Integration
- Add "Surveys" section to Dashboard showing all 3 phases with completion status
- Post Phase appears as checklist item
- Mid Phase shows banner prompt when due

### 6. Completion Tracking
- Store completion in Airtable "Survey Responses" table (query by student + phase)
- Cache locally to avoid repeated API calls

### Technical Notes
- No hardcoded questions — everything driven by Airtable "Survey Questions" table
- Edge function proxy needs "Survey Questions" (GET) and "Survey Responses" (GET/POST) added to allowed tables
- Airtable table structure assumed:
  - **Survey Questions**: Phase, Question Text, Field Type, Answer Options, Order
  - **Survey Responses**: Student (linked), Phase, Question (linked or text), Response

### Files Changed
| Action | File |
|--------|------|
| Delete | `src/pages/PrePilotSurvey.tsx`, `src/pages/PostPilotSurvey.tsx`, `src/pages/FourWeekCheckIn.tsx` |
| Edit | `src/App.tsx` (remove old routes, add new survey route, update gate) |
| Edit | `src/lib/airtable.ts` (remove old helpers, add new survey helpers) |
| Edit | `supabase/functions/airtable-proxy/index.ts` (allow new tables) |
| Create | `src/components/DynamicSurvey.tsx` |
| Create | `src/pages/SurveyPage.tsx` |
| Edit | `src/pages/Dashboard.tsx` (add surveys section, mid-phase prompt) |
