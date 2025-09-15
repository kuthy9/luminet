import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useIdeas } from './useIdeas'
import { createMockUser, createMockIdea } from '@/test/utils'
import { supabase } from '@/integrations/supabase/client'

// Mock the auth hook
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    user: createMockUser(),
    loading: false,
  }),
}))

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('useIdeas', () => {
  const mockIdeas = [
    createMockIdea({ id: '1', content: 'First idea' }),
    createMockIdea({ id: '2', content: 'Second idea' }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useIdeas())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.ideas).toEqual([])
  })

  it('should fetch ideas on mount', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: mockIdeas,
        error: null,
      }),
    })
    
    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    })
    
    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const { result } = renderHook(() => useIdeas())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.ideas).toEqual(mockIdeas)
    expect(mockFrom).toHaveBeenCalledWith('ideas')
  })

  it('should create new idea', async () => {
    const newIdea = createMockIdea({ id: '3', content: 'New idea' })
    
    const mockSingle = vi.fn().mockResolvedValue({
      data: newIdea,
      error: null,
    })
    
    const mockSelect = vi.fn().mockReturnValue({
      single: mockSingle,
    })
    
    const mockInsert = vi.fn().mockReturnValue({
      select: mockSelect,
    })
    
    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    })
    
    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const { result } = renderHook(() => useIdeas())

    await act(async () => {
      const createdIdea = await result.current.createIdea('New idea', {
        mood: 'excited',
        keywords: ['test'],
      })
      expect(createdIdea).toEqual(newIdea)
    })

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'test-user-id',
      content: 'New idea',
      mood: 'excited',
      keywords: ['test'],
    })
  })

  it('should handle fetch error gracefully', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Fetch failed'),
      }),
    })
    
    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    })
    
    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useIdeas())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.ideas).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching ideas:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('should throw error when creating idea without user', async () => {
    // Mock useAuth to return no user
    vi.doMock('./useAuth', () => ({
      useAuth: () => ({
        user: null,
        loading: false,
      }),
    }))

    const { result } = renderHook(() => useIdeas())

    await expect(async () => {
      await act(async () => {
        await result.current.createIdea('Test idea')
      })
    }).rejects.toThrow('User not authenticated')
  })

  it('should refetch ideas when refetch is called', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: mockIdeas,
        error: null,
      }),
    })
    
    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    })
    
    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const { result } = renderHook(() => useIdeas())

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockFrom).toHaveBeenCalledWith('ideas')
    expect(result.current.ideas).toEqual(mockIdeas)
  })
})
