# ReviveAI 🚀

An autonomous AI payment recovery agent built to rescue failed transactions in real-time. 

When a payment fails (e.g., bank timeout, insufficient funds), ReviveAI intercepts the webhook, analyzes the customer's historical transaction data using an LLM, generates a personalized recovery strategy, and dispatches a custom email/SMS to save the sale.

## ✨ Features
- **Intelligent Recovery Agent**: Uses Langchain & Groq (`mixtral-8x7b-32768`) to determine the highest-probability recovery action based on past customer LTV and failure reasons.
- **Generative Copywriting**: Automatically drafts the exact email or SMS to send to the customer.
- **Real-Time Dashboard**: A beautiful React interface featuring live Agent Activity terminal logs, interactive charts, and an autonomous mode toggle.
- **Mock Storefront**: A built-in fake e-commerce checkout page that allows you to simulate a real payment failure instantly for demonstrations.
- **Real SMTP Dispatch**: Actually sends the generated recovery email when an action is approved.

## 🛠 Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Backend**: FastAPI, SQLAlchemy (SQLite), Python
- **AI**: Langchain, Groq

## 🚀 Quick Start Guide

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   SMTP_EMAIL=your_gmail_address@gmail.com
   SMTP_PASSWORD=your_gmail_app_password
   ```
5. Seed the database with initial mock transactions:
   ```bash
   python seed_db.py
   ```
6. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

## 🎮 How to Demo
1. Open the Dashboard. Note the initial seeded transactions.
2. Click the **Mock Storefront** button in the sidebar.
3. Click **Pay Securely**. The transaction will intentionally fail.
4. Go back to the Dashboard. You will see the AI Agent Terminal light up as it processes the failed webhook.
5. Click on the new Recovery Case in the queue to preview the AI's reasoning and the generated message.
6. Click **Approve** to dispatch the real email to your inbox!