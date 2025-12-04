# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
