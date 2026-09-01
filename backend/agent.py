import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from models import AIDecision

class RecoveryActionOutput(BaseModel):
    recommended_action: str = Field(description="The recommended recovery strategy, e.g., 'send_payment_link', 'retry', 'alternative_method'")
    confidence_score: float = Field(description="Confidence score of the recommendation between 0 and 1")
    reasoning: str = Field(description="Explanation of why this action was selected")
    generated_message: str = Field(description="The exact personalized email or SMS copy to send to the customer.")

def analyze_recovery_case(db: Session, case_id: str, transaction_data: dict, customer_history: dict):
    result = None
    if os.environ.get("GROQ_API_KEY"):
        try:
            llm = ChatGroq(model="mixtral-8x7b-32768", temperature=0.2)
            parser = JsonOutputParser(pydantic_object=RecoveryActionOutput)

            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are ReviveAI, an intelligent payment recovery agent. Analyze the transaction and customer history to recommend the best recovery strategy. You MUST also generate the exact personalized email or SMS copy to send. Return ONLY valid JSON matching the format instructions."),
                ("user", "Transaction Details: {transaction}\nCustomer History: {history}\n\nProvide the recommendation and generated message.\n{format_instructions}")
            ])

            chain = prompt | llm | parser

            result = chain.invoke({
                "transaction": transaction_data,
                "history": customer_history,
                "format_instructions": parser.get_format_instructions()
            })
        except Exception as e:
            print(f"[ERROR] LLM Invocation failed: {e}")
            result = None

    if not result:
        result = {
            "recommended_action": "send_payment_link",
            "confidence_score": 0.85,
            "reasoning": "Simulated reasoning: Customer has a good history, temporary failure detected. (Fallback used due to LLM error)",
            "generated_message": f"Hi there, we noticed your recent payment of {transaction_data.get('amount')} failed due to {transaction_data.get('reason', 'a bank issue')}. Don't worry, you can securely complete your purchase using this link: https://pay.example.com/retry"
        }
    
    # Save decision to DB
    decision = AIDecision(
        recovery_case_id=case_id,
        recommended_action=result["recommended_action"],
        confidence_score=result["confidence_score"],
        reasoning=result["reasoning"],
        generated_message=result["generated_message"]
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    
    return decision
