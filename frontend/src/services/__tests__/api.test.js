/**
 * Tests for API service
 * 
 * These tests verify error handling, edge cases, and data transformation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import * as api from '../api'

// Mock axios
vi.mock('axios')

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getImageUrl', () => {
    it('should return null for empty path', () => {
      expect(api.getImageUrl(null)).toBeNull()
      expect(api.getImageUrl(undefined)).toBeNull()
      expect(api.getImageUrl('')).toBeNull()
    })

    it('should return full URL as-is for http URLs', () => {
      const url = 'http://example.com/image.jpg'
      expect(api.getImageUrl(url)).toBe(url)
    })

    it('should return full URL as-is for https URLs', () => {
      const url = 'https://example.com/image.jpg'
      expect(api.getImageUrl(url)).toBe(url)
    })

    it('should construct URL for /uploads/ paths', () => {
      const path = '/uploads/test.jpg'
      const result = api.getImageUrl(path)
      expect(result).toBe('http://localhost:8000/uploads/test.jpg')
    })

    it('should prepend /uploads/ for relative paths', () => {
      const path = 'test.jpg'
      const result = api.getImageUrl(path)
      expect(result).toBe('http://localhost:8000/uploads/test.jpg')
    })
  })

  describe('getYarn', () => {
    it('should return yarn data on success', async () => {
      const mockYarn = { id: 1, brand_name: 'Test Brand' }
      axios.get.mockResolvedValue({ data: mockYarn })

      const result = await api.getYarn(1)

      expect(axios.get).toHaveBeenCalledWith('/yarns/1')
      expect(result).toEqual(mockYarn)
    })

    it('should handle 404 errors', async () => {
      const error = {
        response: { status: 404, data: { detail: 'Not found' } }
      }
      axios.get.mockRejectedValue(error)

      await expect(api.getYarn(999)).rejects.toEqual(error)
    })

    it('should handle network errors', async () => {
      const error = new Error('Network Error')
      axios.get.mockRejectedValue(error)

      await expect(api.getYarn(1)).rejects.toThrow('Network Error')
    })
  })

  describe('createYarn', () => {
    it('should send POST request with yarn data', async () => {
      const yarnData = {
        brand_name: 'Test Brand',
        yarn_name: 'Test Yarn',
        color_name: 'Blue',
      }
      const mockResponse = { id: 1, ...yarnData }
      axios.post.mockResolvedValue({ data: mockResponse })

      const result = await api.createYarn(yarnData)

      expect(axios.post).toHaveBeenCalledWith('/yarns', yarnData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle validation errors', async () => {
      const error = {
        response: {
          status: 422,
          data: { detail: 'Validation error' }
        }
      }
      axios.post.mockRejectedValue(error)

      await expect(api.createYarn({})).rejects.toEqual(error)
    })
  })

  describe('addYarnByGrams', () => {
    it('should send POST request with correct data', async () => {
      const mockResponse = { yarn_id: 1, total_grams_owned: 100.0 }
      axios.post.mockResolvedValue({ data: mockResponse })

      const result = await api.addYarnByGrams(1, 100.0)

      expect(axios.post).toHaveBeenCalledWith('/stash/add/grams', {
        yarn_id: 1,
        grams: 100.0,
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle negative grams error', async () => {
      const error = {
        response: {
          status: 400,
          data: { detail: 'Grams must be positive' }
        }
      }
      axios.post.mockRejectedValue(error)

      await expect(api.addYarnByGrams(1, -10)).rejects.toEqual(error)
    })
  })

  describe('useYarn', () => {
    it('should handle insufficient stash error', async () => {
      const error = {
        response: {
          status: 400,
          data: { detail: 'Insufficient stash' }
        }
      }
      axios.post.mockRejectedValue(error)

      await expect(api.useYarn(1, 200)).rejects.toEqual(error)
    })
  })
})
