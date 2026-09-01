import os
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
from models import Merchant, Customer, Transaction, RecoveryCase, AIDecision

def seed():
    db = SessionLocal()
    
    # 1. Create Merchant
    merchant = Merchant(name="ReviveAI Demo Merchant", api_key="demo_key_456")
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    # 2. Create Customers
    c1 = Customer(merchant_id=merchant.id, name="Alice Smith", email="alice@example.com", phone="1234567890")
    c2 = Customer(merchant_id=merchant.id, name="Bob Jones", email="bob@example.com", phone="0987654321")
    db.add_all([c1, c2])
    db.commit()
    
    # 3. Create Successful Transactions
    t1 = Transaction(customer_id=c1.id, merchant_id=merchant.id, amount=1200.50, status="captured", payment_method="card")
    t2 = Transaction(customer_id=c1.id, merchant_id=merchant.id, amount=450.00, status="captured", payment_method="upi")
    t3 = Transaction(customer_id=c2.id, merchant_id=merchant.id, amount=8999.00, status="captured", payment_method="netbanking")
    
    # 4. Create Failed Transactions (that the agent solved)
    t4 = Transaction(customer_id=c1.id, merchant_id=merchant.id, amount=2500.00, status="failed", payment_method="upi", failure_reason="bank_timeout")
    
    db.add_all([t1, t2, t3, t4])
    db.commit()

    # 5. Create a historical solved recovery case
    rc = RecoveryCase(transaction_id=t4.id, customer_id=c1.id, potential_revenue=2500.00, status="actioned")
    db.add(rc)
    db.commit()

    dec = AIDecision(
        recovery_case_id=rc.id,
        recommended_action="send_payment_link",
        confidence_score=0.92,
        reasoning="Customer Alice Smith has 2 prior successful transactions. UPI timeout is a temporary issue. High likelihood of recovery via payment link.",
        generated_message="Hi Alice, we noticed your recent ₹2500 payment failed due to a bank timeout. Don't worry, your items are saved! Click here to retry safely: https://pay.example.com/retry"
    )
    db.add(dec)
    db.commit()

    print("Database seeded with sample transactions and historical recovery cases!")

if __name__ == "__main__":
    seed()
