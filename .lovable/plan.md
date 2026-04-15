

## Swapping Airtable Credentials

### Will it break everything?

**No, it should work seamlessly** — as long as the copied base has the same table names, field names, and record IDs. Since you said the data was copied, the record IDs (like `reci1yUz0iOkalz5K`) should be preserved, meaning NFC bracelets will continue working.

### What needs to change

Only **two secrets** need updating in Lovable Cloud:

1. **AIRTABLE_API_KEY** → your new API token from the living-lab@sportwaikato.nz account
2. **AIRTABLE_BASE_ID** → `app4IEpE10xJPsLxT`

These are already configured as edge function secrets. Updating them will immediately affect all edge functions (airtable-proxy, sync-leaderboard, backfill-points, assign-role, registration-count) without any code changes.

### What stays the same

- All code references use `Deno.env.get('AIRTABLE_API_KEY')` and `Deno.env.get('AIRTABLE_BASE_ID')` — no hardcoded values
- Table names (Student Registration, Session Reflections, Organisations, etc.) remain the same
- Record IDs are preserved in the copy, so NFC tap URLs still resolve
- Leaderboard cache will refresh on the next sync cycle with data from the new base

### Risk check

The only risk is if Airtable's "duplicate base" changed record IDs. You can verify by checking that `reci1yUz0iOkalz5K` exists in the new base's Student Registration table. If it does, everything will work.

### Steps

1. I will update the **AIRTABLE_BASE_ID** secret to `app4IEpE10xJPsLxT`
2. I will update the **AIRTABLE_API_KEY** secret with your new token (you will be prompted to enter it)
3. Redeploy edge functions so the new secrets take effect
4. Trigger a leaderboard sync to refresh cached data from the new base

No code changes are needed.

