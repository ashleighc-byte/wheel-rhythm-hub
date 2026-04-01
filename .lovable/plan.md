
## What We're Building

Three things to get Free Wheeler ready for schools:

### 1. Clarify the Registration Flow (No Code Changes Needed)

The flow already works end-to-end:
1. **School newsletter** includes link to permission form (`https://bit.ly/FreewheelerPermission`)
2. **Caregiver fills out Airtable form** — selects school, provides consent
3. **You (admin) review** in Airtable, set Consent Status to "active"
4. **You create NFC bracelet** — write a unique token, enter it in the student's Airtable record, set NFC Status to "active"
5. **Student receives bracelet + merch pack** from their teacher
6. **Student taps bracelet** → `/tap/:token` → validated → session form opens

**Students do NOT need email/password signup.** The NFC bracelet bypasses all auth. They never need to visit `/auth`. The existing "What Happens Next?" on the registration page mentions email signup — we'll update that to remove the email signup step and explain they'll receive a bracelet instead.

### 2. NFC First-Tap Onboarding Tour

When a student taps their bracelet for the **first time**, show a guided walkthrough before opening the session form. This teaches them the full workflow.

**Persistence**: Use `localStorage` keyed by the NFC token (since NFC users have no Supabase user ID).

**Tour steps** (5 steps):
1. **Welcome** — "Hey {name}! Welcome to Free Wheeler Bike League. Let's show you how it works."
2. **The Ride** — "Hop on the smart bike and select a track in MyWhoosh. Ride for as long as you want — every minute counts!"
3. **Take a Screenshot** — "When you finish your ride, take a screenshot on the iPad or tablet. On iPad: press the top button + volume up at the same time. On Android: press power + volume down."
4. **Log Your Session** — "Scan your bracelet, find your screenshot, rate how you felt, and hit submit. Your points update instantly!"
5. **Check Your Stats** — "Visit the Leaderboards to see how you rank. Check Your Stats for your personal progress. Now let's log your first ride!"

After completing or skipping the tour → open the session form as normal.

**Files to change:**
- `src/pages/NfcTap.tsx` — add onboarding state, show tour before session form
- `src/components/NfcOnboardingTour.tsx` — new component, simpler than the existing tooltip-based tour (full-screen card-based slides, no DOM targeting needed since NFC users land on a blank page)

### 3. School Newsletter Flyer

Generate a downloadable PDF/image flyer for school newsletters containing:
- Free Wheeler logo and branding
- Headline: "Join the Free Wheeler Bike League!"
- Brief description of the programme
- QR code linking to `https://bit.ly/FreewheelerPermission`
- The URL written out for non-QR scanning
- "Limited to 24 spots per school" urgency note
- Brand colours (#2B220D, #84A914, #DBFE66, #D5E7C4)

This will be generated as a downloadable artifact to `/mnt/documents/`.

### 4. Update Student Registration Page

Update the "What Happens Next?" section on `/studentregistration` to reflect the bracelet flow:
1. Complete the permission form with your caregiver
2. Wait for confirmation from your school
3. Receive your Free Wheeler bracelet and merch pack
4. Tap your bracelet on the school iPad to start riding
5. That's it — no passwords, no accounts needed!

Remove the mention of signing up at freewheeler.lovable.app with email.

### Technical Summary

| Change | File(s) | Complexity |
|--------|---------|------------|
| NFC onboarding tour component | New: `src/components/NfcOnboardingTour.tsx` | Medium |
| Wire tour into NFC tap flow | `src/pages/NfcTap.tsx` | Small |
| Update registration page copy | `src/pages/StudentRegistration.tsx` | Small |
| Generate newsletter flyer PDF | Script → `/mnt/documents/` | Medium |
