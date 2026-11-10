# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-11-09

### Added

- **Budget Plan vs Spent Tab**: Added a dedicated top-level `Budget` tab on the main navigation right after `Data` (`[ Data | Budget | Analysis | Subs ]`), placing the real-time plan vs spent right where it matters most.
- **Architectural Integrity**: Purely derived on load from live sheet data. Spent includes all transactions with a valid amount; rows dated outside the current Eastern month are counted and surfaced with their row numbers in a diagnostic banner.
- **Dynamic Plan & Caps**: Firm Total limit and guide category caps read directly from the `Budget` tab with zero hardcoded caps in code.
- **Buffer & Overages**: Dynamic buffer (Total − Sum of Caps) with alerts when caps exceed the total limit; transparent "No cap" section for spending in categories without a guide cap.
- **Augusta, GA Timezone**: Days remaining in the month computed using Eastern Time (`America/New_York`), counting today.
- **Graceful Degradation**: If the `Budget` tab fails to load or contains issues (missing/multiple Total rows, invalid caps), other views continue functioning smoothly with issues clearly surfaced.

## [0.3.1] - 2026-11-09

### Changed

- **Current Month View**: Removed unused Spending Heatmap and Day & Time Breakdown charts to streamline monthly overview.
- **Expense Logging Categories**: Replaced `Utilities` with `Health` in active expense categories and form dropdown.
- **Icon Mapping**: Added `HeartPulse` icon for `Health` category logging; retired `Utilities` from the active logging form.
- **Historical Data Preservation**: Existing historical records containing `Utilities` remain unmodified and fully supported in aggregations, reporting, and consolidation pipelines.

## [0.3.0] - 2026-09-06

### V2 — Phase 2: Holdings Completed

- **Holdings Logging**: Mobile-first entry for parked capital (`Date`, `Location`, `Amount`, `Type`, `Notes`) safely appending to the live `Holdings` tab (`Holdings!A:E`) without overwriting existing data.
- **Strict Movement Types**: Hardcoded, closed 3-option selector (`contribution`, `withdrawal`, `opening`) preventing invalid data entry and preserving balance derivation integrity.
- **Derived Location Picker**: Accounts derived dynamically from live sheet rows with seamless in-app new account creation.
- **Derived Balances Engine**: Architectural rule enforced — balances computed fresh on load from row histories (`opening + contributions - withdrawals`). No stored or cached balance columns.
- **All-Time Scoped View**: Standalone "All-Time Holdings" section in Analysis View, strictly separated from month-scoped views, featuring combined hero balance, per-account breakdown cards, and expandable movement history.
- **Typo Row Surfacing (Change 1)**: Rows with unrecognized types (e.g. typos like `contibution`), invalid amounts, or invalid dates are actively counted and surfaced in a visible warning banner with sheet row numbers and error reasons instead of silently dropped.
- **Strict Separation of Opening and Contributed (Change 2)**: Opening balances are never merged into "contributed". Per-account and combined hero displays show three distinct figures: Balance (headline), Contributed (contributions only), and Opening (starting baseline).
- **Graceful Anomaly Handling**: Negative balances displayed transparently as-is with visual indicators to alert to data entry discrepancies.

## [0.2.0] - 2026-09-06

### V2 — Phase 1: Income Capture Completed

- **Income Logging**: Added mobile-first capture for gross income (`Date`, `Source`, `Amount`, `Notes`) appending to live `Income` tab.
- **Dynamic Source Picker**: Sources derived dynamically from sheet entries with seed fallback (`Salary`, `Gift`) and in-app entry for new sources without code changes.
- **Unified Log Hub**: Seamless `[ Expense | Income ]` segmented control on primary tab preserving the 3-tab layout.
- **Spending Overview Integration**: Gross Income surfaced side-by-side with Total Spent in real-time (pure numbers, never net).
- **Income View**: Dedicated sub-tab under Current Month showing gross total, source breakdown with percentage bars, and payment log.
- **Architecture Integrity**: Existing `Transactions` read/write paths left completely untouched.

## [0.1.3] - 2025-12-04

### Changed

- **Design**: Complete aesthetic overhaul to a "Premium" standard.
- **Typography**: Switched font from `PT Sans` to `Inter` for better legibility and a modern feel.
- **Theme**: Implemented a deep, rich dark mode (`#0A0A0B`) with glassmorphism effects on cards and inputs.
- **Components**: Enhanced Inputs, Buttons, and Selects with larger touch targets (`h-12`), smooth transitions, and tactile active states.
- **Brand**: Restored and integrated the signature **Orange** accent color into the new premium design system.

## [0.1.2] - 2025-12-04

### Fixed

- **Mobile**: Fixed an issue where the decimal point could not be entered in the Amount field.
- **Mobile**: Fixed the Category dropdown opening upwards and overlapping with the keyboard; it now opens downwards and closes the keyboard automatically.

## [0.1.1] - 2025-12-04

### Fixed

- **Security**: Upgraded `next` to version `15.3.6` to fix CVE-2025-55182 (Critical vulnerability in React Server Components).

### Changed

- **Documentation**: Updated `README.md` with a new "How It Works & Setup" section, detailing Google Sheets integration and Vercel environment variable configuration.

## [0.1.0] - 2025-10-01

### Added

- Initial release of Insight Budgeting App.
- Real-time expense logging.
- Google Sheets integration via Server Actions.
- Mobile-first UI with Tailwind CSS and shadcn/ui.
