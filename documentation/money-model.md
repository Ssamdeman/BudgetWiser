# Insight — Money Model

How money in and money out is captured. Short version.

---

## The three tabs

| Tab | What it records | Lifecycle |
|---|---|---|
| `Transactions` | Money **gone** — spending | Cleared monthly (C–E only) |
| `Income` | Money **arrived** | Permanent, append-only |
| `Holdings` | Money **parked** — savings + investments | Permanent, append-only |

Transactions is the only ephemeral tab. You export it, then clear it. The other two grow forever.

---

## Income

One row per payment received.

`Date | Source | Amount | Notes`

**It is a log, not a setting.** Nothing in it ever gets updated. A month with a gig has an extra row. A month without one doesn't. That's the entire mechanism for variable income — there is no figure to correct.

September: Salary 3,200 + Acme gig 900 = 4,100
October: Salary 3,200 = 3,200

The app never stores "monthly income." It filters by month and sums whatever rows exist.

**Source is the important column.** It's what separates your stable base from your variable upside. Keep names consistent — "Acme" and "Acme Corp" are two different sources to the app, and the trend chart will lie to you.

**Income is gross and never net.** Nothing is subtracted here. Saving 500 of your salary does not reduce your income for the month.

---

## Holdings

One row per movement into or out of an account you still own.

`Date | Location | Amount | Type | Notes`

**Location** is the account name — Savings, Brokerage, Pension. Free choice. A new account exists the moment you type a name you haven't used before. No registry, no setup.

**Type** is one of three:
- `contribution` — money in
- `withdrawal` — money out
- `opening` — the balance that already existed when you started. One row per account, once.

Amount is always positive. Type carries the direction.

**Balances are derived, never stored.** Balance for a location = opening + contributions − withdrawals, computed on every page load. Nothing can drift out of sync because there's nothing to sync.

- *How much have I put into X?* → sum its rows
- *When did I start X?* → its earliest date

**No gains, no valuations.** This shows what you contributed, not what it's worth. Your brokerage app will show a higher number. That gap is your return, and it lives outside this system by design.

---

## Spending vs parking

Everything leaving your account goes to one of two tabs. The test is whether you still own the money.

- Rent, groceries, subscriptions, insurance → **Transactions**. Gone.
- Savings, investment contributions → **Holdings**. Moved.

Fixed costs that come straight out of your salary are still spending. They go in Transactions like everything else.

---

## The month reads as

```
Income  −  Spending  −  Parked  =  Leftover
```

Three tabs, three numbers, no double counting.

---

## Rules that must not be broken

1. **Never clear Income or Holdings.** Clearing Holdings resets every balance to zero. Clearing Income destroys your earnings history — the main thing this system exists to give you.
2. **Never delete rows in Transactions.** Clear C–E only. Array formulas in F–I depend on the rows existing.
3. **Source and Location names must stay consistent.** Use the dropdowns.
4. **Income is never net.** Log what arrived, in full.