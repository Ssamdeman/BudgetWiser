# Insight — Phase 3 Spec: Month-End Summary

Written 2026-09-06. Execute after one full month of real data.

---

## What it is

One read-only view. One equation.

```
Income  −  Spending  −  Net Parked  =  Leftover
```

Per calendar month. No writes, no new tabs, no new schema. Everything derived from the three tabs that already exist.

---

## The hard part: where past-month spending lives

Income and Holdings are permanent and append-only — every month is queryable forever.

Transactions is not. It gets cleared monthly and folded into the V2 CSV master.

So the summary has **two data sources for spending depending on which month you ask about**:

- **Current month** → live Google Sheet
- **Past months** → V2 CSV master

Income and Holdings answer for all months from the sheet.

This is the whole architectural difficulty of Phase 3. Everything else is arithmetic.

**Decision to make before building:** does the summary cover only the current month (simple, one data source, less useful), or every month (two sources stitched together, genuinely useful)?

Recommendation: current month only for v1. Add history later once the stitch is proven.

---

## The numbers

| Figure | Derivation |
|---|---|
| Income | Sum of Income rows in the month |
| Spending | Sum of Transactions in the month |
| Parked in | Sum of Holdings `contribution` rows in the month |
| Parked out | Sum of Holdings `withdrawal` rows in the month |
| Net Parked | Parked in − Parked out |
| Leftover | Income − Spending − Net Parked |

`opening` rows are excluded entirely. They are historical seeds, not movements, and including them would wreck the month they were entered in.

---

## What Leftover actually means

It is not your bank balance. It is the gap between what came in and what you can account for.

- **Positive** — money arrived that you neither spent nor parked. Sitting in checking, or you missed a row.
- **Near zero** — everything is accounted for. This is the goal.
- **Negative** — you spent more than you earned this month. Usually correct: you dipped into savings, which shows as a Holdings withdrawal.

Label it as a reconciliation signal, not as savings. If it reads as "money left over," it will be misread as available cash.

---

## Data completeness is the design risk

Every prior phase degrades gracefully with partial data. A missing income row just makes the income total lower.

This one doesn't. One missed salary row and Leftover is wrong by thousands, presented with the same confidence as a correct figure.

**Requirement:** the view states what it counted — number of income rows, transaction rows, holdings rows in the month. If a count looks wrong, the user sees it before trusting the number.

No confidence scoring, no warnings, no guessing at completeness. Just show the counts.

---

## Explicitly not building

- **Allocation flow.** The original plan had a UI to distribute leftover into pools, writing Transfer rows. Dropped — you log holdings movements as they happen, so there is nothing to allocate at month end.
- **Budgets, targets, plan-vs-actual.** This is a capture system. Stays that way.
- **Stored snapshots.** Everything derived on load, same as Income and Holdings.
- **Gains, valuations, net worth.** Still out. Permanently.

---

## Pre-flight before sending to Agent 3

1. One full month of real entries in all three tabs.
2. One rollover completed with Income and Holdings live — confirm the ritual didn't touch them.
3. README updated with the append-only rule.
4. Answer the current-month-only vs all-months question above.

If after a month you find you aren't logging holdings movements consistently, do not build this. The equation only works when all three tabs are complete, and a confidently wrong number is worse than no number.