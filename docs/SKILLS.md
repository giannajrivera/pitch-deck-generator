# Pitch Deck Generator — Skills & Capabilities

**Powered by Connect.AI | Built for CT SBDC**

---

## What the Tool Can Do

### Deck Generation
- Generates a complete **12-slide investor-ready pitch deck** from guided question responses
- Follows the **CT SBDC pitch deck format** exactly (Intro → Problem → Solution → Product → Market Size → Business Model → Traction → Competition → Go to Market → Financials → Team → Ask)
- Supports two modes: **Workshop** (concise, fast) and **Solo** (detailed, thorough)
- **AI-estimated market sizing** — researches and calculates TAM, SAM, and SOM automatically using industry + geography context. No manual input required.
- Generates a **per-slide talk track** — a 30–60 second spoken script for every slide

### Branding
- Accepts a **custom logo** (uploaded by the user)
- Accepts **brand colors** (hex codes)
- Accepts **custom fonts**
- Applies branding consistently across slide content and export files

### Export Options
- **Copy All** — copies the full deck content as plain text
- **Export PDF** — downloads a branded PDF of all 12 slides
- **Export PPTX** — downloads a branded PowerPoint file
- **Canva Prompt 1** — copies a Canva AI-ready prompt for slides 1–6 (under 3,800 characters)
- **Canva Prompt 2** — copies a Canva AI-ready prompt for slides 7–12 (under 3,800 characters)

### Talk Track
- Per-slide scripts viewable in the **Talk Track tab**
- Each script is 30–60 seconds, written in the founder's voice
- Includes a copy button per slide and a copy-all option

### Saving & Sharing
- Users can **create an account** to save their deck
- Saved decks get a **shareable link** (e.g. for sending to advisors or investors)
- Deck content persists in the browser even without an account (localStorage)

### AI Intelligence
- Flags **weak or missing data** in Quick Improvements
- Provides **coach notes** for workshop facilitators — red flags, follow-up questions, investor concerns
- Infers market size using **bottom-up methodology** with cited math

---

## What the Tool Does Not Do

- Does not create visual slide designs (Canva AI handles that step)
- Does not guarantee market size accuracy — estimates should be verified with industry sources
- Does not store financial data beyond the session
- Does not submit or send decks to investors directly

---

## Canva Integration Workflow

| Step | Action |
|------|--------|
| 1 | Generate deck in the tool |
| 2 | Click **Canva Prompt 1** → paste into Canva AI (slides 1–6) |
| 3 | Click **Canva Prompt 2** → paste into same Canva chat (slides 7–12) |
| 4 | Tell Canva: *"Combine the two into slides 1–12"* |
| 5 | Refine visuals, charts, and formatting inside Canva |

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| AI Model | Google Gemini 2.5 Flash |
| Styling | Tailwind CSS |
| State | Zustand + localStorage |
| Auth & Storage | Supabase |
| Deployment | Netlify |
| PPTX Generation | pptxgenjs |

---

*Connect.AI — Built for CT SBDC Pitch Deck Workshops*
