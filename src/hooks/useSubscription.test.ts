import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSubscription } from './useSubscription'
import { createMockUser } from '@/test/utils'
import { supabase } from '@/integrations/supabase/client'

// Mock the auth hook
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    user: createMockUser(),
    loading: false,
  }),
}))

// Mock Supabase client
const mockInvoke = vi.fn()

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}))

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
})

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    mockInvoke.mockResolvedValue({
      data: { tier: 'free', status: 'active' },
      error: null,
    })

    const { result } = renderHook(() => useSubscription())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.subscription).toBe(null)
  })

  it('should check subscription on mount', async () => {
    const mockSubscriptionData = {
      tier: 'pro',
      status: 'active',
      current_period_end: '2024-12-31T23:59:59Z',
    }

    mockInvoke.mockResolvedValue({
      data: mockSubscriptionData,
      error: null,
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.subscription).toEqual({
      id: 'temp-id',
      user_id: 'test-user-id',
      tier: 'pro',
      status: 'active',
      current_period_end: '2024-12-31T23:59:59Z',
    })

    expect(mockInvoke).toHaveBeenCalledWith('check-subscription')
  })

  it('should default to free tier on error', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error('Subscription check failed'),
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.subscription).toEqual({
      id: 'temp-id',
      user_id: 'test-user-id',
      tier: 'free',
      status: 'active',
    })

    expect(consoleSpy).toHaveBeenCalledWith('Error checking subscription:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('should create checkout session', async () => {
    const checkoutUrl = 'https://checkout.stripe.com/session123'
    
    mockInvoke
      .mockResolvedValueOnce({
        data: { tier: 'free', status: 'active' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { url: checkoutUrl },
        error: null,
      })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      const response = await result.current.createCheckoutSession('pro')
      expect(response.url).toBe(checkoutUrl)
    })

    expect(mockInvoke).toHaveBeenCalledWith('create-checkout', {
      body: { tier: 'pro' },
    })

    expect(window.open).toHaveBeenCalledWith(checkoutUrl, '_blank')
  })

  it('should throw error when creating checkout without user', async () => {
    // Mock useAuth to return no user
    vi.doMock('./useAuth', () => ({
      useAuth: () => ({
        user: null,
        loading: false,
      }),
    }))

    const { result } = renderHook(() => useSubscription())

    await expect(async () => {
      await act(async () => {
        await result.current.createCheckoutSession('pro')
      })
    }).rejects.toThrow('User not authenticated')
  })

  it('should check feature access correctly', async () => {
    mockInvoke.mockResolvedValue({
      data: { tier: 'pro', status: 'active' },
      error: null,
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Pro tier should have access to pro features
    expect(result.current.hasFeatureAccess('unlimited_sparks')).toBe(true)
    expect(result.current.hasFeatureAccess('muse_ai')).toBe(true)
    expect(result.current.hasFeatureAccess('export')).toBe(true)
    
    // But not studio features
    expect(result.current.hasFeatureAccess('collaboration')).toBe(false)
    expect(result.current.hasFeatureAccess('api_access')).toBe(false)
  })

  it('should check studio tier feature access', async () => {
    mockInvoke.mockResolvedValue({
      data: { tier: 'studio', status: 'active' },
      error: null,
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Studio tier should have access to all features
    expect(result.current.hasFeatureAccess('unlimited_sparks')).toBe(true)
    expect(result.current.hasFeatureAccess('muse_ai')).toBe(true)
    expect(result.current.hasFeatureAccess('export')).toBe(true)
    expect(result.current.hasFeatureAccess('collaboration')).toBe(true)
    expect(result.current.hasFeatureAccess('api_access')).toBe(true)
  })

  it('should deny feature access for free tier', async () => {
    mockInvoke.mockResolvedValue({
      data: { tier: 'free', status: 'active' },
      error: null,
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Free tier should not have access to premium features
    expect(result.current.hasFeatureAccess('unlimited_sparks')).toBe(false)
    expect(result.current.hasFeatureAccess('muse_ai')).toBe(false)
    expect(result.current.hasFeatureAccess('export')).toBe(false)
    expect(result.current.hasFeatureAccess('collaboration')).toBe(false)
    expect(result.current.hasFeatureAccess('api_access')).toBe(false)
    
    // But should have access to basic features
    expect(result.current.hasFeatureAccess('basic_feature')).toBe(true)
  })

  it('should handle checkout session creation error', async () => {
    mockInvoke
      .mockResolvedValueOnce({
        data: { tier: 'free', status: 'active' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: new Error('Checkout failed'),
      })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(async () => {
      await act(async () => {
        await result.current.createCheckoutSession('pro')
      })
    }).rejects.toThrow('Checkout failed')
  })
})
