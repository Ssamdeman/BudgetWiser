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

### Google Sheet Integration

1. Create a Google Sheet
2. Share with Service Account email (Editor access)
3. Add Sheet ID to Vercel environment variables

### Monthly Data Flow

- Export monthly data from Google Sheet
- Run consolidation script to update master CSV
- Dashboard reflects changes on refresh

---

## Commands

Start the development server:
```powershell
.\run.ps1 dev
```

Append a new month's CSV data to the master file:
```powershell
.\run.ps1 add-data -File public\raw-data\Feb-2026.csv
```

Start the Genkit process:
```powershell
.\run.ps1 genkit
```

---

## What's Next

- [x] Password-protected subscription view
- [ ] Subscription renewal alerts
- [ ] Budget goals and tracking
- [ ] Export/share reports
