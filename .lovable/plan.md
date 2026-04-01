

## Plan: Student Registration Flow, NFC Onboarding Tour & Newsletter Flyer

### How the Flow Works (No Major Code Changes Needed)

Your existing system already supports the full bracelet-only flow:

1. **Newsletter flyer** goes to schools with link to permission form
2. **Caregiver fills out Airtable form** — selects school, signs MoU
3. **You review in Airtable** — set Consent Status to "active"
4. **You create NFC bracelet** — write unique token, add to student's Airtable record, set NFC Status to "active"
5. **Hand out bracelet packs** to schools
6. **Student taps bracelet** → `/tap/:token` → validated → ready to ride

**Students do NOT need email/password signup.** The NFC bracelet bypasses all authentication. They never visit `/auth`. The registration page currently tells them to sign up with email — we'll fix that.

After the Airtable permission form, show a confirmation message like: *"You're registered! Your teacher will give you your Free Wheeler bracelet and merch pack. Tap your bracelet on the school iPad to start riding — no account or password needed."*

---

### What We'll Build

#### 1. Update Student Registration Page Copy
**File:** `src/pages/StudentRegistration.tsx`

Change the "What Happens Next?" section to reflect the bracelet flow:
1. Complete the permission form with your caregiver
2. Wait for confirmation from your school
3. Receive your Free Wheeler bracelet and merch pack from your teacher
4. Tap your bracelet on the school iPad to start riding
5. No passwords, no accounts — just tap and ride!

Remove the mention of signing up at freewheeler.lovable.app with email.

#### 2. NFC First-Tap Onboarding Tour
**New file:** `src/components/NfcOnboardingTour.tsx`
**Modified file:** `src/pages/NfcTap.tsx`

When a student taps their bracelet for the **first time**, show a full-screen card-based walkthrough (not tooltip-based — there's nothing to point at on the NFC page). Persisted via `localStorage` keyed by NFC token.

**5 slides:**
1. **Welcome** — "Hey {name}! Welcome to Free Wheeler Bike League."
2. **The Ride** — "Hop on the smart bike, select a track in MyWhoosh, and ride for as long as you want."
3. **Screenshot** — "When you finish, take a screenshot. iPad: top button + volume up. Android: power + volume down."
4. **Log Your Session** — "Scan your bracelet, find your screenshot, rate how you felt, and submit. Points update instantly!"
5. **Explore** — "Check the Leaderboards to see how you rank. Visit Your Stats for personal progress. Let's log your first ride!"

After completing → open session form as normal.

#### 3. School Newsletter Flyer (PDF)
Generate a branded A4 flyer to `/mnt/documents/` with:
- Free Wheeler logo and brand colours
- "Join the Free Wheeler Bike League!" headline
- Brief programme description
- QR code to `https://bit.ly/FreewheelerPermission`
- URL written out below QR code
- "Limited to 24 spots per school" urgency callout
- Brand palette: #2B220D, #84A914, #DBFE66, #D5E7C4

---

### Technical Summary

| Change | File(s) | Size |
|--------|---------|------|
| Update registration page copy | `src/pages/StudentRegistration.tsx` | Small |
| NFC onboarding tour component | New: `src/components/NfcOnboardingTour.tsx` | Medium |
| Wire tour into NFC tap flow | `src/pages/NfcTap.tsx` | Small |
| Generate newsletter flyer PDF | Script → `/mnt/documents/` | Medium |

