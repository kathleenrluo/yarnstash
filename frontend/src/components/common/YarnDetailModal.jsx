/**
 * Yarn Detail Modal
 * 
 * Shows all yarn information and clickable links to projects that used it.
 */

import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { formatDateForDisplay } from '../../utils/dateParser';
import { parseMaterialBreakdown } from '../../utils/materialParser';
import { isDemoMode } from '../../config/demoMode';
import { 
  getYarn, 
  getProjectsByYarn, 
  getProjectsByYarnId,
  getShowcaseYarn,
  getShowcaseStashEntry,
  getShowcaseProjectsByYarnId,
  getShowcaseProjectsByYarn,
  getCareInstructionOptions, 
  getColorOptions,
  getYarnWeightOptions,
  getMaterialOptions,
  toggleYarnFavorite,
  updateYarn,
  deleteYarn,
  uploadImage,
  getImageUrl,
  getStashEntry,
  addYarnByGrams,
  addYarnBySkeins,
  useYarn,
  setStashQuantity as setStashQuantityAPI
} from '../../services/api';
import FavoriteButton from './FavoriteButton';
import Select from './Select';
import { theme } from '../../styles/theme';

const YarnDetailModal = ({ isOpen, onClose, yarnId, yarnData, onProjectClick, onFavoriteToggle, onUpdate, onDelete, readOnly = false }) => {
  const [yarn, setYarn] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsUsingThisColor, setProjectsUsingThisColor] = useState([]);
  const [careInstructionLabels, setCareInstructionLabels] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // Track field-specific errors
  const [stashQuantity, setStashQuantity] = useState(0);
  const [stashLoading, setStashLoading] = useState(false);
  
  // Stash management state
  const [stashActionType, setStashActionType] = useState('add'); // 'add' or 'subtract'
  const [stashUnit, setStashUnit] = useState('grams'); // 'grams' or 'skeins'
  const [stashAmount, setStashAmount] = useState('');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [colorOptions, setColorOptions] = useState([]);
  const [careOptions, setCareOptions] = useState([]);
  const [weightOptions, setWeightOptions] = useState({});
  const [materialOptions, setMaterialOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Material entry system (similar to AddYarnForm)
  const [materialEntries, setMaterialEntries] = useState([]); // Array of {material: '', percent: ''}
  const [materialSearchInputs, setMaterialSearchInputs] = useState([]); // Array of search input values
  const [materialSuggestions, setMaterialSuggestions] = useState([]); // Array of suggestion arrays
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState([]); // Array of booleans
  
  // File upload state for editing
  const [yarnPhotoFile, setYarnPhotoFile] = useState(null);
  const [yarnPhotoPreview, setYarnPhotoPreview] = useState(null);
  const [labelPhotoFile, setLabelPhotoFile] = useState(null);
  const [labelPhotoPreview, setLabelPhotoPreview] = useState(null);

  // Refs for file inputs so we can clear native values when removing
  const yarnPhotoInputRef = useRef(null);
  const labelPhotoInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && yarnId) {
      loadCareInstructions();
      loadEditOptions();
      loadYarnDetails();
    } else {
      setYarn(null);
      setProjects([]);
      setProjectsUsingThisColor([]);
      setError(null);
      setIsEditing(false);
      setStashQuantity(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, yarnId, yarnData]);


  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditing && yarn) {
      setEditFormData({
        brand_name: yarn.brand_name || '',
        yarn_name: yarn.yarn_name || '',
        color_name: yarn.color_name || '',
        yarn_weight: yarn.yarn_weight?.toString() || '',
        grams_per_skein: yarn.grams_per_skein?.toString() || '',
        meters_per_skein: yarn.meters_per_skein?.toString() || '',
        generalized_colors: yarn.generalized_colors || [],
        material_breakdown: yarn.material_breakdown || '',
        care_instruction_ids: yarn.care_instruction_ids || [],
        notes: yarn.notes || '',
        is_favorite: yarn.is_favorite || false,
        stash_quantity: stashQuantity.toString(),
      });
      
      if (yarn.material_breakdown && materialOptions.length > 0) {
        const { entries, searchInputs } = parseMaterialBreakdown(yarn.material_breakdown, materialOptions);
        setMaterialEntries(entries);
        setMaterialSearchInputs(searchInputs);
        setMaterialSuggestions(entries.map(() => []));
        setShowMaterialSuggestions(entries.map(() => false));
      } else {
        setMaterialEntries([]);
        setMaterialSearchInputs([]);
        setMaterialSuggestions([]);
        setShowMaterialSuggestions([]);
      }
      
      setYarnPhotoFile(null);
      setYarnPhotoPreview(null);
      setLabelPhotoFile(null);
      setLabelPhotoPreview(null);
    }
  }, [isEditing, yarn, stashQuantity, materialOptions]);

  const loadCareInstructions = async () => {
    try {
      const data = await getCareInstructionOptions();
      const labels = {};
      data.options.forEach(opt => {
        labels[opt.id] = opt.label;
      });
      setCareInstructionLabels(labels);
      setCareOptions(data.options);
    } catch (err) {
      console.error('Error loading care instructions:', err);
    }
  };

  const loadEditOptions = async () => {
    try {
      const [colors, care, weights, materials] = await Promise.all([
        getColorOptions(),
        getCareInstructionOptions(),
        getYarnWeightOptions(),
        getMaterialOptions(),
      ]);
      setColorOptions(colors.options);
      setCareOptions(care.options);
      setMaterialOptions(materials.options);
      const weightLabels = {};
      weights.options.forEach(opt => {
        weightLabels[opt.id] = opt.label;
      });
      setWeightOptions(weightLabels);
      
      if (isEditing && yarn && yarn.material_breakdown && materials.options.length > 0) {
        const { entries, searchInputs } = parseMaterialBreakdown(yarn.material_breakdown, materials.options);
        setMaterialEntries(entries);
        setMaterialSearchInputs(searchInputs);
        setMaterialSuggestions(entries.map(() => []));
        setShowMaterialSuggestions(entries.map(() => false));
      }
    } catch (err) {
      console.error('Error loading edit options:', err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!yarn) return;
    
    const currentFavorite = yarn.is_favorite;
    const newFavorite = !currentFavorite;
    
    // Optimistic update
    setYarn({ ...yarn, is_favorite: newFavorite });
    
    // Notify parent if callback provided
    if (onFavoriteToggle) {
      onFavoriteToggle(yarn.id, newFavorite);
    }
    
    // Update in the background
    try {
      await toggleYarnFavorite(yarn.id, newFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      setYarn({ ...yarn, is_favorite: currentFavorite });
      if (onFavoriteToggle) {
        onFavoriteToggle(yarn.id, currentFavorite);
      }
    }
  };

  const loadStashQuantity = async () => {
    if (!yarnId) return;
    
    try {
      setStashLoading(true);
      const stashEntry = await (readOnly ? getShowcaseStashEntry(yarnId) : getStashEntry(yarnId));
      setStashQuantity(stashEntry?.total_grams_owned || 0);
    } catch (err) {
      // If stash entry doesn't exist (404), set to 0
      if (err.response?.status === 404) {
        setStashQuantity(0);
      } else {
        console.error('Error loading stash quantity:', err);
        setStashQuantity(0);
      }
    } finally {
      setStashLoading(false);
    }
  };

  const loadYarnDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always fetch fresh data (like ProjectDetailModal does)
      let yarnToUse = null;
      if (yarnId) {
        const data = await (readOnly ? getShowcaseYarn(yarnId) : getYarn(yarnId));
        setYarn(data);
        yarnToUse = data;
      } else if (yarnData) {
        // Only use yarnData prop if no yarnId (shouldn't happen, but fallback)
        setYarn(yarnData);
        yarnToUse = yarnData;
      }

      // Update material entries if we have material_breakdown and options are loaded
      if (yarnToUse && yarnToUse.material_breakdown && materialOptions.length > 0) {
        const { entries, searchInputs } = parseMaterialBreakdown(yarnToUse.material_breakdown, materialOptions);
        setMaterialEntries(entries);
        setMaterialSearchInputs(searchInputs);
        setMaterialSuggestions(entries.map(() => []));
        setShowMaterialSuggestions(entries.map(() => false));
      } else if (yarnToUse && !yarnToUse.material_breakdown) {
        setMaterialEntries([]);
        setMaterialSearchInputs([]);
        setMaterialSuggestions([]);
        setShowMaterialSuggestions([]);
      }

      // Always load stash quantity separately (yarnData doesn't include stash info)
      if (yarnId) {
        await loadStashQuantity();
      }

      // Load projects that use this yarn (by brand and yarn name, color insensitive)
      if (yarnToUse && yarnToUse.brand_name && yarnToUse.yarn_name) {
        try {
          const projectData = readOnly
            ? await getShowcaseProjectsByYarn(yarnToUse.brand_name, yarnToUse.yarn_name)
            : await getProjectsByYarn(yarnToUse.brand_name, yarnToUse.yarn_name);
          setProjects(projectData || []);
        } catch (err) {
          // If no projects found or error, just set empty array
          console.warn('No projects found using this yarn:', err);
          setProjects([]);
        }
      } else {
        setProjects([]);
      }

      // Load projects that use THIS exact yarn_id (color-specific) for deletion safety
      if (yarnToUse && yarnToUse.id) {
        try {
          const exactProjects = readOnly
            ? await getShowcaseProjectsByYarnId(yarnToUse.id)
            : await getProjectsByYarnId(yarnToUse.id);
          setProjectsUsingThisColor(exactProjects || []);
        } catch (err) {
          // If this fails, fail closed for delete by treating as "unknown"
          console.warn('Could not load color-specific project usage for yarn:', err);
          setProjectsUsingThisColor(null);
        }
      } else {
        setProjectsUsingThisColor([]);
      }
    } catch (err) {
      setError('Failed to load yarn details.');
      console.error('Error loading yarn details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId) => {
    // Close this modal first, then trigger navigation
    onClose();
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      if (onProjectClick) {
        onProjectClick(projectId);
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
    setError(null); // Clear errors when canceling
    setFieldErrors({}); // Clear field errors
  };

  const handleDelete = async () => {
    if (!yarn) return;

    // Block deletion if THIS specific yarn_id is used in any projects.
    // We rely on a color-specific query for UX, and the backend also enforces this invariant.
    if (Array.isArray(projectsUsingThisColor) && projectsUsingThisColor.length > 0) {
      setError(
        `Cannot delete yarn: This specific color is used in ${projectsUsingThisColor.length} project(s). ` +
        `Please remove it from those projects before deleting.`
      );
      return;
    }

    // If we couldn't load the color-specific usage list (null), do a quick check before proceeding.
    if (projectsUsingThisColor === null) {
      try {
        const exactProjects = await getProjectsByYarnId(yarn.id);
        if (exactProjects && exactProjects.length > 0) {
          setProjectsUsingThisColor(exactProjects);
          setError(
            `Cannot delete yarn: This specific color is used in ${exactProjects.length} project(s). ` +
            `Please remove it from those projects before deleting.`
          );
          return;
        }
      } catch (err) {
        // If we can't verify, let the backend be the final authority
        console.warn('Could not verify color-specific project usage for deletion:', err);
      }
    }

    const displayName = `${yarn.brand_name} ${yarn.yarn_name}${yarn.color_name ? ` - ${yarn.color_name}` : ''}`;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${displayName}"?\n\n` +
      `This will permanently delete this yarn entry and its stash entry. This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await deleteYarn(yarn.id);
      // Close modal and notify parent to refresh
      onClose();
      if (onDelete) {
        onDelete(yarn.id);
      }
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete yarn');
      console.error('Error deleting yarn:', err);
    }
  };

  const handleYarnPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setYarnPhotoFile(file);
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
    // Set to null so it will be removed on save
    setEditFormData({ ...editFormData, yarn_photo_url: null });
    // Clear native input so re-selecting same file works
    if (yarnPhotoInputRef.current) {
      yarnPhotoInputRef.current.value = '';
    }
  };

  const handleRemoveLabelPhoto = () => {
    setLabelPhotoFile(null);
    setLabelPhotoPreview(null);
    // Set to null so it will be removed on save
    setEditFormData({ ...editFormData, label_photo_url: null });
    // Clear native input so re-selecting same file works
    if (labelPhotoInputRef.current) {
      labelPhotoInputRef.current.value = '';
    }
  };

  // Material entry handlers (similar to AddYarnForm)
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
          const optValue = opt.value.toLowerCase();
          return label.includes(searchLower) || optValue.includes(searchLower);
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

  const toggleColor = (colorValue) => {
    const colors = editFormData.generalized_colors || [];
    if (colors.includes(colorValue)) {
      setEditFormData({
        ...editFormData,
        generalized_colors: colors.filter(c => c !== colorValue),
      });
    } else {
      setEditFormData({
        ...editFormData,
        generalized_colors: [...colors, colorValue],
      });
    }
    // Clear error when user selects a color
    if (fieldErrors.generalized_colors) {
      setFieldErrors({ ...fieldErrors, generalized_colors: null });
      if (error && error.includes('color')) {
        setError(null);
      }
    }
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

  const handleStashAction = async () => {
    if (!yarn || !yarnId) return;
    if (!stashAmount || parseFloat(stashAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setError(null);
      let newQuantity = stashQuantity;

      if (stashActionType === 'add') {
        if (stashUnit === 'skeins') {
          const numSkeins = parseInt(stashAmount);
          if (isNaN(numSkeins) || numSkeins <= 0) {
            setError('Please enter a valid number of skeins');
            return;
          }
          await addYarnBySkeins(yarnId, numSkeins);
          newQuantity = stashQuantity + (numSkeins * yarn.grams_per_skein);
        } else {
          const grams = parseFloat(stashAmount);
          if (isNaN(grams) || grams <= 0) {
            setError('Please enter a valid amount in grams');
            return;
          }
          await addYarnByGrams(yarnId, grams);
          newQuantity = stashQuantity + grams;
        }
      } else {
        // subtract
        const grams = stashUnit === 'skeins' 
          ? parseInt(stashAmount) * yarn.grams_per_skein
          : parseFloat(stashAmount);
        
        if (isNaN(grams) || grams <= 0) {
          setError('Please enter a valid amount');
          return;
        }
        
        if (grams > stashQuantity) {
          setError(`Cannot subtract ${grams}g - only ${stashQuantity}g available`);
          return;
        }
        
        await useYarn(yarnId, grams);
        newQuantity = stashQuantity - grams;
      }

      setStashQuantity(newQuantity);
      setStashAmount('');
      
      // Notify parent to refresh
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update stash');
      console.error('Error updating stash:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!yarn) return;
    
    setSaving(true);
    setError(null);
    setFieldErrors({});
    
    try {
      // Validate that at least one color is selected
      if (!editFormData.generalized_colors || editFormData.generalized_colors.length === 0) {
        setError('Please select at least one color');
        setFieldErrors({ generalized_colors: 'Please select at least one color' });
        setSaving(false);
        return;
      }

      // Validate material percentages if materials are provided
      if (materialEntries.some(entry => entry.material && entry.percent)) {
        const validation = validateMaterialPercentages();
        if (!validation.isValid) {
          setError(validation.error);
          setFieldErrors({ material_breakdown: validation.error });
          setSaving(false);
          return;
        }
      }

      // Upload images if files are selected
      let yarnPhotoUrl = yarn.yarn_photo_url; // Keep existing if no new file
      let labelPhotoUrl = yarn.label_photo_url; // Keep existing if no new file

      // If a new file is selected, it always takes precedence over the "removed" flag.
      // Only apply the explicit null (remove) when there is no replacement file.
      if (yarnPhotoFile) {
        const uploadResult = await uploadImage(yarnPhotoFile);
        yarnPhotoUrl = getImageUrl(uploadResult.url);
      } else if (editFormData.yarn_photo_url === null) {
        yarnPhotoUrl = null;
      }

      if (labelPhotoFile) {
        const uploadResult = await uploadImage(labelPhotoFile);
        labelPhotoUrl = getImageUrl(uploadResult.url);
      } else if (editFormData.label_photo_url === null) {
        labelPhotoUrl = null;
      }

      // Extract stash_quantity before creating updateData (it's not a yarn property)
      const stashQuantityToSet = editFormData.stash_quantity;
      
      // Build material_breakdown from entries
      const materialBreakdown = buildMaterialBreakdown();

      // Determine how photo fields should be sent:
      // - If a new file is selected, send the new URL
      // - Else if explicitly removed (null flag) and no new file, send null
      // - Otherwise, omit the field (no change)
      const hasNewYarnPhoto = !!yarnPhotoFile;
      const removedYarnPhoto = !hasNewYarnPhoto && editFormData.yarn_photo_url === null;
      const hasNewLabelPhoto = !!labelPhotoFile;
      const removedLabelPhoto = !hasNewLabelPhoto && editFormData.label_photo_url === null;

      const yarnPhotoUpdate =
        hasNewYarnPhoto ? yarnPhotoUrl :
        removedYarnPhoto ? null :
        undefined;

      const labelPhotoUpdate =
        hasNewLabelPhoto ? labelPhotoUrl :
        removedLabelPhoto ? null :
        undefined;
      
      const updateData = {
        ...editFormData,
        yarn_weight: editFormData.yarn_weight ? parseInt(editFormData.yarn_weight) : undefined,
        grams_per_skein: editFormData.grams_per_skein ? parseFloat(editFormData.grams_per_skein) : undefined,
        meters_per_skein: editFormData.meters_per_skein ? parseFloat(editFormData.meters_per_skein) : undefined,
        care_instruction_ids: editFormData.care_instruction_ids || [],
        material_breakdown: materialBreakdown ? materialBreakdown : null,
        // Photo updates computed above
        yarn_photo_url: yarnPhotoUpdate,
        label_photo_url: labelPhotoUpdate,
      };
      
      // Remove stash_quantity and undefined/empty values (but keep null for photo URLs to clear them)
      delete updateData.stash_quantity;
      Object.keys(updateData).forEach(key => {
        if (key === 'yarn_photo_url' || key === 'label_photo_url') {
          // Keep null values (to clear photos), remove undefined (no change)
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        } else if (updateData[key] === undefined || (key !== 'care_instruction_ids' && key !== 'generalized_colors' && updateData[key] === '')) {
          delete updateData[key];
        }
      });
      
      const updatedYarn = await updateYarn(yarn.id, updateData);
      
      // Update stash quantity if it was provided in edit form
      // Check if stash_quantity exists in editFormData (user has interacted with the field)
      if ('stash_quantity' in editFormData) {
        let newQuantity = 0;
        if (stashQuantityToSet !== '' && stashQuantityToSet !== null && stashQuantityToSet !== undefined) {
          newQuantity = parseFloat(stashQuantityToSet);
          if (isNaN(newQuantity)) {
            setError('Invalid stash quantity value');
            setSaving(false);
            return;
          }
          if (newQuantity < 0) {
            setError('Stash quantity cannot be negative');
            setSaving(false);
            return;
          }
        }
        // Update stash quantity (including setting to 0)
        // This will create a stash entry if it doesn't exist
        try {
          const response = await setStashQuantityAPI(yarn.id, newQuantity);
          
          // Handle response - the API should return a StashEntryResponse with total_grams_owned
          if (response && typeof response === 'object') {
            const quantity = response.total_grams_owned ?? response.total_grams ?? response.grams ?? newQuantity;
            setStashQuantity(quantity);
          } else {
            // If no response, reload the stash quantity from the server to get the actual value
            try {
              const stashEntry = await getStashEntry(yarn.id);
              if (stashEntry && stashEntry.total_grams_owned !== undefined) {
                setStashQuantity(stashEntry.total_grams_owned);
              } else {
                setStashQuantity(newQuantity);
              }
            } catch (reloadErr) {
              setStashQuantity(newQuantity);
            }
          }
        } catch (err) {
          const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error';
          setError('Failed to update stash quantity: ' + errorMsg);
          setSaving(false);
          return;
        }
      }
      
      setYarn(updatedYarn);
      setIsEditing(false);
      
      // Reload yarn details to get fresh data
      // Note: loadStashQuantity will handle 404 gracefully if stash entry doesn't exist yet
      await loadYarnDetails();
      
      // Notify parent to refresh the list
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      // Extract error message from response
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to update yarn';
      setError(errorMessage);
      
      // Parse error to identify which field has the issue
      const newFieldErrors = {};
      const errorLower = errorMessage.toLowerCase();
      
      if (errorLower.includes('material')) {
        newFieldErrors.material_breakdown = errorMessage;
      }
      if (errorLower.includes('duplicate') || errorLower.includes('already exists')) {
        // For duplicate errors, highlight brand, yarn name, and color fields
        newFieldErrors.brand_name = errorMessage;
        newFieldErrors.yarn_name = errorMessage;
        newFieldErrors.color_name = errorMessage;
      }
      
      setFieldErrors(newFieldErrors);
      
      console.error('Error updating yarn:', {
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

  // Prepare header actions for the modal (none when read-only/gallery)
  const headerActions = yarn && !isEditing && !readOnly ? (
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
          isFavorite={yarn.is_favorite}
          onClick={handleToggleFavorite}
        />
      </div>
    </>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={yarn ? `${yarn.brand_name} ${yarn.yarn_name}${yarn.color_name ? ` - ${yarn.color_name}` : ''}` : 'Yarn Details'}
      headerActions={headerActions}
    >
      {loading && <p>Loading...</p>}
      {error && !isEditing && <p style={{ color: theme.colors.error }}>{error}</p>}
      {yarn && (
        <div style={styles.content}>

          {isEditing ? (
            /* Edit Form */
            <div style={styles.editForm}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Brand Name *</label>
                  <input
                    type="text"
                    value={editFormData.brand_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, brand_name: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Yarn Name *</label>
                  <input
                    type="text"
                    value={editFormData.yarn_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, yarn_name: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Color Name *</label>
                  <input
                    type="text"
                    value={editFormData.color_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, color_name: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Yarn Weight *</label>
                  <Select
                    value={editFormData.yarn_weight || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, yarn_weight: e.target.value })}
                    options={Object.entries(weightOptions).map(([id, label]) => ({ value: id, label }))}
                    placeholder="Select weight..."
                    size="large"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Grams per Skein *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editFormData.grams_per_skein || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, grams_per_skein: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Meters per Skein *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editFormData.meters_per_skein || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, meters_per_skein: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Generalized Colors (select multiple) *
                  {fieldErrors.generalized_colors && <span style={{ color: theme.colors.error, marginLeft: '0.5rem' }}>*</span>}
                </label>
                <div style={styles.multiselect}>
                  {colorOptions.map((opt) => (
                    <label key={opt.value} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={(editFormData.generalized_colors || []).includes(opt.value)}
                        onChange={() => toggleColor(opt.value)}
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
                {materialEntries.length > 0 && (() => {
                  const validEntries = materialEntries.filter(entry => entry.material && entry.percent);
                  const total = validEntries.reduce((sum, entry) => {
                    const percent = parseFloat(entry.percent);
                    return sum + (isNaN(percent) ? 0 : percent);
                  }, 0);
                  return (
                    <p style={{
                      ...styles.helpText,
                      color: Math.abs(total - 100) < 0.01 ? theme.colors.textSecondary : theme.colors.error,
                      fontWeight: Math.abs(total - 100) < 0.01 ? 'normal' : theme.typography.fontWeight.medium
                    }}>
                      Total: {total.toFixed(1)}% {Math.abs(total - 100) < 0.01 ? '✓' : '(must equal 100%)'}
                    </p>
                  );
                })()}
                {fieldErrors.material_breakdown && (
                  <p style={{ color: theme.colors.error, fontSize: theme.typography.fontSize.sm, marginTop: theme.spacing.xs, marginBottom: 0 }}>
                    {fieldErrors.material_breakdown}
                  </p>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Care Instructions (select multiple)</label>
                <div style={styles.multiselect}>
                  {careOptions.map(option => (
                    <label key={option.id} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={(editFormData.care_instruction_ids || []).includes(option.id)}
                        onChange={(e) => {
                          const ids = editFormData.care_instruction_ids || [];
                          if (e.target.checked) {
                            setEditFormData({ ...editFormData, care_instruction_ids: [...ids, option.id] });
                          } else {
                            setEditFormData({ ...editFormData, care_instruction_ids: ids.filter(id => id !== option.id) });
                          }
                        }}
                        style={styles.checkbox}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

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
                {yarn && yarn.yarn_photo_url && !yarnPhotoPreview && editFormData.yarn_photo_url !== null && (
                  <div style={styles.imagePreview}>
                    <p style={styles.helpText}>Current photo:</p>
                    <div style={styles.imagePreviewWrapper}>
                      <img src={getImageUrl(yarn.yarn_photo_url)} alt="Current yarn photo" style={styles.previewImage} />
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
                {yarn && yarn.label_photo_url && !labelPhotoPreview && editFormData.label_photo_url !== null && (
                  <div style={styles.imagePreview}>
                    <p style={styles.helpText}>Current photo:</p>
                    <div style={styles.imagePreviewWrapper}>
                      <img src={getImageUrl(yarn.label_photo_url)} alt="Current label photo" style={styles.previewImage} />
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

              <div style={styles.formGroup}>
                <label style={styles.label}>Stash Quantity (grams)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editFormData.stash_quantity || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, stash_quantity: e.target.value })}
                  style={styles.input}
                  placeholder="Total grams in stash"
                />
                <p style={styles.helpText}>
                  Current: {stashQuantity}g
                </p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                  rows="4"
                  placeholder="Any additional notes about this yarn..."
                />
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

          {/* Image */}
          {yarn.yarn_photo_url && (
            <div style={styles.imageSection}>
              <img
                src={getImageUrl(yarn.yarn_photo_url)}
                alt={`${yarn.brand_name} ${yarn.yarn_name}`}
                style={styles.image}
              />
            </div>
          )}

          {/* Basic Info */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Specifications</h3>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <strong>Weight:</strong> {yarn.yarn_weight !== undefined ? (weightOptions[yarn.yarn_weight] || `Weight ${yarn.yarn_weight}`) : 'N/A'}
              </div>
              <div style={styles.detailItem}>
                <strong>Grams per Skein:</strong> {yarn.grams_per_skein}g
              </div>
              <div style={styles.detailItem}>
                <strong>Meters per Skein:</strong> {yarn.meters_per_skein}m
              </div>
              {yarn.material_breakdown && (
                <div style={styles.detailItem}>
                  <strong>Material:</strong> {yarn.material_breakdown}
                </div>
              )}
              {yarn.generalized_colors && yarn.generalized_colors.length > 0 && (
                <div style={styles.detailItem}>
                  <strong>Colors:</strong> {yarn.generalized_colors.join(', ')}
                </div>
              )}
              {yarn.care_instruction_ids && yarn.care_instruction_ids.length > 0 && (
                <div style={styles.detailItem}>
                  <strong>Care Instructions:</strong>{' '}
                  {yarn.care_instruction_ids
                    .map(id => careInstructionLabels[id] || `ID ${id}`)
                    .join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Stash: quantity only when read-only, full add/subtract when not */}
          <div style={styles.section}>
            <div style={styles.stashInfo}>
              <div style={styles.stashQuantity}>
                <strong>Current Quantity:</strong> {stashLoading ? 'Loading...' : `${stashQuantity.toFixed(1)}g`}
              </div>
              {!readOnly && (
                <div style={styles.stashManagement}>
                  <div style={styles.stashControls}>
                    <Select
                      value={stashActionType}
                      onChange={(e) => setStashActionType(e.target.value)}
                      options={[
                        { value: 'add', label: 'Add' },
                        { value: 'subtract', label: 'Subtract' },
                      ]}
                      style={{ width: '100px' }}
                    />
                    <input
                      type="number"
                      step={stashUnit === 'skeins' ? '1' : '0.1'}
                      min="0"
                      value={stashAmount}
                      onChange={(e) => setStashAmount(e.target.value)}
                      placeholder="Amount"
                      style={styles.stashInput}
                    />
                    <Select
                      value={stashUnit}
                      onChange={(e) => setStashUnit(e.target.value)}
                      options={[
                        { value: 'grams', label: 'Grams' },
                        { value: 'skeins', label: 'Skeins' },
                      ]}
                      style={{ width: '100px' }}
                    />
                    <button
                      onClick={handleStashAction}
                      style={styles.stashButton}
                      disabled={!stashAmount || parseFloat(stashAmount) <= 0}
                    >
                      {stashActionType === 'add' ? '+' : '-'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {yarn.notes && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Notes</h3>
              <p style={styles.notesText}>{yarn.notes}</p>
            </div>
          )}

          {/* Label Photo */}
          {yarn.label_photo_url && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Label</h3>
              <img
                src={getImageUrl(yarn.label_photo_url)}
                alt="Yarn label"
                style={styles.labelImage}
              />
            </div>
          )}

          {/* Projects Using This Yarn */}
          {projects.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                Projects Using This Yarn ({projects.length})
              </h3>
              <div style={styles.projectsList}>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    style={styles.projectItem}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div style={styles.projectInfo}>
                      <strong style={styles.projectName}>{project.name}</strong>
                      <div style={styles.projectDetails}>
                        {project.craft_type && <span>{project.craft_type}</span>}
                        <span>•</span>
                        <span>{formatDateForDisplay(project.date_completed)}</span>
                      </div>
                      {project.description && (
                        <p style={styles.projectDescription}>{project.description}</p>
                      )}
                      {project.tags && project.tags.length > 0 && (
                        <div style={styles.projectTags}>
                          {project.tags.map((tag, index) => (
                            <span key={index} style={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span style={styles.clickableHint}>Click to view →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && !loading && (
            <div style={styles.section}>
              <p style={styles.noProjects}>No projects found using this yarn.</p>
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
    padding: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  title: {
    margin: 0,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.primary,
  },
  subtitle: {
    margin: `${theme.spacing.xs} 0`,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.primary,
  },
  colorName: {
    margin: 0,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  imageSection: {
    marginBottom: theme.spacing.lg,
  },
  image: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  labelImage: {
    width: '100%',
    maxHeight: '400px',
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
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing.md,
  },
  detailItem: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.primary,
  },
  projectsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing['2xs'],
  },
  projectItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    transition: theme.transitions.normal,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    display: 'block',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.primary,
  },
  projectDetails: {
    display: 'flex',
    gap: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily.primary,
  },
  completed: {
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.primary,
  },
  projectDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    margin: `${theme.spacing.sm} 0`,
    lineHeight: theme.typography.lineHeight.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  projectTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  tag: {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  clickableHint: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily.primary,
  },
  noProjects: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily.primary,
  },
  headerActions: {
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'center',
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
    fontSize: theme.typography.fontSize.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
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
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.border}`,
  },
  cancelButton: {
    padding: `${theme.spacing['2xs']} ${theme.spacing.lg}`,
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
    padding: `${theme.spacing['2xs']} ${theme.spacing.lg}`,
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
  notesText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.relaxed,
    whiteSpace: 'pre-wrap',
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
  helpText: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
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
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
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
  stashInfo: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  stashQuantity: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing['2xs'],
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.primary,
  },
  stashManagement: {
    marginTop: theme.spacing.sm,
  },
  stashControls: {
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stashSelect: {
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    cursor: 'pointer',
    fontFamily: theme.typography.fontFamily.primary,
  },
  stashInput: {
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    width: '100px',
    fontFamily: theme.typography.fontFamily.primary,
  },
  stashButton: {
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
    minWidth: '44px',
    width: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiselect: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing['2xs'],
    padding: theme.spacing['2xs'],
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceHover || theme.colors.background,
  },
};

export default YarnDetailModal;
