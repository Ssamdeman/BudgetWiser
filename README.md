# Insight Budgeting App

> **Log expenses in real-time. Gain financial clarity.**

Insight is a mobile-first web application designed to make expense tracking frictionless. Built with a modern tech stack, it captures your spending habits at the moment of purchase and syncs them instantly to a Google Sheet, turning it into a powerful, personal database.

## The Goal (Why We Built This)

Traditional budgeting apps are often bulky, slow, and require manual data entry sessions that are easy to forget. Insight was built to solve one problem: **effortless data capture**.

The core philosophy is that the easier it is to log an expense, the more accurate your financial data will be. By using a fast, mobile-friendly interface and a lightweight Google Sheets backend, this app removes the friction. It's not just about tracking _what_ you spend, but _how_ you spend (e.g., "Impulse" vs. "Planned"), giving you a truer picture of your financial habits.

## Core Features

- **Real-time Logging**: A clean, simple form to log an amount, category, and "mood" (context) of your purchase.
- **Google Sheets Backend**: Uses Next.js Server Actions to write every entry directly to your personal Google Sheet in real-time. Your data is always yours, always accessible.
- **Mobile-First Interface**: Designed to be used on your phone right after a purchase.
- **Smart Validation**: Uses Zod for schema validation to ensure data integrity before it's sent to your sheet.

## How It Works & Setup

This application relies on Google Sheets as its database. This setup allows for easy data manipulation and ownership.

### 1. Google Sheet Integration

The app writes data to a specific Google Sheet.

- **Service Account**: The app uses a Google Cloud Service Account to authenticate.
- **Sharing**: You must share your Google Sheet with the Service Account email address (provided by the developer) and give it **Editor** access.

### 2. Monthly Vercel Configuration

To manage your data (e.g., starting a new sheet for a new month), you need to update the connection in Vercel.

1.  **Prepare the Sheet**:
    - Create a new Google Sheet or open an existing one.
    - Ensure it is shared with the Service Account email.
2.  **Get the Sheet ID**:
    - Open the Google Sheet in your browser.
    - Copy the ID from the URL. It is the long string between `/d/` and `/edit`.
    - _Example_: `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`
3.  **Update Vercel**:
    - Go to your project dashboard on **Vercel**.
    - Navigate to **Settings** > **Environment Variables**.
    - Find the variable for the Sheet ID (e.g., `GOOGLE_SHEET_ID`).
    - **Edit** the value and paste your new Sheet ID.
    - **Save** the changes.
    - The app will now write to the new sheet immediately (or after a quick redeploy if needed).

## Technology Stack

- **Framework**: Next.js (React)
- **Backend**: Google Sheets API
- **Data Flow**: Next.js Server Actions
- **Styling**: Tailwind CSS & shadcn/ui
- **Form Management**: React Hook Form & Zod

## The Future: From Data Capture to True Insight

The current app is a powerful data-collection engine. The next phase is to build the "Insight" engine itself.

- **Build the "Analysis" View**: A central dashboard for data visualization.
- **Visualize Spending**: Charts for spending breakdown by category, context ("Impulse" vs. "Planned"), and trends.
- **Provide Actionable Insights**: "You spent $120 on 'Impulse' purchases this month."
- **Set & Track Goals**: Real-time budget tracking by category.
