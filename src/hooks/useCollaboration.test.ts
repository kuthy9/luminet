import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useCollaboration } from './useCollaboration';

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn(() => mockSupabaseQuery),
  insert: vi.fn(() => mockSupabaseQuery),
  update: vi.fn(() => mockSupabaseQuery),
  eq: vi.fn(() => mockSupabaseQuery),
  order: vi.fn(() => mockSupabaseQuery),
  limit: vi.fn(() => mockSupabaseQuery),
  single: vi.fn(),
  then: vi.fn()
};

const mockSupabaseLoose = {
  from: vi.fn(() => mockSupabaseQuery)
};

vi.mock('@/integrations/supabase/client-patched', () => ({
  supabaseLoose: mockSupabaseLoose
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

const mockIdea = {
  id: 'idea-1',
  content: 'Test idea content',
  user_id: 'idea-owner-id',
  collaboration_description: 'Looking for a frontend developer'
};

const mockCollaborationRequest = {
  id: 'request-1',
  idea_id: 'idea-1',
  requester_id: mockUser.id,
  owner_id: 'idea-owner-id',
  message: 'I would like to collaborate on this idea',
  status: 'pending',
  requested_role: 'frontend',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  requester: {
    user_id: mockUser.id,
    display_name: 'Test User',
    skills: ['React', 'TypeScript']
  },
  idea: {
    id: 'idea-1',
    content: 'Test idea content',
    collaboration_description: 'Looking for a frontend developer'
  }
};

const mockCollaboration = {
  id: 'collab-1',
  idea_id: 'idea-1',
  collaborator_id: mockUser.id,
  role: 'frontend',
  permissions: ['view', 'comment', 'edit'],
  status: 'active',
  joined_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  collaborator: {
    user_id: mockUser.id,
    display_name: 'Test User',
    skills: ['React', 'TypeScript']
  },
  idea: {
    id: 'idea-1',
    content: 'Test idea content'
  }
};

const mockMatch = {
  id: 'match-1',
  idea_id: 'idea-1',
  user_id: mockUser.id,
  match_score: 85,
  match_reasons: {
    skill_match: ['React', 'TypeScript'],
    interest_match: ['Web Development']
  },
  status: 'suggested',
  created_at: '2023-01-01T00:00:00Z',
  idea: {
    id: 'idea-1',
    content: 'Test idea content',
    collaboration_description: 'Looking for a frontend developer',
    collaboration_roles: ['frontend', 'design']
  },
  user: {
    user_id: mockUser.id,
    display_name: 'Test User',
    skills: ['React', 'TypeScript']
  }
};

describe('useCollaboration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset default mock implementations
    mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.insert.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.update.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.order.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.limit.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });
    mockSupabaseLoose.from.mockReturnValue(mockSupabaseQuery);
  });

  describe('sendCollaborationRequest', () => {
    it('sends collaboration request successfully', async () => {
      // Mock idea lookup
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: { user_id: 'idea-owner-id' }, 
        error: null 
      });
      
      // Mock request creation
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: mockCollaborationRequest, 
        error: null 
      });

      const { result } = renderHook(() => useCollaboration());

      let request: any;
      await act(async () => {
        request = await result.current.sendCollaborationRequest(
          'idea-1',
          'I would like to collaborate on this idea',
          'frontend'
        );
      });

      expect(request).toEqual(mockCollaborationRequest);
      expect(mockSupabaseLoose.from).toHaveBeenCalledWith('ideas');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'idea-1');
      expect(mockSupabaseLoose.from).toHaveBeenCalledWith('collaboration_requests');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        idea_id: 'idea-1',
        requester_id: mockUser.id,
        owner_id: 'idea-owner-id',
        message: 'I would like to collaborate on this idea',
        requested_role: 'frontend'
      });
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.sendCollaborationRequest('idea-1', 'Test message');
        });
      }).rejects.toThrow('User not authenticated');
    });

    it('throws error when idea not found', async () => {
      const ideaError = new Error('Idea not found');
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: ideaError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.sendCollaborationRequest('non-existent', 'Test message');
        });
      }).rejects.toThrow('Idea not found');
    });

    it('throws error when idea data is null', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: null });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.sendCollaborationRequest('idea-1', 'Test message');
        });
      }).rejects.toThrow('Idea not found');
    });

    it('handles request creation error', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: { user_id: 'idea-owner-id' }, 
        error: null 
      });
      
      const requestError = new Error('Request creation failed');
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: requestError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.sendCollaborationRequest('idea-1', 'Test message');
        });
      }).rejects.toThrow('Request creation failed');
    });

    it('manages loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const requestPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: { user_id: 'idea-owner-id' }, 
        error: null 
      });
      mockSupabaseQuery.single.mockReturnValueOnce(requestPromise);

      const { result } = renderHook(() => useCollaboration());

      act(() => {
        result.current.sendCollaborationRequest('idea-1', 'Test message');
      });

      expect(result.current.loading).toBe(true);

      resolvePromise!({ data: mockCollaborationRequest, error: null });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('respondToCollaborationRequest', () => {
    it('accepts collaboration request successfully', async () => {
      // Mock request update
      mockSupabaseQuery.update.mockResolvedValueOnce({ error: null });
      
      // Mock request data lookup
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: {
          idea_id: 'idea-1',
          requester_id: 'requester-id',
          requested_role: 'frontend'
        }, 
        error: null 
      });
      
      // Mock collaboration creation
      mockSupabaseQuery.insert.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.respondToCollaborationRequest(
          'request-1',
          'accepted',
          'frontend',
          ['view', 'comment', 'edit']
        );
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ status: 'accepted' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'request-1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        idea_id: 'idea-1',
        collaborator_id: 'requester-id',
        role: 'frontend',
        permissions: ['view', 'comment', 'edit']
      });
    });

    it('rejects collaboration request successfully', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.respondToCollaborationRequest('request-1', 'rejected');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ status: 'rejected' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'request-1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
    });

    it('uses default role and permissions when accepting', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({ error: null });
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: {
          idea_id: 'idea-1',
          requester_id: 'requester-id',
          requested_role: 'backend'
        }, 
        error: null 
      });
      mockSupabaseQuery.insert.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.respondToCollaborationRequest('request-1', 'accepted');
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        idea_id: 'idea-1',
        collaborator_id: 'requester-id',
        role: 'backend', // Uses requested_role
        permissions: ['view', 'comment'] // Uses default permissions
      });
    });

    it('uses fallback role when no requested role', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({ error: null });
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: {
          idea_id: 'idea-1',
          requester_id: 'requester-id',
          requested_role: null
        }, 
        error: null 
      });
      mockSupabaseQuery.insert.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.respondToCollaborationRequest('request-1', 'accepted');
      });

      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        idea_id: 'idea-1',
        collaborator_id: 'requester-id',
        role: 'collaborator', // Uses fallback
        permissions: ['view', 'comment']
      });
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.respondToCollaborationRequest('request-1', 'accepted');
        });
      }).rejects.toThrow('User not authenticated');
    });

    it('handles update error', async () => {
      const updateError = new Error('Update failed');
      mockSupabaseQuery.update.mockResolvedValueOnce({ error: updateError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.respondToCollaborationRequest('request-1', 'accepted');
        });
      }).rejects.toThrow('Update failed');
    });
  });

  describe('getCollaborationRequests', () => {
    it('gets sent requests successfully', async () => {
      const requests = [mockCollaborationRequest];
      mockSupabaseQuery.order.mockResolvedValue({ data: requests, error: null });

      const { result } = renderHook(() => useCollaboration());

      let sentRequests: any;
      await act(async () => {
        sentRequests = await result.current.getCollaborationRequests('sent');
      });

      expect(sentRequests).toEqual(requests);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('requester_id', mockUser.id);
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('gets received requests successfully', async () => {
      const requests = [mockCollaborationRequest];
      mockSupabaseQuery.order.mockResolvedValue({ data: requests, error: null });

      const { result } = renderHook(() => useCollaboration());

      let receivedRequests: any;
      await act(async () => {
        receivedRequests = await result.current.getCollaborationRequests('received');
      });

      expect(receivedRequests).toEqual(requests);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
    });

    it('returns empty array when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useCollaboration());

      let requests: any;
      await act(async () => {
        requests = await result.current.getCollaborationRequests('sent');
      });

      expect(requests).toEqual([]);
      expect(mockSupabaseLoose.from).not.toHaveBeenCalled();
    });

    it('handles fetch error', async () => {
      const fetchError = new Error('Fetch failed');
      mockSupabaseQuery.order.mockResolvedValue({ data: null, error: fetchError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.getCollaborationRequests('sent');
        });
      }).rejects.toThrow('Fetch failed');
    });

    it('returns empty array when data is null', async () => {
      mockSupabaseQuery.order.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useCollaboration());

      let requests: any;
      await act(async () => {
        requests = await result.current.getCollaborationRequests('sent');
      });

      expect(requests).toEqual([]);
    });
  });

  describe('getMyCollaborations', () => {
    it('gets user collaborations successfully', async () => {
      const collaborations = [mockCollaboration];
      mockSupabaseQuery.order.mockResolvedValue({ data: collaborations, error: null });

      const { result } = renderHook(() => useCollaboration());

      let myCollaborations: any;
      await act(async () => {
        myCollaborations = await result.current.getMyCollaborations();
      });

      expect(myCollaborations).toEqual(collaborations);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('collaborator_id', mockUser.id);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('joined_at', { ascending: false });
    });

    it('returns empty array when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useCollaboration());

      let collaborations: any;
      await act(async () => {
        collaborations = await result.current.getMyCollaborations();
      });

      expect(collaborations).toEqual([]);
    });

    it('handles fetch error', async () => {
      const fetchError = new Error('Collaborations fetch failed');
      mockSupabaseQuery.order.mockResolvedValue({ data: null, error: fetchError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.getMyCollaborations();
        });
      }).rejects.toThrow('Collaborations fetch failed');
    });
  });

  describe('getIdeaCollaborators', () => {
    it('gets idea collaborators successfully', async () => {
      const collaborators = [mockCollaboration];
      mockSupabaseQuery.eq.mockResolvedValue({ data: collaborators, error: null });

      const { result } = renderHook(() => useCollaboration());

      let ideaCollaborators: any;
      await act(async () => {
        ideaCollaborators = await result.current.getIdeaCollaborators('idea-1');
      });

      expect(ideaCollaborators).toEqual(collaborators);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('idea_id', 'idea-1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('handles fetch error', async () => {
      const fetchError = new Error('Collaborators fetch failed');
      mockSupabaseQuery.eq.mockResolvedValue({ data: null, error: fetchError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.getIdeaCollaborators('idea-1');
        });
      }).rejects.toThrow('Collaborators fetch failed');
    });

    it('returns empty array when data is null', async () => {
      mockSupabaseQuery.eq.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useCollaboration());

      let collaborators: any;
      await act(async () => {
        collaborators = await result.current.getIdeaCollaborators('idea-1');
      });

      expect(collaborators).toEqual([]);
    });
  });

  describe('updateCollaborationStatus', () => {
    it('updates collaboration status successfully', async () => {
      mockSupabaseQuery.eq.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.updateCollaborationStatus('collab-1', 'paused');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ status: 'paused' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'collab-1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('collaborator_id', mockUser.id);
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.updateCollaborationStatus('collab-1', 'paused');
        });
      }).rejects.toThrow('User not authenticated');
    });

    it('handles update error', async () => {
      const updateError = new Error('Status update failed');
      mockSupabaseQuery.eq.mockResolvedValue({ error: updateError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.updateCollaborationStatus('collab-1', 'paused');
        });
      }).rejects.toThrow('Status update failed');
    });
  });

  describe('getCollaborationMatches', () => {
    it('gets collaboration matches successfully', async () => {
      const matches = [mockMatch];
      mockSupabaseQuery.limit.mockResolvedValue({ data: matches, error: null });

      const { result } = renderHook(() => useCollaboration());

      let collaborationMatches: any;
      await act(async () => {
        collaborationMatches = await result.current.getCollaborationMatches();
      });

      expect(collaborationMatches).toEqual(matches);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'suggested');
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('match_score', { ascending: false });
      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(10);
    });

    it('gets matches with custom limit', async () => {
      const matches = [mockMatch];
      mockSupabaseQuery.limit.mockResolvedValue({ data: matches, error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.getCollaborationMatches(25);
      });

      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(25);
    });

    it('returns empty array when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useCollaboration());

      let matches: any;
      await act(async () => {
        matches = await result.current.getCollaborationMatches();
      });

      expect(matches).toEqual([]);
    });

    it('handles fetch error', async () => {
      const fetchError = new Error('Matches fetch failed');
      mockSupabaseQuery.limit.mockResolvedValue({ data: null, error: fetchError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.getCollaborationMatches();
        });
      }).rejects.toThrow('Matches fetch failed');
    });
  });

  describe('updateMatchStatus', () => {
    it('updates match status successfully', async () => {
      mockSupabaseQuery.eq.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.updateMatchStatus('match-1', 'viewed');
      });

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ status: 'viewed' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'match-1');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.updateMatchStatus('match-1', 'viewed');
        });
      }).rejects.toThrow('User not authenticated');
    });

    it('handles update error', async () => {
      const updateError = new Error('Match status update failed');
      mockSupabaseQuery.eq.mockResolvedValue({ error: updateError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.updateMatchStatus('match-1', 'viewed');
        });
      }).rejects.toThrow('Match status update failed');
    });
  });

  describe('getInspirationPlaza', () => {
    it('gets inspiration plaza items successfully', async () => {
      const plazaItems = [
        {
          id: 'plaza-1',
          idea_id: 'idea-1',
          priority_score: 85,
          idea: {
            id: 'idea-1',
            content: 'Plaza idea content',
            collaboration_description: 'Looking for collaborators',
            collaboration_roles: ['frontend', 'backend'],
            user_id: 'owner-id',
            created_at: '2023-01-01T00:00:00Z',
            tags: ['web', 'mobile'],
            user: { id: 'owner-id', email: 'owner@example.com' },
            profile: { display_name: 'Idea Owner', avatar_url: 'avatar.jpg' }
          }
        }
      ];
      mockSupabaseQuery.limit.mockResolvedValue({ data: plazaItems, error: null });

      const { result } = renderHook(() => useCollaboration());

      let plazaData: any;
      await act(async () => {
        plazaData = await result.current.getInspirationPlaza();
      });

      expect(plazaData).toEqual(plazaItems);
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('priority_score', { ascending: false });
      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(20);
    });

    it('gets plaza items with custom limit', async () => {
      mockSupabaseQuery.limit.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.getInspirationPlaza(50);
      });

      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(50);
    });

    it('handles fetch error', async () => {
      const fetchError = new Error('Plaza fetch failed');
      mockSupabaseQuery.limit.mockResolvedValue({ data: null, error: fetchError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.getInspirationPlaza();
        });
      }).rejects.toThrow('Plaza fetch failed');
    });

    it('returns empty array when data is null', async () => {
      mockSupabaseQuery.limit.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useCollaboration());

      let plazaData: any;
      await act(async () => {
        plazaData = await result.current.getInspirationPlaza();
      });

      expect(plazaData).toEqual([]);
    });
  });

  describe('addToInspirationPlaza', () => {
    it('adds idea to inspiration plaza successfully', async () => {
      // Mock idea ownership verification
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: { user_id: mockUser.id }, 
        error: null 
      });
      
      // Mock plaza insertion
      mockSupabaseQuery.insert.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.addToInspirationPlaza('idea-1');
      });

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'idea-1');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({ idea_id: 'idea-1' });
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.addToInspirationPlaza('idea-1');
        });
      }).rejects.toThrow('User not authenticated');
    });

    it('throws error when idea verification fails', async () => {
      const ideaError = new Error('Idea verification failed');
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: ideaError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.addToInspirationPlaza('idea-1');
        });
      }).rejects.toThrow('Idea verification failed');
    });

    it('throws error when user is not idea owner', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: { user_id: 'other-user-id' }, 
        error: null 
      });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.addToInspirationPlaza('idea-1');
        });
      }).rejects.toThrow('Unauthorized');
    });

    it('handles insertion error', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: { user_id: mockUser.id }, 
        error: null 
      });
      
      const insertError = new Error('Plaza insertion failed');
      mockSupabaseQuery.insert.mockResolvedValueOnce({ error: insertError });

      const { result } = renderHook(() => useCollaboration());

      await expect(async () => {
        await act(async () => {
          await result.current.addToInspirationPlaza('idea-1');
        });
      }).rejects.toThrow('Plaza insertion failed');
    });
  });

  describe('loading state management', () => {
    it('manages loading state across different operations', async () => {
      // sendCollaborationRequest
      let resolvePromise: (value: any) => void;
      const requestPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockSupabaseQuery.single.mockResolvedValueOnce({ 
        data: { user_id: 'idea-owner-id' }, 
        error: null 
      });
      mockSupabaseQuery.single.mockReturnValueOnce(requestPromise);

      const { result } = renderHook(() => useCollaboration());

      act(() => {
        result.current.sendCollaborationRequest('idea-1', 'Test message');
      });

      expect(result.current.loading).toBe(true);

      resolvePromise!({ data: mockCollaborationRequest, error: null });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // respondToCollaborationRequest
      let resolvePromise2: (value: any) => void;
      const responsePromise = new Promise((resolve) => {
        resolvePromise2 = resolve;
      });
      
      mockSupabaseQuery.update.mockReturnValueOnce(responsePromise);

      act(() => {
        result.current.respondToCollaborationRequest('request-1', 'accepted');
      });

      expect(result.current.loading).toBe(true);

      resolvePromise2!({ error: null });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});