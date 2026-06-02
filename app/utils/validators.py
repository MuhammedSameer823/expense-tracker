from datetime import datetime
from fastapi import HTTPException

VALID_CATEGORIES = {'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'}

def validate_category(category: str) -> str:
    """Ensure the category matches one of the allowed values."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}"
        )
    return category

def validate_date_format(date_str: str) -> str:
    """Ensure date is in YYYY-MM-DD format and is a valid calendar date."""
    if not date_str:
        return datetime.now().strftime("%Y-%m-%d")
    try:
        # Check parsing
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Must be YYYY-MM-DD"
        )

def validate_date_range(start_date: str, end_date: str):
    """Ensure start_date is not after end_date."""
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            if start > end:
                raise HTTPException(
                    status_code=400,
                    detail="Start date cannot be after end date"
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date parameters. Must be YYYY-MM-DD"
            )
