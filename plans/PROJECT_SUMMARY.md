# Project Summary: Yarn Stash Tracker

## What You're Building

A **local-first web application** to track your yarn collection and crochet/knit projects. Think of it as a digital inventory system specifically designed for yarn crafters.

## Core Features

### 1. Yarn Stash Management
- Track detailed yarn information (brand, color, weight, material, care instructions)
- Store photos of yarn and labels
- Manage inventory quantities (add/remove yarn)
- Smart autocomplete for brands you already own
- Multiple sorting options (color, weight, material, quantity)

### 2. Project Tracking
- Record all your crochet/knit projects
- Link projects to yarns used
- Track how much yarn each project consumed
- Automatically calculate care instructions (uses most restrictive from all yarns)
- Store pattern references (PDF links, tutorial links, or mark as freehand)
- Add notes, images, and dates

### 3. Yarn Usage Calculator
- Estimate how much yarn you need for a project
- Based on stitch type, yarn weight, and hook size
- Convert between meters and grams
- Check if you have enough yarn in your stash

### 4. Future: Pattern Creation
- Build patterns within the app
- Use stash and calculations to plan projects
- (This comes later)

## Technical Architecture

### Frontend (React)
- **What it does**: User interface, displays data, handles user input
- **What it doesn't do**: No business logic, no calculations, no direct database access
- **Pages**: Landing, Stash, Projects, Calculator, Pattern (later)

### Backend (FastAPI - Python)
- **What it does**: All business logic, calculations, data validation, database operations
- **Structure**:
  - **Models**: Database structure (Yarn, StashEntry, Project)
  - **Services**: Business logic layer (how to add yarn, use yarn, calculate care instructions)
  - **API**: REST endpoints that frontend calls
  - **Calculations**: Pure math module (no database access)

### Database (SQLite → PostgreSQL later)
- **SQLite**: Starts simple, file-based, no setup needed
- **PostgreSQL**: Can migrate later for production

## Key Design Principles

1. **Separation of Concerns**
   - Frontend = UI only
   - Backend = Logic only
   - This makes testing and maintenance easier

2. **Yarn vs Stash**
   - **Yarn**: Information about a yarn type (persists even if you have 0g)
   - **StashEntry**: How much of that yarn you actually own
   - Example: You might have "Red Heart Super Saver" in your database, but 0g in stash (used it all)

3. **Invariant Enforcement**
   - Stash can ONLY be updated through specific methods:
     - `use_yarn()` - Deduct yarn
     - `add_yarn_by_grams()` - Add specific grams
     - `add_yarn_by_skeins()` - Add by number of skeins
   - This prevents bugs and ensures data consistency

4. **Extensibility**
   - Code is modular so you can add features later:
     - Computer vision for label scanning
     - Machine learning for better stitch estimates
     - Public API
     - Mobile app

## Data Models Overview

### Yarn
- Brand name, yarn name, color name
- Generalized color (for sorting)
- Yarn weight (DK, Worsted, etc.)
- Material breakdown (50% wool, 30% acrylic, etc.)
- Grams per skein, meters per skein
- Care instructions
- Photos (yarn and label)
- **Note**: This is metadata, not inventory

### StashEntry
- Links to a Yarn
- Total grams owned
- Last updated timestamp
- **Note**: This is your actual inventory

### Project
- Name, description, notes
- Date started/completed
- Hook sizes used
- Pattern type (PDF link, tutorial link, freehand)
- Computed care instruction (from yarns used)
- Images/videos

### ProjectYarnUsage
- Links Project to Yarn
- Records grams used
- **Note**: When you record usage, stash automatically updates

## Workflow Examples

### Adding Yarn to Stash
1. User fills out form (brand, color, weight, etc.)
2. Frontend sends POST request to `/yarns`
3. Backend creates Yarn record
4. User then adds quantity (e.g., "I have 200g")
5. Frontend sends POST to `/stash/add`
6. Backend creates/updates StashEntry

### Using Yarn in a Project
1. User creates project
2. User selects yarns and enters grams used (e.g., "Used 50g of Red Heart")
3. Frontend sends POST to `/projects/{id}/use-yarn`
4. Backend:
   - Records usage in ProjectYarnUsage
   - Calls `stash_service.use_yarn()` to deduct from stash
   - Computes care instructions from all yarns

### Calculating Yarn Needs
1. User enters stitch counts on Calculator page
2. User selects yarn and hook size
3. Frontend sends POST to `/calculate/yarn-estimate`
4. Backend calculation engine:
   - Looks up stitch rules (meters per stitch)
   - Calculates total meters needed
   - Converts to grams for selected yarn
   - Checks stash sufficiency
5. Returns estimate to frontend

## Development Approach

**Start Simple, Build Incrementally**

1. **Phase 1**: Backend foundation (models, basic CRUD)
2. **Phase 2**: Frontend foundation (basic pages, navigation)
3. **Phase 3**: Stash management (full CRUD with autocomplete)
4. **Phase 4**: Project management (tracking with auto-updates)
5. **Phase 5**: Calculation engine (stitch estimates)
6. **Phase 6**: Polish and testing

Each phase builds on the previous one. You can use the app after Phase 3, even if features are basic.

## What You Need to Install

See `QUICK_START.md` for detailed installation instructions.

**Minimum Required:**
- Python 3.11+ (for backend)
- Node.js 18+ (for frontend)
- Git (optional, for version control)

**That's it!** SQLite comes with Python, so no database setup needed initially.

## Next Steps

1. ✅ Read this summary (you're here!)
2. ✅ Read `PROJECT_PLAN.md` for detailed roadmap
3. ✅ Read `QUICK_START.md` for installation steps
4. ⏭️ Install Python and Node.js
5. ⏭️ Set up project structure
6. ⏭️ Start Phase 1: Backend Foundation

## Questions?

The design document from ChatGPT provides a solid foundation. The main things to decide as you build:

- **Styling approach**: CSS, Tailwind, or styled-components?
- **State management**: Context API or Redux?
- **Image storage**: Local files or cloud?
- **Testing**: How much testing do you want initially?

You can make these decisions as you go - the architecture supports any choice!
