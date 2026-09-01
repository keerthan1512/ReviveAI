# ReviveAI - Project Context and Steps

## Objective
Build a complete, end-to-end autonomous payment recovery agent that catches failed transactions via webhooks, analyzes customer history using an LLM, generates personalized recovery strategies (and email copy), and executes them.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS (v4), Recharts, Lucide-React, React-Hot-Toast.
- **Backend**: FastAPI, SQLAlchemy (SQLite), Python.
- **AI Agent**: Langchain, Groq (`mixtral-8x7b-32768`).

## Implementation Steps Taken
1. **Initial Setup**: Scaffolded Vite frontend and FastAPI backend. Configured `requirements.txt` and `vite.config.ts` (resolving Tailwind v4 PostCSS issues).
2. **Database Architecture**: Implemented a relational SQLite database via SQLAlchemy. Created models for `Merchants`, `Customers`, `Transactions`, `RecoveryCases`, and `AIDecisions` (with `generated_message`).
3. **API & Webhooks**: Built `/api/webhooks/razorpay` to securely parse failed payments, identify customers, and trigger the AI asynchronously. Added `/api/dashboard/metrics`, `/api/dashboard/recovery-cases`, and `/api/transactions` for the frontend.
4. **Agent Intelligence**: Built the Langchain agent (`agent.py`) that reads actual DB history. It evaluates the failure reason and outputs a JSON containing a `recommended_action`, `confidence_score`, `reasoning`, and a highly personalized `generated_message`. Wrapped in robust `try/except` fallbacks.
5. **Frontend Dashboard "Wow Factors"**:
   - Built a beautiful Glassmorphism dashboard.
   - Added a "Live Agent Activity Feed" (Terminal UI) to visualize the AI's internal thoughts.
   - Added an expandable table row to preview the Generative AI email copy.
   - Built a "Mock Storefront" view to allow users to trigger a realistic checkout failure, which immediately fires the webhook.
6. **Real Email Dispatch**: Integrated Python `smtplib` (`email_service.py`) to actually send the generated recovery message to the customer's real email address when "Approve" is clicked, using Gmail SMTP credentials provided in `.env`.
7. **Database Seeding**: Created `seed_db.py` to populate the initial state with successful and failed transactions for demonstration purposes.

## Current State
The project is 100% complete and fully functional for demonstration.
