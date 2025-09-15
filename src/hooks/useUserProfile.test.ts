import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useUserProfile } from './useUserProfile';

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn(() => mockSupabaseQuery),
  insert: vi.fn(() => mockSupabaseQuery),
  update: vi.fn(() => mockSupabaseQuery),
  eq: vi.fn(() => mockSupabaseQuery),
  overlaps: vi.fn(() => mockSupabaseQuery),
  ilike: vi.fn(() => mockSupabaseQuery),
  order: vi.fn(() => mockSupabaseQuery),
  limit: vi.fn(() => mockSupabaseQuery),
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

const mockProfile = {
  user_id: 'test-user-id',
  display_name: 'Test User',
  bio: 'Test bio',
  avatar_url: 'https://example.com/avatar.jpg',
  skills: ['React', 'TypeScript', 'Node.js'],
  interests: ['Web Development', 'AI', 'Open Source'],
  location: 'San Francisco, CA',
  timezone: 'America/Los_Angeles',
  collaboration_preferences: {
    available_for_collaboration: true,
    preferred_roles: ['Frontend Developer', 'Full Stack'],
    communication_style: 'direct',
    time_commitment: 'part-time',
    project_types: ['Web Apps', 'Mobile Apps']
  },
  reputation_score: 85,
  collaboration_count: 12,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-15T00:00:00Z'
};

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset default mock implementations
    mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.insert.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.update.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.overlaps.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.ilike.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.order.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.limit.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.from.mockReturnValue(mockSupabaseQuery);
  });

  describe('fetchProfile', () => {
    it('fetches user profile successfully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockProfile, error: null });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('creates default profile when no profile exists for current user', async () => {
      const defaultProfile = {
        user_id: mockUser.id,
        display_name: 'test',
        bio: '',
        skills: [],
        interests: [],
        collaboration_preferences: {
          available_for_collaboration: true,
          preferred_roles: [],
          communication_style: 'flexible',
          time_commitment: 'flexible',
          project_types: []
        },
        reputation_score: 0,
        collaboration_count: 0
      };

      // First call returns no profile (PGRST116 error)
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows returned' } 
      });
      
      // Second call (insert) returns created profile
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: defaultProfile, error: null });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        display_name: 'test',
        bio: '',
        skills: [],
        interests: [],
        collaboration_preferences: {
          available_for_collaboration: true,
          preferred_roles: [],
          communication_style: 'flexible',
          time_commitment: 'flexible',
          project_types: []
        },
        reputation_score: 0,
        collaboration_count: 0
      });
      expect(result.current.profile).toEqual(defaultProfile);
    });

    it('handles fetch error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Database error');
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user profile:', mockError);
      expect(result.current.profile).toBe(null);
      
      consoleErrorSpy.mockRestore();
    });

    it('fetches specific user profile when userId provided', async () => {
      const otherUserId = 'other-user-id';
      const otherProfile = { ...mockProfile, user_id: otherUserId };
      mockSupabaseQuery.single.mockResolvedValue({ data: otherProfile, error: null });

      const { result } = renderHook(() => useUserProfile(otherUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', otherUserId);
      expect(result.current.profile).toEqual(otherProfile);
    });

    it('handles no user authentication', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      // Setup existing profile
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      // Setup update response
      const updatedProfile = { ...mockProfile, display_name: 'Updated Name' };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      let updated: any;
      await act(async () => {
        updated = await result.current.updateProfile({ display_name: 'Updated Name' });
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ display_name: 'Updated Name' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(updated).toEqual(updatedProfile);
      expect(result.current.profile).toEqual(updatedProfile);
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateProfile({ display_name: 'Test' });
        });
      }).rejects.toThrow('User not authenticated or profile not loaded');
    });

    it('throws error when profile not loaded', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updateProfile({ display_name: 'Test' });
        });
      }).rejects.toThrow('User not authenticated or profile not loaded');
    });

    it('handles update error', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updateError = new Error('Update failed');
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: updateError });

      await expect(async () => {
        await act(async () => {
          await result.current.updateProfile({ display_name: 'Updated Name' });
        });
      }).rejects.toThrow('Update failed');
    });

    it('manages updating state correctly', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      let resolvePromise: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockSupabaseQuery.single.mockReturnValueOnce(updatePromise);

      act(() => {
        result.current.updateProfile({ display_name: 'Updated Name' });
      });

      expect(result.current.updating).toBe(true);

      resolvePromise!({ data: { ...mockProfile, display_name: 'Updated Name' }, error: null });

      await waitFor(() => {
        expect(result.current.updating).toBe(false);
      });
    });
  });

  describe('skill management', () => {
    beforeEach(async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockProfile, error: null });
    });

    it('adds skill successfully', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { 
        ...mockProfile, 
        skills: [...mockProfile.skills, 'Python'] 
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.addSkill('Python');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        skills: ['React', 'TypeScript', 'Node.js', 'Python']
      });
    });

    it('prevents duplicate skills', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { ...mockProfile }; // No change since skill already exists
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.addSkill('React'); // Already exists
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        skills: ['React', 'TypeScript', 'Node.js'] // No duplicates
      });
    });

    it('removes skill successfully', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { 
        ...mockProfile, 
        skills: ['TypeScript', 'Node.js'] 
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.removeSkill('React');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        skills: ['TypeScript', 'Node.js']
      });
    });

    it('handles skill operations when no profile loaded', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addSkill('Python');
      });

      expect(mockSupabaseQuery.update).not.toHaveBeenCalled();
    });
  });

  describe('interest management', () => {
    beforeEach(async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockProfile, error: null });
    });

    it('adds interest successfully', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { 
        ...mockProfile, 
        interests: [...mockProfile.interests, 'Machine Learning'] 
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.addInterest('Machine Learning');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        interests: ['Web Development', 'AI', 'Open Source', 'Machine Learning']
      });
    });

    it('removes interest successfully', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { 
        ...mockProfile, 
        interests: ['Web Development', 'Open Source'] 
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.removeInterest('AI');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        interests: ['Web Development', 'Open Source']
      });
    });

    it('prevents duplicate interests', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { ...mockProfile };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.addInterest('AI'); // Already exists
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        interests: ['Web Development', 'AI', 'Open Source'] // No duplicates
      });
    });
  });

  describe('collaboration preferences', () => {
    beforeEach(async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockProfile, error: null });
    });

    it('updates collaboration preferences successfully', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const newPreferences = {
        communication_style: 'async',
        time_commitment: 'full-time'
      };

      const updatedProfile = { 
        ...mockProfile, 
        collaboration_preferences: {
          ...mockProfile.collaboration_preferences,
          ...newPreferences
        }
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.updateCollaborationPreferences(newPreferences);
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        collaboration_preferences: {
          available_for_collaboration: true,
          preferred_roles: ['Frontend Developer', 'Full Stack'],
          communication_style: 'async',
          time_commitment: 'full-time',
          project_types: ['Web Apps', 'Mobile Apps']
        }
      });
    });

    it('toggles collaboration availability', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { 
        ...mockProfile, 
        collaboration_preferences: {
          ...mockProfile.collaboration_preferences,
          available_for_collaboration: false
        }
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.toggleCollaborationAvailability();
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        collaboration_preferences: {
          ...mockProfile.collaboration_preferences,
          available_for_collaboration: false
        }
      });
    });

    it('handles missing availability preference gracefully', async () => {
      const profileWithoutAvailability = {
        ...mockProfile,
        collaboration_preferences: {
          preferred_roles: ['Developer'],
          communication_style: 'direct'
        }
      };
      
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: profileWithoutAvailability, error: null });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(profileWithoutAvailability);
      });

      const updatedProfile = { 
        ...profileWithoutAvailability, 
        collaboration_preferences: {
          ...profileWithoutAvailability.collaboration_preferences,
          available_for_collaboration: false // Should default to true, then toggle to false
        }
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.toggleCollaborationAvailability();
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        collaboration_preferences: {
          preferred_roles: ['Developer'],
          communication_style: 'direct',
          available_for_collaboration: false
        }
      });
    });
  });

  describe('reputation and statistics', () => {
    beforeEach(async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockProfile, error: null });
    });

    it('increments collaboration count', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { 
        ...mockProfile, 
        collaboration_count: mockProfile.collaboration_count + 1 
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.incrementCollaborationCount();
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        collaboration_count: 13
      });
    });

    it('updates reputation score', async () => {
      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      const updatedProfile = { 
        ...mockProfile, 
        reputation_score: 95 
      };
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedProfile, error: null });

      await act(async () => {
        await result.current.updateReputationScore(95);
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        reputation_score: 95
      });
    });
  });

  describe('search and discovery', () => {
    it('searches profiles with skills filter', async () => {
      const searchResults = [mockProfile];
      mockSupabaseQuery.order.mockResolvedValue({ data: searchResults, error: null });

      const { result } = renderHook(() => useUserProfile());

      let profiles: any;
      await act(async () => {
        profiles = await result.current.searchProfiles({
          skills: ['React', 'TypeScript']
        });
      });

      expect(profiles).toEqual(searchResults);
      expect(mockSupabaseQuery.overlaps).toHaveBeenCalledWith('skills', ['React', 'TypeScript']);
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('reputation_score', { ascending: false });
    });

    it('searches profiles with interests filter', async () => {
      const searchResults = [mockProfile];
      mockSupabaseQuery.order.mockResolvedValue({ data: searchResults, error: null });

      const { result } = renderHook(() => useUserProfile());

      await act(async () => {
        await result.current.searchProfiles({
          interests: ['AI', 'Web Development']
        });
      });

      expect(mockSupabaseQuery.overlaps).toHaveBeenCalledWith('interests', ['AI', 'Web Development']);
    });

    it('searches profiles with location filter', async () => {
      const searchResults = [mockProfile];
      mockSupabaseQuery.order.mockResolvedValue({ data: searchResults, error: null });

      const { result } = renderHook(() => useUserProfile());

      await act(async () => {
        await result.current.searchProfiles({
          location: 'San Francisco'
        });
      });

      expect(mockSupabaseQuery.ilike).toHaveBeenCalledWith('location', '%San Francisco%');
    });

    it('searches profiles with collaboration availability filter', async () => {
      const searchResults = [mockProfile];
      mockSupabaseQuery.order.mockResolvedValue({ data: searchResults, error: null });

      const { result } = renderHook(() => useUserProfile());

      await act(async () => {
        await result.current.searchProfiles({
          available_for_collaboration: true
        });
      });

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith(
        'collaboration_preferences->available_for_collaboration',
        true
      );
    });

    it('applies limit to search results', async () => {
      const searchResults = [mockProfile];
      mockSupabaseQuery.order.mockResolvedValue({ data: searchResults, error: null });

      const { result } = renderHook(() => useUserProfile());

      await act(async () => {
        await result.current.searchProfiles({
          limit: 5
        });
      });

      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(5);
    });

    it('handles search error', async () => {
      const searchError = new Error('Search failed');
      mockSupabaseQuery.order.mockResolvedValue({ data: null, error: searchError });

      const { result } = renderHook(() => useUserProfile());

      await expect(async () => {
        await act(async () => {
          await result.current.searchProfiles({ skills: ['React'] });
        });
      }).rejects.toThrow('Search failed');
    });

    it('gets top collaborators successfully', async () => {
      const topCollaborators = [mockProfile];
      mockSupabaseQuery.limit.mockResolvedValue({ data: topCollaborators, error: null });

      const { result } = renderHook(() => useUserProfile());

      let collaborators: any;
      await act(async () => {
        collaborators = await result.current.getTopCollaborators();
      });

      expect(collaborators).toEqual(topCollaborators);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith(
        'collaboration_preferences->available_for_collaboration',
        true
      );
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('reputation_score', { ascending: false });
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('collaboration_count', { ascending: false });
      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(10);
    });

    it('gets top collaborators with custom limit', async () => {
      const topCollaborators = [mockProfile];
      mockSupabaseQuery.limit.mockResolvedValue({ data: topCollaborators, error: null });

      const { result } = renderHook(() => useUserProfile());

      await act(async () => {
        await result.current.getTopCollaborators(25);
      });

      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(25);
    });

    it('handles top collaborators error', async () => {
      const searchError = new Error('Top collaborators fetch failed');
      mockSupabaseQuery.limit.mockResolvedValue({ data: null, error: searchError });

      const { result } = renderHook(() => useUserProfile());

      await expect(async () => {
        await act(async () => {
          await result.current.getTopCollaborators();
        });
      }).rejects.toThrow('Top collaborators fetch failed');
    });
  });

  describe('createDefaultProfile', () => {
    it('handles create default profile error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // First call returns no profile
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });
      
      // Create profile fails
      const createError = new Error('Create failed');
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: createError });

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating default profile:', createError);
      
      consoleErrorSpy.mockRestore();
    });
  });
});