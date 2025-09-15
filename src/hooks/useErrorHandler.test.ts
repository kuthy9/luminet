import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useErrorHandler, useErrorRecovery } from './useErrorHandler'
import { AppError, ErrorType, ErrorSeverity } from '@/lib/errorHandler'
import { toast } from '@/components/ui/use-toast'

// Mock dependencies
vi.mock('@/lib/errorHandler', async () => {
  const actual = await vi.importActual('@/lib/errorHandler')
  return {
    ...actual,
    globalErrorHandler: {
      handleError: vi.fn(),
    },
  }
})

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}))

describe('useErrorHandler', () => {
  const mockToast = vi.mocked(toast)
  let mockGlobalErrorHandler: any

  beforeEach(() => {
    vi.clearAllMocks()
    const { globalErrorHandler } = require('@/lib/errorHandler')
    mockGlobalErrorHandler = globalErrorHandler
  })

  describe('handleError', () => {
    it('calls global error handler with error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const testError = new Error('Test error')

      result.current.handleError(testError)

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        { showToast: true }
      )
    })

    it('respects showToast parameter', () => {
      const { result } = renderHook(() => useErrorHandler())
      const testError = new Error('Test error')

      result.current.handleError(testError, false)

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        { showToast: false }
      )
    })
  })

  describe('specific error handlers', () => {
    it('handles network error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const context = { url: 'https://api.example.com' }

      result.current.handleNetworkError('Connection failed', context)

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalled()
    })

    it('handles auth error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const context = { token: 'invalid' }

      result.current.handleAuthError('Authentication failed', context)

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalled()
    })

    it('handles validation error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const context = { field: 'email' }

      result.current.handleValidationError('Invalid email', context)

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalled()
    })

    it('handles permission error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const context = { resource: 'admin' }

      result.current.handlePermissionError('Access denied', context)

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalled()
    })
  })

  describe('withErrorHandling', () => {
    it('executes async function successfully', async () => {
      const { result } = renderHook(() => useErrorHandler())
      const mockAsyncFn = vi.fn().mockResolvedValue('success')

      const wrappedFn = result.current.withErrorHandling(mockAsyncFn)
      const response = await wrappedFn()

      expect(response).toBe('success')
      expect(mockAsyncFn).toHaveBeenCalledTimes(1)
      expect(mockGlobalErrorHandler.handleError).not.toHaveBeenCalled()
    })

    it('handles async function errors', async () => {
      const { result } = renderHook(() => useErrorHandler())
      const testError = new Error('Async error')
      const mockAsyncFn = vi.fn().mockRejectedValue(testError)

      const wrappedFn = result.current.withErrorHandling(mockAsyncFn)
      const response = await wrappedFn()

      expect(response).toBeNull()
      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(testError, true)
    })

    it('calls custom error handler when provided', async () => {
      const { result } = renderHook(() => useErrorHandler())
      const testError = new Error('Async error')
      const mockAsyncFn = vi.fn().mockRejectedValue(testError)
      const customErrorHandler = vi.fn()

      const wrappedFn = result.current.withErrorHandling(mockAsyncFn, {
        onError: customErrorHandler,
        showToast: false,
      })
      await wrappedFn()

      expect(customErrorHandler).toHaveBeenCalledWith(testError)
      expect(mockGlobalErrorHandler.handleError).not.toHaveBeenCalled()
    })
  })

  describe('handleSupabaseError', () => {
    it('handles JWT authentication error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const supabaseError = {
        code: 'PGRST301',
        message: 'JWT expired',
      }

      result.current.handleSupabaseError(supabaseError, 'fetch user data')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication expired. Please sign in again.',
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          code: 'PGRST301',
        })
      )
    })

    it('handles permission error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const supabaseError = {
        code: 'PGRST116',
        message: 'Permission denied',
      }

      result.current.handleSupabaseError(supabaseError, 'update profile')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You don\'t have permission to perform this action.',
          type: ErrorType.PERMISSION,
          severity: ErrorSeverity.MEDIUM,
        })
      )
    })

    it('handles constraint violation', () => {
      const { result } = renderHook(() => useErrorHandler())
      const supabaseError = {
        code: '23505',
        message: 'Unique constraint violation',
      }

      result.current.handleSupabaseError(supabaseError, 'create user')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid data provided. Please check your input.',
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.LOW,
        })
      )
    })

    it('handles network error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const supabaseError = {
        message: 'network error occurred',
      }

      result.current.handleSupabaseError(supabaseError, 'sync data')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Network error. Please check your connection.',
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.MEDIUM,
        })
      )
    })

    it('handles unknown error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const supabaseError = {
        code: 'UNKNOWN_CODE',
        message: 'Unknown database error',
      }

      result.current.handleSupabaseError(supabaseError, 'database operation')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unknown database error',
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          context: {
            operation: 'database operation',
            originalError: supabaseError,
          },
        })
      )
    })
  })

  describe('handleFormErrors', () => {
    it('processes form validation errors', () => {
      const { result } = renderHook(() => useErrorHandler())
      const formErrors = {
        email: { message: 'Invalid email format' },
        password: { message: 'Password too short' },
        age: 'Must be a number',
      }

      result.current.handleFormErrors(formErrors)

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed: email: Invalid email format, password: Password too short, age: Must be a number',
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.LOW,
          code: 'FORM_VALIDATION',
          context: { errors: formErrors },
        })
      )
    })
  })

  describe('handleApiError', () => {
    it('handles 401 unauthorized', () => {
      const { result } = renderHook(() => useErrorHandler())
      const apiError = { status: 401, message: 'Unauthorized' }

      result.current.handleApiError(apiError, '/api/users')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
        })
      )
    })

    it('handles 403 forbidden', () => {
      const { result } = renderHook(() => useErrorHandler())
      const apiError = { status: 403, message: 'Forbidden' }

      result.current.handleApiError(apiError, '/api/admin')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access forbidden',
          type: ErrorType.PERMISSION,
          severity: ErrorSeverity.MEDIUM,
        })
      )
    })

    it('handles 404 not found', () => {
      const { result } = renderHook(() => useErrorHandler())
      const apiError = { status: 404, message: 'Not found' }

      result.current.handleApiError(apiError, '/api/posts/123')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Resource not found',
          type: ErrorType.NOT_FOUND,
          severity: ErrorSeverity.LOW,
        })
      )
    })

    it('handles 500 server error', () => {
      const { result } = renderHook(() => useErrorHandler())
      const apiError = { status: 500, message: 'Internal server error' }

      result.current.handleApiError(apiError, '/api/data')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Server error occurred',
          type: ErrorType.SERVER,
          severity: ErrorSeverity.HIGH,
        })
      )
    })

    it('handles client errors (4xx)', () => {
      const { result } = renderHook(() => useErrorHandler())
      const apiError = { status: 422, message: 'Validation failed' }

      result.current.handleApiError(apiError, '/api/validate')

      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid request',
          type: ErrorType.CLIENT,
          severity: ErrorSeverity.MEDIUM,
        })
      )
    })
  })

  describe('success and warning helpers', () => {
    it('shows success toast', () => {
      const { result } = renderHook(() => useErrorHandler())

      result.current.showSuccess('Operation successful', 'Data saved successfully')

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Operation successful',
        description: 'Data saved successfully',
        variant: 'default',
      })
    })

    it('shows warning toast', () => {
      const { result } = renderHook(() => useErrorHandler())

      result.current.showWarning('Warning', 'Please check your input')

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Warning',
        description: 'Please check your input',
        variant: 'destructive',
      })
    })
  })
})

describe('useErrorRecovery', () => {
  let mockGlobalErrorHandler: any

  beforeEach(() => {
    vi.clearAllMocks()
    const { globalErrorHandler } = require('@/lib/errorHandler')
    mockGlobalErrorHandler = globalErrorHandler
  })

  describe('retry', () => {
    it('succeeds on first attempt', async () => {
      const { result } = renderHook(() => useErrorRecovery())
      const mockOperation = vi.fn().mockResolvedValue('success')

      const response = await result.current.retry(mockOperation)

      expect(response).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
      expect(mockGlobalErrorHandler.handleError).not.toHaveBeenCalled()
    })

    it('retries on failure and eventually succeeds', async () => {
      const { result } = renderHook(() => useErrorRecovery())
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const response = await result.current.retry(mockOperation, 3, 10)

      expect(response).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(3)
      expect(mockGlobalErrorHandler.handleError).not.toHaveBeenCalled()
    })

    it('exhausts retries and handles final error', async () => {
      const { result } = renderHook(() => useErrorRecovery())
      const finalError = new Error('Final failure')
      const mockOperation = vi.fn().mockRejectedValue(finalError)

      const response = await result.current.retry(mockOperation, 2, 10)

      expect(response).toBeNull()
      expect(mockOperation).toHaveBeenCalledTimes(2)
      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(finalError)
    })

    it('waits between retries', async () => {
      const { result } = renderHook(() => useErrorRecovery())
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success')

      const startTime = Date.now()
      await result.current.retry(mockOperation, 2, 50)
      const duration = Date.now() - startTime

      expect(duration).toBeGreaterThanOrEqual(50)
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })
  })

  describe('retryWithBackoff', () => {
    it('succeeds on first attempt', async () => {
      const { result } = renderHook(() => useErrorRecovery())
      const mockOperation = vi.fn().mockResolvedValue('success')

      const response = await result.current.retryWithBackoff(mockOperation)

      expect(response).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('retries with exponential backoff', async () => {
      const { result } = renderHook(() => useErrorRecovery())
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const startTime = Date.now()
      const response = await result.current.retryWithBackoff(mockOperation, 3, 100, 5000)
      const duration = Date.now() - startTime

      expect(response).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(3)
      
      // Should have waited for at least the first retry delay (100ms + some jitter)
      expect(duration).toBeGreaterThanOrEqual(100)
    })

    it('respects maximum delay', async () => {
      const { result } = renderHook(() => useErrorRecovery())
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const startTime = Date.now()
      await result.current.retryWithBackoff(mockOperation, 3, 1000, 500) // maxDelay < baseDelay * 2
      const duration = Date.now() - startTime

      // With maxDelay of 500ms, the second retry shouldn't wait more than 500ms
      expect(duration).toBeLessThan(1500) // Some buffer for jitter and execution time
    })

    it('exhausts retries and handles final error', async () => {
      const { result } = renderHook(() => useErrorRecovery())
      const finalError = new Error('Final failure')
      const mockOperation = vi.fn().mockRejectedValue(finalError)

      const response = await result.current.retryWithBackoff(mockOperation, 2, 10, 100)

      expect(response).toBeNull()
      expect(mockOperation).toHaveBeenCalledTimes(2)
      expect(mockGlobalErrorHandler.handleError).toHaveBeenCalledWith(finalError)
    })
  })
})