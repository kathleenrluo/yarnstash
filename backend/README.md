# Yarn Stash Tracker - Backend

FastAPI backend for the Yarn Stash Tracker application.

## Setup

### Quick Setup (Windows)

Run the setup script from the `backend` directory:
```powershell
.\setup.ps1
```

This will:
- Create a virtual environment (if it doesn't exist)
- Install all dependencies
- Set up the backend ready to run

### Manual Setup

#### 1. Create Virtual Environment

```bash
python -m venv venv
```

#### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── models/          # Database models (SQLAlchemy)
│   ├── services/        # Business logic layer
│   ├── api/             # API endpoints (FastAPI routes)
│   └── main.py         # FastAPI application entry point
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Key Design Principles

1. **Separation of Concerns**: Business logic lives in services, not in API endpoints
2. **Invariant Enforcement**: Stash can only be updated through specific service methods
3. **Clean Architecture**: Models → Services → API → Frontend

## API Endpoints

### Yarns
- `POST /yarns` - Create yarn
- `GET /yarns` - List all yarns
- `GET /yarns/{id}` - Get yarn by ID
- `PUT /yarns/{id}` - Update yarn
- `DELETE /yarns/{id}` - Delete yarn
- `GET /yarns/search/brands?q={term}` - Search brands (autocomplete)

### Stash
- `GET /stash` - Get all stash entries
- `GET /stash/{yarn_id}` - Get stash entry for yarn
- `POST /stash/add/grams` - Add yarn by grams
- `POST /stash/add/skeins` - Add yarn by skeins
- `POST /stash/use` - Deduct yarn from stash
- `PUT /stash/set` - Set stash quantity

### Projects
- `POST /projects` - Create project
- `GET /projects` - List all projects
- `GET /projects/{id}` - Get project by ID
- `GET /projects/{id}/details` - Get project with yarn details
- `PUT /projects/{id}` - Update project
- `POST /projects/{id}/use-yarn` - Record yarn usage
- `POST /projects/{id}/complete` - Mark project as completed
- `DELETE /projects/{id}` - Delete project

## Database

The application uses SQLite by default (file: `yarn_stash.db`).

To switch to PostgreSQL, update `app/models/database.py`:
```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"
```

## Development

The server runs with auto-reload enabled (`--reload` flag), so changes to code will automatically restart the server.
