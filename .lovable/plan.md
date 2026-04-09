
# Brand Visual Redesign – Professional Audit & Fix

## Problems Identified
1. **Brand graphics used as dark, barely-visible background textures** – the "Pedal Your Own Path" and "Chain" graphics are crammed into `object-cover` backgrounds with 15-25% opacity, making them unrecognizable
2. **Dashboard hero section** is a dark brown bar with the chain graphic invisible behind it
3. **About/Info page hero** has the "Pedal Your Own Path" graphic as an unrecognizable dark smear
4. **Generic Lucide icons** used for bike icon on dashboard instead of the brand bike icon from the logo
5. **No use of the brand's neon (#DBFE66) "tape device" energy** in section transitions or decorative elements
6. **Large empty spaces** between sections with no visual interest

## Proposed Changes

### 1. Create a Brand Bike SVG Icon Component
- Extract the cyclist icon from the logo as a reusable SVG component
- Use it in the dashboard greeting, stat cards, and anywhere a bike icon appears
- Replace the generic Lucide `Bike` icon throughout

### 2. Dashboard Hero Redesign
- Remove the barely-visible background image
- Use the brand's dark brown + neon green pattern: bold "HEY, NAME" with the brand cyclist icon
- Add a subtle speed-lines pattern (from the brand tape device) as decoration

### 3. About/Info Page Hero Redesign  
- Remove the background image approach entirely
- Use the "Pedal Your Own Path" graphic as a **visible featured image** alongside the hero text (side-by-side layout), not hidden behind an overlay
- Or use the neon/olive color-block approach from the brand landing page mockup

### 4. Add Brand Graphics as Visible Section Dividers
- Use the "Power's In Your Legs" and "Chain" graphics as **visible, properly sized decorative images** between content sections
- Scale them to fit without cropping, with proper aspect ratios

### 5. Fix the Airtable Filter Error (runtime fix)
- The `NFC Bracelet` field filter is failing – fix the field name casing

## Files to Modify
- `src/components/BrandBikeIcon.tsx` (new) – SVG brand cyclist icon
- `src/pages/Dashboard.tsx` – hero section, replace Lucide bike icons
- `src/pages/Info.tsx` – hero section, add visible brand graphics between sections
- `src/components/HeroSection.tsx` – landing page hero with proper brand image usage
- `src/components/Navbar.tsx` – use brand icon if needed
- `src/pages/Dashboard.tsx` – fix Airtable field name for NFC filter
