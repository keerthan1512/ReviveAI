from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Merchant(Base):
    __tablename__ = "merchants"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, index=True)
    api_key = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    merchant_id = Column(String, ForeignKey("merchants.id"))
    name = Column(String)
    email = Column(String, index=True)
    phone = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    transactions = relationship("Transaction", back_populates="customer")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    merchant_id = Column(String, ForeignKey("merchants.id"))
    amount = Column(Float)
    currency = Column(String, default="INR")
    status = Column(String, index=True) # "failed", "captured", "authorized"
    payment_method = Column(String)
    failure_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    customer = relationship("Customer", back_populates="transactions")
    recovery_case = relationship("RecoveryCase", back_populates="transaction", uselist=False)

class RecoveryCase(Base):
    __tablename__ = "recovery_cases"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), unique=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    status = Column(String, default="pending") # pending, actioned, recovered, failed
    potential_revenue = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    transaction = relationship("Transaction", back_populates="recovery_case")
    ai_decision = relationship("AIDecision", back_populates="recovery_case", uselist=False)

class AIDecision(Base):
    __tablename__ = "ai_decisions"
    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    recovery_case_id = Column(String, ForeignKey("recovery_cases.id"), unique=True)
    recommended_action = Column(String)
    confidence_score = Column(Float)
    reasoning = Column(String)
    generated_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    recovery_case = relationship("RecoveryCase", back_populates="ai_decision")
