import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { createMockUser, createMockIdea } from '@/test/utils'
import Discover from './Discover'

// Mock dependencies
vi.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockUser(),
  }),
}))

vi.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleSupabaseError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}))

// Mock Supabase client
const mockSupabaseQuery = {
  select: vi.fn(() => mockSupabaseQuery),
  eq: vi.fn(() => mockSupabaseQuery),
  neq: vi.fn(() => mockSupabaseQuery),
  or: vi.fn(() => mockSupabaseQuery),
  order: vi.fn(() => mockSupabaseQuery),
  limit: vi.fn(() => mockSupabaseQuery),
  insert: vi.fn(() => mockSupabaseQuery),
  upsert: vi.fn(() => mockSupabaseQuery),
}

const mockSupabase = {
  from: vi.fn(() => mockSupabaseQuery),
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

const mockIdeas = [
  {
    id: '1',
    content: 'React development idea for modern apps',
    keywords: ['react', 'development', 'frontend'],
    mood: 'excited',
    collaboration_status: 'open',
    collaboration_roles: ['developer', 'designer'],
    collaboration_description: 'Looking for a frontend developer',
    tags: ['web', 'development'],
    visibility: 'public',
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
    user_profile: {
      display_name: 'John Doe',
      avatar_url: 'https://example.com/avatar1.jpg',
      skills: ['React', 'TypeScript', 'Design'],
      interests: ['web development', 'UX design'],
    },
    likes_count: 5,
    comments_count: 3,
    collaborators_count: 1,
  },
  {
    id: '2',
    content: 'Mobile app concept for productivity',
    keywords: ['mobile', 'productivity', 'app'],
    mood: 'focused',
    collaboration_status: 'seeking',
    collaboration_roles: ['mobile developer'],
    collaboration_description: 'Need React Native developer',
    tags: ['mobile', 'productivity'],
    visibility: 'public',
    created_at: '2024-01-02T00:00:00Z',
    user_id: 'user-2',
    user_profile: {
      display_name: 'Jane Smith',
      avatar_url: 'https://example.com/avatar2.jpg',
      skills: ['Product Management', 'UI Design'],
      interests: ['mobile apps', 'productivity'],
    },
    likes_count: 8,
    comments_count: 2,
    collaborators_count: 0,
  },
]

describe('Discover Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful response
    mockSupabaseQuery.limit.mockResolvedValue({
      data: mockIdeas,
      error: null,
    })
    mockSupabaseQuery.insert.mockResolvedValue({
      data: null,
      error: null,
    })
    mockSupabaseQuery.upsert.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  describe('rendering', () => {
    it('renders page title and description', async () => {
      render(<Discover />)

      expect(screen.getByText('Discover Ideas')).toBeInTheDocument()
      expect(screen.getByText('Explore creative ideas from the community and find collaboration opportunities')).toBeInTheDocument()
    })

    it('renders filter controls', async () => {
      render(<Discover />)

      expect(screen.getByPlaceholderText('Search ideas...')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /mood/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /sort/i })).toBeInTheDocument()
    })

    it('displays loading state initially', () => {
      render(<Discover />)

      expect(screen.getAllByRole('generic', { hidden: true })).toBeDefined()
    })

    it('displays ideas after loading', async () => {
      render(<Discover />)

      await waitFor(() => {
        expect(screen.getByText('React development idea for modern apps')).toBeInTheDocument()
        expect(screen.getByText('Mobile app concept for productivity')).toBeInTheDocument()
      })
    })
  })

  describe('filtering and searching', () => {
    it('searches ideas by content', async () => {
      render(<Discover />)

      const searchInput = screen.getByPlaceholderText('Search ideas...')
      fireEvent.change(searchInput, { target: { value: 'React' } })

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('ideas')
        expect(mockSupabaseQuery.or).toHaveBeenCalledWith('content.ilike.%React%,tags.cs.{React}')
      })
    })

    it('filters by mood', async () => {
      render(<Discover />)

      const moodSelect = screen.getByRole('combobox', { name: /mood/i })
      fireEvent.click(moodSelect)

      const excitedOption = screen.getByText('Excited')
      fireEvent.click(excitedOption)

      await waitFor(() => {
        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('mood', 'excited')
      })
    })

    it('filters by collaboration status', async () => {
      render(<Discover />)

      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      fireEvent.click(statusSelect)

      const openOption = screen.getByText('Open for Collaboration')
      fireEvent.click(openOption)

      await waitFor(() => {
        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('collaboration_status', 'open')
      })
    })

    it('sorts ideas', async () => {
      render(<Discover />)

      const sortSelect = screen.getByRole('combobox', { name: /sort/i })
      fireEvent.click(sortSelect)

      const popularOption = screen.getByText('Popular')
      fireEvent.click(popularOption)

      await waitFor(() => {
        expect(mockSupabaseQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      })
    })

    it('applies multiple filters simultaneously', async () => {
      render(<Discover />)

      // Set search query
      const searchInput = screen.getByPlaceholderText('Search ideas...')
      fireEvent.change(searchInput, { target: { value: 'mobile' } })

      // Set mood filter
      const moodSelect = screen.getByRole('combobox', { name: /mood/i })
      fireEvent.click(moodSelect)
      const focusedOption = screen.getByText('Focused')
      fireEvent.click(focusedOption)

      await waitFor(() => {
        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('mood', 'focused')
        expect(mockSupabaseQuery.or).toHaveBeenCalledWith('content.ilike.%mobile%,tags.cs.{mobile}')
      })
    })
  })

  describe('idea interactions', () => {
    beforeEach(async () => {
      render(<Discover />)
      await waitFor(() => {
        expect(screen.getByText('React development idea for modern apps')).toBeInTheDocument()
      })
    })

    it('displays idea cards with correct information', () => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('open')).toBeInTheDocument()
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('#web')).toBeInTheDocument()
      expect(screen.getByText('Looking for a frontend developer')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
    })

    it('shows like counts and interaction buttons', () => {
      expect(screen.getByText('5')).toBeInTheDocument() // likes count
      expect(screen.getByText('3')).toBeInTheDocument() // comments count
      expect(screen.getByText('1')).toBeInTheDocument() // collaborators count
    })

    it('handles like button click', async () => {
      const likeButtons = screen.getAllByRole('button', { name: /heart/i })
      fireEvent.click(likeButtons[0])

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('idea_likes')
        expect(mockSupabaseQuery.upsert).toHaveBeenCalledWith({
          idea_id: '1',
          user_id: 'test-user-id',
        })
      })
    })

    it('handles collaboration request', async () => {
      const collaborateButtons = screen.getAllByRole('button', { name: /collaborate/i })
      fireEvent.click(collaborateButtons[0])

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('collaboration_requests')
        expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
          idea_id: '1',
          requester_id: 'test-user-id',
          status: 'pending',
          message: 'I would like to collaborate on this idea!',
        })
      })
    })

    it('does not show collaborate button for own ideas', async () => {
      // Mock user being the owner of the first idea
      const userIdMock = vi.mocked(require('@/hooks/useAuth').useAuth)
      userIdMock.mockReturnValue({
        user: { ...createMockUser(), id: 'user-1' },
      })

      render(<Discover />)

      await waitFor(() => {
        expect(screen.getByText('React development idea for modern apps')).toBeInTheDocument()
      })

      // Should not show collaborate button for own idea
      const collaborateButtons = screen.queryAllByRole('button', { name: /collaborate/i })
      expect(collaborateButtons).toHaveLength(1) // Only for the second idea
    })

    it('shows sign-in message for unauthenticated users', async () => {
      const userMock = vi.mocked(require('@/hooks/useAuth').useAuth)
      userMock.mockReturnValue({ user: null })

      const { showSuccess } = require('@/hooks/useErrorHandler').useErrorHandler()

      render(<Discover />)

      await waitFor(() => {
        expect(screen.getByText('React development idea for modern apps')).toBeInTheDocument()
      })

      const likeButtons = screen.getAllByRole('button', { name: /heart/i })
      fireEvent.click(likeButtons[0])

      expect(showSuccess).toHaveBeenCalledWith(
        'Please sign in to like ideas',
        'You need to be signed in to like ideas.'
      )
    })
  })

  describe('empty states', () => {
    it('shows empty state when no ideas found', async () => {
      mockSupabaseQuery.limit.mockResolvedValue({
        data: [],
        error: null,
      })

      render(<Discover />)

      await waitFor(() => {
        expect(screen.getByText('No ideas found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your filters or search terms')).toBeInTheDocument()
      })
    })

    it('shows loading skeletons', () => {
      render(<Discover />)

      // Should show loading skeleton cards
      const skeletonCards = screen.getAllByRole('generic', { hidden: true })
      expect(skeletonCards.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      const { handleSupabaseError } = require('@/hooks/useErrorHandler').useErrorHandler()
      
      mockSupabaseQuery.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      render(<Discover />)

      await waitFor(() => {
        expect(handleSupabaseError).toHaveBeenCalledWith(
          { message: 'Database connection failed' },
          'fetch public ideas'
        )
      })
    })

    it('handles collaboration request errors', async () => {
      const { handleSupabaseError } = require('@/hooks/useErrorHandler').useErrorHandler()

      mockSupabaseQuery.insert.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      })

      render(<Discover />)

      await waitFor(() => {
        expect(screen.getByText('React development idea for modern apps')).toBeInTheDocument()
      })

      const collaborateButtons = screen.getAllByRole('button', { name: /collaborate/i })
      fireEvent.click(collaborateButtons[0])

      await waitFor(() => {
        expect(handleSupabaseError).toHaveBeenCalledWith(
          { message: 'Permission denied' },
          'send collaboration request'
        )
      })
    })

    it('handles like request errors', async () => {
      const { handleSupabaseError } = require('@/hooks/useErrorHandler').useErrorHandler()

      mockSupabaseQuery.upsert.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      })

      render(<Discover />)

      await waitFor(() => {
        expect(screen.getByText('React development idea for modern apps')).toBeInTheDocument()
      })

      const likeButtons = screen.getAllByRole('button', { name: /heart/i })
      fireEvent.click(likeButtons[0])

      await waitFor(() => {
        expect(handleSupabaseError).toHaveBeenCalledWith(
          { message: 'Network error' },
          'like idea'
        )
      })
    })
  })

  describe('responsive behavior', () => {
    it('renders on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<Discover />)

      expect(screen.getByText('Discover Ideas')).toBeInTheDocument()
    })

    it('renders filter controls in grid layout', () => {
      render(<Discover />)

      const filterContainer = screen.getByPlaceholderText('Search ideas...').closest('div')
      expect(filterContainer).toHaveClass('grid')
    })
  })

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      render(<Discover />)

      const mainHeading = screen.getByRole('heading', { name: 'Discover Ideas' })
      expect(mainHeading).toBeInTheDocument()
    })

    it('has proper button labels', async () => {
      render(<Discover />)

      await waitFor(() => {
        expect(screen.getByText('React development idea for modern apps')).toBeInTheDocument()
      })

      const likeButtons = screen.getAllByRole('button', { name: /heart/i })
      const commentButtons = screen.getAllByRole('button', { name: /message/i })
      
      expect(likeButtons).toBeDefined()
      expect(commentButtons).toBeDefined()
    })

    it('has proper form controls', () => {
      render(<Discover />)

      const searchInput = screen.getByPlaceholderText('Search ideas...')
      expect(searchInput).toHaveAttribute('type', 'text')

      const selects = screen.getAllByRole('combobox')
      expect(selects).toHaveLength(3) // mood, status, sort
    })
  })

  describe('performance', () => {
    it('debounces search input', async () => {
      render(<Discover />)

      const searchInput = screen.getByPlaceholderText('Search ideas...')
      
      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 'r' } })
      fireEvent.change(searchInput, { target: { value: 're' } })
      fireEvent.change(searchInput, { target: { value: 'rea' } })
      fireEvent.change(searchInput, { target: { value: 'react' } })

      // Should only trigger search after debounce
      await waitFor(() => {
        expect(mockSupabaseQuery.or).toHaveBeenCalledWith('content.ilike.%react%,tags.cs.{react}')
      })
    })

    it('limits API results', async () => {
      render(<Discover />)

      await waitFor(() => {
        expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(20)
      })
    })
  })
})