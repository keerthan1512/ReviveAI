from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Transaction, Customer, RecoveryCase, Merchant
from agent import analyze_recovery_case

router = APIRouter()

@router.post("/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives real or mock Razorpay webhooks.
    Event structure: { "event": "payment.failed", "payload": { "payment": { "entity": { ... } } } }
    """
    payload = await request.json()
    event_type = payload.get("event")
    
    if not event_type:
        raise HTTPException(status_code=400, detail="Invalid event format")

    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    
    # 1. Identify or Create Merchant (Mock for now, normally verified by webhook secret)
    # We'll just grab the first merchant or create a default one
    merchant = db.query(Merchant).first()
    if not merchant:
        merchant = Merchant(name="ReviveAI Demo Merchant", api_key="test_key_123")
        db.add(merchant)
        db.commit()
        db.refresh(merchant)

    # 2. Identify or Create Customer
    customer_email = payment_entity.get("email", "unknown@example.com")
    customer_phone = payment_entity.get("contact", "")
    customer = db.query(Customer).filter(Customer.email == customer_email).first()
    if not customer:
        customer = Customer(
            merchant_id=merchant.id,
            name=customer_email.split("@")[0],
            email=customer_email,
            phone=customer_phone
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # 3. Create Transaction
    amount = float(payment_entity.get("amount", 0)) / 100.0 if payment_entity.get("amount") else 0.0
    status = payment_entity.get("status", "unknown")
    failure_reason = payment_entity.get("error_description", "")

    transaction = Transaction(
        customer_id=customer.id,
        merchant_id=merchant.id,
        amount=amount,
        currency=payment_entity.get("currency", "INR"),
        status=status,
        payment_method=payment_entity.get("method", "unknown"),
        failure_reason=failure_reason
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # 4. Handle Failed Payment Logic
    if event_type == "payment.failed" or status == "failed":
        # Create Recovery Case
        rc = RecoveryCase(
            transaction_id=transaction.id,
            customer_id=customer.id,
            potential_revenue=amount,
            status="pending"
        )
        db.add(rc)
        db.commit()
        db.refresh(rc)

        # Trigger AI Analysis asynchronously (doing it sync here for MVP simplicity)
        # Gather history
        success_count = db.query(Transaction).filter(Transaction.customer_id == customer.id, Transaction.status == "captured").count()
        total_count = db.query(Transaction).filter(Transaction.customer_id == customer.id).count()
        customer_history = {
            "total_transactions": total_count,
            "success_rate": f"{(success_count / total_count * 100):.1f}%" if total_count > 0 else "0%"
        }

        decision = analyze_recovery_case(db, rc.id, {
            "amount": transaction.amount,
            "method": transaction.payment_method,
            "reason": transaction.failure_reason
        }, customer_history)

        # Autonomous Execution Check
        import settings
        from email_service import send_recovery_email
        if settings.AUTONOMOUS_MODE and decision.confidence_score >= 0.90:
            print(f"[AUTONOMOUS AGENT] High confidence ({decision.confidence_score}). Auto-executing strategy for {customer_email}")
            send_recovery_email(
                to_email=customer.email, 
                subject="Action Required on your Recent Payment", 
                message_body=decision.generated_message
            )
            rc.status = "actioned"
            db.commit()

    return {"status": "ok"}
