from fastapi import FastAPI
from database import Base, engine
from routers import webhooks, dashboard, transactions
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReviveAI API - Complete Version")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Complete ReviveAI API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
