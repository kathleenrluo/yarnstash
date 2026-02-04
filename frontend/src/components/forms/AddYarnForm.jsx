/**
 * Add Yarn Form Component
 * 
 * Modal form for adding a new yarn to the database.
 * Includes all yarn fields with proper input types.
 */

import { useState, useEffect, useRef } from 'react';
import { 
  createYarn, 
  searchBrands, 
  searchYarnNames, 
  searchColorNames, 
  searchMaterials, 
  getYarnProperties, 
  getColorOptions, 
  getCareInstructionOptions, 
  getYarnWeightOptions,
  getMaterialOptions,
  addYarnByGrams, 
  addYarnBySkeins,
  uploadImage,
  getImageUrl
} from '../../services/api';
import { theme } from '../../styles/theme';
import Select from '../common/Select';
import { parseMaterialBreakdown } from '../../utils/materialParser';

const AddYarnForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    brand_name: '',
    yarn_name: '',
    color_name: '',
    yarn_weight: '',
    grams_per_skein: '',
    meters_per_skein: '',
    generalized_colors: [],
    material_breakdown: '',
    care_instruction_ids: [],
    notes: '',
    is_favorite: false,
  });
  
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [yarnNameSuggestions, setYarnNameSuggestions] = useState([]);
  const [showYarnNameSuggestions, setShowYarnNameSuggestions] = useState(false);
  const [colorNameSuggestions, setColorNameSuggestions] = useState([]);
  const [showColorNameSuggestions, setShowColorNameSuggestions] = useState(false);
  
  // Material entry system (similar to yarn usage in projects)
  const [materialEntries, setMaterialEntries] = useState([]); // Array of {material: '', percent: ''}
  const [materialSearchInputs, setMaterialSearchInputs] = useState([]); // Array of search input values
  const [materialSuggestions, setMaterialSuggestions] = useState([]); // Array of suggestion arrays
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState([]); // Array of booleans
  const [materialOptions, setMaterialOptions] = useState([]); // Standard material options from API
  
  const [colorOptions, setColorOptions] = useState([]);
  const [careOptions, setCareOptions] = useState([]);
  const [weightOptions, setWeightOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // Track field-specific errors
  const [addToStash, setAddToStash] = useState(true);
  const [stashAmount, setStashAmount] = useState('');
  const [stashType, setStashType] = useState('grams'); // 'grams' or 'skeins'
  
  // File upload state
  const [yarnPhotoFile, setYarnPhotoFile] = useState(null);
  const [yarnPhotoPreview, setYarnPhotoPreview] = useState(null);
  const [labelPhotoFile, setLabelPhotoFile] = useState(null);
  const [labelPhotoPreview, setLabelPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Refs for file inputs so we can clear the underlying value when removing
  const yarnPhotoInputRef = useRef(null);
  const labelPhotoInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      // Reset form when opening
      setFormData({
        brand_name: '',
        yarn_name: '',
        color_name: '',
        yarn_weight: '',
        grams_per_skein: '',
        meters_per_skein: '',
        generalized_colors: [],
      material_breakdown: '',
      care_instruction_ids: [],
      yarn_photo_url: '',
      label_photo_url: '',
      notes: '',
      is_favorite: false,
    });
    setMaterialEntries([]);
    setMaterialSearchInputs([]);
    setMaterialSuggestions([]);
    setShowMaterialSuggestions([]);
    setError(null);
    setFieldErrors({});
    setLoading(false);
    setStashAmount('');
    setYarnPhotoFile(null);
    setYarnPhotoPreview(null);
    setLabelPhotoFile(null);
    setLabelPhotoPreview(null);
    }
  }, [isOpen]);

  const loadOptions = async () => {
    try {
      const [colors, care, weights, materials] = await Promise.all([
        getColorOptions(),
        getCareInstructionOptions(),
        getYarnWeightOptions(),
        getMaterialOptions(),
      ]);
      setColorOptions(colors.options);
      setCareOptions(care.options);
      setWeightOptions(weights.options);
      setMaterialOptions(materials.options);
    } catch (err) {
      console.error('Error loading options:', err);
    }
  };

  const handleBrandSearch = async (value) => {
    setFormData({ ...formData, brand_name: value });
    if (value.length > 1) {
      try {
        const brands = await searchBrands(value);
        setBrandSuggestions(brands);
        setShowBrandSuggestions(true);
      } catch (err) {
        console.error('Error searching brands:', err);
      }
    } else {
      setBrandSuggestions([]);
      setShowBrandSuggestions(false);
    }
  };

  const handleYarnNameSearch = async (value) => {
    setFormData({ ...formData, yarn_name: value });
    if (value.length > 1) {
      try {
        // Only search yarn names for the selected brand if brand is filled
        const names = await searchYarnNames(value, formData.brand_name || null);
        setYarnNameSuggestions(names);
        setShowYarnNameSuggestions(true);
      } catch (err) {
        console.error('Error searching yarn names:', err);
      }
    } else {
      setYarnNameSuggestions([]);
      setShowYarnNameSuggestions(false);
    }
  };

  // Parse material_breakdown string into entries

  // Helper function to auto-fill properties from existing yarn
  const handleAutoFill = async (brandName, yarnName) => {
    // Only auto-fill if both brand and yarn name are filled
    if (brandName && yarnName) {
      try {
        const existingYarn = await getYarnProperties(brandName, yarnName);
        
        // Only auto-fill fields that are currently empty
        setFormData(prev => {
          // Don't auto-fill if color is already filled (user might be editing)
          if (prev.color_name) {
            return prev;
          }
          
          // Check if we've already auto-filled (avoid re-filling)
          if (prev.yarn_weight && prev.grams_per_skein && prev.meters_per_skein) {
            // Already filled, might be from previous autofill
            return prev;
          }
          
          const materialBreakdown = prev.material_breakdown || existingYarn.material_breakdown || '';
          
          // Parse material breakdown into entries if we have material options loaded and no existing entries
          if (materialBreakdown && materialOptions.length > 0 && materialEntries.length === 0) {
            const { entries, searchInputs } = parseMaterialBreakdown(materialBreakdown, materialOptions);
            if (entries.length > 0) {
              setMaterialEntries(entries);
              setMaterialSearchInputs(searchInputs);
              setMaterialSuggestions(entries.map(() => []));
              setShowMaterialSuggestions(entries.map(() => false));
            }
          }
          
          return {
            ...prev,
            yarn_weight: prev.yarn_weight || existingYarn.yarn_weight?.toString() || '',
            grams_per_skein: prev.grams_per_skein || existingYarn.grams_per_skein?.toString() || '',
            meters_per_skein: prev.meters_per_skein || existingYarn.meters_per_skein?.toString() || '',
            material_breakdown: materialBreakdown,
            notes: prev.notes || existingYarn.notes || '',
            // Don't autofill generalized_colors - user should select colors manually for each color variant
            care_instruction_ids: prev.care_instruction_ids.length > 0 ? prev.care_instruction_ids : (existingYarn.care_instruction_ids || []),
          };
        });
      } catch (err) {
        // Yarn not found - that's okay, it's a new yarn
        // Silently fail - no error message needed
      }
    }
  };

  // Auto-fill properties when both brand and yarn name are filled
  useEffect(() => {
    // Only trigger if both fields are filled and color is empty (new color of existing yarn)
    // Also check that key fields are empty (to avoid re-filling)
    if (formData.brand_name && formData.yarn_name && !formData.color_name) {
      // Only auto-fill if the key fields are empty (yarn_weight, grams_per_skein, meters_per_skein)
      // This prevents re-filling if user has already entered data
      const needsAutoFill = !formData.yarn_weight || !formData.grams_per_skein || !formData.meters_per_skein;
      
      if (needsAutoFill) {
        // Debounce the auto-fill to avoid too many API calls
        const timeoutId = setTimeout(() => {
          handleAutoFill(formData.brand_name, formData.yarn_name);
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.brand_name, formData.yarn_name, formData.color_name]);

  // Parse material_breakdown into entries when materialOptions are loaded and material_breakdown exists
  // Only parse if materialEntries are empty (to avoid overwriting user input)
  useEffect(() => {
    if (formData.material_breakdown && materialOptions.length > 0 && materialEntries.length === 0) {
      const { entries, searchInputs } = parseMaterialBreakdown(formData.material_breakdown, materialOptions);
      if (entries.length > 0) {
        setMaterialEntries(entries);
        setMaterialSearchInputs(searchInputs);
        setMaterialSuggestions(entries.map(() => []));
        setShowMaterialSuggestions(entries.map(() => false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.material_breakdown, materialOptions]);

  const handleColorNameSearch = async (value) => {
    setFormData({ ...formData, color_name: value });
    if (value.length > 1) {
      try {
        const colors = await searchColorNames(value);
        setColorNameSuggestions(colors);
        setShowColorNameSuggestions(true);
      } catch (err) {
        console.error('Error searching color names:', err);
      }
    } else {
      setColorNameSuggestions([]);
      setShowColorNameSuggestions(false);
    }
  };

  // Material entry handlers (similar to yarn usage in projects)
  const handleAddMaterial = () => {
    const newIndex = materialEntries.length;
    setMaterialEntries([...materialEntries, { material: '', percent: '' }]);
    setMaterialSearchInputs([...materialSearchInputs, '']);
    setMaterialSuggestions([...materialSuggestions, []]);
    setShowMaterialSuggestions([...showMaterialSuggestions, false]);
  };

  const handleRemoveMaterial = (index) => {
    setMaterialEntries(materialEntries.filter((_, i) => i !== index));
    setMaterialSearchInputs(materialSearchInputs.filter((_, i) => i !== index));
    setMaterialSuggestions(materialSuggestions.filter((_, i) => i !== index));
    setShowMaterialSuggestions(showMaterialSuggestions.filter((_, i) => i !== index));
  };

  const handleMaterialEntryChange = (index, field, value) => {
    const updated = [...materialEntries];
    updated[index] = { ...updated[index], [field]: value };
    setMaterialEntries(updated);
    
    // Clear error when user starts editing
    if (fieldErrors.material_breakdown) {
      setFieldErrors({ ...fieldErrors, material_breakdown: null });
      if (error && error.includes('Material percentages')) {
        setError(null);
      }
    }
  };

  const handleMaterialSearchChange = (index, value) => {
    const updatedInputs = [...materialSearchInputs];
    updatedInputs[index] = value;
    setMaterialSearchInputs(updatedInputs);

    if (value.trim()) {
      const searchLower = value.trim().toLowerCase();
      const suggestions = materialOptions
        .filter(opt => {
          const isSelected = materialEntries.some((entry, i) => 
            i !== index && entry.material && entry.material.toLowerCase() === opt.value.toLowerCase()
          );
          if (isSelected) return false;
          
          const label = opt.label.toLowerCase();
          const value = opt.value.toLowerCase();
          return label.includes(searchLower) || value.includes(searchLower);
        })
        .slice(0, 5)
        .map(opt => ({
          value: opt.value,
          label: opt.label
        }));

      const updatedSuggestions = [...materialSuggestions];
      updatedSuggestions[index] = suggestions;
      setMaterialSuggestions(updatedSuggestions);

      const updatedShow = [...showMaterialSuggestions];
      updatedShow[index] = suggestions.length > 0;
      setShowMaterialSuggestions(updatedShow);
    } else {
      const updatedSuggestions = [...materialSuggestions];
      updatedSuggestions[index] = [];
      setMaterialSuggestions(updatedSuggestions);
      
      const updatedShow = [...showMaterialSuggestions];
      updatedShow[index] = false;
      setShowMaterialSuggestions(updatedShow);
    }
  };

  const handleSelectMaterialSuggestion = (index, materialValue, materialLabel) => {
    const updated = [...materialEntries];
    updated[index] = { ...updated[index], material: materialValue };
    setMaterialEntries(updated);

    const updatedInputs = [...materialSearchInputs];
    updatedInputs[index] = materialLabel;
    setMaterialSearchInputs(updatedInputs);

    const updatedSuggestions = [...materialSuggestions];
    updatedSuggestions[index] = [];
    setMaterialSuggestions(updatedSuggestions);

    const updatedShow = [...showMaterialSuggestions];
    updatedShow[index] = false;
    setShowMaterialSuggestions(updatedShow);
  };

  const handleClearMaterialSelection = (index) => {
    const updated = [...materialEntries];
    updated[index] = { ...updated[index], material: '', percent: '' };
    setMaterialEntries(updated);

    const updatedInputs = [...materialSearchInputs];
    updatedInputs[index] = '';
    setMaterialSearchInputs(updatedInputs);
  };

  // Build material_breakdown string from entries
  const buildMaterialBreakdown = () => {
    const validEntries = materialEntries.filter(entry => entry.material && entry.percent);
    if (validEntries.length === 0) return '';
    
    return validEntries
      .map(entry => `${entry.percent}% ${entry.material}`)
      .join(', ');
  };

  // Validate material percentages add up to 100%
  const validateMaterialPercentages = () => {
    const validEntries = materialEntries.filter(entry => entry.material && entry.percent);
    if (validEntries.length === 0) return { isValid: true, error: null };
    
    const total = validEntries.reduce((sum, entry) => {
      const percent = parseFloat(entry.percent);
      return sum + (isNaN(percent) ? 0 : percent);
    }, 0);
    
    if (Math.abs(total - 100) > 0.01) { // Allow small floating point differences
      return {
        isValid: false,
        error: `Material percentages must add up to 100%. Current total: ${total.toFixed(1)}%`
      };
    }
    
    return { isValid: true, error: null };
  };

  const handleYarnPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setYarnPhotoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setYarnPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLabelPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLabelPhotoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLabelPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveYarnPhoto = () => {
    setYarnPhotoFile(null);
    setYarnPhotoPreview(null);
    // Clear the native file input so selecting the same file again triggers onChange
    if (yarnPhotoInputRef.current) {
      yarnPhotoInputRef.current.value = '';
    }
  };

  const handleRemoveLabelPhoto = () => {
    setLabelPhotoFile(null);
    setLabelPhotoPreview(null);
    // Clear the native file input so selecting the same file again triggers onChange
    if (labelPhotoInputRef.current) {
      labelPhotoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Validate that at least one color is selected
      if (!formData.generalized_colors || formData.generalized_colors.length === 0) {
        setError('Please select at least one color');
        setFieldErrors({ generalized_colors: 'Please select at least one color' });
        setLoading(false);
        setUploading(false);
        return;
      }

      // Validate material percentages if materials are provided
      if (materialEntries.some(entry => entry.material && entry.percent)) {
        const validation = validateMaterialPercentages();
        if (!validation.isValid) {
          setError(validation.error);
          setFieldErrors({ material_breakdown: validation.error });
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      // Upload images if files are selected
      let yarnPhotoUrl = null;
      let labelPhotoUrl = null;

      if (yarnPhotoFile) {
        const uploadResult = await uploadImage(yarnPhotoFile);
        yarnPhotoUrl = getImageUrl(uploadResult.url);
      }

      if (labelPhotoFile) {
        const uploadResult = await uploadImage(labelPhotoFile);
        labelPhotoUrl = getImageUrl(uploadResult.url);
      }

      // Build material_breakdown from entries
      const materialBreakdown = buildMaterialBreakdown();
      
      // Create yarn
      const yarnData = {
        ...formData,
        yarn_weight: parseInt(formData.yarn_weight),
        grams_per_skein: parseFloat(formData.grams_per_skein),
        meters_per_skein: parseFloat(formData.meters_per_skein),
        material_breakdown: materialBreakdown || undefined,
        yarn_photo_url: yarnPhotoUrl,
        label_photo_url: labelPhotoUrl,
      };

      const newYarn = await createYarn(yarnData);

      // Add to stash if requested and amount is greater than 0
      // Note: Yarn creation already creates a stash entry with 0g, so we only need to add if amount > 0
      if (addToStash && stashAmount) {
        const parsedAmount = stashType === 'grams' ? parseFloat(stashAmount) : parseInt(stashAmount);
        if (parsedAmount > 0) {
          if (stashType === 'grams') {
            await addYarnByGrams(newYarn.id, parsedAmount);
          } else {
            await addYarnBySkeins(newYarn.id, parsedAmount);
          }
        }
        // If amount is 0, the stash entry already exists with 0g from yarn creation, so we skip
      }

      onSuccess();
      onClose();
    } catch (err) {
      // Handle network errors (404, connection refused, etc.)
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK' || err.message?.includes('Backend server')) {
        const errorMessage = err.message || 'Backend server is not responding. Please make sure the backend is running on http://localhost:8000';
        setError(errorMessage);
        setFieldErrors({});
        console.error('Network/Server error:', err);
        return;
      }
      
      // Handle validation errors (422) - these shouldn't crash the page
      if (err.response?.status === 422) {
        const errorMessage = err.response?.data?.detail || err.message || 'Invalid input. Please check your values.';
        setError(errorMessage);
        setFieldErrors({});
        console.error('Validation error:', err);
        return;
      }
      
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create yarn';
      setError(errorMessage);
      
      // Parse error to identify which field has the issue
      const newFieldErrors = {};
      const errorLower = errorMessage.toLowerCase();
      
      if (errorLower.includes('material')) {
        newFieldErrors.material_breakdown = errorMessage;
      }
      if (errorLower.includes('duplicate') || errorLower.includes('already exists')) {
        // For duplicate errors, highlight all three fields since it's the combination
        newFieldErrors.brand_name = errorMessage;
        newFieldErrors.yarn_name = errorMessage;
        newFieldErrors.color_name = errorMessage;
      }
      
      setFieldErrors(newFieldErrors);
      console.error('Error creating yarn:', err);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const toggleColor = (colorValue) => {
    const colors = formData.generalized_colors || [];
    if (colors.includes(colorValue)) {
      setFormData({
        ...formData,
        generalized_colors: colors.filter(c => c !== colorValue),
      });
    } else {
      setFormData({
        ...formData,
        generalized_colors: [...colors, colorValue],
      });
    }
  };

  const toggleCareInstruction = (careId) => {
    const careIds = formData.care_instruction_ids || [];
    if (careIds.includes(careId)) {
      setFormData({
        ...formData,
        care_instruction_ids: careIds.filter(id => id !== careId),
      });
    } else {
      setFormData({
        ...formData,
        care_instruction_ids: [...careIds, careId],
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Add New Yarn</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Brand Name with Autocomplete */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Brand Name *
                {fieldErrors.brand_name && <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>}
              </label>
              <div style={styles.autocompleteContainer}>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) => {
                    handleBrandSearch(e.target.value);
                    // Clear field error when user starts typing
                    if (fieldErrors.brand_name) {
                      setFieldErrors({ ...fieldErrors, brand_name: null });
                      if (error && (error.toLowerCase().includes('duplicate') || error.toLowerCase().includes('already exists'))) {
                        setError(null);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (brandSuggestions.length > 0) setShowBrandSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                  style={{
                    ...styles.input,
                    borderColor: fieldErrors.brand_name ? theme.colors.error : theme.colors.border,
                    borderWidth: fieldErrors.brand_name ? '2px' : '1px'
                  }}
                  required
                />
                {showBrandSuggestions && brandSuggestions.length > 0 && (
                  <div style={styles.suggestions}>
                    {brandSuggestions.map((brand, idx) => (
                      <div
                        key={idx}
                        style={styles.suggestionItem}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData(prev => {
                            const updated = { ...prev, brand_name: brand };
                            // Trigger auto-fill if yarn name is also filled
                            if (updated.yarn_name) {
                              setTimeout(() => {
                                handleAutoFill(updated.brand_name, updated.yarn_name);
                              }, 100);
                            }
                            return updated;
                          });
                          setShowBrandSuggestions(false);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F5F1EB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {brand}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Yarn Name with Autocomplete */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Yarn Name *
                {fieldErrors.yarn_name && <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>}
              </label>
              <div style={styles.autocompleteContainer}>
                <input
                  type="text"
                  value={formData.yarn_name}
                  onChange={(e) => {
                    handleYarnNameSearch(e.target.value);
                    // Clear field error when user starts typing
                    if (fieldErrors.yarn_name) {
                      setFieldErrors({ ...fieldErrors, yarn_name: null });
                      if (error && (error.toLowerCase().includes('duplicate') || error.toLowerCase().includes('already exists'))) {
                        setError(null);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (yarnNameSuggestions.length > 0) setShowYarnNameSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowYarnNameSuggestions(false), 200)}
                  style={{
                    ...styles.input,
                    borderColor: fieldErrors.yarn_name ? theme.colors.error : theme.colors.border,
                    borderWidth: fieldErrors.yarn_name ? '2px' : '1px'
                  }}
                  required
                />
                {showYarnNameSuggestions && yarnNameSuggestions.length > 0 && (
                  <div style={styles.suggestions}>
                    {yarnNameSuggestions.map((name, idx) => (
                      <div
                        key={idx}
                        style={styles.suggestionItem}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData(prev => {
                            const updated = { ...prev, yarn_name: name };
                            // Trigger auto-fill if brand name is also filled
                            if (updated.brand_name) {
                              setTimeout(() => {
                                handleAutoFill(updated.brand_name, updated.yarn_name);
                              }, 100);
                            }
                            return updated;
                          });
                          setShowYarnNameSuggestions(false);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F5F1EB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Color Name with Autocomplete */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Color Name *
                {fieldErrors.color_name && <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>}
              </label>
              <div style={styles.autocompleteContainer}>
                <input
                  type="text"
                  value={formData.color_name}
                  onChange={(e) => {
                    handleColorNameSearch(e.target.value);
                    // Clear field error when user starts typing
                    if (fieldErrors.color_name) {
                      setFieldErrors({ ...fieldErrors, color_name: null });
                      if (error && (error.toLowerCase().includes('duplicate') || error.toLowerCase().includes('already exists'))) {
                        setError(null);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (colorNameSuggestions.length > 0) setShowColorNameSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowColorNameSuggestions(false), 200)}
                  style={{
                    ...styles.input,
                    borderColor: fieldErrors.color_name ? theme.colors.error : theme.colors.border,
                    borderWidth: fieldErrors.color_name ? '2px' : '1px'
                  }}
                  required
                />
                {showColorNameSuggestions && colorNameSuggestions.length > 0 && (
                  <div style={styles.suggestions}>
                    {colorNameSuggestions.map((color, idx) => (
                      <div
                        key={idx}
                        style={styles.suggestionItem}
                        onMouseDown={() => {
                          setFormData({ ...formData, color_name: color });
                          setShowColorNameSuggestions(false);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F5F1EB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {color}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Yarn Weight */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Yarn Weight *</label>
              <Select
                value={formData.yarn_weight}
                onChange={(e) => setFormData({ ...formData, yarn_weight: e.target.value })}
                options={weightOptions.map(opt => ({ value: opt.id, label: opt.label }))}
                placeholder="Select weight..."
                size="large"
              />
            </div>

            {/* Grams per Skein */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Grams per Skein *</label>
              <input
                type="number"
                step="0.1"
                value={formData.grams_per_skein}
                onChange={(e) => setFormData({ ...formData, grams_per_skein: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            {/* Meters per Skein */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Meters per Skein *</label>
              <input
                type="number"
                step="0.1"
                value={formData.meters_per_skein}
                onChange={(e) => setFormData({ ...formData, meters_per_skein: e.target.value })}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Colors - Multiselect */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Colors (select multiple) *
              {fieldErrors.generalized_colors && <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>}
            </label>
            <div style={styles.multiselect}>
              {colorOptions.map((opt) => (
                <label key={opt.value} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={(formData.generalized_colors || []).includes(opt.value)}
                    onChange={() => {
                      toggleColor(opt.value);
                      // Clear error when user selects a color
                      if (fieldErrors.generalized_colors) {
                        setFieldErrors({ ...fieldErrors, generalized_colors: null });
                        if (error && error.includes('color')) {
                          setError(null);
                        }
                      }
                    }}
                    style={styles.checkbox}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {fieldErrors.generalized_colors && (
              <p style={{ color: theme.colors.error, fontSize: theme.typography.fontSize.sm, marginTop: theme.spacing.xs, marginBottom: 0 }}>
                {fieldErrors.generalized_colors}
              </p>
            )}
          </div>

          {/* Care Instructions - Multiselect */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Care Instructions (select multiple)</label>
            <div style={styles.multiselect}>
              {careOptions.map((opt) => (
                <label key={opt.id} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={(formData.care_instruction_ids || []).includes(opt.id)}
                    onChange={() => toggleCareInstruction(opt.id)}
                    style={styles.checkbox}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Material Breakdown - Entry System */}
          <div style={styles.formGroup}>
            <div style={styles.sectionHeader}>
              <label style={styles.label}>
                Material Breakdown
                {fieldErrors.material_breakdown && <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>}
              </label>
              <button
                type="button"
                onClick={handleAddMaterial}
                style={styles.addButton}
              >
                + Add Material
              </button>
            </div>
            {materialEntries.length > 0 && (
              <div style={styles.yarnUsageList}>
                {materialEntries.map((entry, index) => {
                  const searchInput = materialSearchInputs[index] || '';
                  const suggestions = materialSuggestions[index] || [];
                  const showSuggestions = showMaterialSuggestions[index] || false;
                  
                  return (
                    <div key={index} style={styles.yarnUsageItem}>
                      <div style={styles.yarnUsageRow}>
                        <div style={{ ...styles.yarnSearchWrapper, flex: 2, position: 'relative' }}>
                          {entry.material ? (
                            // Show selected material as a chip
                            <div style={styles.selectedYarnChip}>
                              <span>{materialSearchInputs[index] || materialOptions.find(opt => opt.value === entry.material)?.label || entry.material}</span>
                              <button
                                type="button"
                                onClick={() => handleClearMaterialSelection(index)}
                                style={styles.chipRemoveButton}
                                title="Clear selection"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            // Show searchable input
                            <>
                              <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => handleMaterialSearchChange(index, e.target.value)}
                                onFocus={() => {
                                  if (searchInput.trim() && suggestions.length > 0) {
                                    const updatedShow = [...showMaterialSuggestions];
                                    updatedShow[index] = true;
                                    setShowMaterialSuggestions(updatedShow);
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    const updatedShow = [...showMaterialSuggestions];
                                    updatedShow[index] = false;
                                    setShowMaterialSuggestions(updatedShow);
                                  }, 200);
                                }}
                                placeholder="Search material..."
                                style={styles.input}
                              />
                              {showSuggestions && suggestions.length > 0 && (
                                <div style={styles.suggestions}>
                                  {suggestions.map(suggestion => (
                                    <div
                                      key={suggestion.value}
                                      style={styles.suggestionItem}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectMaterialSuggestion(index, suggestion.value, suggestion.label);
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#F5F1EB';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      {suggestion.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={entry.percent}
                          onChange={(e) => handleMaterialEntryChange(index, 'percent', e.target.value)}
                          placeholder="%"
                          style={{ ...styles.input, flex: 1, marginLeft: '0.5rem' }}
                          required={entry.material ? true : false}
                          disabled={!entry.material}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          style={styles.removeButton}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {materialEntries.length === 0 && (
              <p style={styles.helpText}>
                Add materials and their percentages (e.g., 80% merino, 20% nylon)
              </p>
            )}
            {fieldErrors.material_breakdown && (
              <p style={{ color: theme.colors.error, fontSize: theme.typography.fontSize.sm, marginTop: '0.25rem', marginBottom: 0 }}>
                {fieldErrors.material_breakdown}
              </p>
            )}
          </div>

          {/* Photo Uploads */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Yarn Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleYarnPhotoChange}
              style={styles.fileInput}
              ref={yarnPhotoInputRef}
            />
            {yarnPhotoPreview && (
              <div style={styles.imagePreview}>
                <div style={styles.imagePreviewWrapper}>
                  <img src={yarnPhotoPreview} alt="Yarn preview" style={styles.previewImage} />
                  <button
                    type="button"
                    onClick={handleRemoveYarnPhoto}
                    style={styles.removeImageButton}
                    title="Remove photo"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Label Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLabelPhotoChange}
              style={styles.fileInput}
              ref={labelPhotoInputRef}
            />
            {labelPhotoPreview && (
              <div style={styles.imagePreview}>
                <div style={styles.imagePreviewWrapper}>
                  <img src={labelPhotoPreview} alt="Label preview" style={styles.previewImage} />
                  <button
                    type="button"
                    onClick={handleRemoveLabelPhoto}
                    style={styles.removeImageButton}
                    title="Remove photo"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
              rows="4"
              placeholder="Any additional notes about this yarn..."
            />
          </div>

          {/* Favorite */}
          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_favorite}
                onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                style={styles.checkbox}
              />
              <span>Add to favorites</span>
            </label>
          </div>

          {/* Add to Stash */}
          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={addToStash}
                onChange={(e) => setAddToStash(e.target.checked)}
                style={styles.checkbox}
              />
              <span>Add to stash now</span>
            </label>
            {addToStash && (
              <div style={styles.stashInput}>
                <input
                  type="number"
                  step="0.1"
                  value={stashAmount}
                  onChange={(e) => setStashAmount(e.target.value)}
                  placeholder="Amount"
                  style={{ ...styles.input, width: '150px', marginRight: '0.5rem' }}
                />
                <Select
                  value={stashType}
                  onChange={(e) => setStashType(e.target.value)}
                  options={[
                    { value: 'grams', label: 'Grams' },
                    { value: 'skeins', label: 'Skeins' },
                  ]}
                  style={{ width: '120px' }}
                  size="large"
                />
              </div>
            )}
          </div>

          {/* Error message appears directly above the buttons */}
          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? 'Creating...' : 'Add Yarn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: theme.spacing.md,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: theme.shadows.lg,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottom: `1px solid ${theme.colors.border}`,
  },
  title: {
    margin: 0,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.primary,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: theme.typography.fontSize['3xl'],
    color: theme.colors.textSecondary,
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  form: {
    padding: theme.spacing.lg,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing.md,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    display: 'block',
    marginBottom: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.primary,
  },
  input: {
    width: '100%',
    padding: theme.spacing['2xs'],
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  autocompleteContainer: {
    position: 'relative',
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    marginTop: '0.25rem',
    maxHeight: '200px',
    overflow: 'auto',
    zIndex: 100,
    boxShadow: theme.shadows.md,
  },
  suggestionItem: {
    padding: theme.spacing['2xs'],
    cursor: 'pointer',
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  multiselect: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing['2xs'],
    padding: theme.spacing['2xs'],
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceHover,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.primary,
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
  stashInput: {
    display: 'flex',
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  error: {
    color: theme.colors.errorMuted,
    padding: theme.spacing['2xs'],
    backgroundColor: theme.colors.errorBackground,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.primary,
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTop: `1px solid ${theme.colors.border}`,
  },
  cancelButton: {
    padding: `${theme.spacing['2xs']} ${theme.spacing.lg}`,
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  submitButton: {
    padding: `${theme.spacing['2xs']} ${theme.spacing.lg}`,
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  addButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  yarnSearchWrapper: {
    position: 'relative',
    width: '100%',
  },
  selectedYarnChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing.sm} ${theme.spacing['2xs']}`,
    backgroundColor: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  chipRemoveButton: {
    marginLeft: theme.spacing.sm,
    background: 'none',
    border: 'none',
    color: theme.colors.textSecondary,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.xl,
    lineHeight: '1',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: theme.typography.fontFamily.primary,
  },
  yarnUsageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing['2xs'],
    marginTop: theme.spacing.sm,
  },
  yarnUsageItem: {
    padding: theme.spacing['2xs'],
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  yarnUsageRow: {
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  removeButton: {
    padding: `${theme.spacing.sm} ${theme.spacing['2xs']}`,
    backgroundColor: theme.colors.favorite,
    color: theme.colors.surface,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.xl,
    cursor: 'pointer',
    fontWeight: theme.typography.fontWeight.bold,
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: theme.transitions.normal,
    flexShrink: 0,
    fontFamily: theme.typography.fontFamily.primary,
  },
  helpText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily.primary,
  },
  fileInput: {
    width: '100%',
    padding: theme.spacing['2xs'],
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    cursor: 'pointer',
    fontFamily: theme.typography.fontFamily.primary,
  },
  imagePreviewWrapper: {
    position: 'relative',
    display: 'inline-block',
    width: '100%',
    maxWidth: '300px',
  },
  imagePreview: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: theme.borderRadius.md,
    objectFit: 'contain',
    backgroundColor: theme.colors.background,
    display: 'block',
  },
  removeImageButton: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    width: '24px',
    height: '24px',
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.error,
    color: theme.colors.surface,
    border: 'none',
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.xl,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
    zIndex: 10,
    boxShadow: theme.shadows.sm,
    fontFamily: theme.typography.fontFamily.primary,
  },
};

export default AddYarnForm;
