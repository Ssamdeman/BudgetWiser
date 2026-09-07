# Insight Budgeting App

> **Capture money in, money out, and money parked. See the truth in your spending.**

Insight is a mobile-first personal finance app backed entirely by Google Sheets. It captures four kinds of money and shows you exactly what's happening — no predictions, no algorithms, just your real data.

## Why Insight?

Most budgeting apps are bloated, slow, or try to "predict" your behavior with AI. Insight takes a different approach: **capture real data effortlessly, then show you exactly what's happening.**

- The easier it is to log, the more accurate your data
- Your data stays yours (Google Sheets backend)
- Balances are always derived from history, never stored
- Real insights come from real patterns, not algorithms

---

## The Money Model

Four tabs in one Google Sheet. Every number in the app is derived from them.

| Tab | Captures | Lifecycle |
| --- | --- | --- |
| `Transactions` | Money **spent** — decisions you made | Ephemeral — exported and cleared monthly (C–E only) |
| `Income` | Money **arrived** — gross, never net | **Permanent, append-only** |
| `Holdings` | Money **parked** — savings and investments | **Permanent, append-only** |
| `Subscriptions` | Money **committed** — recurring obligations | **Permanent registry** — edited in place |

### Logged vs Committed — the core distinction

Two genuinely different kinds of money leaving your account:

- **Logged spending** — decisions you made. You chose each one. Lives in `Transactions`.
- **Committed cost** — money you already agreed to. Rent, subscriptions, financing. No decision happens when it bills. Lives in `Subscriptions`.

Committed cost is **derived from the registry, never written as transactions.** The two figures are shown side by side and totalled, but never merged. The distinction is the point.

> [!CAUTION]
> **NEVER log a committed cost as an expense.**
> If you manually log rent or a subscription in `Transactions`, it is counted twice — once as logged spending, once as committed cost. Nothing detects this. Committed costs are counted by existing in the registry. They are never logged.

---

## Features

### 📝 Expense Logging

Log purchases in seconds — right after you buy.

- Amount, category, and **mood** (Planned, Impulse, Social, Necessary, Treat)
- Appends to the `Transactions` tab in real time
- Mobile-optimized for on-the-go entry

### 💵 Income Tracking

Gross money arrived. Permanent and append-only.

- Log payments in seconds (Amount, Source, Date, Notes)
- Sources derived dynamically from existing sheet entries, with in-app creation of new ones
- Current month total plus breakdown by source
- A log, not a setting — a month with a gig has an extra row; a month without has one fewer. Nothing is ever updated

### 🏦 Holdings & Parked Capital

Savings and investments together. Location is the only distinction.

- Balances derived fresh on every load: `opening + contributions − withdrawals`. Never stored, never cached, cannot drift
- Strict movement types: `contribution`, `withdrawal`, `opening`
- All-time scoped — never nested inside a monthly view
- Shows contributed capital, not market value. Your brokerage will show a higher number; that gap is your return and lives outside this system by design
- Invalid rows surfaced with row numbers, never silently dropped

### 💳 Subscriptions & Committed Cost

The registry of everything you've already agreed to pay.

- **Committed this month** — sum of active monthly obligations still running
- **Yearly items** — listed individually with due dates. Never divided by twelve, never folded into the monthly figure
- **Ending soon** — anything expiring or converting within 60 days
- No annual projection. `monthly × 12` assumes commitments run forever, which is false
- Two-tier validation: rows with a bad Status, Cycle, or Cost are excluded and flagged; rows with only bad metadata are counted and flagged

### 📊 Spending Analytics

**Current Month (Live)** — money in and money out together:

```
Logged spending      $X   (month to date)
Committed recurring  $Y   (full month)
────────────────────────────
Running floor out    $X + Y
```

Called a *running floor* rather than a total, because mid-month it combines partial spending with a full month of obligations. It becomes a true total only on the last day.

**2026 Insights (V2)** — mood breakdown, category breakdown, spending heatmap, day and time patterns.

**2025 Historical (V1)** — monthly trends, category breakdown, month-over-month changes.

Historical views read from CSV masters, which contain no subscription data. Committed cost is never injected into past months.

---

## Tech Stack

- **Framework**: Next.js (React)
- **Backend**: Google Sheets API + CSV for historical masters
- **Styling**: Tailwind CSS & shadcn/ui
- **Charts**: Recharts
- **Validation**: Zod

---

## Sheet Schemas

**`Transactions`** — data starts row 5

| C | D | E | F–I |
| --- | --- | --- | --- |
| Amount | Category | Mood | Array formulas (Time, Day, Week, Date) |

**`Income`** — data starts row 2

| A | B | C | D |
| --- | --- | --- | --- |
| Date | Source | Amount | Notes |

**`Holdings`** — data starts row 2

| A | B | C | D | E |
| --- | --- | --- | --- | --- |
| Date | Location | Amount | Type | Notes |

`Type` is a strict dropdown: `contribution`, `withdrawal`, `opening`. Amount is always positive; Type carries direction. `opening` seeds a balance that existed before tracking began — one row per account, once.

**`Subscriptions`** — data starts row 2

| A | B | C | D | E | F | G | H | I | J |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Name | Status | Category | Cost | Cycle | Bill Day | Bank | Trial Ends | Notes | Ends |

`Trial Ends` means the **price changes**. `Ends` means the **payment stops** (lease end, financing payoff). Blank `Ends` is treated as ongoing.

---

## Setup

### Google Sheet Integration (One-Time)

The app reuses a single persistent Google Sheet. The Sheet ID never changes.

1. Create a Google Sheet with four tabs: `Transactions`, `Income`, `Holdings`, `Subscriptions`.
2. Share it with your Service Account email (Editor access).
3. Add the Sheet ID to your environment variables — both `.env.local` and Vercel.

> [!WARNING]
> If you ever change sheets, update **both** local and Vercel environment variables. A stale `GOOGLE_SHEET_ID` produces a 404 on the newer tabs while older tabs keep working — a confusing failure that looks like a code bug.

### Environment Variables

```
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

---

## Monthly Rollover Ritual — `Transactions` Only

> [!IMPORTANT]
> **The rollover applies strictly to the `Transactions` tab.**
>
> **`Income`, `Holdings`, and `Subscriptions` are permanent. NEVER clear them.**
> - Clearing `Income` destroys your earnings history.
> - Clearing `Holdings` resets every account balance to zero.
> - Clearing `Subscriptions` erases your committed cost registry.

Export one month at a time, never batched:

1. **Export** the completed month's rows from the `Transactions` tab as a CSV.
2. **Save** it into `public/raw-data/` (e.g. `Apr-2026.csv`).
3. **Run** the consolidation command:
   ```powershell
   .\run.ps1 add-data -File public\raw-data\Apr-2026.csv
   ```
4. **Archive** the exported rows into your personal master tracker.
5. **Clear** the values in columns C, D, and E for the consolidated rows.

> [!WARNING]
> **NEVER DELETE ROWS in the `Transactions` tab.** Clear values in C, D, and E only.
> Columns F through I contain array formulas that auto-stamp Time, Day, Week, and Date. Deleting rows destroys them and silently breaks expense logging.

> [!TIP]
> The consolidation script replaces a month's data rather than duplicating it if run twice with the same file.

---

## Maintenance Habits

The system only stays true if the registry does.

- **Review Subscriptions quarterly.** A stale registry means a wrong committed figure presented with full confidence.
- **Watch "Ending soon."** A $0 trial today is a real cost on its renewal date.
- **Keep Source and Location names consistent.** Use the derived pickers rather than retyping.
- **Never manually log a committed cost.** See the caution above.

---

## Commands

```powershell
.\run.ps1 dev                                        # Development server
.\run.ps1 add-data -File public\raw-data\Mar-2026.csv # Fold a month into the V2 master
.\run.ps1 genkit                                     # Genkit process
```