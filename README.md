Insight Budgeting App

Log expenses in real-time. Gain financial clarity.

Insight is a mobile-first web application designed to make expense tracking frictionless. Built with a modern tech stack, it captures your spending habits at the moment of purchase and syncs them instantly to a Google Sheet, turning it into a powerful, personal database.

The Goal (Why We Built This)

Traditional budgeting apps are often bulky, slow, and require manual data entry sessions that are easy to forget. Insight was built to solve one problem: effortless data capture.

The core philosophy is that the easier it is to log an expense, the more accurate your financial data will be. By using a fast, mobile-friendly interface and a lightweight Google Sheets backend, this app removes the friction. It's not just about tracking what you spend, but how you spend (e.g., "Impulse" vs. "Planned"), giving you a truer picture of your financial habits.

Core Features (Current)

Real-time Logging: A clean, simple form to log an amount, category, and "mood" (context) of your purchase.

Google Sheets Backend: Uses Next.js Server Actions to write every entry directly to your personal Google Sheet in real-time. Your data is always yours, always accessible.

Mobile-First Interface: Designed to be used on your phone right after a purchase.

Smart Validation: Uses Zod for schema validation to ensure data integrity before it's sent to your sheet.

The Future: From Data Capture to True Insight

The current app is a powerful data-collection engine. The next phase is to build the "Insight" engine itself.

Our roadmap is focused on transforming this raw data into actionable financial wisdom:

Build the "Analysis" View: The second tab of the app is currently a placeholder. This will become the central dashboard for data visualization.

Visualize Spending: We will add charts and graphs to show:

Spending breakdown by category (e.g., "Groceries," "Eating Out").

Spending by context (e.g., "Impulse" vs. "Planned").

Monthly and weekly spending trends.

Provide Actionable Insights: The "Mood/Context" data is key. We want to provide insights that other apps can't, such as:

"You spent $120 on 'Impulse' purchases this month."

"Your 'Social' spending is 30% higher than last month."

Set & Track Goals: Allow users to set budgets by category and track their progress in real-time.

Technology Stack

Framework: Next.js (React)

Backend: Google Sheets API

Data Flow: Next.js Server Actions

Styling: Tailwind CSS & shadcn/ui

Form Management: React Hook Form & Zod
