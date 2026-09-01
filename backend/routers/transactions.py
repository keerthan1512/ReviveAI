from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Transaction, Customer

router = APIRouter()

@router.get("/")
def list_transactions(db: Session = Depends(get_db)):
    txs = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(10).all()
    result = []
    for t in txs:
        customer = db.query(Customer).filter(Customer.id == t.customer_id).first()
        result.append({
            "id": t.id,
            "amount": t.amount,
            "status": t.status,
            "payment_method": t.payment_method,
            "customer_name": customer.name if customer else "Unknown",
            "created_at": t.created_at
        })
    return {"transactions": result}
