import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.expenses import router as expenses_router

# Load env variables
load_dotenv()

app = FastAPI(title="Spender • Personal Expense Tracker API")

# Enable CORS for local cross-origin testing if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
static_dir = os.path.join(BASE_DIR, "static")
templates_dir = os.path.join(BASE_DIR, "templates")

# Mount Static assets
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Templates engine setup
templates = Jinja2Templates(directory=templates_dir)

# Mount API Routers
app.include_router(expenses_router, prefix="/api/expenses", tags=["Expenses"])

# Root Route - Serves Dashboard HTML template
@app.get("/", response_class=HTMLResponse)
async def get_dashboard(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Custom Exception Handler for Pydantic Validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = {}
    for error in exc.errors():
        # Retrieve the leaf location field name (e.g. ('body', 'title') -> 'title')
        field_name = str(error["loc"][-1])
        # Map specific field error messages to be cleaner
        msg = error["msg"]
        if "greater than 0" in msg:
            msg = "Amount must be a positive number (0 or greater)."
        elif "value is not a valid" in msg:
            msg = "Enter a valid positive number."
        errors[field_name] = msg
        
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "message": "Validation failed",
            "errors": errors
        }
    )

# Custom Exception Handler for standard HTTPExceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail
        }
    )

# Custom General Exception Handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal Server Error",
            "detail": str(exc)
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
