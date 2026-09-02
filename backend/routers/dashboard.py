from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Transaction, RecoveryCase, Customer, AIDecision

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_cases = db.query(RecoveryCase).count()
    revenue_at_risk = db.query(func.sum(RecoveryCase.potential_revenue)).filter(RecoveryCase.status == "pending").scalar() or 0.0
    recovered_revenue = db.query(func.sum(RecoveryCase.potential_revenue)).filter(RecoveryCase.status == "recovered").scalar() or 0.0
    
    return {
        "total_cases": total_cases,
        "revenue_at_risk": revenue_at_risk,
        "recovered_revenue": recovered_revenue
    }

@router.get("/recovery-cases")
def list_recovery_cases(db: Session = Depends(get_db)):
    cases = db.query(RecoveryCase).order_by(RecoveryCase.created_at.desc()).all()
    result = []
    for c in cases:
        ai_decision = db.query(AIDecision).filter(AIDecision.recovery_case_id == c.id).first()
        customer = db.query(Customer).filter(Customer.id == c.customer_id).first()
        
        result.append({
            "id": c.id,
            "transaction_id": c.transaction_id,
            "customer": {"name": customer.name, "email": customer.email} if customer else None,
            "status": c.status,
            "potential_revenue": c.potential_revenue,
            "ai_recommendation": {
                "recommended_action": ai_decision.recommended_action,
                "confidence_score": ai_decision.confidence_score,
                "reasoning": ai_decision.reasoning,
                "generated_message": ai_decision.generated_message
            } if ai_decision else None
        })
    return {"recovery_cases": result}

from email_service import send_recovery_email

@router.post("/recovery-cases/{case_id}/approve")
def approve_action(case_id: str, db: Session = Depends(get_db)):
    case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Update status to actioned
    case.status = "actioned"
    
    ai_decision = db.query(AIDecision).filter(AIDecision.recovery_case_id == case.id).first()
    customer = db.query(Customer).filter(Customer.id == case.customer_id).first()
    
    if ai_decision and customer and ai_decision.generated_message:
        print(f"[ACTION EXECUTION] Dispatching email to {customer.email}")
        # When testing with the storefront mock, change the customer email to your real email in seed_db or storefront payload to receive it!
        send_recovery_email(
            to_email=customer.email, 
            subject="Action Required on your Recent Payment", 
            message_body=ai_decision.generated_message
        )
    
    db.commit()
    db.refresh(case)
    return {"status": "success", "case": {"id": case.id, "status": case.status}}

import settings
from fastapi import Body

@router.get("/settings/autonomous")
def get_autonomous():
    return {"autonomous_mode": settings.AUTONOMOUS_MODE}

@router.post("/settings/autonomous")
def set_autonomous(mode: bool = Body(..., embed=True)):
    settings.AUTONOMOUS_MODE = mode
    return {"autonomous_mode": settings.AUTONOMOUS_MODE}

