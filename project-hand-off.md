# BudgetWiser — Project Handoff

## What It Is
Mobile-first personal finance app. Three tabs: Log expenses, View analytics, Track subscriptions.

---

## Tech Stack
- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Backend:** Google Sheets API
- **Validation:** Zod
- **Data:** CSV files + live Google Sheet

---

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Main entry, swipeable tabs
│   ├── actions.ts            # Server Actions (logging, fetching)
│   └── api/                   # API routes (password verification)
├── components/
│   ├── log-expense-form.tsx  # Expense input form
│   ├── analysis-view.tsx     # Analytics dashboard (toggles + charts)
│   ├── subscriptions-view.tsx # Subscription tracker
│   └── charts/               # Individual chart components
├── lib/
│   ├── google-sheets.ts      # Google Sheets API client
│   ├── csv-parser.ts         # CSV parsing + aggregation
│   ├── subscription-parser.ts # Subscription CSV parser
│   └── types.ts              # All TypeScript types
└── hooks/                    # Custom React hooks
```

---

## Data Flow

| Data | Source | Method |
|------|--------|--------|
| New expenses | Google Sheet | Server Action (write) |
| Current month | Google Sheet | Server Action (read) |
| V2 historical (2026) | `public/V2-2026-Mastered-data/` | CSV fetch |
| V1 historical (2025) | `public/V1-2025-Mastered-data/` | CSV fetch |
| Subscriptions | `public/subscriptions/` | CSV fetch (password-gated) |

---

## Google Sheet Schema (Live Data)

| Column | Field |
|--------|-------|
| C | Amount |
| D | Category |
| E | Mood/Context |
| F | Time of Day |
| G | Day of Week |
| H | Week Number |
| I | Date |

Data starts row 5.

---

## Key Patterns

**1. Modular Charts**
Each chart = separate component. Pass data, get visualization.
```
src/components/charts/
├── monthly-spending-chart.tsx
├── category-breakdown-chart.tsx
├── mood-analysis-chart.tsx
├── spending-heatmap.tsx
└── day-time-bars-chart.tsx
```

**2. CSV Parsing**
All CSV files: fetch → parse → aggregate → pass to components.
Parsers handle normalization (typos, missing fields).

**3. Toggle Sections**
Use Radix Accordion. Each section = collapsible with badge.
- Current Month [Live] — expanded default
- 2026 Insights [Current] — collapsed
- 2025 Historical [Historical] — collapsed

**4. Password Gate (Subscriptions)**
- Server-side bcrypt verification
- React state controls unlock
- 10-minute auto-lock timer
- CSV only fetched after unlock

---

## Philosophy

| Principle | Meaning |
|-----------|---------|
| Mobile-first | Design for phone, scale up |
| Modular | Swap components without breaking others |
| No-cache | Data fetches fresh every load |
| Server-side sensitive ops | Passwords, API keys never on client |
| Graceful errors | Validate input, handle missing data, show user-friendly messages |
| Real data | No AI predictions — user's actual numbers |

---

## Adding Features

1. **New chart:** Create component in `charts/`, import in `analysis-view.tsx`
2. **New data field:** Update `types.ts` → update parser → update components
3. **New tab:** Add to `page.tsx` tabs array, create view component
4. **New API route:** Add to `app/api/`, use Server Actions when possible

---

## Environment Variables

```
GOOGLE_SHEET_ID=           # Active expense sheet
GOOGLE_SERVICE_ACCOUNT=    # JSON credentials
SUBSCRIPTION_HASH=         # bcrypt hash for subscriptions password
```

---

## Scripts

```bash
npm run dev                 # Local development
make update                 # Regenerate repomix
make add-data FILE=x.csv    # Append month to V2 master
```

---

## Current State

✅ Expense logging → Google Sheet
✅ V1 analytics (2025 historical)
✅ V2 analytics (2026 with mood/time)
✅ Current month live view
✅ Subscriptions (password-protected)
✅ Predictions (basic forecasting)