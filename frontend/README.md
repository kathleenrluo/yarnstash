# Yarn Stash Tracker - Frontend

React frontend for the Yarn Stash Tracker application, built with Vite.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Project Structure

```
frontend/
├── src/
│   ├── pages/           # Page components
│   │   ├── LandingPage.jsx
│   │   ├── StashPage.jsx
│   │   ├── ProjectsPage.jsx
│   │   └── CalculatorPage.jsx
│   ├── components/      # Reusable components
│   │   └── common/
│   │       └── Navbar.jsx
│   ├── services/        # API client
│   │   └── api.js
│   ├── App.jsx          # Main app component with routing
│   └── main.jsx         # Entry point
├── package.json
└── vite.config.js
```

## Features

### Current Implementation
- ✅ Navigation bar with routing
- ✅ Landing page (placeholder)
- ✅ Stash page (displays stash, basic UI)
- ✅ Projects page (displays projects, basic UI)
- ✅ Calculator page (placeholder)
- ✅ API client service (all backend endpoints)

### Next Steps
- Add yarn form (with multiselects for colors, care instructions, dropdown for weight)
- Edit yarn functionality
- Add project form
- Stash management (add/use yarn)
- Filtering and sorting
- Enhanced styling

## API Integration

All API calls go through `src/services/api.js`. The backend should be running on `http://localhost:8000`.

To test the connection:
1. Start the backend: `cd backend && uvicorn app.main:app --reload`
2. Start the frontend: `npm run dev`
3. Navigate to the Stash or Projects page to see data

## Development

The app uses:
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vite** - Build tool and dev server
