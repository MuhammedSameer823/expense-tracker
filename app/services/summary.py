import calendar
from datetime import datetime, date
from app.db.supabase import supabase

CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other']

def get_monthly_summary_data() -> dict:
    """Calculate the total spent and category-wise breakdown for the current month."""
    now = datetime.now()
    year = now.year
    month = now.month

    # Calculate dates YYYY-MM-01 to last day of month
    start_date = date(year, month, 1).strftime("%Y-%m-%d")
    _, last_day = calendar.monthrange(year, month)
    end_date = date(year, month, last_day).strftime("%Y-%m-%d")

    # Fetch amount and category fields within range
    response = supabase.table("expenses").select("amount, category").gte("date", start_date).lte("date", end_date).execute()
    records = response.data or []

    total_spent = 0.0
    breakdown = {cat: 0.0 for cat in CATEGORIES}

    for record in records:
        amt = float(record.get("amount") or 0)
        cat = record.get("category")
        total_spent += amt
        if cat in breakdown:
            breakdown[cat] += amt
        else:
            # Fallback for custom labels
            breakdown[cat] = breakdown.get(cat, 0.0) + amt

    # Round results
    formatted_breakdown = {k: round(v, 2) for k, v in breakdown.items()}
    month_name = now.strftime("%B %Y")

    return {
        "month": month_name,
        "totalSpent": round(total_spent, 2),
        "breakdown": formatted_breakdown
    }
