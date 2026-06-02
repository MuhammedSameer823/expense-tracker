from pydantic import BaseModel, Field
from typing import Optional

class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Title of the expense")
    amount: float = Field(..., gt=0, description="Positive decimal value representing cost")
    category: str = Field(..., description="Category constraint matching allowed options")
    expense_date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    note: Optional[str] = Field(None, description="Optional description note")

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    expense_date: Optional[str] = None
    note: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    title: str
    amount: float
    category: str
    expense_date: str
    note: Optional[str] = None
    created_at: str
