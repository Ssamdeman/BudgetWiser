# Insight Budgeting App

> **Log expenses. Track subscriptions. See the truth in your spending.**

Insight is a mobile-first personal finance app that consolidates expense tracking, spending analytics, and subscription management in one place. Built for speed and clarity — no AI guesses, just your real data visualized.

## Why Insight?

Most budgeting apps are bloated, slow, or try to "predict" your behavior with AI. Insight takes a different approach: **capture real data effortlessly, then show you exactly what's happening.**

The philosophy is simple:

- The easier it is to log, the more accurate your data
- Your data stays yours (Google Sheets backend)
- Real insights come from real patterns, not algorithms

---

## Features

### 📝 Expense Logging

Log purchases in seconds — right after you buy.

- Amount, category, and **mood** (Planned, Impulse, Social, Necessary, Treat)
- Syncs instantly to your Google Sheet
- Mobile-optimized for on-the-go entry

### 📊 Spending Analytics

Two dashboard views for complete visibility:

**2025 Historical (V1)**

- Monthly spending trends
- Category breakdown
- Month-over-month changes

**2026 Insights (V2)**

- Spending by mood — see how much is impulsive vs. planned
- Category breakdown
- When you spend — heatmap by day and time
- Day & time patterns — which days and times cost you most

### 💳 Subscription Tracker

All your recurring costs in one view.

- Monthly and yearly totals at a glance
- Status tracking: Active, Done, Canceled
- Organized by status with collapsible sections
- Bank and billing cycle info per subscription

---

## How It Works

**Expense Logging** → Google Sheets API (real-time sync)

**Analytics** → Reads from local CSV masters, fresh on every page load

**Subscriptions** → CSV-based, manually updated

No cloud sync magic. No AI predictions. Just clean data flow you control.

---

## Tech Stack

- **Framework**: Next.js (React)
- **Backend**: Google Sheets API + CSV
- **Styling**: Tailwind CSS & shadcn/ui
- **Charts**: Recharts
- **Validation**: Zod

---

## Data Structure

| Data                 | Source                        | Format               |
| -------------------- | ----------------------------- | -------------------- |
| Live expenses        | Google Sheet                  | Real-time API        |
| V1 historical (2025) | `V1_master_finances-2025.csv` | Consolidated monthly |
| V2 insights (2026)   | `V2_master_finances-2026.csv` | Mood + time tracking |
| Subscriptions        | `subscriptions_master.csv`    | Manual updates       |

---

## Setup

### Google Sheet Integration (One-Time Setup)

You only need to configure the Google Sheet once. **The app reuses a single, persistent Google Sheet forever.** The Sheet ID never changes, so Vercel environment variables are set once and never touched again.

1. Create a Google Sheet.
2. Share it with your Service Account email (Editor access).
3. Add the Sheet ID to your Vercel environment variables.

### Monthly Rollover Ritual

Because the dashboard automatically filters the live sheet to show only the current calendar month, stale rows don't break anything. However, to keep your insights accurate and the sheet clean, follow this rollover process at the end of each month (export **one month at a time**, never batched):

1.  **Export** the completed month's rows from the Google Sheet as a CSV.
2.  **Save** the CSV file into the `public/raw-data/` directory (e.g., `Apr-2026.csv`).
3.  **Run** the consolidation command in your terminal to fold it into the V2 master:
    ```powershell
    .\run.ps1 add-data -File public\raw-data\Apr-2026.csv
    ```
4.  **Archive** the exported rows into your personal master tracker (a separate sheet, unrelated to the app).
5.  **Clear** the values in columns C, D, and E for the consolidated month's rows in the live sheet.

> [!WARNING]
> **NEVER DELETE THE ROWS in your live Google Sheet.** Only clear the values in columns C, D, and E. 
> Columns F through I contain hidden array formulas that auto-stamp the Time, Day, Week, and Date for new entries. Deleting the rows will destroy these formulas and silently break new expense logging.

> [!TIP]
> The consolidation script is "smart"—if you run it again with the same file, it will **replace** that month's data in the master file rather than duplicating it. This prevents double-entries while allowing you to update a month if you add more data later.

---

## Commands

Start the development server:
```powershell
.\run.ps1 dev
```

Append or update a month's CSV data in the master file:
```powershell
.\run.ps1 add-data -File public\raw-data\Mar-2026.csv
```

Start the Genkit process:
```powershell
.\run.ps1 genkit
```

---

## What's Next

- [x] Password-protected subscription view
- [x] Subscription renewal alerts
- [x] Budget goals and tracking
- [ ] Export/share reports
