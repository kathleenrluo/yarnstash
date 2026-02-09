/**
 * Project Detail Modal
 * 
 * Shows all project information and clickable links to yarns used.
 */

import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { getProjectWithYarns, toggleProjectFavorite, updateProject, deleteProject, getProjects, uploadImages, getImageUrl, getStash, addYarnUsage, removeYarnUsage, updateYarnUsage, getCareInstructionOptions } from '../../services/api';
import Tag from './Tag';
import FavoriteButton from './FavoriteButton';
import Select from './Select';
import { formatDateForDisplay } from '../../utils/dateParser';
import { formatHookSizeForDisplay } from '../../utils/hookSizes';
import { theme } from '../../styles/theme';
import { isDemoMode } from '../../config/demoMode';

const formatPatternTypeLabel = (patternType) => {
  if (!patternType) return '';
  const map = {
    freehand: 'Freehand',
    paid_pattern: 'Paid Pattern',
    free_tutorial: 'Free Tutorial',
  };
  return map[patternType] || patternType;
};

const ProjectDetailModal = ({ isOpen, onClose, projectId, onYarnClick, onFavoriteToggle, onUpdate, onDelete }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // Track field-specific errors
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [existingTags, setExistingTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagDropdownRef = useRef(null);
  const [saving, setSaving] = useState(false);
  
  // Care instructions state
  const [careInstructionOptions, setCareInstructionOptions] = useState([]);
  
  // Image upload state for editing
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Track existing images separately
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  // Ref for project photos input so we can clear the native value when removing
  const imageInputRef = useRef(null);
  
  // Yarn editing state
  const [stash, setStash] = useState([]);
  const [yarnUsage, setYarnUsage] = useState([]); // Array of {usage_id, yarn_id, grams_used, update_stash, isNew}
  const [yarnSearchInputs, setYarnSearchInputs] = useState([]);
  const [yarnSuggestions, setYarnSuggestions] = useState([]);
  const [showYarnSuggestions, setShowYarnSuggestions] = useState([]);

  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectDetails();
      loadExistingTags();
      loadStash();
      loadCareInstructionOptions();
    } else {
      setProject(null);
      setError(null);
      setIsEditing(false);
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImages([]);
      setPrimaryImageIndex(0);
    }
  }, [isOpen, projectId]);
  
  // Update primary index when project changes (but not when editing)
  // This should only run when NOT in edit mode to avoid resetting during edit
  useEffect(() => {
    if (project && !isEditing && project.image_urls && project.image_urls.length > 0) {
      // Preserve the actual primary_image_index value (even if it's 0)
      const primaryIdx = project.primary_image_index !== undefined && project.primary_image_index !== null 
        ? project.primary_image_index 
        : 0;
      const validPrimaryIdx = Math.min(Math.max(0, primaryIdx), project.image_urls.length - 1);
      setPrimaryImageIndex(validPrimaryIdx);
      setExistingImages(project.image_urls || []);
    }
  }, [project, isEditing]);

  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditing && project) {
      setEditFormData({
        name: project.name || '',
        description: project.description || '',
        notes: project.notes || '',
        craft_type: project.craft_type || '',
        hook_size: project.hook_size || '',
        pattern_type: project.pattern_type || '',
        pattern_reference: project.pattern_reference || '',
        date_completed: project.date_completed || '',
        is_favorite: project.is_favorite || false,
        tags: project.tags || [],
        manual_care_instruction_ids: project.manual_care_instruction_ids || [],
      });
      setTagInput('');
      // Initialize existing images and primary index
      // IMPORTANT: Preserve the actual primary_image_index value (even if it's 0)
      const existingImgs = project.image_urls || [];
      // Use the actual primary_image_index from project, defaulting to 0 only if undefined/null
      const primaryIdx = project.primary_image_index !== undefined && project.primary_image_index !== null 
        ? project.primary_image_index 
        : 0;
      
      // Ensure primary index is valid for the number of images
      const validPrimaryIdx = existingImgs.length > 0 
        ? Math.min(Math.max(0, primaryIdx), existingImgs.length - 1)
        : 0;
      
      setPrimaryImageIndex(validPrimaryIdx);
      setExistingImages(existingImgs);
      setImageFiles([]);
      setImagePreviews([]);
      
      // Initialize yarn usage from project (only if stash is loaded)
      if (stash.length > 0 && project.yarns_used && project.yarns_used.length > 0) {
        const initialYarnUsage = project.yarns_used.map(yu => ({
          usage_id: yu.usage_id || null,
          yarn_id: yu.yarn_id.toString(),
          grams_used: yu.grams_used.toString(),
          update_stash: false, // Default to false for existing yarns (already deducted)
          isNew: false,
        }));
        setYarnUsage(initialYarnUsage);
        setYarnSearchInputs(initialYarnUsage.map(yu => {
          const stashEntry = stash.find(s => s.yarn.id === parseInt(yu.yarn_id));
          return stashEntry ? `${stashEntry.yarn.brand_name} ${stashEntry.yarn.yarn_name} - ${stashEntry.yarn.color_name}` : '';
        }));
        setYarnSuggestions(initialYarnUsage.map(() => []));
        setShowYarnSuggestions(initialYarnUsage.map(() => false));
      } else if (stash.length > 0) {
        // No yarns used, initialize empty
        setYarnUsage([]);
        setYarnSearchInputs([]);
        setYarnSuggestions([]);
        setShowYarnSuggestions([]);
      }
    }
  }, [isEditing, project, stash]);

  const loadExistingTags = async () => {
    try {
      const projects = await getProjects();
      const tags = new Set();
      projects.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) {
          p.tags.forEach(tag => tags.add(tag));
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
      setStash(stashData);
    } catch (err) {
      console.error('Error loading stash:', err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!project) return;
    
    const currentFavorite = project.is_favorite;
    const newFavorite = !currentFavorite;
    
    // Optimistic update
    setProject({ ...project, is_favorite: newFavorite });
    
    // Notify parent if callback provided
    if (onFavoriteToggle) {
      onFavoriteToggle(project.id, newFavorite);
    }
    
    // Update in the background
    try {
      await toggleProjectFavorite(project.id, newFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      setProject({ ...project, is_favorite: currentFavorite });
      if (onFavoriteToggle) {
        onFavoriteToggle(project.id, currentFavorite);
      }
    }
  };

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectWithYarns(projectId);
      setProject(data);
      // Set primary image index when project loads (only if not in edit mode)
      if (data && data.image_urls && data.image_urls.length > 0 && !isEditing) {
        // Preserve the actual primary_image_index value (even if it's 0)
        const primaryIdx = data.primary_image_index !== undefined && data.primary_image_index !== null 
          ? data.primary_image_index 
          : 0;
        const validPrimaryIdx = Math.min(Math.max(0, primaryIdx), data.image_urls.length - 1);
        setPrimaryImageIndex(validPrimaryIdx);
        setExistingImages(data.image_urls || []);
      }
    } catch (err) {
      setError('Failed to load project details.');
      console.error('Error loading project details:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadCareInstructionOptions = async () => {
    try {
      const data = await getCareInstructionOptions();
      setCareInstructionOptions(data.options || []);
    } catch (err) {
      console.error('Error loading care instruction options:', err);
    }
  };
  
  const toggleCareInstruction = (careId) => {
    const careIds = editFormData.manual_care_instruction_ids || [];
    if (careIds.includes(careId)) {
      setEditFormData({
        ...editFormData,
        manual_care_instruction_ids: careIds.filter(id => id !== careId),
      });
    } else {
      setEditFormData({
        ...editFormData,
        manual_care_instruction_ids: [...careIds, careId],
      });
    }
  };

  const handleYarnClick = (yarnId) => {
    // Close this modal first, then trigger navigation
    onClose();
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      if (onYarnClick) {
        onYarnClick(yarnId);
      }
    }, 150);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null); // Clear errors when entering edit mode
    setFieldErrors({}); // Clear field errors
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
    setImageFiles([]);
    setImagePreviews([]);
    setError(null); // Clear errors when canceling
    setFieldErrors({}); // Clear field errors
  };

  const handleDelete = async () => {
    if (!project) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\n` +
      `This will permanently delete the project and all associated yarn usage records. This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await deleteProject(project.id);
      // Close modal and notify parent to refresh
      onClose();
      if (onDelete) {
        onDelete(project.id);
      }
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete project');
      console.error('Error deleting project:', err);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    
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

  const handleRemoveNewImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);

    // If all newly added images are removed, clear the native file input so
    // selecting the same file again will trigger onChange
    if (newFiles.length === 0 && imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveExistingImage = (index) => {
    const newExisting = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExisting);
    // Adjust primary index if needed
    // If removing the primary image, set to 0 (first remaining image)
    // If removing an image before the primary, decrement the primary index
    if (primaryImageIndex === index) {
      // If we're removing the primary, set to 0 (first image)
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      // If we're removing an image before the primary, adjust the index
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
    // If removing an image after the primary, no change needed
  };

  const handleSetPrimaryImage = (index, isExisting) => {
    if (isExisting) {
      setPrimaryImageIndex(index);
    } else {
      // For new images, the index in the combined array is existingImages.length + index
      setPrimaryImageIndex(existingImages.length + index);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      const currentTags = editFormData.tags || [];
      if (!currentTags.includes(newTag)) {
        setEditFormData({
          ...editFormData,
          tags: [...currentTags, newTag],
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

  const handleRemoveTag = (tagToRemove) => {
    const currentTags = editFormData.tags || [];
    setEditFormData({
      ...editFormData,
      tags: currentTags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
  };

  // Update tag suggestions based on input
  useEffect(() => {
    const currentTags = editFormData.tags || [];
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
  }, [tagInput, existingTags, editFormData.tags]);

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

  const handleTagSuggestionClick = (tag) => {
    const currentTags = editFormData.tags || [];
    if (!currentTags.includes(tag)) {
      setEditFormData({
        ...editFormData,
        tags: [...currentTags, tag],
      });
    }
    setTagInput('');
  };

  const getSizeOptions = () => {
    if (editFormData.craft_type === 'crochet') {
      const sizes = [
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
      const options = sizes.map(size => {
        // Build label with letter and/or US number
        let label = `${size.mm}mm`;
        const parts = [];
        if (size.letter) parts.push(size.letter);
        if (size.usNumber !== null) parts.push(size.usNumber.toString());
        if (parts.length > 0) {
          label += ` (${parts.join('/')})`;
        }
        return {
          value: `${size.mm}mm`, // Value is always just "Xmm" to match stored format
          label: label,
        };
      });
      // Add "forgot" option at the beginning
      return [{ value: 'forgot', label: 'Forgot' }, ...options];
    } else if (editFormData.craft_type === 'knit') {
      const sizes = [
        1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75,
        4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 8.0, 9.0, 10.0, 12.0, 15.0, 16.0, 19.0, 25.0
      ];
      const options = sizes.map(size => ({
        value: `${size}mm`,
        label: `${size}mm`,
      }));
      // Add "forgot" option at the beginning
      return [{ value: 'forgot', label: 'Forgot' }, ...options];
    }
    return [];
  };

  const handleCraftTypeChange = (e) => {
    const newCraftType = e.target.value;
    // Only reset hook_size if craft_type actually changed
    // This prevents resetting when the form is first initialized
    const shouldResetHookSize = editFormData.craft_type && editFormData.craft_type !== newCraftType;
    setEditFormData({
      ...editFormData,
      craft_type: newCraftType,
      hook_size: shouldResetHookSize ? '' : editFormData.hook_size,
    });
  };

  // Yarn editing handlers
  const handleAddYarn = () => {
    const newIndex = yarnUsage.length;
    setYarnUsage([...yarnUsage, { usage_id: null, yarn_id: '', grams_used: '', update_stash: true, isNew: true }]);
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
    const updatedInputs = [...yarnSearchInputs];
    updatedInputs[index] = value;
    setYarnSearchInputs(updatedInputs);

    if (value.trim()) {
      const searchLower = value.trim().toLowerCase();
      const suggestions = stash
        .filter(entry => {
          const isSelected = yarnUsage.some((usage, i) => 
            i !== index && usage.yarn_id && parseInt(usage.yarn_id) === entry.yarn.id
          );
          if (isSelected) return false;

          const searchableText = [
            entry.yarn.brand_name || '',
            entry.yarn.yarn_name || '',
            entry.yarn.color_name || ''
          ].join(' ').toLowerCase();
          
          return searchableText.includes(searchLower);
        })
        .slice(0, 5)
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
    const updated = [...yarnUsage];
    updated[index] = { ...updated[index], yarn_id: yarnId.toString() };
    setYarnUsage(updated);

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
    const updated = [...yarnUsage];
    updated[index] = { ...updated[index], yarn_id: '', grams_used: '' };
    setYarnUsage(updated);

    const updatedInputs = [...yarnSearchInputs];
    updatedInputs[index] = '';
    setYarnSearchInputs(updatedInputs);
  };

  const handleSaveEdit = async () => {
    if (!project) return;
    
    setSaving(true);
    setError(null);
    setFieldErrors({});
    
    try {
      // Validate: if no yarn usage, care instructions are required
      // Allow 0 grams (means "unknown") - check for yarn_id and that grams_used is not empty string
      const hasYarnUsage = yarnUsage.length > 0 && yarnUsage.some(usage => usage.yarn_id && usage.grams_used !== '');
      const hasCareInstructions = editFormData.manual_care_instruction_ids && editFormData.manual_care_instruction_ids.length > 0;
      
      if (!hasYarnUsage && !hasCareInstructions) {
        setError('Care instructions are required when no yarn usage is specified. Please add manual care instructions or attach yarns to the project.');
        setSaving(false);
        return;
      }
      // Upload new images if files are selected
      let newImageUrls = [];
      if (imageFiles.length > 0) {
        const uploadResult = await uploadImages(imageFiles);
        newImageUrls = uploadResult.urls.map(item => getImageUrl(item.url));
      }

      // Combine existing (after removals) and new images
      const allImageUrls = [...existingImages, ...newImageUrls];
      
      // Ensure primary_image_index is valid
      let finalPrimaryIndex = primaryImageIndex;
      if (finalPrimaryIndex >= allImageUrls.length) {
        finalPrimaryIndex = allImageUrls.length > 0 ? 0 : 0;
      }

      // Format dates for backend (ISO format, or null if empty)
      // Determine if image_urls changed: compare current state with original project state
      const originalImageCount = project.image_urls?.length || 0;
      const hasImageChanges = allImageUrls.length !== originalImageCount || 
        (allImageUrls.length > 0 && originalImageCount > 0 && 
         JSON.stringify(allImageUrls) !== JSON.stringify(project.image_urls));
      
      const updateData = {
        ...editFormData,
        date_completed: (editFormData.date_completed && editFormData.date_completed.trim()) || null,
        // Send empty array if all images removed, undefined if no change, or array if changed
        image_urls: hasImageChanges ? allImageUrls : undefined,
        primary_image_index: allImageUrls.length > 0 ? finalPrimaryIndex : 0,
      };
      
      // Remove undefined/empty values (but keep null dates and empty arrays to clear them)
      Object.keys(updateData).forEach(key => {
        if (key === 'date_completed') {
          // Keep null dates, remove undefined
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        } else if (key === 'image_urls') {
          // Keep empty arrays (to clear images), remove undefined (no change)
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        } else if (updateData[key] === undefined || (key !== 'tags' && key !== 'primary_image_index' && key !== 'manual_care_instruction_ids' && updateData[key] === '')) {
          delete updateData[key];
        }
      });
      
      // Include manual_care_instruction_ids even if empty (to clear it)
      if ('manual_care_instruction_ids' in editFormData) {
        updateData.manual_care_instruction_ids = editFormData.manual_care_instruction_ids || [];
      }
      
      const updatedProject = await updateProject(project.id, updateData);
      
      // Handle yarn usage changes
      // Create a map of original usages by usage_id for comparison
      const originalUsages = new Map();
      (project.yarns_used || []).forEach(yu => {
        if (yu.usage_id) {
          originalUsages.set(yu.usage_id, yu);
        }
      });
      
      // Get original yarn usage IDs
      const originalUsageIds = new Set((project.yarns_used || []).map(yu => yu.usage_id).filter(id => id));
      const currentUsageIds = new Set(yarnUsage.filter(yu => yu.usage_id).map(yu => yu.usage_id));
      
      // Remove deleted yarn usages and usages where yarn_id has changed
      for (const usageId of originalUsageIds) {
        const currentUsage = yarnUsage.find(yu => yu.usage_id === usageId);
        const originalUsage = originalUsages.get(usageId);
        
        // Remove if usage is deleted OR if yarn_id has changed
        if (!currentUsage || (originalUsage && currentUsage.yarn_id && parseInt(currentUsage.yarn_id) !== originalUsage.yarn_id)) {
          await removeYarnUsage(project.id, usageId);
        }
      }
      
      // Update or add yarn usages
      // Allow 0 grams (means "unknown") - only skip if yarn_id is missing or grams_used is empty string
      for (const usage of yarnUsage) {
        if (!usage.yarn_id || usage.grams_used === '') continue;
        
        if (usage.usage_id && !usage.isNew) {
          // Check if yarn_id has changed
          const originalUsage = originalUsages.get(usage.usage_id);
          if (originalUsage && parseInt(usage.yarn_id) !== originalUsage.yarn_id) {
            // Yarn has changed - remove old and add new (already removed above)
            // Add new usage with new yarn_id
            await addYarnUsage(
              project.id,
              parseInt(usage.yarn_id),
              parseFloat(usage.grams_used) || 0, // Allow 0, default to 0 if NaN
              usage.update_stash !== false
            );
          } else {
            // Just update grams_used (yarn_id hasn't changed)
            await updateYarnUsage(
              project.id,
              usage.usage_id,
              parseFloat(usage.grams_used) || 0, // Allow 0, default to 0 if NaN
              usage.update_stash !== false ? true : null
            );
          }
        } else {
          // Add new usage
          await addYarnUsage(
            project.id,
            parseInt(usage.yarn_id),
            parseFloat(usage.grams_used) || 0, // Allow 0, default to 0 if NaN
            usage.update_stash !== false
          );
        }
      }
      
      setProject(updatedProject);
      setIsEditing(false);
      
      // Reload project details to get fresh data
      await loadProjectDetails();
      
      // Notify parent to refresh the list
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      // Extract error message from response
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to update project';
      setError(errorMessage);
      
      // Parse error to identify which field has the issue
      const newFieldErrors = {};
      const errorLower = errorMessage.toLowerCase();
      
      if (errorLower.includes('date') || errorLower.includes('format')) {
        newFieldErrors.date_completed = errorMessage;
      }
      if (errorLower.includes('material')) {
        newFieldErrors.material_breakdown = errorMessage;
      }
      
      setFieldErrors(newFieldErrors);
      
      console.error('Error updating project:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        updateData: updateData
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Prepare header actions for the modal
  const headerActions = project && !isEditing ? (
    <>
      {!isDemoMode && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }} 
            style={styles.editButton}
          >
            Edit
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }} 
            style={styles.deleteButton}
          >
            Delete
          </button>
        </>
      )}
      <div onClick={(e) => e.stopPropagation()}>
        <FavoriteButton
          isFavorite={project.is_favorite}
          onClick={handleToggleFavorite}
        />
      </div>
    </>
  ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project?.name || 'Project Details'} headerActions={headerActions}>
      {loading && <p>Loading...</p>}
      {error && !isEditing && <p style={{ color: theme.colors.error }}>{error}</p>}
      {project && (
        <div style={styles.content}>

          {isEditing ? (
            /* Edit Form */
            <div style={styles.editForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Project Name *</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                  rows="3"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Craft Type</label>
                <Select
                  value={editFormData.craft_type || ''}
                  onChange={handleCraftTypeChange}
                  options={[
                    { value: 'knit', label: 'Knit' },
                    { value: 'crochet', label: 'Crochet' },
                  ]}
                  placeholder="Select..."
                />
              </div>

              {editFormData.craft_type && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {editFormData.craft_type === 'crochet' ? 'Hook Size' : 'Needle Size'}
                  </label>
                  <Select
                    value={editFormData.hook_size || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, hook_size: e.target.value })}
                    options={getSizeOptions()}
                    placeholder="Select size..."
                  />
                </div>
              )}

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pattern Type</label>
                  <Select
                    value={editFormData.pattern_type || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, pattern_type: e.target.value })}
                    options={[
                      { value: 'freehand', label: 'Freehand' },
                      { value: 'paid_pattern', label: 'Paid Pattern' },
                      { value: 'free_tutorial', label: 'Free Tutorial' },
                    ]}
                    placeholder="Select..."
                  />
                </div>
                {editFormData.pattern_type && editFormData.pattern_type !== 'freehand' && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Pattern Reference</label>
                    <input
                      type="text"
                      value={editFormData.pattern_reference || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, pattern_reference: e.target.value })}
                      placeholder="Pattern name or link"
                      style={styles.input}
                    />
                  </div>
                )}
              </div>

              {/* Date Completed */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Date Completed
                  {fieldErrors.date_completed && <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={editFormData.date_completed || ''}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, date_completed: e.target.value });
                    // Clear field error when user starts typing
                    if (fieldErrors.date_completed) {
                      setFieldErrors({ ...fieldErrors, date_completed: null });
                      if (error && error.toLowerCase().includes('date')) {
                        setError(null);
                      }
                    }
                  }}
                  style={{
                    ...styles.input,
                    borderColor: fieldErrors.date_completed ? theme.colors.error : theme.colors.border,
                    borderWidth: fieldErrors.date_completed ? '2px' : '1px'
                  }}
                  placeholder="e.g., 2024, 2024-03, March 2024, or 2024-03-15"
                />
                {fieldErrors.date_completed ? (
                  <p style={{ ...styles.helpText, color: theme.colors.error, marginTop: '0.25rem' }}>
                    {fieldErrors.date_completed}
                  </p>
                ) : (
                  <p style={styles.helpText}>
                    Enter year only (e.g., "2024"), month and year (e.g., "2024-03" or "March 2024"), or full date (e.g., "2024-03-15"). Leave empty if incomplete.
                  </p>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tags</label>
                <div style={styles.tagInputWrapper} ref={tagDropdownRef}>
                  {/* Selected Tags */}
                  {editFormData.tags && editFormData.tags.length > 0 && (
                    <div style={styles.selectedTagsContainer}>
                      {editFormData.tags.map((tag, index) => (
                        <Tag
                          key={index}
                          label={tag}
                          onRemove={() => handleRemoveTag(tag)}
                          editable={true}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Search Input with Suggestions */}
                  <div style={styles.tagInputWrapper} ref={tagDropdownRef}>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTagInputChange}
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
                        {tagSuggestions.map((tag, idx) => (
                          <div
                            key={idx}
                            style={styles.suggestionItem}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleTagSuggestionClick(tag);
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
                </div>
              </div>

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
                <p style={styles.helpText}>Click on an image to set it as primary (shown in card view).</p>
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div style={styles.imageSection}>
                    <p style={styles.helpText}>Existing Images:</p>
                    <div style={styles.imagePreviewsContainer}>
                      {existingImages.map((url, index) => (
                        <div key={`existing-${index}`} style={styles.imagePreviewItem}>
                          <div
                            style={{
                              ...styles.imageWrapper,
                              border: primaryImageIndex === index ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                            }}
                            onClick={() => handleSetPrimaryImage(index, true)}
                            title="Click to set as primary"
                          >
                            <img src={url} alt={`Existing ${index + 1}`} style={styles.previewImage} />
                            {primaryImageIndex === index && (
                              <div style={styles.primaryBadge}>Primary</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(index)}
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
                
                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div style={styles.imageSection}>
                    <p style={styles.helpText}>New Images:</p>
                    <div style={styles.imagePreviewsContainer}>
                      {imagePreviews.map((preview, index) => {
                        const combinedIndex = existingImages.length + index;
                        return (
                          <div key={`new-${index}`} style={styles.imagePreviewItem}>
                            <div
                              style={{
                                ...styles.imageWrapper,
                                border: primaryImageIndex === combinedIndex ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                              }}
                              onClick={() => handleSetPrimaryImage(index, false)}
                              title="Click to set as primary"
                            >
                              <img src={preview} alt={`Preview ${index + 1}`} style={styles.previewImage} />
                              {primaryImageIndex === combinedIndex && (
                                <div style={styles.primaryBadge}>Primary</div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(index)}
                              style={styles.removeImageButton}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                  rows="4"
                  placeholder="Any additional notes about this project..."
                />
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
                                <>
                                  <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => handleYarnSearchChange(index, e.target.value)}
                                    onFocus={() => {
                                      if (searchInput && searchInput.trim() && suggestions.length > 0) {
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveYarn(index);
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
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
                    You can add yarns now or add them later.
                  </p>
                )}
              </div>

              {/* Care Instructions */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Care Instructions (select multiple)
                  {yarnUsage.length === 0 || !yarnUsage.some(usage => usage.yarn_id && usage.grams_used !== '') ? (
                    <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>
                  ) : null}
                </label>
                <p style={styles.helpText}>
                  {yarnUsage.length > 0 && yarnUsage.some(usage => usage.yarn_id && usage.grams_used !== '')
                    ? 'Manual care instructions will override the calculated care instructions from yarns.'
                    : 'Required when no yarn usage is specified. Manual care instructions will override calculated care instructions from yarns.'}
                </p>
                <div style={styles.multiselect}>
                  {careInstructionOptions.map(opt => (
                    <label key={opt.id} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={(editFormData.manual_care_instruction_ids || []).includes(opt.id)}
                        onChange={() => toggleCareInstruction(opt.id)}
                        style={styles.checkbox}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {yarnUsage.length === 0 || !yarnUsage.some(usage => usage.yarn_id && usage.grams_used !== '') ? (
                  (editFormData.manual_care_instruction_ids || []).length === 0 && (
                    <p style={{ ...styles.helpText, color: theme.colors.error, marginTop: '0.5rem' }}>
                      Please select at least one care instruction.
                    </p>
                  )
                ) : null}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editFormData.is_favorite || false}
                    onChange={(e) => setEditFormData({ ...editFormData, is_favorite: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span>Favorite</span>
                </label>
              </div>

              {/* Error message appears directly above the buttons */}
              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.buttonGroup}>
                <button type="button" onClick={handleCancelEdit} style={styles.cancelButton}>
                  Cancel
                </button>
                <button type="button" onClick={handleSaveEdit} style={styles.saveButton} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            /* Display View */
            <>
          {/* Images */}
          {project.image_urls && project.image_urls.length > 0 && (
            <div style={styles.imageSection}>
              {project.image_urls.map((url, index) => (
                <img
                  key={index}
                  src={getImageUrl(url)}
                  alt={`${project.name} ${index + 1}`}
                  style={styles.image}
                />
              ))}
            </div>
          )}

          {/* Basic Info (no section header, go straight into content) */}
          <div style={styles.section}>
            {project.description && (
              <p style={styles.description}>{project.description}</p>
            )}
            {project.notes && (
              <div style={styles.notes}>
                <strong>Notes:</strong>
                <p>{project.notes}</p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div style={styles.detailsGrid}>
            {project.craft_type && (
              <div style={styles.detailItem}>
                <strong>Craft Type:</strong> {project.craft_type}
              </div>
            )}
            <div style={styles.detailItem}>
              <strong>Date Completed:</strong> {formatDateForDisplay(project.date_completed)}
            </div>
            {project.hook_size && (
              <div style={styles.detailItem}>
                <strong>{project.craft_type === 'crochet' ? 'Hook Size' : project.craft_type === 'knit' ? 'Needle Size' : 'Hook/Needle Size'}:</strong> {formatHookSizeForDisplay(project.hook_size, project.craft_type)}
              </div>
            )}
            {project.pattern_type && (
              <div style={styles.detailItem}>
                <strong>Pattern Type:</strong> {formatPatternTypeLabel(project.pattern_type)}
              </div>
            )}
            {project.pattern_reference && (
              <div style={styles.detailItem}>
                <strong>Pattern:</strong>{' '}
                {project.pattern_reference.startsWith('http://') || project.pattern_reference.startsWith('https://') ? (
                  <a href={project.pattern_reference} target="_blank" rel="noopener noreferrer" style={styles.link}>
                    {project.pattern_reference}
                  </a>
                ) : (
                  <span>{project.pattern_reference}</span>
                )}
              </div>
            )}
            {project.computed_care_instruction && (
              <div style={styles.detailItem}>
                <strong>Care Instructions:</strong> {project.computed_care_instruction}
              </div>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Tags</h3>
              <div style={styles.tagsContainer}>
                {project.tags.map((tag, index) => (
                  <Tag key={index} label={tag} />
                ))}
              </div>
            </div>
          )}

          {/* Yarns Used */}
          {project.yarns_used && project.yarns_used.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Yarns Used</h3>
              <div style={styles.yarnsList}>
                {project.yarns_used.map((yarnUsage) => (
                  <div
                    key={yarnUsage.yarn_id}
                    style={styles.yarnItem}
                    onClick={() => handleYarnClick(yarnUsage.yarn_id)}
                  >
                    <div style={styles.yarnInfo}>
                      <strong style={styles.yarnName}>
                        {yarnUsage.brand_name} {yarnUsage.yarn_name}
                      </strong>
                      <div style={styles.yarnDetails}>
                        <span>Color: {yarnUsage.color_name}</span>
                        <span>•</span>
                        <span>Used: {yarnUsage.grams_used}g</span>
                      </div>
                    </div>
                    <span style={styles.clickableHint}>Click to view →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {project.video_urls && project.video_urls.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Videos</h3>
              <div style={styles.videosList}>
                {project.video_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    Video {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

const styles = {
  content: {
    padding: theme.spacing.md,
  },
  headerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    margin: 0,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.primary,
  },
  imageSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  image: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing['2xs'],
    fontFamily: theme.typography.fontFamily.primary,
  },
  description: {
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.primary,
  },
  notes: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.primary,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  detailItem: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: theme.spacing['2xs'],
    wordBreak: 'break-word',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  yarnsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing['2xs'],
  },
  yarnItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    transition: theme.transitions.normal,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yarnInfo: {
    flex: 1,
  },
  yarnName: {
    display: 'block',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.primary,
  },
  yarnDetails: {
    display: 'flex',
    gap: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.primary,
  },
  clickableHint: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontStyle: 'italic',
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
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  yarnSearchWrapper: {
    position: 'relative',
    flex: 1,
  },
  selectedYarnChip: {
    display: 'flex',
    alignItems: 'center',
    padding: `${theme.spacing.sm} 0.75rem`,
    backgroundColor: theme.colors.border,
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
    padding: `${theme.spacing.sm} 0.75rem`,
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
    position: 'relative',
    zIndex: 20,
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
  videosList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  link: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontFamily: theme.typography.fontFamily.primary,
  },
  deleteButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: theme.colors.error,
    color: theme.colors.surface,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  editButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    cursor: 'pointer',
    fontWeight: theme.typography.fontWeight.medium,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  editForm: {
    padding: `${theme.spacing.md} 0`,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
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
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
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
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
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
  multiselect: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing['2xs'],
    padding: theme.spacing['2xs'],
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceHover,
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.border}`,
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.primary,
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.primary,
  },
  error: {
    color: theme.colors.error,
    padding: theme.spacing['2xs'],
    backgroundColor: theme.colors.errorBackground,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
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
    transition: theme.transitions.borderColor,
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: '0.25rem',
    left: '0.25rem',
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    padding: '0.25rem 0.5rem',
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    zIndex: 2,
    pointerEvents: 'none',
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
    borderRadius: theme.borderRadius.circle,
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
  existingImages: {
    marginTop: theme.spacing.md,
  },
  helpText: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily.primary,
  },
};

export default ProjectDetailModal;
