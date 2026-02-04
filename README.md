# Yarn Stash Tracker 

A full-stack web application for tracking your yarn collection, managing crochet and knitting projects, and calculating yarn usage. Built with a focus on efficiency, useful autofill, smart sorting, and automatic care-instruction calculation.

## Features

### Yarn Management
- **Complete yarn tracking** with brand, name, color, weight, materials, and care instructions
- **Photo uploads** for visual yarn identification
- **Smart autocomplete** for brands, yarn names, colors, and materials
- **Auto-fill properties** when adding duplicate yarns
- **Notes field** for personal annotations
- **Favorites system** to mark your go-to yarns

### Stash Inventory
- **Automatic quantity tracking** that updates as you use yarn in projects
- **Add yarn by grams or skeins** with flexible input
- **Filtering** by favorite, weight, color, brand, and material
- **Multi-field search** across all yarn properties
- **Sorting** by name, weight, quantity, or favorite status

### Project Management
- **Track crochet and knitting projects** with detailed information
- **Yarn usage tracking** - automatically deducts from stash as you work
- **Care instruction calculation** based on project materials (most restrictive)
- **Tags system** (Discord-style, free-form) for organization
- **Pattern references** and notes
- **Favorites** for your best projects

### User Experience
- **Earthy, clean design** with consistent theming
- **Responsive layout** that works on all screen sizes
- **Pinterest-style card layouts** for easy browsing
- **Cross-modal navigation** between yarns and projects
- **Optimistic UI updates** for instant feedback
- **Edit functionality** for both yarns and projects

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Database (easily migratable to PostgreSQL)
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React 19** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Custom theme system** - Consistent styling

## Quick Start

### Prerequisites
- Python 3.14+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Run the setup script (Windows):**
   ```powershell
   .\setup.ps1
   ```

   Or manually:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   ```

3. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at:
   - API: http://localhost:8000
   - Interactive Docs: http://localhost:8000/docs
   - Alternative Docs: http://localhost:8000/redoc

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:5173

### Using Helper Scripts

For convenience, PowerShell scripts are provided in the `scripts/` directory:

```powershell
# Start both backend and frontend
.\scripts\START_ALL.ps1

# Or start individually
.\scripts\START_BACKEND.ps1
.\scripts\START_FRONTEND.ps1
```

## Project Structure

```
yarn-stash/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI endpoints
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── services/         # Business logic layer
│   │   ├── calculations/     # (Reserved for future calculator feature)
│   │   └── main.py           # FastAPI application entry point
│   ├── migrations/           # Database migration scripts
│   ├── utilities/            # Development/maintenance scripts
│   ├── tests/                # Test files
│   ├── uploads/              # User-uploaded images
│   ├── requirements.txt      # Python dependencies
│   └── setup.ps1            # Quick setup script
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── common/       # Shared components (Modal, Card, etc.)
│   │   │   └── forms/        # Form components
│   │   ├── pages/            # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── StashPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   └── CalculatorPage.jsx
│   │   ├── services/            # API client
│   │   └── api.js
│   │   ├── styles/            # Theme and styling
│   │   │   └── theme.js
│   │   └── utils/             # Utility functions
│   ├── public/               # Static assets
│   └── package.json
└── scripts/                  # Helper scripts for running the app
```

## Usage

### Adding Yarns
1. Navigate to the **Stash** page
2. Click **Add Yarn**
3. Fill in yarn details (brand, name, color, etc.)
4. Use autocomplete for faster entry
5. Upload photos if desired
6. Add notes for personal reference

### Managing Stash
- **Add yarn**: Use the "Add Yarn" form to add new yarns to your collection
- **Add quantity**: Click on a yarn card to view details and add more quantity
- **Use yarn**: When you use yarn in a project, it automatically deducts from stash
- **Filter & search**: Use the filters and search bar to find specific yarns
- **Sort**: Click column headers to sort by different criteria

### Creating Projects
1. Navigate to the **Projects** page
2. Click **Add Project**
3. Fill in project details (name, craft type, pattern, etc.)
4. Select yarns used in the project
5. Add tags for organization
6. Save - yarn usage is automatically tracked

### Viewing Details
- Click on any yarn or project card to view full details
- Edit or delete items from the detail modal
- Toggle favorites for quick access
- Navigate between related yarns and projects

## Development

### Backend Development
- The server runs with auto-reload enabled (`--reload` flag)
- API documentation is available at `/docs` and `/redoc`
- Database file: `yarn_stash.db` (SQLite)

### Frontend Development
- Hot module replacement is enabled
- API calls are configured to `http://localhost:8000`
- Theme colors and styles are centralized in `src/styles/theme.js`

### Database Migrations
Migration scripts are in `backend/migrations/`. To apply a migration:
```bash
python backend/migrations/<migration_name>.py
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## API Documentation

Full API documentation is available when the backend is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

**Yarns:**
- `GET /yarns` - List all yarns
- `POST /yarns` - Create yarn
- `GET /yarns/{id}` - Get yarn details
- `PUT /yarns/{id}` - Update yarn
- `DELETE /yarns/{id}` - Delete yarn
- `GET /yarns/search/*` - Autocomplete endpoints

**Stash:**
- `GET /stash` - Get all stash entries
- `POST /stash/add/grams` - Add yarn by grams
- `POST /stash/add/skeins` - Add yarn by skeins
- `POST /stash/use` - Deduct yarn from stash

**Projects:**
- `GET /projects` - List all projects
- `POST /projects` - Create project
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project
- `POST /projects/{id}/use-yarn` - Record yarn usage
- `DELETE /projects/{id}` - Delete project

## Design Philosophy

This project reflects a focus on:
- **Efficiency**: Smart autofill and sorting that actually work
- **Details**: Automatic care-instruction calculation based on materials
- **Repeatability**: Systems that update themselves as you work
- **Clean interfaces**: Intuitive workflows that fit how you think and create

## Future Features

- **Calculator Page**: Estimate yarn needs based on stitch counts (Phase 5)
- **Pattern Creation**: Build and save custom patterns
- **Computer Vision**: Scan yarn labels automatically
- **Mobile App**: Native mobile experience

## License

This project is open source and available for personal use.

## Author

**Kat** - A serial hobbyist who dives deep, fast. This tracker combines technical skills with creative interests to build tools that actually work the way you think.

---

**Made for yarn crafters who care about the details**
