import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './useAuth'
import { supabase } from '@/integrations/supabase/client'
import React from 'react'

// Mock Supabase client
const mockGetSession = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithOtp = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockInvoke = vi.fn()

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signInWithOtp: mockSignInWithOtp,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    functions: {
      invoke: mockInvoke,
    },
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('should initialize with loading state', () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
  })

  it('should set user when session exists', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    }

    mockGetSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('should sign in with email and password', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    
    mockSignInWithPassword.mockResolvedValue({
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signIn('test@example.com', 'password123')
    })

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('should throw error on sign in failure', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    
    const signInError = new Error('Invalid credentials')
    mockSignInWithPassword.mockResolvedValue({
      error: signInError,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(async () => {
      await act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword')
      })
    }).rejects.toThrow('Invalid credentials')
  })

  it('should sign up with email and password', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    
    mockSignUp.mockResolvedValue({
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signUp('test@example.com', 'password123')
    })

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'http://localhost:3000/',
      },
    })
  })

  it('should send magic link', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    
    mockInvoke.mockResolvedValue({
      error: null,
    })
    
    mockSignInWithOtp.mockResolvedValue({
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signInWithMagicLink('test@example.com')
    })

    expect(mockInvoke).toHaveBeenCalledWith('send-magic-link', {
      body: { email: 'test@example.com' },
    })
    
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: 'http://localhost:3000/',
      },
    })
  })

  it('should sign out', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    
    mockSignOut.mockResolvedValue({
      error: null,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('should handle auth state changes', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    }

    mockGetSession.mockResolvedValue({
      data: { session: null },
    })

    let authStateCallback: (event: string, session: any) => void

    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      }
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Simulate auth state change
    act(() => {
      authStateCallback('SIGNED_IN', { user: mockUser })
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.loading).toBe(false)
    })
  })

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')
  })
})
