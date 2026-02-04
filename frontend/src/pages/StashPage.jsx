/**
 * Stash Page
 * 
 * Displays and manages yarn stash inventory with Pinterest-style cards.
 * Includes filtering, sorting, and add yarn functionality.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStash, toggleYarnFavorite, getYarnWeightOptions, getColorOptions, getImageUrl } from '../services/api';
import Card from '../components/common/Card';
import FavoriteButton from '../components/common/FavoriteButton';
import ColorSelect from '../components/common/ColorSelect';
import Select from '../components/common/Select';
import YarnDetailModal from '../components/common/YarnDetailModal';
import AddYarnForm from '../components/forms/AddYarnForm';
import { theme } from '../styles/theme';
import { isDemoMode } from '../config/demoMode';

const StashPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isClosingRef = useRef(false);
  const [stash, setStash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weightLabels, setWeightLabels] = useState({});
  const [colorOptions, setColorOptions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedYarnId, setSelectedYarnId] = useState(null);
  const [selectedYarnData, setSelectedYarnData] = useState(null);
  
  // Filter and sort state
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterStashOnly, setFilterStashOnly] = useState(false); // Only show yarns with quantity > 0
  const [filterWeight, setFilterWeight] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Multi-field search (additional to dropdowns)
  const [sortBy, setSortBy] = useState('name'); // 'name', 'weight', 'quantity', 'favorite'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    loadOptions();
    loadStash();
  }, []);

  // Set default sort order to descending when sorting by quantity
  useEffect(() => {
    if (sortBy === 'quantity' && sortOrder === 'asc') {
      setSortOrder('desc');
    }
  }, [sortBy]);

  // Check for yarnId in location state (from navigation from projects page)
  useEffect(() => {
    // Don't open if we're in the process of closing
    if (isClosingRef.current) {
      isClosingRef.current = false;
      return;
    }
    
    // Only open modal if location state has yarnId AND we don't already have a selected yarn
    // Also check that location.state actually exists (not just cleared)
    if (location.state?.yarnId && !selectedYarnId && stash.length > 0) {
      const yarnId = location.state.yarnId;
      // Clear the state FIRST to prevent reopening
      window.history.replaceState({}, document.title);
      
      // Find the yarn in stash to get the full data
      const stashEntry = stash.find(entry => entry.yarn.id === yarnId);
      if (stashEntry) {
        setSelectedYarnId(yarnId);
        setSelectedYarnData(stashEntry.yarn);
      } else {
        // If not found in current stash, still set the ID (will fetch in modal)
        setSelectedYarnId(yarnId);
        setSelectedYarnData(null);
      }
    }
  }, [location.state, stash, selectedYarnId]);

  const loadOptions = async () => {
    try {
      const [weights, colors] = await Promise.all([
        getYarnWeightOptions(),
        getColorOptions(),
      ]);
      
      const labels = {};
      weights.options.forEach(opt => {
        labels[opt.id] = opt.label;
      });
      setWeightLabels(labels);
      setColorOptions(colors.options);
    } catch (err) {
      console.error('Error loading options:', err);
    }
  };

  const loadStash = async () => {
    try {
      setLoading(true);
      const data = await getStash();
      setStash(data);
      setError(null);
    } catch (err) {
      setError('Failed to load stash. Make sure the backend is running.');
      console.error('Error loading stash:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (yarnId, currentFavorite) => {
    // Optimistically update the UI immediately
    setStash(prevStash => 
      prevStash.map(entry => 
        entry.yarn.id === yarnId
          ? {
              ...entry,
              yarn: {
                ...entry.yarn,
                is_favorite: !currentFavorite
              }
            }
          : entry
      )
    );

    // Update in the background
    try {
      await toggleYarnFavorite(yarnId, !currentFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      setStash(prevStash => 
        prevStash.map(entry => 
          entry.yarn.id === yarnId
            ? {
                ...entry,
                yarn: {
                  ...entry.yarn,
                  is_favorite: currentFavorite
                }
              }
            : entry
        )
      );
    }
  };

  const handleResetFilters = () => {
    setFilterFavorite(false);
    setFilterStashOnly(false);
    setFilterWeight('');
    setFilterColor('');
    setFilterBrand('');
    setFilterMaterial('');
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
  };

  // Get unique values for filters
  const uniqueBrands = useMemo(() => {
    const brands = new Set();
    stash.forEach(entry => {
      if (entry.yarn.brand_name) brands.add(entry.yarn.brand_name);
    });
    return Array.from(brands).sort();
  }, [stash]);

  const uniqueYarnNames = useMemo(() => {
    const names = new Set();
    stash.forEach(entry => {
      if (entry.yarn.yarn_name) names.add(entry.yarn.yarn_name);
    });
    return Array.from(names).sort();
  }, [stash]);

  const uniqueMaterials = useMemo(() => {
    const materials = new Set();
    stash.forEach(entry => {
      // Use materials array if available, otherwise fall back to parsing breakdown
      if (entry.yarn.materials && Array.isArray(entry.yarn.materials)) {
        entry.yarn.materials.forEach(mat => materials.add(mat));
      } else if (entry.yarn.material_breakdown) {
        // Fallback: try to extract materials from breakdown (for old data)
        const breakdown = entry.yarn.material_breakdown.toLowerCase();
        // Simple extraction - look for common materials
        const commonMaterials = ['merino', 'nylon', 'acrylic', 'cotton', 'wool', 'cashmere', 'mohair', 'alpaca', 'silk', 'polyester', 'bamboo'];
        commonMaterials.forEach(mat => {
          if (breakdown.includes(mat)) {
            materials.add(mat);
          }
        });
      }
    });
    return Array.from(materials).sort();
  }, [stash]);

  // Filter and sort logic
  const filteredAndSortedStash = useMemo(() => {
    let filtered = [...stash];

    // Filter by favorite
    if (filterFavorite) {
      filtered = filtered.filter(entry => entry.yarn.is_favorite);
    }

    // Filter by stash only (quantity > 0)
    if (filterStashOnly) {
      filtered = filtered.filter(entry => entry.total_grams_owned > 0);
    }

    // Filter by weight
    if (filterWeight) {
      filtered = filtered.filter(entry => entry.yarn.yarn_weight === parseInt(filterWeight));
    }

    // Filter by color
    if (filterColor) {
      filtered = filtered.filter(entry => 
        entry.yarn.generalized_colors && entry.yarn.generalized_colors.includes(filterColor)
      );
    }

    // Filter by brand
    if (filterBrand) {
      filtered = filtered.filter(entry => 
        entry.yarn.brand_name.toLowerCase().includes(filterBrand.toLowerCase())
      );
    }

    // Filter by material (check materials array first, then fallback to breakdown)
    // Case-insensitive: materials are stored in lowercase, filter is compared in lowercase
    if (filterMaterial) {
      const filterLower = filterMaterial.toLowerCase();
      filtered = filtered.filter(entry => {
        // Check materials array first (materials are stored in lowercase)
        if (entry.yarn.materials && Array.isArray(entry.yarn.materials)) {
          return entry.yarn.materials.some(mat => 
            mat.toLowerCase() === filterLower
          );
        }
        // Fallback to breakdown for old data
        if (entry.yarn.material_breakdown) {
          return entry.yarn.material_breakdown.toLowerCase().includes(filterLower);
        }
        return false;
      });
    }

    // Multi-field search - searches across brand, yarn name, color, and materials
    // Supports multiple terms (e.g., "red acrylic" searches for both "red" and "acrylic")
    // This works IN ADDITION to the dropdown filters above
    if (searchTerm) {
      const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/);
      filtered = filtered.filter(entry => {
        // Build a searchable text from all fields
        const searchableText = [
          entry.yarn.brand_name || '',
          entry.yarn.yarn_name || '',
          entry.yarn.color_name || '',
          entry.yarn.material_breakdown || '',
          ...(entry.yarn.generalized_colors || []),
          ...(entry.yarn.materials || [])
        ].join(' ').toLowerCase();

        // All search terms must match somewhere in the searchable text
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.yarn.brand_name + ' ' + a.yarn.yarn_name).localeCompare(
            b.yarn.brand_name + ' ' + b.yarn.yarn_name
          );
          break;
        case 'weight':
          comparison = a.yarn.yarn_weight - b.yarn.yarn_weight;
          break;
        case 'quantity':
          comparison = a.total_grams_owned - b.total_grams_owned; // Lower values first (ascending)
          break;
        case 'favorite':
          comparison = (b.yarn.is_favorite ? 1 : 0) - (a.yarn.is_favorite ? 1 : 0);
          break;
        default:
          comparison = 0;
      }
      
      // If primary comparison is equal, use secondary sort: brand name, yarn name, color name
      if (comparison === 0) {
        // Compare brand name
        const brandCompare = (a.yarn.brand_name || '').localeCompare(b.yarn.brand_name || '');
        if (brandCompare !== 0) {
          comparison = brandCompare;
        } else {
          // Compare yarn name
          const yarnCompare = (a.yarn.yarn_name || '').localeCompare(b.yarn.yarn_name || '');
          if (yarnCompare !== 0) {
            comparison = yarnCompare;
          } else {
            // Compare color name
            comparison = (a.yarn.color_name || '').localeCompare(b.yarn.color_name || '');
          }
        }
      }
      
      // Apply sort order
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [stash, filterFavorite, filterStashOnly, filterWeight, filterColor, filterBrand, filterMaterial, searchTerm, sortBy, sortOrder]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>My Stash</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h1 style={styles.title}>My Stash</h1>
          <p style={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Stash</h1>
          {!isDemoMode && (
            <button 
              style={styles.addButton}
              onClick={() => setShowAddForm(true)}
            >
              + Add Yarn
            </button>
          )}
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
                placeholder="Search across all fields..."
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
                  { value: 'weight', label: 'Weight' },
                  { value: 'quantity', label: 'Quantity' },
                  { value: 'favorite', label: 'Favorites first' },
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
              <label style={styles.filterLabel}>Weight:</label>
              <Select
                value={filterWeight}
                onChange={(e) => setFilterWeight(e.target.value)}
                options={Object.entries(weightLabels).map(([id, label]) => ({ value: id, label }))}
                placeholder="All weights"
                style={{ minWidth: '150px' }}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Color:</label>
              <ColorSelect
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                options={colorOptions}
                style={{ minWidth: '150px' }}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Brand:</label>
              <Select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                options={uniqueBrands.map(brand => ({ value: brand, label: brand }))}
                placeholder="All brands"
                style={{ minWidth: '150px' }}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Material:</label>
              <Select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                options={uniqueMaterials.map(material => ({ value: material, label: material }))}
                placeholder="All materials"
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
              <label style={styles.filterLabel}>
                <input
                  type="checkbox"
                  checked={filterStashOnly}
                  onChange={(e) => setFilterStashOnly(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Stash only (quantity &gt; 0)</span>
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

        {filteredAndSortedStash.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No yarns found</h3>
            <p>
              {stash.length === 0 
                ? 'Your stash is empty. Add some yarn to get started!'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div style={styles.stashGrid}>
            {filteredAndSortedStash.map((entry) => (
              <Card
                key={entry.yarn.id}
                style={styles.yarnCard}
                noPadding={true}
                onClick={() => {
                  setSelectedYarnId(entry.yarn.id);
                  setSelectedYarnData(entry.yarn);
                }}
              >
                {/* Image placeholder */}
                <div style={styles.imageContainer}>
                  {entry.yarn.yarn_photo_url ? (
                    <img 
                      src={getImageUrl(entry.yarn.yarn_photo_url)} 
                      alt={`${entry.yarn.brand_name} ${entry.yarn.yarn_name}`}
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
                      isFavorite={entry.yarn.is_favorite}
                      onClick={() => handleToggleFavorite(entry.yarn.id, entry.yarn.is_favorite)}
                    />
                  </div>
                </div>
                
                {/* Card content */}
                <div style={styles.cardContent}>
                  <h3 style={styles.brandName}>{entry.yarn.brand_name}</h3>
                  <p style={styles.yarnName}>{entry.yarn.yarn_name}</p>
                  <p style={styles.colorName}>{entry.yarn.color_name}</p>
                  
                  <div style={styles.details}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Weight:</span>
                      <span style={styles.detailValue}>
                        {weightLabels[entry.yarn.yarn_weight] || `Weight ${entry.yarn.yarn_weight}`}
                      </span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>In Stash:</span>
                      <span style={styles.quantity}>{entry.total_grams_owned}g</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Yarn Modal */}
      {!isDemoMode && (
        <AddYarnForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={loadStash}
        />
      )}

      {/* Yarn Detail Modal */}
      <YarnDetailModal
        isOpen={selectedYarnId !== null}
        onClose={() => {
          // Mark that we're closing to prevent useEffect from reopening
          isClosingRef.current = true;
          // Clear location state FIRST to prevent useEffect from reopening
          window.history.replaceState({}, document.title);
          // Then clear the selected yarn state
          setSelectedYarnId(null);
          setSelectedYarnData(null);
        }}
        yarnId={selectedYarnId}
        yarnData={selectedYarnData}
        onProjectClick={(projectId) => {
          // Navigate to projects page and open project detail modal
          setSelectedYarnId(null);
          setSelectedYarnData(null);
          navigate('/projects', { state: { projectId } });
        }}
        onFavoriteToggle={(yarnId, isFavorite) => {
          // Update stash state when favorite is toggled in modal
          setStash(prevStash =>
            prevStash.map(entry =>
              entry.yarn.id === yarnId
                ? {
                    ...entry,
                    yarn: {
                      ...entry.yarn,
                      is_favorite: isFavorite
                    }
                  }
                : entry
            )
          );
          // Also update selectedYarnData if it matches
          if (selectedYarnData && selectedYarnData.id === yarnId) {
            setSelectedYarnData({ ...selectedYarnData, is_favorite: isFavorite });
          }
        }}
        onUpdate={loadStash}
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
  filterSelect: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #E0D9CF',
    borderRadius: '8px',
    fontSize: '0.9rem',
    backgroundColor: '#FFFFFF',
    color: theme.colors.textPrimary,
    cursor: 'pointer',
  },
  filterInput: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #E0D9CF',
    borderRadius: '8px',
    fontSize: '0.9rem',
    backgroundColor: '#FFFFFF',
    color: theme.colors.textPrimary,
    minWidth: '150px',
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
  stashGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  yarnCard: {
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
    pointerEvents: 'none',
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
  cardContent: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  brandName: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: '0.25rem',
  },
  yarnName: {
    margin: 0,
    fontSize: '0.95rem',
    color: theme.colors.textSecondary,
    marginBottom: '0.5rem',
  },
  colorName: {
    margin: 0,
    fontSize: '0.9rem',
    color: theme.colors.primary,
    fontWeight: '500',
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
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
  },
  detailLabel: {
    color: theme.colors.textSecondary,
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  quantity: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: '0.95rem',
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

export default StashPage;
