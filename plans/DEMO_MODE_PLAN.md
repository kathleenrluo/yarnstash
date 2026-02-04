# Demo Mode / Portfolio Deployment Plan

**Status**: Not Started  
**Priority**: Medium  
**Target**: Portfolio deployment for recruiters and potential employers

## Overview

This document outlines the features and implementation plan for deploying the Yarn Stash Tracker as an interactive demo on a portfolio website. The goal is to allow visitors (primarily recruiters) to explore the full functionality of the application without risking modification to the actual production data.

## Goals

1. **Showcase Full Functionality**: Allow visitors to experience all features including write operations (create, update, delete)
2. **Data Protection**: Ensure production data remains untouched
3. **Professional Presentation**: Provide a polished, recruiter-friendly experience
4. **Easy Toggle**: Enable switching between demo mode and production mode during development

## Proposed Features

### 1. Landing Page with Demo Video

**Purpose**: Provide a quick overview of the application's capabilities before visitors interact with it.

**Components**:
- Prominent "Watch Demo Video" button/link
- Embedded video player or link to hosted video (YouTube, Vimeo, etc.)
- 2-3 minute walkthrough showing:
  - Adding yarns to stash
  - Creating projects
  - Linking yarns to projects
  - Filtering and searching
  - Edit functionality
- "Try Interactive Demo" button that navigates to the main app
- "View Code on GitHub" link

**Implementation Notes**:
- Video can be hosted externally (YouTube unlisted, Vimeo, etc.)
- Or embedded directly in the landing page
- Should be professionally edited with clear narration or captions

### 2. Demo Mode Toggle

**Purpose**: Allow easy switching between demo mode and production mode during development.

**Implementation**:
- Environment variable: `DEMO_MODE=true/false`
- Backend checks this variable to determine database and behavior
- Frontend can optionally check this to show/hide demo-specific UI elements
- Default to `false` (production mode) for safety

**Configuration**:
```python
# backend/.env or environment config
DEMO_MODE=true
DEMO_SESSION_TIMEOUT=3600  # 1 hour in seconds
```

### 3. Session-Based Demo Mode

**Purpose**: Provide isolated, temporary databases for each visitor so they can fully interact with the application.

**Architecture**:
- Each visitor gets a unique session ID (stored in cookie or localStorage)
- Each session gets its own temporary SQLite database file
- Session data persists across page refreshes (until timeout)
- Automatic cleanup of expired sessions

**Session Management**:
- **Session ID Generation**: UUID v4 or similar
- **Session Storage**: 
  - Backend: In-memory dictionary mapping session_id → database_path
  - Frontend: Cookie or localStorage to persist session_id
- **Database Location**: `backend/demo_sessions/{session_id}.db`
- **Session Timeout**: 1 hour of inactivity (configurable)
- **Cleanup**: Background task runs periodically to delete expired session databases

**Database Strategy**:
- **Option A (Initial)**: Temporary SQLite files per session
  - Pros: Simple, persists across refreshes, easy cleanup
  - Cons: SQLite concurrency limitations, file system management
- **Option B (Future)**: PostgreSQL with schema-per-session
  - Pros: Better concurrency, more scalable
  - Cons: More complex setup, requires PostgreSQL

**Session Lifecycle**:
1. Visitor arrives → Check for existing session_id in cookie
2. If no session_id → Generate new one, create new database, seed with sample data
3. If session_id exists → Load existing session database
4. On each request → Check session timeout, refresh if valid
5. Background cleanup → Delete databases older than timeout

### 4. Demo Banner / UI Indicators

**Purpose**: Clearly communicate to visitors that they're in demo mode and set expectations.

**Components**:
- **Top Banner**: 
  - "🎮 Demo Mode - Your changes will be reset after 1 hour of inactivity"
  - Sticky or dismissible (but reappears on page load)
  - Distinct styling (e.g., subtle background color, icon)
- **Session Info** (Optional):
  - Show time remaining until reset
  - "Session expires in: 45 minutes"
- **Reset Button** (Optional):
  - "Start Fresh Session" button to manually reset their demo data
  - Confirms before resetting

**Styling**:
- Non-intrusive but visible
- Consistent with app theme
- Clear, friendly messaging

### 5. Sample Data Seeding

**Purpose**: Provide realistic, interesting sample data for visitors to explore.

**Implementation**:
- Seed script that populates new session databases with:
  - 10-15 sample yarns (various brands, colors, weights)
  - Stash entries with varying quantities
  - 5-8 sample projects (completed and in-progress)
  - Yarn-project relationships
  - Sample images (or placeholder images)
- Data should showcase:
  - Different yarn weights
  - Various colors and materials
  - Different project types (knit vs crochet)
  - Favorites, tags, notes

**Sample Data Sources**:
- Create realistic but fictional data
- Or use anonymized/sanitized real data
- Ensure no personal information is included

### 6. File Upload Handling in Demo Mode

**Purpose**: Allow visitors to test image upload functionality without cluttering production storage.

**Implementation**:
- **Per-Session Upload Directories**: `backend/uploads/demo/{session_id}/`
- **Cleanup**: Delete session upload directory when session expires
- **Limits**: 
  - File size limits (same as production)
  - Total files per session (optional, e.g., max 20 images)
- **Storage**: Temporary, cleaned up with session

### 7. API Modifications for Demo Mode

**Purpose**: Route requests to the appropriate database based on session.

**Middleware/Decorator Pattern**:
```python
# Pseudo-code structure
@router.post("/yarns")
async def create_yarn(..., session_id: str = get_session_id()):
    if DEMO_MODE:
        db = get_session_db(session_id)
    else:
        db = get_production_db()
    # ... rest of endpoint logic
```

**Session ID Extraction**:
- From cookie (preferred for security)
- From request header (fallback)
- Generate new if missing (in demo mode)

**Database Dependency**:
- Modify `get_db()` dependency to check `DEMO_MODE`
- If demo mode: return session-specific database
- If production: return production database

### 8. Frontend Modifications

**Purpose**: Handle session management and display demo-specific UI.

**Session Management**:
- Store session_id in cookie or localStorage
- Send session_id with API requests (cookie automatically, or header)
- Handle session expiration gracefully

**UI Updates**:
- Show demo banner component
- Optionally disable certain features if needed
- Show session timeout countdown (optional)
- Handle "session expired" errors gracefully

**API Client Updates**:
- Ensure cookies are sent with requests (axios withCredentials)
- Handle session-related errors
- Optionally refresh session on 401/403 errors

### 9. Cleanup and Maintenance

**Purpose**: Prevent accumulation of demo session data and files.

**Cleanup Tasks**:
- **Database Cleanup**: 
  - Background task runs every 15-30 minutes
  - Deletes SQLite files for expired sessions
  - Checks last access time vs timeout threshold
- **File Cleanup**:
  - Delete upload directories for expired sessions
  - Remove orphaned files
- **Session Registry Cleanup**:
  - Remove expired sessions from in-memory mapping
  - Log cleanup activity

**Implementation**:
- Background thread/task in FastAPI
- Or separate cron job/script
- Or cleanup on startup (simpler but less efficient)

## Implementation Phases

### Phase 1: Foundation
- [ ] Add `DEMO_MODE` environment variable support
- [ ] Create session management utilities
- [ ] Implement session ID generation and storage
- [ ] Create demo database initialization function
- [ ] Modify `get_db()` dependency to support session databases

### Phase 2: Sample Data
- [ ] Create sample data seed script
- [ ] Design realistic sample yarns and projects
- [ ] Test data seeding for new sessions

### Phase 3: API Integration
- [ ] Add session ID extraction middleware
- [ ] Update all API endpoints to use session databases in demo mode
- [ ] Test all CRUD operations in demo mode
- [ ] Handle session expiration in API responses

### Phase 4: Frontend Integration
- [ ] Add demo banner component
- [ ] Implement session ID storage (cookie/localStorage)
- [ ] Update API client to handle sessions
- [ ] Add session timeout UI (optional)
- [ ] Handle session expiration gracefully

### Phase 5: File Uploads
- [ ] Implement per-session upload directories
- [ ] Update upload endpoint for demo mode
- [ ] Test file uploads in demo mode
- [ ] Ensure proper cleanup of uploaded files

### Phase 6: Cleanup System
- [ ] Implement background cleanup task
- [ ] Test cleanup of expired sessions
- [ ] Test cleanup of orphaned files
- [ ] Add logging for cleanup operations

### Phase 7: Landing Page
- [ ] Create/update landing page with demo video
- [ ] Add "Watch Demo" and "Try Interactive Demo" buttons
- [ ] Style demo banner
- [ ] Test user flow from landing to demo

### Phase 8: Testing & Polish
- [ ] Test full user journey in demo mode
- [ ] Test session persistence across refreshes
- [ ] Test session expiration
- [ ] Test concurrent users (if possible)
- [ ] Performance testing
- [ ] UI/UX polish

## Technical Considerations

### SQLite Concurrency
- **Issue**: SQLite doesn't handle concurrent writes well
- **Mitigation**: 
  - Each session has its own database file (no shared writes)
  - Use connection pooling carefully
  - Consider PostgreSQL for production demo deployment

### Session Storage
- **In-Memory**: Fast but lost on server restart
- **Redis**: Better for distributed systems, but adds dependency
- **File-Based**: Simple, persists across restarts
- **Recommendation**: Start with in-memory + file-based, upgrade to Redis if needed

### Security Considerations
- Session IDs should be unpredictable (UUID v4)
- Don't expose session management details to frontend unnecessarily
- Validate session IDs before database access
- Rate limiting for session creation (prevent abuse)

### Performance
- Session database creation should be fast (< 1 second)
- Sample data seeding should be optimized
- Cleanup should not block main application
- Consider lazy loading of session databases

## Alternative Approaches Considered

### Option 1: Read-Only Mode
- **Pros**: Simple, zero risk, easy to implement
- **Cons**: Doesn't showcase write functionality
- **Status**: Rejected in favor of full interactivity

### Option 2: Shared Demo Database with Auto-Reset
- **Pros**: Simpler than session-based, shows write functionality
- **Cons**: Visitors see each other's changes, less professional
- **Status**: Considered but session-based preferred for better UX

### Option 3: Separate Demo Deployment
- **Pros**: Complete isolation, can use different tech stack
- **Cons**: More maintenance, two deployments
- **Status**: May be considered for production deployment

## Future Enhancements

- [ ] Analytics: Track demo usage (sessions created, features used)
- [ ] Feedback: Optional feedback form after demo
- [ ] Session Export: Allow visitors to export their demo data (optional)
- [ ] PostgreSQL Migration: Upgrade from SQLite to PostgreSQL for better concurrency
- [ ] Redis Session Store: For distributed deployments
- [ ] Admin Dashboard: View active demo sessions (optional)

## Deployment Considerations

### Environment Configuration
- Set `DEMO_MODE=true` in production deployment
- Configure `DEMO_SESSION_TIMEOUT` appropriately
- Set up cleanup task scheduling
- Configure file storage limits

### Monitoring
- Monitor session creation rate
- Monitor cleanup task execution
- Monitor disk space usage
- Alert on unusual activity

### Backup Strategy
- Production database: Regular backups (not affected by demo mode)
- Demo sessions: No backup needed (temporary data)

## Notes

- This feature is designed primarily for portfolio/recruiter showcase
- Full production deployment would use different architecture
- Session-based approach allows full functionality demonstration
- Can be toggled on/off for development vs deployment
- Consider creating a separate branch or even repository for demo mode implementation

## Related Documents

- `PROJECT_PLAN.md` - Overall project plan
- `STATUS.md` - Current project status
- `design.txt` - Design decisions and patterns
