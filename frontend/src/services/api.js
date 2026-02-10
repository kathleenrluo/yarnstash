/**
 * API Client Service
 * 
 * Centralized service for making HTTP requests to the backend API.
 * All API calls go through this service to ensure consistency.
 */

import axios from 'axios';
import { getStoredToken } from '../context/AuthContext';

// Base URL for the backend API
// Use relative URL in production (when served from same domain), absolute in development
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to requests when user is logged in
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create axios instance for file uploads (multipart/form-data)
const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

uploadClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Extract a user-friendly error message from an axios error
 * 
 * Priority order:
 * 1. Specific backend errors (detail, message, error fields) - these are preserved
 * 2. HTTP status code messages (404, 500, etc.)
 * 3. Network/timeout errors
 * 4. Generic fallback: "Oops! Something went wrong"
 * 
 * Note: The original error.response is preserved, so components can still
 * access err.response?.data?.detail for specific validation errors.
 */
const getErrorMessage = (error) => {
  // Priority 1: Try to get specific error message from response data
  // This ensures validation errors like "Care instructions are required..." 
  // are used instead of generic messages
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Handle specific HTTP status codes
  if (error.response?.status === 404) {
    return 'Resource not found. The item may have been deleted.';
  }
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (error.response?.status === 401) {
    return 'Authentication required. Please try again.';
  }
  if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  }
  if (error.response?.status === 503) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  // Network errors (no response from server)
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Network error. Please check your connection and ensure the backend server is running.';
  }
  
  // Request timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // Generic fallback
  if (error.message) {
    return error.message;
  }
  
  // Ultimate fallback
  return 'Oops! Something went wrong. Please try again.';
};

// Add response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    
    // Create a new error with user-friendly message
    // IMPORTANT: We preserve error.response so components can still access
    // err.response?.data?.detail for specific validation errors
    const userFriendlyError = new Error(getErrorMessage(error));
    userFriendlyError.originalError = error;
    userFriendlyError.response = error.response; // Preserved for component access
    userFriendlyError.status = error.response?.status;
    
    return Promise.reject(userFriendlyError);
  }
);

// Add same interceptor to upload client
uploadClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('Upload Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    
    // Create a new error with user-friendly message
    // IMPORTANT: We preserve error.response so components can still access
    // err.response?.data?.detail for specific validation errors
    const userFriendlyError = new Error(getErrorMessage(error));
    userFriendlyError.originalError = error;
    userFriendlyError.response = error.response; // Preserved for component access
    userFriendlyError.status = error.response?.status;
    
    return Promise.reject(userFriendlyError);
  }
);

// ==================== Options API ====================

/**
 * Get all available care instruction options
 */
export const getCareInstructionOptions = async () => {
  const response = await apiClient.get('/options/care-instructions');
  return response.data;
};

/**
 * Get all available color options
 */
export const getColorOptions = async () => {
  const response = await apiClient.get('/options/colors');
  return response.data;
};

/**
 * Get all available yarn weight options
 */
export const getYarnWeightOptions = async () => {
  const response = await apiClient.get('/options/yarn-weights');
  return response.data;
};

/**
 * Get all available material options
 */
export const getMaterialOptions = async () => {
  const response = await apiClient.get('/options/materials');
  return response.data;
};

// ==================== Yarns API ====================

/**
 * Get a specific yarn by ID
 */
export const getYarn = async (yarnId) => {
  const response = await apiClient.get(`/yarns/${yarnId}`);
  return response.data;
};

/**
 * Create a new yarn
 */
export const createYarn = async (yarnData) => {
  try {
    const response = await apiClient.post('/yarns/', yarnData);
    return response.data;
  } catch (error) {
    // Log the full error for debugging
    console.error('Create yarn error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      requestData: yarnData,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    // Re-throw with more context if it's a 404
    if (error.response?.status === 404) {
      throw new Error('Backend server may not be running. Please check that the API is available at http://localhost:8000');
    }
    throw error;
  }
};

/**
 * Update a yarn
 */
export const updateYarn = async (yarnId, yarnData) => {
  const response = await apiClient.put(`/yarns/${yarnId}`, yarnData);
  return response.data;
};

/**
 * Delete a yarn
 */
export const deleteYarn = async (yarnId) => {
  await apiClient.delete(`/yarns/${yarnId}`);
};

/**
 * Search for brand names (autocomplete)
 */
export const searchBrands = async (searchTerm) => {
  const response = await apiClient.get('/yarns/search/brands', {
    params: { q: searchTerm },
  });
  return response.data.brands;
};

/**
 * Search for yarn names (autocomplete)
 */
export const searchYarnNames = async (searchTerm, brandName = null) => {
  const params = { q: searchTerm };
  if (brandName) {
    params.brand = brandName;
  }
  const response = await apiClient.get('/yarns/search/yarn-names', {
    params: params,
  });
  return response.data.brands || [];
};

/**
 * Search for color names (autocomplete)
 */
export const searchColorNames = async (searchTerm) => {
  const response = await apiClient.get('/yarns/search/color-names', {
    params: { q: searchTerm },
  });
  return response.data.brands;
};

/**
 * Search for material breakdowns (autocomplete)
 */
export const searchMaterials = async (searchTerm) => {
  const response = await apiClient.get('/yarns/search/materials', {
    params: { q: searchTerm },
  });
  return response.data.brands;
};

/**
 * Get yarn properties by brand and yarn name (for autocomplete)
 * Returns properties from an existing yarn (any color) to auto-fill form
 */
export const getYarnProperties = async (brandName, yarnName) => {
  try {
    const response = await apiClient.get('/yarns/properties', {
      params: { brand_name: brandName, yarn_name: yarnName },
    });
    return response.data;
  } catch (error) {
    // 404 is expected when yarn doesn't exist (for autocomplete)
    // Only log other errors
    if (error.response?.status !== 404) {
      console.error('Get yarn properties error:', {
        status: error.response?.status,
        data: error.response?.data,
        params: { brand_name: brandName, yarn_name: yarnName }
      });
    }
    throw error;
  }
};

// ==================== Stash API ====================

/**
 * Get all stash entries with yarn information
 */
export const getStash = async () => {
  const response = await apiClient.get('/stash/');
  return response.data;
};

/**
 * Get stash entry for a specific yarn
 */
export const getStashEntry = async (yarnId) => {
  const response = await apiClient.get(`/stash/${yarnId}`);
  return response.data;
};


/**
 * Add yarn to stash by grams
 */
export const addYarnByGrams = async (yarnId, grams) => {
  const response = await apiClient.post('/stash/add/grams', {
    yarn_id: yarnId,
    grams,
  });
  return response.data;
};

/**
 * Add yarn to stash by skeins
 */
export const addYarnBySkeins = async (yarnId, numSkeins) => {
  const response = await apiClient.post('/stash/add/skeins', {
    yarn_id: yarnId,
    num_skeins: numSkeins,
  });
  return response.data;
};

/**
 * Use yarn (deduct from stash)
 */
export const useYarn = async (yarnId, grams) => {
  const response = await apiClient.post('/stash/use', {
    yarn_id: yarnId,
    grams,
  });
  return response.data;
};

/**
 * Set stash quantity to a specific amount
 */
export const setStashQuantity = async (yarnId, grams) => {
  const response = await apiClient.put('/stash/set', {
    yarn_id: yarnId,
    grams,
  });
  return response.data;
};

// ==================== Showcase (Kat's Gallery) API — read-only, no auth ====================

export const getShowcaseStash = async () => {
  const response = await apiClient.get('/showcase/stash');
  return response.data;
};

export const getShowcaseStashEntry = async (yarnId) => {
  const response = await apiClient.get(`/showcase/stash/${yarnId}`);
  return response.data;
};

export const getShowcaseYarn = async (yarnId) => {
  const response = await apiClient.get(`/showcase/yarns/${yarnId}`);
  return response.data;
};

export const getShowcaseProjects = async (skip = 0, limit = 100) => {
  const response = await apiClient.get('/showcase/projects', {
    params: { skip, limit },
  });
  return response.data;
};

export const getShowcaseProjectDetails = async (projectId) => {
  const response = await apiClient.get(`/showcase/projects/${projectId}/details`);
  return response.data;
};

export const getShowcaseProjectsByYarnId = async (yarnId) => {
  const response = await apiClient.get('/showcase/projects/by-yarn-id', {
    params: { yarn_id: yarnId },
  });
  return response.data.projects || [];
};

export const getShowcaseProjectsByYarn = async (brandName, yarnName) => {
  const response = await apiClient.get('/showcase/projects/by-yarn', {
    params: { brand_name: brandName, yarn_name: yarnName },
  });
  return response.data.projects || [];
};

// ==================== Projects API ====================

/**
 * Get all projects with pagination
 */
export const getProjects = async (skip = 0, limit = 100) => {
  const response = await apiClient.get('/projects/', {
    params: { skip, limit },
  });
  return response.data;
};


/**
 * Get project with yarn details
 */
export const getProjectWithYarns = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/details`);
  return response.data;
};

/**
 * Get projects by yarn name (color insensitive)
 */
export const getProjectsByYarn = async (brandName, yarnName) => {
  const response = await apiClient.get('/projects/by-yarn', {
    params: { brand_name: brandName, yarn_name: yarnName }
  });
  return response.data.projects || [];
};

export const getProjectsByYarnId = async (yarnId) => {
  const response = await apiClient.get('/projects/by-yarn-id', {
    params: { yarn_id: yarnId }
  });
  return response.data.projects || [];
};

/**
 * Create a new project
 */
export const createProject = async (projectData) => {
  const response = await apiClient.post('/projects/', projectData);
  return response.data;
};

/**
 * Update a project
 */
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await apiClient.put(`/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    // Log the full error for debugging
    console.error('Update project error:', {
      status: error.response?.status,
      data: error.response?.data,
      requestData: projectData
    });
    throw error;
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId) => {
  await apiClient.delete(`/projects/${projectId}`);
};

/**
 * Add yarn usage to a project
 */
export const addYarnUsage = async (projectId, yarnId, gramsUsed, updateStash = true) => {
  const response = await apiClient.post(`/projects/${projectId}/use-yarn`, {
    yarn_id: yarnId,
    grams_used: gramsUsed,
    update_stash: updateStash,
  });
  return response.data;
};

/**
 * Remove yarn usage from a project
 */
export const removeYarnUsage = async (projectId, usageId) => {
  await apiClient.delete(`/projects/${projectId}/use-yarn/${usageId}`);
};

/**
 * Update yarn usage in a project
 */
export const updateYarnUsage = async (projectId, usageId, gramsUsed, updateStash = null) => {
  const data = {};
  if (gramsUsed !== null && gramsUsed !== undefined) {
    data.grams_used = gramsUsed;
  }
  if (updateStash !== null && updateStash !== undefined) {
    data.update_stash = updateStash;
  }
  const response = await apiClient.put(`/projects/${projectId}/use-yarn/${usageId}`, data);
  return response.data;
};


/**
 * Toggle favorite status for a yarn
 */
export const toggleYarnFavorite = async (yarnId, isFavorite) => {
  const response = await apiClient.put(`/yarns/${yarnId}`, {
    is_favorite: isFavorite,
  });
  return response.data;
};

/**
 * Toggle favorite status for a project
 */
export const toggleProjectFavorite = async (projectId, isFavorite) => {
  const response = await apiClient.put(`/projects/${projectId}`, {
    is_favorite: isFavorite,
  });
  return response.data;
};

// ==================== Upload API ====================

/**
 * Upload a single image file
 */
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await uploadClient.post('/upload/image', formData);
  return response.data;
};

/**
 * Upload multiple image files
 */
export const uploadImages = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  const response = await uploadClient.post('/upload/images', formData);
  return response.data;
};

/**
 * Get full URL for an uploaded image
 * Handles both local uploads (/uploads/...) and external URLs.
 * Converts stored localhost URLs to relative path when page is HTTPS (avoids mixed content).
 */
function extractUploadPath(fullUrl) {
  try {
    return new URL(fullUrl).pathname;
  } catch {
    const match = fullUrl.match(/\/uploads\/[^/\s]+/);
    return match ? match[0] : fullUrl;
  }
}

export const getImageUrl = (path) => {
  if (!path) return null;
  
  // If it's already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const isLocalhostUrl = path.includes('localhost') || path.includes('127.0.0.1') || path.includes('0.0.0.0');
    
    // Stored localhost URLs: in production OR when page is HTTPS, use relative path to avoid mixed content
    if (isLocalhostUrl && path.includes('/uploads/')) {
      const pathname = extractUploadPath(path);
      if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location?.protocol === 'https:')) {
        return pathname; // Same-origin request, no mixed content
      }
      return path; // Dev (HTTP page), keep full localhost URL so backend is used
    }
    
    // In production, downgrade other HTTP URLs that look like uploads to relative path
    if (import.meta.env.PROD && path.startsWith('http://')) {
      const match = path.match(/\/uploads\/[^/\s]+/);
      if (match) return match[0];
    }
    
    // Return HTTPS URLs as-is (external URLs)
    return path;
  }
  
  // If it starts with /uploads/, use as is (already relative)
  if (path.startsWith('/uploads/')) {
    // In development, convert relative paths to full localhost URLs
    if (import.meta.env.DEV) {
      return `http://localhost:8000${path}`;
    }
    return path;
  }
  
  // If it's just a filename (no slashes), prepend /uploads/
  if (!path.includes('/') && path.match(/\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)$/i)) {
    const fullPath = `/uploads/${path}`;
    // In development, convert to full localhost URL
    if (import.meta.env.DEV) {
      return `http://localhost:8000${fullPath}`;
    }
    return fullPath;
  }
  
  // Otherwise, assume it's a relative path and prepend /uploads/
  const fullPath = `/uploads/${path}`;
  // In development, convert to full localhost URL
  if (import.meta.env.DEV) {
    return `http://localhost:8000${fullPath}`;
  }
  return fullPath;
};

export default apiClient;
