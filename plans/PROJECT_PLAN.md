# Yarn Stash Tracker - Project Plan

## Overview
A local-first web application for tracking yarn inventory, crochet/knit projects, and performing yarn usage calculations. Built with React frontend and FastAPI backend.

## Installation Requirements

### 1. Python (Backend)
- **Version**: Python 3.11 or 3.12 (recommended)
- **Download**: https://www.python.org/downloads/
- **During installation**: ✅ Check "Add Python to PATH"
- **Verify**: Open terminal and run `python --version`

### 2. Node.js & npm (Frontend)
- **Version**: Node.js 18.x or 20.x (LTS recommended)
- **Download**: https://nodejs.org/
- **Includes**: npm (Node Package Manager) comes with Node.js
- **Verify**: Run `node --version` and `npm --version`

### 3. Git (Version Control)
- **Download**: https://git-scm.com/download/win
- **Verify**: Run `git --version`

### 4. Code Editor (Optional but Recommended)
- **VS Code**: https://code.visualstudio.com/
- **Extensions to install**:
  - Python
  - ESLint
  - Prettier
  - React snippets

### 5. Database (Optional for now)
- **SQLite**: Comes with Python (no separate install needed)
- **PostgreSQL**: Only needed later if you want to migrate from SQLite

## Project Structure

```
yarn-stash/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── models/              # Database models
│   │   │   ├── yarn.py
│   │   │   ├── stash.py
│   │   │   ├── project.py
│   │   │   └── database.py
│   │   ├── services/            # Business logic layer
│   │   │   ├── yarn_service.py
│   │   │   ├── stash_service.py
│   │   │   ├── project_service.py
│   │   │   └── care_instruction_service.py
│   │   ├── api/                 # API endpoints
│   │   │   ├── yarns.py
│   │   │   ├── stash.py
│   │   │   ├── projects.py
│   │   │   └── calculations.py
│   │   └── calculations/        # Calculation engine
│   │       ├── stitch_estimator.py
│   │       ├── yarn_converter.py
│   │       └── stitch_rules.json
│   ├── requirements.txt
│   ├── alembic/                 # Database migrations (later)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Stash/
│   │   │   ├── Projects/
│   │   │   ├── Calculator/
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── StashPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   └── CalculatorPage.jsx
│   │   ├── services/            # API client functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js           # or create-react-app config
├── .gitignore
└── README.md
```

## Development Phases

### Phase 1: Backend Foundation (Week 1-2) ✅ COMPLETED
**Goal**: Set up backend structure and core data models

1. **Setup**
   - [x] Create virtual environment
   - [x] Install FastAPI, SQLAlchemy, Pydantic
   - [x] Set up project structure
   - [x] Configure SQLite database

2. **Data Models**
   - [x] Yarn model (all properties from brainstorm)
   - [x] StashEntry model (yarn_id + quantity)
   - [x] Project model
   - [x] ProjectYarnUsage join table
   - [x] Database relationships
   - [x] Structured data (integer IDs for care instructions, weights)
   - [x] JSON arrays for multi-select fields

3. **Core Services**
   - [x] Yarn service (CRUD operations)
   - [x] Stash service (add/use/update methods)
   - [x] Care instruction resolver (most restrictive logic)
   - [x] Project service
   - [x] Material parsing service

4. **API Endpoints**
   - [x] `/yarns` - GET, POST, PUT, DELETE
   - [x] `/stash` - GET, POST (add), POST (use)
   - [x] `/projects` - GET, POST, PUT, DELETE
   - [x] `/options` - Get available options
   - [x] `/yarns/search/*` - Autocomplete endpoints
   - [x] `/yarns/properties` - Get yarn properties for autofill
   - [x] `/projects/by-yarn` - Get projects by yarn
   - [x] Basic error handling

### Phase 2: Frontend Foundation (Week 2-3) ✅ COMPLETED
**Goal**: Create React app with basic UI

1. **Setup**
   - [x] Create React app (Vite recommended)
   - [x] Install React Router, Axios
   - [x] Set up API client service
   - [x] Basic styling setup (earthy theme, inline styles)

2. **Pages**
   - [x] Landing page (placeholder)
   - [x] Navigation bar
   - [x] Stash page (Pinterest-style cards)
   - [x] Projects page (Pinterest-style cards)
   - [x] Calculator page (placeholder)

3. **Components**
   - [x] Yarn card component (Card)
   - [x] Project card component (Card)
   - [x] Form components (AddYarnForm, AddProjectForm)
   - [x] Reusable components (Modal, FavoriteButton, Tag, ColorSelect)
   - [x] Detail modals (YarnDetailModal, ProjectDetailModal)

### Phase 3: Stash Management (Week 3-4) ✅ COMPLETED
**Goal**: Full stash CRUD with autocomplete

1. **Features**
   - [x] Add yarn form (all properties)
   - [x] Brand name autocomplete
   - [x] Yarn name autocomplete
   - [x] Color name autocomplete
   - [x] Material breakdown autocomplete
   - [x] Auto-fill properties when brand + yarn name match
   - [x] Add yarn quantity (by grams)
   - [x] Use yarn (deduct quantity via projects)
   - [x] Sort/filter functionality:
     - [x] By color (with visual color squares)
     - [x] By weight
     - [x] By material
     - [x] By brand
     - [x] By quantity
     - [x] By favorite
     - [x] Multi-field search
     - [x] Ascending/descending sort
   - [x] Display stash with photos (Pinterest-style)
   - [x] Favorites system
   - [x] Yarn detail modal

### Phase 4: Project Management (Week 4-5) ✅ COMPLETED
**Goal**: Full project tracking with yarn usage

1. **Features**
   - [x] Add project form
   - [x] Assign yarns to project
   - [x] Track grams used per yarn
   - [x] Auto-update stash when yarn is used
   - [x] Display computed care instructions
   - [x] Project images/videos (URLs stored)
   - [x] Date tracking (started/completed)
   - [x] Pattern reference (PDF link, tutorial link, or "freehand")
   - [x] Craft type (knit/crochet)
   - [x] Hook/needle size (single value, with US notation for crochet)
   - [x] Tags system (free-form, Discord-style)
   - [x] Favorites system
   - [x] Project detail modal
   - [x] Cross-modal navigation (yarn ↔ project)
   - [x] Search and sort functionality

### Phase 5: Calculation Engine (Week 5-6)
**Goal**: Yarn usage estimation

1. **Stitch Rules**
   - [ ] Create stitch_rules.json structure
   - [ ] Add test swatch data entry
   - [ ] Build stitch estimator module
   - [ ] Meters per stitch calculation

2. **Calculator Page**
   - [ ] Input stitch counts
   - [ ] Select yarn(s)
   - [ ] Calculate meters needed
   - [ ] Convert to grams (per yarn)
   - [ ] Check stash sufficiency
   - [ ] Display results

3. **Integration**
   - [ ] API endpoint for calculations
   - [ ] Frontend calculator UI
   - [ ] Stash checking logic

### Phase 6: Polish & Testing (Week 6-7) 🚧 PARTIALLY COMPLETE
**Goal**: Refinement and bug fixes

1. **Testing**
   - [ ] Backend unit tests (directory reserved)
   - [ ] API integration tests
   - [ ] Frontend component tests (optional)

2. **UX Improvements**
   - [x] Form validation (basic)
   - [x] Loading states (basic)
   - [x] Error messages (basic)
   - [ ] Success notifications
   - [x] Responsive design (flexbox-based)
   - [x] Optimistic UI updates for favorites
   - [x] Earthy theme with consistent styling

3. **Documentation**
   - [x] API documentation (FastAPI auto-generates at /docs)
   - [x] README with setup instructions (QUICK_START.md)
   - [x] Code comments
   - [x] STATUS.md for project status
   - [x] Migration scripts documented

### Phase 7: Future Features (Later)
- Pattern creation page
- Computer vision for label scanning
- ML-based stitch estimation
- Public API deployment
- Mobile app
- **Photo cropping on upload** - Allow users to crop images before uploading (yarn photos, label photos, project photos). Would use a library like `react-easy-crop` to provide a cropping interface between file selection and upload. Estimated effort: 2-3 hours for single images, 4-6 hours for multiple images.

## Key Implementation Notes

### Backend Architecture
- **No business logic in React** - All calculations and state changes go through API
- **Service layer pattern** - Controllers call services, services handle logic
- **Pure calculation engine** - No database access, just math
- **Invariant enforcement** - Stash can only be updated via specific methods

### Data Flow
1. User action in React → API call
2. API endpoint → Service layer
3. Service layer → Database models
4. Service layer → Business logic (care instructions, calculations)
5. Response → Frontend updates

### Important Design Decisions
- **Yarn vs Stash**: Yarn is metadata (persists even at 0 quantity), StashEntry is inventory
- **Care Instructions**: Computed from most restrictive yarn in project
- **Stitch Rules**: JSON config file (easy to update with test swatch data)
- **Extensibility**: All modules are independent, easy to add CV/ML later

## Next Steps

1. **Install required software** (see Installation Requirements above)
2. **Set up project structure** (create folders)
3. **Initialize backend** (Python virtual environment, FastAPI)
4. **Initialize frontend** (React app)
5. **Start with Phase 1** - Backend Foundation

## Questions to Consider

1. **Styling**: CSS modules, Tailwind, or styled-components?
2. **State Management**: Context API, Redux, or just local state?
3. **Image Storage**: Local filesystem or cloud storage (S3, etc.)?
4. **Database Migrations**: Alembic or manual SQL?
5. **Testing Framework**: pytest for backend, Jest for frontend?
