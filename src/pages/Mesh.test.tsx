import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Mesh from './Mesh';

// Mock the hooks and components
const mockIdeas = [
  {
    id: '1',
    content: 'First amazing idea',
    keywords: ['amazing', 'first'],
    mood: 'excited',
    idea_type: 'general',
    color_signature: '#E07A5F',
    created_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '2', 
    content: 'Second curious thought',
    keywords: ['curious', 'thought'],
    mood: 'curious',
    idea_type: 'detailed',
    color_signature: '#3D5A80',
    created_at: '2023-01-02T00:00:00Z'
  },
  {
    id: '3',
    content: 'Third simple note',
    keywords: null,
    mood: 'contemplative',
    idea_type: 'concise',
    color_signature: '#98C1D9',
    created_at: '2023-01-03T00:00:00Z'
  }
];

vi.mock('@/hooks/useIdeas', () => ({
  useIdeas: () => ({
    ideas: mockIdeas,
    loading: false
  })
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

vi.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  )
}));

describe('Mesh Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the mesh page correctly', () => {
    render(<Mesh />);
    
    expect(screen.getByText('mesh.title')).toBeInTheDocument();
    expect(screen.getByText('Explore your interconnected web of ideas')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search your ideas, keywords, or connections...')).toBeInTheDocument();
  });

  it('displays all ideas when no search term', () => {
    render(<Mesh />);
    
    expect(screen.getByText('First amazing idea')).toBeInTheDocument();
    expect(screen.getByText('Second curious thought')).toBeInTheDocument();
    expect(screen.getByText('Third simple note')).toBeInTheDocument();
  });

  it('handles search functionality by content', () => {
    render(<Mesh />);
    
    const searchInput = screen.getByPlaceholderText('Search your ideas, keywords, or connections...');
    fireEvent.change(searchInput, { target: { value: 'amazing' } });
    
    expect(screen.getByText('First amazing idea')).toBeInTheDocument();
    expect(screen.queryByText('Second curious thought')).not.toBeInTheDocument();
    expect(screen.queryByText('Third simple note')).not.toBeInTheDocument();
  });

  it('handles search functionality by keywords', () => {
    render(<Mesh />);
    
    const searchInput = screen.getByPlaceholderText('Search your ideas, keywords, or connections...');
    fireEvent.change(searchInput, { target: { value: 'curious' } });
    
    expect(screen.queryByText('First amazing idea')).not.toBeInTheDocument();
    expect(screen.getByText('Second curious thought')).toBeInTheDocument();
    expect(screen.queryByText('Third simple note')).not.toBeInTheDocument();
  });

  it('handles case insensitive search', () => {
    render(<Mesh />);
    
    const searchInput = screen.getByPlaceholderText('Search your ideas, keywords, or connections...');
    fireEvent.change(searchInput, { target: { value: 'AMAZING' } });
    
    expect(screen.getByText('First amazing idea')).toBeInTheDocument();
  });

  it('shows no results when search has no matches', () => {
    render(<Mesh />);
    
    const searchInput = screen.getByPlaceholderText('Search your ideas, keywords, or connections...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No matching ideas')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search terms')).toBeInTheDocument();
    expect(screen.queryByText('First amazing idea')).not.toBeInTheDocument();
  });

  it('displays idea cards with correct information', () => {
    render(<Mesh />);
    
    // Check first idea card
    const firstIdea = screen.getByText('First amazing idea').closest('[data-testid]') || 
                     screen.getByText('First amazing idea').closest('div');
    
    expect(screen.getByText('First amazing idea')).toBeInTheDocument();
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('amazing')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('excited')).toBeInTheDocument();
  });

  it('handles ideas with missing keywords safely', () => {
    render(<Mesh />);
    
    // Third idea has null keywords, should still render
    expect(screen.getByText('Third simple note')).toBeInTheDocument();
    expect(screen.getByText('contemplative')).toBeInTheDocument();
  });

  it('opens idea detail modal when idea is clicked', async () => {
    render(<Mesh />);
    
    const firstIdeaCard = screen.getByText('First amazing idea').closest('div');
    fireEvent.click(firstIdeaCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Idea Details')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Mood')).toBeInTheDocument();
    });
  });

  it('displays idea details correctly in modal', async () => {
    render(<Mesh />);
    
    const firstIdeaCard = screen.getByText('First amazing idea').closest('div');
    fireEvent.click(firstIdeaCard!);
    
    await waitFor(() => {
      expect(screen.getByText('First amazing idea')).toBeInTheDocument();
      expect(screen.getByText('general')).toBeInTheDocument();
      expect(screen.getByText('excited')).toBeInTheDocument();
      expect(screen.getByText('Keywords')).toBeInTheDocument();
      expect(screen.getByText('amazing')).toBeInTheDocument();
      expect(screen.getByText('first')).toBeInTheDocument();
    });
  });

  it('handles modal close', async () => {
    render(<Mesh />);
    
    const firstIdeaCard = screen.getByText('First amazing idea').closest('div');
    fireEvent.click(firstIdeaCard!);
    
    await waitFor(() => {
      expect(screen.getByText('Idea Details')).toBeInTheDocument();
    });
    
    // Click outside or use escape to close modal
    const modal = screen.getByRole('dialog');
    fireEvent.keyDown(modal, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Idea Details')).not.toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    vi.mocked(vi.importActual('@/hooks/useIdeas')).useIdeas = () => ({
      ideas: [],
      loading: true
    });

    render(<Mesh />);
    
    // Should show loading skeleton
    expect(screen.getAllByRole('generic')).toHaveLength(6); // 6 skeleton cards
  });

  it('shows empty state when no ideas exist', () => {
    vi.mocked(vi.importActual('@/hooks/useIdeas')).useIdeas = () => ({
      ideas: [],
      loading: false
    });

    render(<Mesh />);
    
    expect(screen.getByText('No ideas yet')).toBeInTheDocument();
    expect(screen.getByText('Start by creating your first spark!')).toBeInTheDocument();
  });

  it('displays All Ideas header', () => {
    render(<Mesh />);
    
    expect(screen.getByText('All Ideas')).toBeInTheDocument();
  });

  it('shows filter button', () => {
    render(<Mesh />);
    
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('handles corrupted idea data gracefully', () => {
    const corruptedIdeas = [
      {
        id: '1',
        content: 'Valid idea',
        keywords: ['valid'],
        mood: 'excited',
        idea_type: 'general',
        color_signature: '#E07A5F',
        created_at: '2023-01-01T00:00:00Z'
      },
      {
        id: null, // Missing ID
        content: 'Invalid idea',
        keywords: ['invalid']
      },
      {
        id: '3',
        content: null, // Missing content
        keywords: ['test']
      },
      {
        id: '4',
        content: 'Idea with bad keywords',
        keywords: 'not-an-array', // Invalid keywords
        mood: 'curious',
        created_at: null // Missing date
      }
    ];

    vi.mocked(vi.importActual('@/hooks/useIdeas')).useIdeas = () => ({
      ideas: corruptedIdeas,
      loading: false
    });

    render(<Mesh />);
    
    // Should only show valid ideas
    expect(screen.getByText('Valid idea')).toBeInTheDocument();
    expect(screen.queryByText('Invalid idea')).not.toBeInTheDocument();
    expect(screen.queryByText('Idea with bad keywords')).not.toBeInTheDocument();
  });

  it('handles search with empty keywords array', () => {
    const ideasWithEmptyKeywords = [
      {
        id: '1',
        content: 'Idea without keywords',
        keywords: [], // Empty array
        mood: 'neutral',
        idea_type: 'general',
        color_signature: '#E07A5F',
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    vi.mocked(vi.importActual('@/hooks/useIdeas')).useIdeas = () => ({
      ideas: ideasWithEmptyKeywords,
      loading: false
    });

    render(<Mesh />);
    
    const searchInput = screen.getByPlaceholderText('Search your ideas, keywords, or connections...');
    fireEvent.change(searchInput, { target: { value: 'without' } });
    
    expect(screen.getByText('Idea without keywords')).toBeInTheDocument();
  });

  it('displays correct date format', () => {
    render(<Mesh />);
    
    // Dates should be formatted as MM/DD/YYYY
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('1/2/2023')).toBeInTheDocument();
    expect(screen.getByText('1/3/2023')).toBeInTheDocument();
  });

  it('handles idea without mood', () => {
    const ideasWithoutMood = [
      {
        id: '1',
        content: 'Idea without mood',
        keywords: ['test'],
        mood: null,
        idea_type: 'general',
        color_signature: '#E07A5F',
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    vi.mocked(vi.importActual('@/hooks/useIdeas')).useIdeas = () => ({
      ideas: ideasWithoutMood,
      loading: false
    });

    render(<Mesh />);
    
    expect(screen.getByText('Idea without mood')).toBeInTheDocument();
    // Should not crash when mood is missing
  });

  it('displays idea cards with proper styling and structure', () => {
    render(<Mesh />);
    
    const ideaCards = screen.getAllByText(/idea|thought|note/).map(text => 
      text.closest('.bg-white')
    ).filter(Boolean);
    
    expect(ideaCards.length).toBeGreaterThan(0);
    
    // Check that each card has the expected structure
    ideaCards.forEach(card => {
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-2xl');
    });
  });

  it('shows keyword limit in idea cards', () => {
    const ideaWithManyKeywords = [
      {
        id: '1',
        content: 'Idea with many keywords',
        keywords: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'],
        mood: 'excited',
        idea_type: 'general', 
        color_signature: '#E07A5F',
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    vi.mocked(vi.importActual('@/hooks/useIdeas')).useIdeas = () => ({
      ideas: ideaWithManyKeywords,
      loading: false
    });

    render(<Mesh />);
    
    // Should only show first 3 keywords
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText('third')).toBeInTheDocument();
    expect(screen.queryByText('fourth')).not.toBeInTheDocument();
  });

  it('handles date parsing errors gracefully', () => {
    const ideasWithBadDates = [
      {
        id: '1',
        content: 'Idea with bad date',
        keywords: ['test'],
        mood: 'neutral',
        idea_type: 'general',
        color_signature: '#E07A5F',
        created_at: 'invalid-date'
      }
    ];

    vi.mocked(vi.importActual('@/hooks/useIdeas')).useIdeas = () => ({
      ideas: ideasWithBadDates,
      loading: false
    });

    render(<Mesh />);
    
    expect(screen.getByText('Idea with bad date')).toBeInTheDocument();
    expect(screen.getByText('Unknown date')).toBeInTheDocument();
  });
});