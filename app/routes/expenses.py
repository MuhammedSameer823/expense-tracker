from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List
from datetime import datetime

from app.db.supabase import supabase
from app.models.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services.summary import get_monthly_summary_data
from app.utils.validators import (
    validate_category,
    validate_date_format,
    validate_date_range
)

router = APIRouter()

def map_db_to_response(db_item: dict) -> dict:
    """Helper to convert database field 'date' back to 'expense_date' for the schema response."""
    return {
        "id": str(db_item.get("id")),
        "title": db_item.get("title"),
        "amount": float(db_item.get("amount") or 0.0),
        "category": db_item.get("category"),
        "expense_date": db_item.get("date"),
        "note": db_item.get("note"),
        "created_at": db_item.get("created_at")
    }

@router.get("/summary")
def get_monthly_summary():
    """Retrieve aggregate spending summary for the current month."""
    try:
        data = get_monthly_summary_data()
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch summary: {str(e)}"
        )

@router.get("/")
def get_expenses(
    category: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """View list of all expenses with optional filtering, sorted by date descending."""
    try:
        # Validate query date constraints
        if startDate:
            validate_date_format(startDate)
        if endDate:
            validate_date_format(endDate)
        if startDate and endDate:
            validate_date_range(startDate, endDate)
        if category:
            validate_category(category)

        # Build Supabase query
        query = supabase.table("expenses").select("*")

        if category:
            query = query.eq("category", category)
        if startDate:
            query = query.gte("date", startDate)
        if endDate:
            query = query.lte("date", endDate)
        if search:
            query = query.ilike("title", f"%{search}%")

        # Order by date descending, created_at descending
        response = query.order("date", desc=True).order("created_at", desc=True).execute()
        records = response.data or []

        formatted_expenses = [map_db_to_response(item) for item in records]

        return {
            "success": True,
            "count": len(formatted_expenses),
            "data": formatted_expenses
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch expenses: {str(e)}"
        )

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_expense(expense: ExpenseCreate):
    """Add a new expense."""
    try:
        # Validate inputs
        validate_category(expense.category)
        expense_date = validate_date_format(expense.expense_date)

        insert_payload = {
            "title": expense.title.strip(),
            "amount": expense.amount,
            "category": expense.category,
            "date": expense_date,
            "note": expense.note.strip() if expense.note else None
        }

        response = supabase.table("expenses").insert(insert_payload).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to create expense record."
            )

        return {
            "success": True,
            "data": map_db_to_response(response.data[0])
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create expense: {str(e)}"
        )

@router.put("/{id}")
def update_expense(id: str, expense: ExpenseUpdate):
    """Edit an existing expense."""
    try:
        fields_set = expense.model_fields_set
        update_payload = {}
        
        if "title" in fields_set:
            if expense.title is None or not expense.title.strip():
                raise HTTPException(status_code=400, detail="Title cannot be empty")
            update_payload["title"] = expense.title.strip()
            
        if "amount" in fields_set:
            if expense.amount is None or expense.amount < 0:
                raise HTTPException(status_code=400, detail="Amount must be positive")
            update_payload["amount"] = expense.amount
            
        if "category" in fields_set:
            if expense.category is None:
                raise HTTPException(status_code=400, detail="Category is required")
            validate_category(expense.category)
            update_payload["category"] = expense.category
            
        if "expense_date" in fields_set:
            expense_date = validate_date_format(expense.expense_date)
            update_payload["date"] = expense_date
            
        if "note" in fields_set:
            update_payload["note"] = expense.note.strip() if expense.note else None

        if not update_payload:
            raise HTTPException(status_code=400, detail="No update parameters provided")

        response = supabase.table("expenses").update(update_payload).eq("id", id).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Expense record not found or no changes made."
            )

        return {
            "success": True,
            "data": map_db_to_response(response.data[0])
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update expense: {str(e)}"
        )

@router.delete("/{id}")
def delete_expense(id: str):
    """Delete an expense."""
    try:
        response = supabase.table("expenses").delete().eq("id", id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Expense record not found or already deleted."
            )

        return {
            "success": True,
            "message": "Expense deleted successfully"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete expense: {str(e)}"
        )
