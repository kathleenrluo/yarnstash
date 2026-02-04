/**
 * Projects Page
 * 
 * Displays and manages crochet/knit projects with Pinterest-style cards.
 * Includes filtering, sorting, and add project functionality.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProjects, toggleProjectFavorite } from '../services/api';
import Card from '../components/common/Card';
import FavoriteButton from '../components/common/FavoriteButton';
import Tag from '../components/common/Tag';
import Select from '../components/common/Select';
import ProjectDetailModal from '../components/common/ProjectDetailModal';
import AddProjectForm from '../components/forms/AddProjectForm';
import { formatDateForDisplay, parseDateForSorting } from '../utils/dateParser';
import { theme } from '../styles/theme';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isClosingRef = useRef(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Filter and sort state
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterCraft, setFilterCraft] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'name', 'date', 'favorite', 'craft'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  useEffect(() => {
    loadProjects();
  }, []);

  // Check for projectId in location state (from navigation from stash page)
  useEffect(() => {
    // Don't open if we're in the process of closing
    if (isClosingRef.current) {
      isClosingRef.current = false;
      return;
    }
    
    // Only open modal if location state has projectId AND we don't already have a selected project
    if (location.state?.projectId && !selectedProjectId) {
      const projectId = location.state.projectId;
      // Clear the state FIRST to prevent reopening
      window.history.replaceState({}, document.title);
      // Then set the selected project
      setSelectedProjectId(projectId);
    }
  }, [location.state, selectedProjectId]);

  // Set default sort order to descending when sorting by date
  useEffect(() => {
    if (sortBy === 'date' && sortOrder === 'asc') {
      setSortOrder('desc');
    }
  }, [sortBy]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects. Make sure the backend is running.');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (projectId, currentFavorite) => {
    // Optimistically update the UI immediately
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId
          ? { ...project, is_favorite: !currentFavorite }
          : project
      )
    );

    // Update in the background
    try {
      await toggleProjectFavorite(projectId, !currentFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId
            ? { ...project, is_favorite: currentFavorite }
            : project
        )
      );
    }
  };

  const handleResetFilters = () => {
    setFilterFavorite(false);
    setFilterCraft('');
    setFilterTag('');
    setSearchTerm('');
    setSortBy('date');
    setSortOrder('desc');
  };

  // Get all unique tags from projects
  const allTags = useMemo(() => {
    const tags = new Set();
    projects.forEach(project => {
      if (project.tags) {
        project.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [projects]);

  // Filter and sort logic
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Filter by favorite
    if (filterFavorite) {
      filtered = filtered.filter(project => project.is_favorite);
    }

    // Filter by craft type
    if (filterCraft) {
      filtered = filtered.filter(project => project.craft_type === filterCraft);
    }

    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter(project => 
        project.tags && project.tags.includes(filterTag)
      );
    }

    // Search across multiple fields
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(project => {
        // Search in name
        if (project.name?.toLowerCase().includes(searchLower)) return true;
        // Search in description
        if (project.description?.toLowerCase().includes(searchLower)) return true;
        // Search in notes
        if (project.notes?.toLowerCase().includes(searchLower)) return true;
        // Search in tags
        if (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchLower))) return true;
        // Search in craft type
        if (project.craft_type?.toLowerCase().includes(searchLower)) return true;
        // Search in pattern type
        if (project.pattern_type?.toLowerCase().includes(searchLower)) return true;
        return false;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          // Use date_completed for sorting, with proper parsing for flexible formats
          const dateA = a.date_completed || null;
          const dateB = b.date_completed || null;
          const parsedA = parseDateForSorting(dateA);
          const parsedB = parseDateForSorting(dateB);
          
          // Handle unknown/invalid dates
          if (parsedA.specificity === 0 && parsedB.specificity === 0) {
            comparison = 0;
          } else if (parsedA.specificity === 0) {
            comparison = -1; // Unknown comes before valid dates
          } else if (parsedB.specificity === 0) {
            comparison = 1; // Valid dates come before unknown
          } else {
            // Both are valid dates - handle specificity correctly
            const yearA = Math.floor(parsedA.sortValue / 10000);
            const yearB = Math.floor(parsedB.sortValue / 10000);
            
            if (yearA !== yearB) {
              // Different years - sort by year
              comparison = parsedA.sortValue - parsedB.sortValue;
            } else {
              // Same year - year-only dates come after more specific dates
              const isYearOnlyA = parsedA.specificity === 1;
              const isYearOnlyB = parsedB.specificity === 1;
              
              if (isYearOnlyA && !isYearOnlyB) {
                comparison = -1; // Year-only comes after specific dates
              } else if (isYearOnlyB && !isYearOnlyA) {
                comparison = 1; // Specific dates come before year-only
              } else {
                comparison = parsedA.sortValue - parsedB.sortValue;
              }
            }
          }
          break;
        case 'favorite':
          comparison = (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
          break;
        case 'craft':
          comparison = (a.craft_type || '').localeCompare(b.craft_type || '');
          break;
        default:
          return 0;
      }
      // Apply sort order
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [projects, filterFavorite, filterCraft, filterTag, searchTerm, sortBy, sortOrder]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>My Projects</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>My Projects</h1>
          <p style={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Projects</h1>
          <button 
            style={styles.addButton}
            onClick={() => setShowAddForm(true)}
          >
            + New Project
          </button>
        </div>

        {/* Filters and Sort */}
        <div style={styles.filtersContainer}>
          {/* First row: Search and Sort */}
          <div style={styles.filters}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Search:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                style={styles.filterInput}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Sort by:</label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'name', label: 'Name' },
                  { value: 'date', label: 'Date' },
                  { value: 'favorite', label: 'Favorites first' },
                  { value: 'craft', label: 'Craft type' },
                ]}
                style={{ minWidth: '150px' }}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Order:</label>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                options={[
                  { value: 'asc', label: 'Ascending' },
                  { value: 'desc', label: 'Descending' },
                ]}
                style={{ minWidth: '150px' }}
              />
            </div>
          </div>

          {/* Second row: Filter dropdowns */}
          <div style={styles.filtersRow2}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Craft:</label>
              <Select
                value={filterCraft}
                onChange={(e) => setFilterCraft(e.target.value)}
                options={[
                  { value: 'knit', label: 'Knit' },
                  { value: 'crochet', label: 'Crochet' },
                ]}
                placeholder="All crafts"
                style={{ minWidth: '150px' }}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Tag:</label>
              <Select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                options={allTags.map(tag => ({ value: tag, label: tag }))}
                placeholder="All tags"
                style={{ minWidth: '150px' }}
              />
            </div>
          </div>

          {/* Third row with checkboxes and reset button */}
          <div style={styles.filtersRow3}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>
                <input
                  type="checkbox"
                  checked={filterFavorite}
                  onChange={(e) => setFilterFavorite(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Favorites only</span>
              </label>
            </div>
            <button
              onClick={handleResetFilters}
              style={styles.resetButton}
            >
              Reset All
            </button>
          </div>
        </div>

        {filteredAndSortedProjects.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No projects found</h3>
            <p>
              {projects.length === 0 
                ? 'No projects yet. Create your first project!'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div style={styles.projectsGrid}>
            {filteredAndSortedProjects.map((project) => (
              <Card
                key={project.id}
                style={styles.projectCard}
                noPadding={true}
                onClick={() => setSelectedProjectId(project.id)}
              >
                {/* Image placeholder */}
                <div style={styles.imageContainer}>
                  {project.image_urls && project.image_urls.length > 0 ? (
                    <img 
                      src={project.image_urls[project.primary_image_index || 0]} 
                      alt={project.name}
                      style={styles.image}
                    />
                  ) : (
                    <div style={styles.imagePlaceholder}>
                      <span style={styles.placeholderText}>🧶</span>
                    </div>
                  )}
                  <div 
                    style={styles.favoriteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <FavoriteButton
                      isFavorite={project.is_favorite}
                      onClick={() => handleToggleFavorite(project.id, project.is_favorite)}
                    />
                  </div>
                  {project.craft_type && (
                    <div style={styles.craftBadge}>
                      {project.craft_type}
                    </div>
                  )}
                </div>
                
                {/* Card content */}
                <div style={styles.cardContent}>
                  <h3 style={styles.projectName}>{project.name}</h3>
                  
                  {project.description && (
                    <p style={styles.description}>{project.description}</p>
                  )}
                  
                  {project.tags && project.tags.length > 0 && (
                    <div style={styles.tagsContainer}>
                      {project.tags.map((tag, index) => (
                        <Tag key={index} label={tag} />
                      ))}
                    </div>
                  )}
                  
                  <div style={styles.details}>
                    <div style={styles.dateCompleted}>
                      {formatDateForDisplay(project.date_completed)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <AddProjectForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={loadProjects}
      />

      {/* Project Detail Modal */}
      <ProjectDetailModal
        isOpen={selectedProjectId !== null}
        onClose={() => {
          // Mark that we're closing to prevent useEffect from reopening
          isClosingRef.current = true;
          // Clear location state FIRST to prevent useEffect from reopening
          window.history.replaceState({}, document.title);
          // Then clear the selected project state
          setSelectedProjectId(null);
        }}
        projectId={selectedProjectId}
        onYarnClick={(yarnId) => {
          // Navigate to stash page and open yarn detail modal
          setSelectedProjectId(null);
          navigate('/stash', { state: { yarnId } });
        }}
        onFavoriteToggle={(projectId, isFavorite) => {
          // Update projects state when favorite is toggled in modal
          setProjects(prevProjects =>
            prevProjects.map(project =>
              project.id === projectId
                ? { ...project, is_favorite: isFavorite }
                : project
            )
          );
        }}
        onUpdate={loadProjects}
        onDelete={(projectId) => {
          // Remove deleted project from projects list
          setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
          setSelectedProjectId(null);
        }}
      />
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem 1.5rem',
    backgroundColor: '#F5F1EB',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2rem',
    color: theme.colors.textPrimary,
    margin: 0,
    fontWeight: '600',
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#8B7355',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  filtersContainer: {
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E0D9CF',
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1rem',
  },
  filtersRow2: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1rem',
  },
  filtersRow3: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #E0D9CF',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: theme.colors.textPrimary,
    fontWeight: '500',
    cursor: 'pointer',
  },
  filterInput: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #E0D9CF',
    borderRadius: '8px',
    fontSize: '0.9rem',
    backgroundColor: '#FFFFFF',
    color: theme.colors.textPrimary,
    minWidth: '200px',
    fontFamily: 'inherit',
  },
  filterSelect: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #E0D9CF',
    borderRadius: '8px',
    fontSize: '0.9rem',
    backgroundColor: '#FFFFFF',
    color: theme.colors.textPrimary,
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.textPrimary}`,
    borderRadius: theme.borderRadius.xs,
    position: 'relative',
    flexShrink: 0,
    margin: 0,
  },
  error: {
    color: theme.colors.errorMuted,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.errorBackground,
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.typography.fontFamily.primary,
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  projectCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4/5',
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
    pointerEvents: 'auto',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.border,
    pointerEvents: 'none',
  },
  placeholderText: {
    fontSize: '4rem',
    opacity: 0.5,
  },
  favoriteButton: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    zIndex: 100,
    pointerEvents: 'auto',
  },
  craftBadge: {
    position: 'absolute',
    bottom: '0.75rem',
    left: '0.75rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: `rgba(${parseInt(theme.colors.primary.slice(1, 3), 16)}, ${parseInt(theme.colors.primary.slice(3, 5), 16)}, ${parseInt(theme.colors.primary.slice(5, 7), 16)}, 0.9)`,
    color: theme.colors.surface,
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardContent: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  projectName: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: '0.5rem',
  },
  description: {
    margin: 0,
    fontSize: '0.9rem',
    color: theme.colors.textSecondary,
    marginBottom: '0.75rem',
    lineHeight: '1.5',
    flex: 1,
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  details: {
    marginTop: 'auto',
    paddingTop: '0.75rem',
    borderTop: `1px solid ${theme.colors.borderLight}`,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    marginBottom: '0.25rem',
  },
  detailLabel: {
    color: theme.colors.textSecondary,
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  dateCompleted: {
    display: 'inline-block',
    padding: '0.375rem 0.75rem',
    color: theme.colors.textPrimary,
    fontSize: '0.9rem',
  },
  resetButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#E0D9CF',
    color: theme.colors.textPrimary,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
};

export default ProjectsPage;
