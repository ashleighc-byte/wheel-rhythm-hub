# Airtable Changes — BikeTerra / Bluetooth Integration
**Date:** April 2026
**Why:** Adding direct Wattbike Bluetooth data capture means session performance data now
comes from the bike in real-time instead of manual entry. These new fields store that data
cleanly alongside the existing reflection fields.

---

## Table: Session Reflections

Go to your **Session Reflections** table and add the following fields.
Do this before deploying the new `/ride` page — the app will start writing to these
fields as soon as students complete a Bluetooth ride.

---

### Fields to Add

#### 1. Distance (km)
| Setting | Value |
|---------|-------|
| Field type | **Number** |
| Format | Decimal |
| Precision | 2 decimal places |
| Allow negative | No |

---

#### 2. Duration (min)
| Setting | Value |
|---------|-------|
| Field type | **Number** |
| Format | Decimal |
| Precision | 1 decimal place |
| Allow negative | No |

> This stores duration in minutes as a decimal (e.g. 22.5 for 22 min 30 sec).
> Keep the existing "Total minutes" and "Rollup Minutes" fields — the app reads
> those first and falls back to this field. Over time this replaces the JSON blob.

---

#### 3. Avg Speed (km/h)
| Setting | Value |
|---------|-------|
| Field type | **Number** |
| Format | Decimal |
| Precision | 1 decimal place |
| Allow negative | No |

---

#### 4. Elevation (m)
| Setting | Value |
|---------|-------|
| Field type | **Number** |
| Format | Integer |
| Allow negative | No |

> Keep the existing "Total Elevation" field. The app reads "Total Elevation" first and
> falls back to this field. Over time this replaces the JSON blob approach.

---

#### 5. Avg Power (W)
| Setting | Value |
|---------|-------|
| Field type | **Number** |
| Format | Integer |
| Allow negative | No |

> **New field — did not exist before.** This stores the average wattage output from the
> Wattbike Proton for Bluetooth sessions. Manual sessions leave this blank.
> Used for the power bonus in the points calculation.

---

#### 6. Course Name
| Setting | Value |
|---------|-------|
| Field type | **Single line text** |

> Stores the BikeTerra route name the student selected for the ride
> (e.g. "Rotorua Redwoods Loop"). Replaces the `courseMap` JSON blob field.
> Used for the track variety bonus in points calculation.

---

#### 7. Ride Source
| Setting | Value |
|---------|-------|
| Field type | **Single select** |
| Options | `Bluetooth`, `Manual` |

> Tracks how the session data was captured. Useful for analytics:
> what % of sessions are now auto-captured vs still manually entered.
> Default for new Bluetooth rides: **Bluetooth**.
> Default for old/manual rides: **Manual**.

---

## No Other Tables Need Changes

The following tables are **unchanged**:
- Student Registration — no new fields needed
- Organisations — no new fields needed
- Survey Questions — no new fields needed

---

## After Adding the Fields

1. Go to **Airtable → Session Reflections → any existing record** and confirm the
   new fields appear (they will be empty on old records — that's fine).
2. The app will start writing to these fields as students complete Bluetooth rides.
3. Old manual sessions will continue to work as before — the points engine reads
   the existing rollup fields first and falls back to the new direct fields.

---

## Optional: Update Your Airtable Views

Add the new fields to your **Grid View** column order so you can see them:
1. Click the **+** (add field) arrow at the right edge of the grid
2. Select "Show fields" and drag the new fields into view
3. Suggested column order: Student Registration | Date | Course Name | Distance (km) |
   Duration (min) | Avg Speed (km/h) | Elevation (m) | Avg Power (W) | Ride Source |
   Feeling Before | Feeling After | Reflection

---

*Last updated: April 2026 | Owner: Grant | Review: After pilot completion*
