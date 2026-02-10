/**
 * Add Project Form Component
 * 
 * Modal form for adding a new project.
 * Includes tag input with autocomplete and hook/needle size dropdowns.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { createProject, getProjects, getStash, uploadImages, getImageUrl, getCareInstructionOptions } from '../../services/api';
import Tag from '../common/Tag';
import Select from '../common/Select';
import { theme } from '../../styles/theme';

// Hook sizes for crochet (mm with letter and/or US number)
// Standard US crochet hook sizes: B/1=2.25mm, C/2=2.75mm, D/3=3.25mm, E/4=3.5mm, F/5=3.75mm, G/6=4.0mm, 7=4.5mm, H/8=5.0mm, I/9=5.5mm, J/10=6.0mm, K/10.5=6.5mm, L/11=8.0mm, M/13=9.0mm, N/15=10.0mm
const CROCHET_HOOK_SIZES = [
  { mm: 2.0, letter: null, usNumber: null },
  { mm: 2.25, letter: 'B', usNumber: 1 },
  { mm: 2.5, letter: null, usNumber: null },
  { mm: 2.75, letter: 'C', usNumber: 2 },
  { mm: 3.0, letter: null, usNumber: null },
  { mm: 3.25, letter: 'D', usNumber: 3 },
  { mm: 3.5, letter: 'E', usNumber: 4 },
  { mm: 3.75, letter: 'F', usNumber: 5 },
  { mm: 4.0, letter: 'G', usNumber: 6 },
  { mm: 4.25, letter: null, usNumber: null },
  { mm: 4.5, letter: null, usNumber: 7 },
  { mm: 5.0, letter: 'H', usNumber: 8 },
  { mm: 5.5, letter: 'I', usNumber: 9 },
  { mm: 6.0, letter: 'J', usNumber: 10 },
  { mm: 6.5, letter: 'K', usNumber: 10.5 },
  { mm: 7.0, letter: null, usNumber: null },
  { mm: 8.0, letter: 'L', usNumber: 11 },
  { mm: 9.0, letter: 'M', usNumber: 13 },
  { mm: 10.0, letter: 'N', usNumber: 15 },
  { mm: 12.0, letter: 'O', usNumber: null },
  { mm: 15.0, letter: 'P', usNumber: null },
  { mm: 16.0, letter: 'Q', usNumber: null },
  { mm: 19.0, letter: 'S', usNumber: null },
];

// Needle sizes for knitting (mm only)
const KNIT_NEEDLE_SIZES = [
  1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75,
  4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 8.0, 9.0, 10.0, 12.0, 15.0, 16.0, 19.0, 25.0
];

const AddProjectForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    craft_type: '',
    hook_size: '', // Single value now, stored as ["5mm"] in backend
    pattern_type: '',
    pattern_reference: '',
    date_completed: '',
    is_favorite: false,
    tags: [],
    manual_care_instruction_ids: [],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [existingTags, setExistingTags] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagDropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Yarn usage state
  const [stash, setStash] = useState([]);
  const [yarnUsage, setYarnUsage] = useState([]); // Array of {yarn_id, grams_used, update_stash}
  const [yarnSearchInputs, setYarnSearchInputs] = useState([]); // Array of search input values for each yarn usage entry
  const [yarnSuggestions, setYarnSuggestions] = useState([]); // Array of suggestion arrays for each yarn usage entry
  const [showYarnSuggestions, setShowYarnSuggestions] = useState([]); // Array of booleans for showing suggestions
  
  // Image upload state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Ref for project photos input so we can clear the native value when removing
  const imageInputRef = useRef(null);
  
  // Care instructions state
  const [careInstructionOptions, setCareInstructionOptions] = useState([]);

  // Load existing tags and stash from all projects for autocomplete
  useEffect(() => {
    if (isOpen) {
      loadExistingTags();
      loadStash();
      loadCareInstructionOptions();
    }
  }, [isOpen]);
  
  const loadCareInstructionOptions = async () => {
    try {
      const data = await getCareInstructionOptions();
      setCareInstructionOptions(data.options || []);
    } catch (err) {
      console.error('Error loading care instruction options:', err);
    }
  };

  const loadExistingTags = async () => {
    try {
      const projects = await getProjects();
      const tags = new Set();
      projects.forEach(project => {
        if (project.tags && Array.isArray(project.tags)) {
          project.tags.forEach(tag => tags.add(tag));
        }
      });
      setExistingTags(Array.from(tags).sort());
    } catch (err) {
      console.error('Error loading existing tags:', err);
    }
  };

  const loadStash = async () => {
    try {
      const stashData = await getStash();
      setStash(stashData || []);
    } catch (err) {
      console.error('Error loading stash:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setFormData({
        name: '',
        description: '',
        notes: '',
        craft_type: '',
        hook_size: '',
        pattern_type: '',
        pattern_reference: '',
        date_started: '',
        date_completed: '',
        is_favorite: false,
        tags: [],
        manual_care_instruction_ids: [],
      });
      setTagInput('');
      setError(null);
      setTagSuggestions([]);
      setShowTagDropdown(false);
      setImageFiles([]);
      setImagePreviews([]);
      setYarnUsage([]);
      setYarnSearchInputs([]);
      setYarnSuggestions([]);
      setShowYarnSuggestions([]);
    }
  }, [isOpen]);

  // Update tag suggestions based on input
  useEffect(() => {
    const currentTags = formData.tags || [];
    if (tagInput.trim()) {
      const input = tagInput.trim().toLowerCase();
      const suggestions = existingTags.filter(tag =>
        tag.toLowerCase().includes(input) && !currentTags.includes(tag)
      ).slice(0, 5); // Show max 5 suggestions
      setTagSuggestions(suggestions);
      setShowTagDropdown(suggestions.length > 0);
    } else {
      setTagSuggestions([]);
      setShowTagDropdown(false);
    }
  }, [tagInput, existingTags, formData.tags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setShowTagDropdown(false);
      }
    };

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showTagDropdown]);

  const handleAddYarn = () => {
    // Add a new empty yarn usage entry
    const newIndex = yarnUsage.length;
    setYarnUsage([...yarnUsage, { yarn_id: '', grams_used: '', update_stash: true }]);
    setYarnSearchInputs([...yarnSearchInputs, '']);
    setYarnSuggestions([...yarnSuggestions, []]);
    setShowYarnSuggestions([...showYarnSuggestions, false]);
  };

  const handleRemoveYarn = (index) => {
    setYarnUsage(yarnUsage.filter((_, i) => i !== index));
    setYarnSearchInputs(yarnSearchInputs.filter((_, i) => i !== index));
    setYarnSuggestions(yarnSuggestions.filter((_, i) => i !== index));
    setShowYarnSuggestions(showYarnSuggestions.filter((_, i) => i !== index));
  };

  const handleYarnUsageChange = (index, field, value) => {
    const updated = [...yarnUsage];
    updated[index] = { ...updated[index], [field]: value };
    setYarnUsage(updated);
  };

  const handleYarnSearchChange = (index, value) => {
    // Update search input
    const updatedInputs = [...yarnSearchInputs];
    updatedInputs[index] = value;
    setYarnSearchInputs(updatedInputs);

    // Update suggestions based on search
    if (value.trim()) {
      const searchLower = value.trim().toLowerCase();
      const suggestions = stash
        .filter(entry => {
          // Filter out already selected yarns
          const isSelected = yarnUsage.some((usage, i) => 
            i !== index && usage.yarn_id && parseInt(usage.yarn_id) === entry.yarn.id
          );
          if (isSelected) return false;

          // Search in brand name, yarn name, and color name
          const searchableText = [
            entry.yarn.brand_name || '',
            entry.yarn.yarn_name || '',
            entry.yarn.color_name || ''
          ].join(' ').toLowerCase();
          
          return searchableText.includes(searchLower);
        })
        .slice(0, 5) // Show max 5 suggestions
        .map(entry => ({
          id: entry.yarn.id,
          label: `${entry.yarn.brand_name} ${entry.yarn.yarn_name} - ${entry.yarn.color_name} (${entry.total_grams_owned || 0}g available)`,
          entry: entry
        }));

      const updatedSuggestions = [...yarnSuggestions];
      updatedSuggestions[index] = suggestions;
      setYarnSuggestions(updatedSuggestions);

      const updatedShow = [...showYarnSuggestions];
      updatedShow[index] = suggestions.length > 0;
      setShowYarnSuggestions(updatedShow);
    } else {
      const updatedSuggestions = [...yarnSuggestions];
      updatedSuggestions[index] = [];
      setYarnSuggestions(updatedSuggestions);
      
      const updatedShow = [...showYarnSuggestions];
      updatedShow[index] = false;
      setShowYarnSuggestions(updatedShow);
    }
  };

  const handleSelectYarnSuggestion = (index, yarnId, label) => {
    // Set the selected yarn
    const updated = [...yarnUsage];
    updated[index] = { ...updated[index], yarn_id: yarnId.toString() };
    setYarnUsage(updated);

    // Clear search input and suggestions
    const updatedInputs = [...yarnSearchInputs];
    updatedInputs[index] = label;
    setYarnSearchInputs(updatedInputs);

    const updatedSuggestions = [...yarnSuggestions];
    updatedSuggestions[index] = [];
    setYarnSuggestions(updatedSuggestions);

    const updatedShow = [...showYarnSuggestions];
    updatedShow[index] = false;
    setShowYarnSuggestions(updatedShow);
  };

  const handleClearYarnSelection = (index) => {
    // Clear the selected yarn
    const updated = [...yarnUsage];
    updated[index] = { ...updated[index], yarn_id: '', grams_used: '' };
    setYarnUsage(updated);

    // Clear search input
    const updatedInputs = [...yarnSearchInputs];
    updatedInputs[index] = '';
    setYarnSearchInputs(updatedInputs);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Append new files to existing ones instead of replacing
    setImageFiles(prev => [...prev, ...files]);
    
    // Create previews for new files and append to existing previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input value so the same file can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    // Adjust primary index if needed
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }

    // If all images are removed, clear the native file input so re-selecting
    // the same file again will trigger onChange
    if (newFiles.length === 0 && imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleSetPrimaryImage = (index) => {
    setPrimaryImageIndex(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);
    setError(null);

    try {
      // Validate: if no yarn usage, care instructions are required
      // Allow 0 grams (means "unknown") - check for yarn_id and that grams_used is not empty string
      const hasYarnUsage = yarnUsage.length > 0 && yarnUsage.some(usage => usage.yarn_id && usage.grams_used !== '');
      const hasCareInstructions = formData.manual_care_instruction_ids && formData.manual_care_instruction_ids.length > 0;
      
      if (!hasYarnUsage && !hasCareInstructions) {
        setError('Care instructions are required when no yarn usage is specified. Please add manual care instructions or attach yarns to the project.');
        setLoading(false);
        setUploading(false);
        return;
      }

      // Upload images if files are selected
      let imageUrls = [];
      if (imageFiles.length > 0) {
        const uploadResult = await uploadImages(imageFiles);
        imageUrls = uploadResult.urls.map(item => getImageUrl(item.url));
      }

      // date_completed is now a flexible string (year, month+year, or full date)
      const projectData = {
        ...formData,
        date_completed: formData.date_completed.trim() || null,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        primary_image_index: imageUrls.length > 0 ? primaryImageIndex : 0,
        manual_care_instruction_ids: (formData.manual_care_instruction_ids && formData.manual_care_instruction_ids.length > 0) ? formData.manual_care_instruction_ids : undefined,
        // hook_size is now sent directly as a string
      };
      
      // Remove empty date string
      if (!projectData.date_completed) delete projectData.date_completed;

      // Add yarn usage if any yarns were selected
      // Allow 0 grams (means "unknown") - only filter out entries without yarn_id or empty grams_used string
      if (yarnUsage.length > 0) {
        projectData.yarn_usage = yarnUsage
          .filter(usage => usage.yarn_id && usage.grams_used !== '') // Only include valid entries (allow 0)
          .map(usage => ({
            yarn_id: parseInt(usage.yarn_id),
            grams_used: parseFloat(usage.grams_used) || 0, // Allow 0, default to 0 if NaN
            update_stash: usage.update_stash !== false, // Default to true
          }));
      }

      await createProject(projectData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create project');
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };
  
  const toggleCareInstruction = (careId) => {
    const careIds = formData.manual_care_instruction_ids || [];
    if (careIds.includes(careId)) {
      setFormData({
        ...formData,
        manual_care_instruction_ids: careIds.filter(id => id !== careId),
      });
    } else {
      setFormData({
        ...formData,
        manual_care_instruction_ids: [...careIds, careId],
      });
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag],
        });
        // Add to existing tags if not already there
        if (!existingTags.includes(newTag)) {
          setExistingTags([...existingTags, newTag].sort());
        }
      }
      setTagInput('');
    } else if (e.key === 'Escape') {
      setShowTagDropdown(false);
      setTagInput('');
    }
  };

  const handleSelectSuggestion = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  // Get hook/needle size options based on craft type
  const getSizeOptions = () => {
    if (formData.craft_type === 'crochet') {
      const options = CROCHET_HOOK_SIZES.map(size => {
        // Build label with letter and/or US number
        let label = `${size.mm}mm`;
        const parts = [];
        if (size.letter) parts.push(size.letter);
        if (size.usNumber !== null) parts.push(size.usNumber.toString());
        if (parts.length > 0) {
          label += ` (${parts.join('/')})`;
        }
        return {
          value: `${size.mm}mm`,
          label: label,
        };
      });
      // Add "forgot" option at the beginning
      return [{ value: 'forgot', label: 'Forgot' }, ...options];
    } else if (formData.craft_type === 'knit') {
      const options = KNIT_NEEDLE_SIZES.map(size => ({
        value: `${size}mm`,
        label: `${size}mm`,
      }));
      // Add "forgot" option at the beginning
      return [{ value: 'forgot', label: 'Forgot' }, ...options];
    }
    return [];
  };

  // Reset hook_size when craft_type changes
  const handleCraftTypeChange = (e) => {
    setFormData({
      ...formData,
      craft_type: e.target.value,
      hook_size: '', // Reset hook size when craft type changes
    });
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>New Project</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Project Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Project Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              rows="3"
            />
          </div>

          {/* Craft Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Craft Type</label>
            <Select
              value={formData.craft_type}
              onChange={handleCraftTypeChange}
              options={[
                { value: 'knit', label: 'Knit' },
                { value: 'crochet', label: 'Crochet' },
              ]}
              placeholder="Select..."
            />
          </div>

          {/* Hook/Needle Size - Only show if craft type is selected */}
          {formData.craft_type && (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                {formData.craft_type === 'crochet' ? 'Hook Size' : 'Needle Size'} *
              </label>
              <Select
                value={formData.hook_size}
                onChange={(e) => setFormData({ ...formData, hook_size: e.target.value })}
                options={getSizeOptions()}
                placeholder="Select size..."
              />
            </div>
          )}

          {/* Pattern Type */}
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Pattern Type</label>
              <Select
                value={formData.pattern_type}
                onChange={(e) => setFormData({ ...formData, pattern_type: e.target.value })}
                options={[
                  { value: 'freehand', label: 'Freehand' },
                  { value: 'paid_pattern', label: 'Paid Pattern' },
                  { value: 'free_tutorial', label: 'Free Tutorial' },
                ]}
                placeholder="Select..."
              />
            </div>

            {formData.pattern_type && formData.pattern_type !== 'freehand' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Pattern Reference</label>
                <input
                  type="text"
                  value={formData.pattern_reference}
                  onChange={(e) => setFormData({ ...formData, pattern_reference: e.target.value })}
                  placeholder="Pattern name or link"
                  style={styles.input}
                />
              </div>
            )}
          </div>

          {/* Tags - Search and Select */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Tags</label>
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div style={styles.selectedTagsContainer}>
                {formData.tags.map((tag) => (
                  <Tag
                    key={tag}
                    label={tag}
                    editable={true}
                    onRemove={() => handleRemoveTag(tag)}
                  />
                ))}
              </div>
            )}
            
            {/* Search Input with Suggestions */}
            <div style={styles.tagInputWrapper} ref={tagDropdownRef}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                onFocus={() => {
                  if (tagInput.trim() && tagSuggestions.length > 0) {
                    setShowTagDropdown(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                placeholder="Search tags or press Enter to add..."
                style={styles.tagSearchInput}
              />
              {showTagDropdown && tagSuggestions.length > 0 && (
                <div style={styles.suggestions}>
                  {tagSuggestions.map(tag => (
                    <div
                      key={tag}
                      style={styles.suggestionItem}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(tag);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F5F1EB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p style={styles.helpText}>
              Examples: garment, top, hat, outer, stuffed animal, amigurumi
            </p>
          </div>

          {/* Project Images */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Project Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={styles.fileInput}
              ref={imageInputRef}
            />
            {imagePreviews.length > 0 && (
              <div>
                <p style={styles.helpText}>Click on an image to set it as primary (shown in card view).</p>
                <div style={styles.imagePreviewsContainer}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={styles.imagePreviewItem}>
                      <div
                        style={{
                          ...styles.imageWrapper,
                          border: primaryImageIndex === index ? '3px solid #8B7355' : '3px solid transparent',
                        }}
                        onClick={() => handleSetPrimaryImage(index)}
                        title="Click to set as primary"
                      >
                        <img src={preview} alt={`Preview ${index + 1}`} style={styles.previewImage} />
                        {primaryImageIndex === index && (
                          <div style={styles.primaryBadge}>Primary</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        style={styles.removeImageButton}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
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
              placeholder="Any additional notes about this project..."
            />
          </div>

          {/* Date Completed */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Date Completed</label>
            <input
              type="text"
              value={formData.date_completed}
              onChange={(e) => setFormData({ ...formData, date_completed: e.target.value })}
              style={styles.input}
              placeholder="e.g., 2024, 2024-03, March 2024, or 2024-03-15"
            />
            <p style={styles.helpText}>
              Enter year only (e.g., "2024"), month and year (e.g., "2024-03" or "March 2024"), or full date (e.g., "2024-03-15"). Leave empty if incomplete.
            </p>
          </div>

          {/* Yarn Usage Section */}
          <div style={styles.formGroup}>
            <div style={styles.sectionHeader}>
              <label style={styles.label}>Yarns Used</label>
              <button
                type="button"
                onClick={handleAddYarn}
                style={styles.addButton}
              >
                + Add Yarn
              </button>
            </div>
            {yarnUsage.length > 0 && (
              <div style={styles.yarnUsageList}>
                {yarnUsage.map((usage, index) => {
                  const selectedYarn = stash.find(entry => entry.yarn.id === parseInt(usage.yarn_id));
                  const searchInput = yarnSearchInputs[index] || '';
                  const suggestions = yarnSuggestions[index] || [];
                  const showSuggestions = showYarnSuggestions[index] || false;
                  
                  return (
                    <div key={index} style={styles.yarnUsageItem}>
                      <div style={styles.yarnUsageRow}>
                        <div style={{ ...styles.yarnSearchWrapper, flex: 2, position: 'relative' }}>
                          {usage.yarn_id ? (
                            // Show selected yarn as a chip
                            <div style={styles.selectedYarnChip}>
                              <span>{yarnSearchInputs[index] || `${selectedYarn?.yarn.brand_name} ${selectedYarn?.yarn.yarn_name} - ${selectedYarn?.yarn.color_name}`}</span>
                              <button
                                type="button"
                                onClick={() => handleClearYarnSelection(index)}
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
                                onChange={(e) => handleYarnSearchChange(index, e.target.value)}
                                onFocus={() => {
                                  if (searchInput.trim() && suggestions.length > 0) {
                                    const updatedShow = [...showYarnSuggestions];
                                    updatedShow[index] = true;
                                    setShowYarnSuggestions(updatedShow);
                                  }
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    const updatedShow = [...showYarnSuggestions];
                                    updatedShow[index] = false;
                                    setShowYarnSuggestions(updatedShow);
                                  }, 200);
                                }}
                                placeholder="Search yarn..."
                                style={styles.input}
                              />
                              {showSuggestions && suggestions.length > 0 && (
                                <div style={styles.suggestions}>
                                  {suggestions.map(suggestion => (
                                    <div
                                      key={suggestion.id}
                                      style={styles.suggestionItem}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectYarnSuggestion(index, suggestion.id, suggestion.label);
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
                          step="0.1"
                          min="0"
                          value={usage.grams_used}
                          onChange={(e) => handleYarnUsageChange(index, 'grams_used', e.target.value)}
                          placeholder="Grams used"
                          style={{ ...styles.input, flex: 1, marginLeft: '0.5rem' }}
                          required={usage.yarn_id ? true : false}
                          disabled={!usage.yarn_id}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveYarn(index)}
                          style={styles.removeButton}
                        >
                          ×
                        </button>
                      </div>
                      {usage.yarn_id && (
                        <div style={{ ...styles.yarnUsageRow, marginTop: '0.5rem', justifyContent: 'flex-start' }}>
                          <label style={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={usage.update_stash !== false}
                              onChange={(e) => handleYarnUsageChange(index, 'update_stash', e.target.checked)}
                              style={styles.checkbox}
                            />
                            <span>Update stash</span>
                          </label>
                        </div>
                      )}
                      {selectedYarn && parseFloat(usage.grams_used) > selectedYarn.total_grams_owned && usage.update_stash !== false && (
                        <div style={styles.warning}>
                          Warning: Requested {usage.grams_used}g but only {selectedYarn.total_grams_owned}g available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {yarnUsage.length === 0 && (
              <p style={styles.helpText}>
                You can add yarns now or add them later after creating the project.
              </p>
            )}
          </div>

          {/* Care Instructions */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Care Instructions (select multiple)
              {yarnUsage.length === 0 || !yarnUsage.some(usage => usage.yarn_id && usage.grams_used) ? (
                <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>
              ) : null}
            </label>
            <p style={styles.helpText}>
              {yarnUsage.length > 0 && yarnUsage.some(usage => usage.yarn_id && usage.grams_used)
                ? 'Leave blank to have care instructions calculated from the yarns in this project.'
                : 'Required when no yarns are attached. When you add yarns, leave this blank to have care instructions calculated from them.'}
            </p>
            <div style={styles.multiselect}>
              {careInstructionOptions.map(opt => (
                <label key={opt.id} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={(formData.manual_care_instruction_ids || []).includes(opt.id)}
                    onChange={() => toggleCareInstruction(opt.id)}
                    style={styles.checkbox}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {yarnUsage.length === 0 || !yarnUsage.some(usage => usage.yarn_id && usage.grams_used) ? (
              (formData.manual_care_instruction_ids || []).length === 0 && (
                <p style={{ ...styles.helpText, color: theme.colors.error, marginTop: '0.5rem' }}>
                  Please select at least one care instruction.
                </p>
              )
            ) : null}
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

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
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
    maxWidth: '600px',
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
    position: 'relative',
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
  tagInputWrapper: {
    position: 'relative',
  },
  selectedTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagSearchInput: {
    width: '100%',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    outline: 'none',
    fontSize: theme.typography.fontSize.base,
    padding: theme.spacing['2xs'],
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.25rem',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.md,
    zIndex: 10,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  suggestionItem: {
    padding: theme.spacing['2xs'],
    cursor: 'pointer',
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.base,
    borderBottom: `1px solid ${theme.colors.background}`,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing['2xs'],
  },
  addButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: theme.colors.secondary,
    color: theme.colors.surface,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    cursor: 'pointer',
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
    padding: `${theme.spacing.sm} 0.75rem`,
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
  warning: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: '#FFF3CD',
    color: '#856404',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.primary,
  },
  helpText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily.primary,
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
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
  imagePreviewsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing['2xs'],
    marginTop: theme.spacing['2xs'],
  },
  imageWrapper: {
    position: 'relative',
    cursor: 'pointer',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    transition: 'border-color 0.2s ease',
  },
  primaryBadge: {
    position: 'absolute',
    top: '0.5rem',
    left: '0.5rem',
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    padding: '0.25rem 0.5rem',
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    zIndex: 2,
    fontFamily: theme.typography.fontFamily.primary,
  },
  imagePreviewItem: {
    position: 'relative',
    width: '150px',
    height: '150px',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  removeImageButton: {
    position: 'absolute',
    top: '0.25rem',
    right: '0.25rem',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: theme.colors.error,
    color: theme.colors.surface,
    border: 'none',
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.xl,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    fontFamily: theme.typography.fontFamily.primary,
  },
};

export default AddProjectForm;
