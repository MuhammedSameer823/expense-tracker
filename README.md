# Spender • Personal Expense Tracker

A high-performance personal expense tracker web application built with a **FastAPI (Python)** backend, a responsive **Vanilla HTML/CSS/JS** frontend, and **Supabase (PostgreSQL)** for secure persistence.

---

## How to Run It (Starting from GitHub Clone)

Follow these exact commands to clone the repository and run the application locally on your laptop:

### 1. Clone the Repository & Navigate In
Open your terminal and run:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_REPO_NAME>
```
*(Replace `<YOUR_GITHUB_REPO_URL>` and `<YOUR_REPO_NAME>` with your actual repository link).*

*Note: The project is pre-configured with a hosted cloud database on Supabase (the `.env` file is included in this repository), so you do not need to create a database or run SQL setup scripts.*

### 2. Install Dependencies
Install the required Python packages:
```bash
pip install -r requirements.txt
```

### 3. Launch the Server
Start the local development server:
```bash
python app/main.py
```
*(Alternatively, run: `uvicorn app.main:app --port 3000 --reload`)*

Once started, open your browser and navigate to:
```
http://127.0.0.1:3000
```

---

## Stack Choices and Trade-offs

* **Backend: FastAPI (Python 3.8+)**
  * *Why*: FastAPI is extremely fast to set up, handles request validation automatically using Pydantic, and generates interactive OpenAPI specification docs.
  * *Trade-off*: We serve the static HTML and asset files directly from FastAPI's routing (`app.mount("/static", ...)`). This avoids any cross-origin resource sharing (CORS) header issues during local testing and allows running both API and UI on a single port.
* **Frontend: Vanilla HTML, CSS, and JS**
  * *Why*: Kept completely dependency-free (no React, Vue, Tailwind, or Bootstrap) to respect the test guidelines. Visuals use custom modern CSS variables, responsive grids, and subtle animations to present a premium look.
  * *Trade-off*: Writing raw JavaScript DOM manipulations requires more lines of code than a reactive framework, but yields a **0KB build bundle** and loads instantly in the browser.
* **Database: Supabase (PostgreSQL)**
  * *Why*: PostgreSQL provides strong data integrity. We implemented SQL check constraints directly in the database (`CHECK (amount >= 0)` and specific category constraints) to enforce data quality at the persistence layer.
  * *Trade-off*: Relies on a network connection to Supabase. However, we added performance indexes on the `date` and `category` fields to keep query response times minimal.

---

## What's Done vs. Skipped (and why)

### What's Done
1. **Add Expenses**: Form input with full client-side and backend validation (Title, Category selection, Amount check, note, and default today date).
2. **View Expenses**: List rendering sorted by date (most recent first) showing all fields.
3. **Edit & Delete**: CRUD capability with pre-filled inputs and verification prompts.
4. **Monthly Summary**: Calculates total current month spending and provides category breakdown progress bars.
5. **Advanced Filters**: Real-time searching by title, category, and date range (`from` to `to`) with client-side debouncing to reduce API load.
6. **Bonus Recruiter Features**:
   * **⚡ Seed Data**: Generates 12 realistic mock items mapped to logical categories and Rupee amounts with one click.
   * **📥 Export CSV**: Triggers a spreadsheet CSV download matching your current filtered search results.

### What's Skipped (as per test guidelines "What We Don't Care About")
1. **Authentication / Multi-user Support**: Skipped. The database and backend are structured for a single-user profile to focus on core CRUD/UI features within the 2-hour timeframe.
2. **Unit Test Suite**: Skipped. Prioritized strict Pydantic schemas, exception handler middleware, and manual verification to guarantee reliability under time constraints.
3. **Deployment**: Skipped. The application is built for portable, local execution.

---

## Known Rough Edges

1. **Timezone Boundary Offsets**: Dates are saved as standard `YYYY-MM-DD` strings. Summary calculations use the local system's date. If the user resides in a different timezone than the server environment, boundaries for records entered near midnight might shift by a day.
2. **Pagination**: The app fetches all matching records. If the database grows to thousands of records, we would need to add pagination cursors on the backend to avoid payload delays.
3. **API Documentation**: The interactive OpenAPI specification is compiled automatically. You can view the raw API Swagger interface by navigating to `http://127.0.0.1:3000/docs`.
