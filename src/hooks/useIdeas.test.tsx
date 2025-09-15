import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useIdeas } from './useIdeas';

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn(() => mockSupabaseQuery),
  eq: vi.fn(() => mockSupabaseQuery),
  order: vi.fn(() => mockSupabaseQuery),
  insert: vi.fn(() => mockSupabaseQuery),
  update: vi.fn(() => mockSupabaseQuery),
  delete: vi.fn(() => mockSupabaseQuery),
  single: vi.fn(),
  then: vi.fn()
};

const mockSupabase = {
  from: vi.fn(() => mockSupabaseQuery)
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock useAuth
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

vi.mock('./useAuth', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

describe('useIdeas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset default mock implementations
    mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.order.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.insert.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.update.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.delete.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.from.mockReturnValue(mockSupabaseQuery);
  });

  describe('fetchIdeas', () => {
    it('fetches ideas successfully', async () => {
      const mockIdeas = [
        {
          id: '1',
          content: 'Test idea 1',
          idea_type: 'general',
          mood: 'excited',
          keywords: ['test', 'idea'],
          color_signature: '#E07A5F',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          content: 'Test idea 2',
          idea_type: 'detailed',
          mood: 'curious',
          keywords: ['another', 'test'],
          color_signature: '#3D5A80',
          created_at: '2023-01-02T00:00:00Z'
        }
      ];

      mockSupabaseQuery.order.mockResolvedValue({ data: mockIdeas, error: null });

      const { result } = renderHook(() => useIdeas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ideas).toEqual(mockIdeas);
      expect(mockSupabase.from).toHaveBeenCalledWith('ideas');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('id, content, idea_type, mood, keywords, color_signature, created_at');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('handles fetch error gracefully', async () => {
      const mockError = new Error('Database error');
      mockSupabaseQuery.order.mockResolvedValue({ data: null, error: mockError });

      const { result } = renderHook(() => useIdeas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ideas).toEqual([]);
    });

    it('filters out corrupted ideas', async () => {
      const mockIdeas = [
        {
          id: '1',
          content: 'Valid idea',
          idea_type: 'general',
          mood: 'excited',
          keywords: ['test'],
          color_signature: '#E07A5F',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: null, // Invalid - no ID
          content: 'Invalid idea',
        },
        {
          id: '3',
          content: '', // Invalid - empty content
          idea_type: 'general'
        },
        {
          id: '4',
          content: 'Another valid idea',
          idea_type: null, // Should get default
          mood: null, // Should get default
          keywords: null, // Should get default
          color_signature: null, // Should get default
          created_at: null // Should get default
        }
      ];

      mockSupabaseQuery.order.mockResolvedValue({ data: mockIdeas, error: null });

      const { result } = renderHook(() => useIdeas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ideas).toHaveLength(2);
      expect(result.current.ideas[0]).toEqual({
        id: '1',
        content: 'Valid idea',
        idea_type: 'general',
        mood: 'excited',
        keywords: ['test'],
        color_signature: '#E07A5F',
        created_at: '2023-01-01T00:00:00Z'
      });
      expect(result.current.ideas[1]).toEqual({
        id: '4',
        content: 'Another valid idea',
        idea_type: 'general',
        mood: 'neutral',
        keywords: [],
        color_signature: '#E07A5F',
        created_at: expect.any(String)
      });
    });

    it('handles unauthenticated user', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useIdeas());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.ideas).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('createIdea', () => {
    it('creates idea successfully', async () => {
      const newIdea = {
        id: 'new-id',
        content: 'New test idea',
        idea_type: 'general',
        mood: 'excited',
        keywords: ['new', 'test'],
        color_signature: '#E07A5F',
        created_at: '2023-01-03T00:00:00Z'
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: newIdea, error: null });

      const { result } = renderHook(() => useIdeas());

      let createdIdea: any;
      await act(async () => {
        createdIdea = await result.current.createIdea({
          content: 'New test idea',
          keywords: ['new', 'test'],
          mood: 'excited'
        });
      });

      expect(createdIdea).toEqual(newIdea);
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        content: 'New test idea',
        idea_type: 'general',
        mood: 'excited',
        keywords: ['new', 'test'],
        color_signature: '#E07A5F'
      });
    });

    it('validates empty content', async () => {
      const { result } = renderHook(() => useIdeas());

      await expect(async () => {
        await act(async () => {
          await result.current.createIdea({ content: '' });
        });
      }).rejects.toThrow('Idea content cannot be empty');

      expect(mockSupabaseQuery.insert).not.toHaveBeenCalled();
    });

    it('validates whitespace-only content', async () => {
      const { result } = renderHook(() => useIdeas());

      await expect(async () => {
        await act(async () => {
          await result.current.createIdea({ content: '   ' });
        });
      }).rejects.toThrow('Idea content cannot be empty');
    });

    it('handles unauthenticated user', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useIdeas());

      await expect(async () => {
        await act(async () => {
          await result.current.createIdea({ content: 'Test idea' });
        });
      }).rejects.toThrow('User not authenticated');
    });

    it('handles creation error', async () => {
      const mockError = new Error('Database error');
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      const { result } = renderHook(() => useIdeas());

      await expect(async () => {
        await act(async () => {
          await result.current.createIdea({ content: 'Test idea' });
        });
      }).rejects.toThrow('Failed to create idea: Database error');
    });

    it('trims content and applies defaults', async () => {
      const newIdea = {
        id: 'new-id',
        content: 'Trimmed idea',
        idea_type: 'general',
        mood: 'neutral',
        keywords: [],
        color_signature: '#E07A5F',
        created_at: '2023-01-03T00:00:00Z'
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: newIdea, error: null });

      const { result } = renderHook(() => useIdeas());

      await act(async () => {
        await result.current.createIdea({ content: '  Trimmed idea  ' });
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        content: 'Trimmed idea',
        idea_type: 'general',
        mood: 'neutral',
        keywords: [],
        color_signature: '#E07A5F'
      });
    });

    it('updates ideas state after creation', async () => {
      const existingIdea = {
        id: '1',
        content: 'Existing idea',
        idea_type: 'general',
        mood: 'neutral',
        keywords: [],
        color_signature: '#E07A5F',
        created_at: '2023-01-01T00:00:00Z'
      };

      const newIdea = {
        id: '2',
        content: 'New idea',
        idea_type: 'general',
        mood: 'excited',
        keywords: ['new'],
        color_signature: '#E07A5F',
        created_at: '2023-01-03T00:00:00Z'
      };

      // Setup existing ideas
      mockSupabaseQuery.order.mockResolvedValue({ data: [existingIdea], error: null });
      
      const { result } = renderHook(() => useIdeas());

      await waitFor(() => {
        expect(result.current.ideas).toHaveLength(1);
      });

      // Create new idea
      mockSupabaseQuery.single.mockResolvedValue({ data: newIdea, error: null });

      await act(async () => {
        await result.current.createIdea({ content: 'New idea', mood: 'excited', keywords: ['new'] });
      });

      expect(result.current.ideas).toHaveLength(2);
      expect(result.current.ideas[0]).toEqual(newIdea);
      expect(result.current.ideas[1]).toEqual(existingIdea);
    });
  });

  describe('updateIdea', () => {
    it('updates idea successfully', async () => {
      const updatedIdea = {
        id: '1',
        content: 'Updated content',
        idea_type: 'detailed',
        mood: 'contemplative',
        keywords: ['updated'],
        color_signature: '#3D5A80',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: updatedIdea, error: null });

      const { result } = renderHook(() => useIdeas());

      let result_data: any;
      await act(async () => {
        result_data = await result.current.updateIdea('1', {
          content: 'Updated content',
          idea_type: 'detailed',
          mood: 'contemplative'
        });
      });

      expect(result_data).toEqual(updatedIdea);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        content: 'Updated content',
        idea_type: 'detailed',
        mood: 'contemplative'
      });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('validates idea ID', async () => {
      const { result } = renderHook(() => useIdeas());

      await expect(async () => {
        await act(async () => {
          await result.current.updateIdea('', { content: 'Updated' });
        });
      }).rejects.toThrow('Idea ID is required');

      await expect(async () => {
        await act(async () => {
          await result.current.updateIdea('   ', { content: 'Updated' });
        });
      }).rejects.toThrow('Idea ID is required');
    });

    it('handles update error', async () => {
      const mockError = new Error('Update failed');
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      const { result } = renderHook(() => useIdeas());

      await expect(async () => {
        await act(async () => {
          await result.current.updateIdea('1', { content: 'Updated' });
        });
      }).rejects.toThrow('Failed to update idea: Update failed');
    });

    it('updates ideas state after update', async () => {
      const originalIdea = {
        id: '1',
        content: 'Original content',
        idea_type: 'general',
        mood: 'neutral',
        keywords: [],
        color_signature: '#E07A5F',
        created_at: '2023-01-01T00:00:00Z'
      };

      const updatedIdea = {
        ...originalIdea,
        content: 'Updated content',
        mood: 'excited'
      };

      // Setup existing ideas
      mockSupabaseQuery.order.mockResolvedValue({ data: [originalIdea], error: null });
      
      const { result } = renderHook(() => useIdeas());

      await waitFor(() => {
        expect(result.current.ideas[0].content).toBe('Original content');
      });

      // Update idea
      mockSupabaseQuery.single.mockResolvedValue({ data: updatedIdea, error: null });

      await act(async () => {
        await result.current.updateIdea('1', { content: 'Updated content', mood: 'excited' });
      });

      expect(result.current.ideas[0].content).toBe('Updated content');
      expect(result.current.ideas[0].mood).toBe('excited');
    });
  });

  describe('deleteIdea', () => {
    it('deletes idea successfully', async () => {
      mockSupabaseQuery.delete.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useIdeas());

      await act(async () => {
        await result.current.deleteIdea('1');
      });

      expect(mockSupabaseQuery.delete).toHaveBeenCalled();
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('validates idea ID', async () => {
      const { result } = renderHook(() => useIdeas());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteIdea('');
        });
      }).rejects.toThrow('Idea ID is required');
    });

    it('handles delete error', async () => {
      const mockError = new Error('Delete failed');
      mockSupabaseQuery.delete.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useIdeas());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteIdea('1');
        });
      }).rejects.toThrow('Failed to delete idea: Delete failed');
    });

    it('removes idea from state after deletion', async () => {
      const ideas = [
        {
          id: '1',
          content: 'First idea',
          idea_type: 'general',
          mood: 'neutral',
          keywords: [],
          color_signature: '#E07A5F',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          content: 'Second idea',
          idea_type: 'general',
          mood: 'neutral',
          keywords: [],
          color_signature: '#E07A5F',
          created_at: '2023-01-02T00:00:00Z'
        }
      ];

      // Setup existing ideas
      mockSupabaseQuery.order.mockResolvedValue({ data: ideas, error: null });
      
      const { result } = renderHook(() => useIdeas());

      await waitFor(() => {
        expect(result.current.ideas).toHaveLength(2);
      });

      // Delete first idea
      mockSupabaseQuery.delete.mockResolvedValue({ error: null });

      await act(async () => {
        await result.current.deleteIdea('1');
      });

      expect(result.current.ideas).toHaveLength(1);
      expect(result.current.ideas[0].id).toBe('2');
    });
  });

  describe('refetch', () => {
    it('refetches ideas', async () => {
      const initialIdeas = [
        {
          id: '1',
          content: 'Initial idea',
          idea_type: 'general',
          mood: 'neutral',
          keywords: [],
          color_signature: '#E07A5F',
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      const updatedIdeas = [
        ...initialIdeas,
        {
          id: '2',
          content: 'New idea',
          idea_type: 'general',
          mood: 'excited',
          keywords: ['new'],
          color_signature: '#3D5A80',
          created_at: '2023-01-02T00:00:00Z'
        }
      ];

      // Initial fetch
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: initialIdeas, error: null });
      
      const { result } = renderHook(() => useIdeas());

      await waitFor(() => {
        expect(result.current.ideas).toHaveLength(1);
      });

      // Refetch with updated data
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: updatedIdeas, error: null });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.ideas).toHaveLength(2);
    });
  });

  describe('loading state', () => {
    it('manages loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockSupabaseQuery.order.mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useIdeas());

      expect(result.current.loading).toBe(true);

      resolvePromise!({ data: [], error: null });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});