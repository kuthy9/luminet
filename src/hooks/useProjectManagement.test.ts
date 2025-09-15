import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProjectManagement } from './useProjectManagement';

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn(() => mockSupabaseQuery),
  insert: vi.fn(() => mockSupabaseQuery),
  update: vi.fn(() => mockSupabaseQuery),
  delete: vi.fn(() => mockSupabaseQuery),
  eq: vi.fn(() => mockSupabaseQuery),
  or: vi.fn(() => mockSupabaseQuery),
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

const mockProject = {
  id: 'project-1',
  title: 'Test Project',
  description: 'Test description',
  owner_id: 'test-user-id',
  status: 'active',
  visibility: 'private',
  priority: 'medium',
  completion_percentage: 50,
  tags: ['test', 'project'],
  metadata: {},
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  owner: {
    id: 'test-user-id',
    email: 'test@example.com'
  },
  members: [],
  tasks: []
};

const mockTask = {
  id: 'task-1',
  project_id: 'project-1',
  title: 'Test Task',
  description: 'Test task description',
  creator_id: 'test-user-id',
  status: 'todo',
  priority: 'medium',
  task_order: 1,
  labels: ['test'],
  dependencies: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  creator: {
    id: 'test-user-id',
    email: 'test@example.com'
  }
};

const mockStage = {
  id: 'stage-1',
  project_id: 'project-1',
  name: 'Test Stage',
  description: 'Test stage description',
  stage_order: 1,
  status: 'active',
  completion_percentage: 0,
  color: '#FF0000',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const mockMilestone = {
  id: 'milestone-1',
  project_id: 'project-1',
  title: 'Test Milestone',
  description: 'Test milestone description',
  due_date: '2023-12-31',
  status: 'pending',
  color: '#00FF00',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const mockMember = {
  id: 'member-1',
  project_id: 'project-1',
  user_id: 'user-2',
  role: 'member',
  permissions: [],
  joined_at: '2023-01-01T00:00:00Z',
  status: 'active',
  user: {
    id: 'user-2',
    email: 'member@example.com'
  }
};

describe('useProjectManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset default mock implementations
    mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.insert.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.update.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.delete.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.or.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.order.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.limit.mockReturnValue(mockSupabaseQuery);
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.from.mockReturnValue(mockSupabaseQuery);
  });

  describe('createProject', () => {
    it('creates project successfully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockProject, error: null });

      const { result } = renderHook(() => useProjectManagement());

      let createdProject: any;
      await act(async () => {
        createdProject = await result.current.createProject({
          title: 'Test Project',
          description: 'Test description',
          visibility: 'private',
          priority: 'medium',
          tags: ['test', 'project']
        });
      });

      expect(createdProject).toEqual(mockProject);
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        title: 'Test Project',
        description: 'Test description',
        visibility: 'private',
        priority: 'medium',
        tags: ['test', 'project'],
        owner_id: mockUser.id
      });
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useProjectManagement());

      await expect(async () => {
        await act(async () => {
          await result.current.createProject({ title: 'Test Project' });
        });
      }).rejects.toThrow('User not authenticated');
    });

    it('handles creation error', async () => {
      const mockError = new Error('Database error');
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      const { result } = renderHook(() => useProjectManagement());

      await expect(async () => {
        await act(async () => {
          await result.current.createProject({ title: 'Test Project' });
        });
      }).rejects.toThrow('Database error');
    });

    it('manages loading state during creation', async () => {
      let resolvePromise: (value: any) => void;
      const createPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockSupabaseQuery.single.mockReturnValue(createPromise);

      const { result } = renderHook(() => useProjectManagement());

      act(() => {
        result.current.createProject({ title: 'Test Project' });
      });

      expect(result.current.loading).toBe(true);

      resolvePromise!({ data: mockProject, error: null });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('getProjects', () => {
    it('fetches projects successfully', async () => {
      const mockProjects = [mockProject];
      mockSupabaseQuery.order.mockResolvedValue({ data: mockProjects, error: null });

      const { result } = renderHook(() => useProjectManagement());

      let projects: any;
      await act(async () => {
        projects = await result.current.getProjects();
      });

      expect(projects).toEqual(mockProjects);
      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('returns empty array when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useProjectManagement());

      let projects: any;
      await act(async () => {
        projects = await result.current.getProjects();
      });

      expect(projects).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('applies status filter', async () => {
      mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useProjectManagement());

      await act(async () => {
        await result.current.getProjects({ status: 'active' });
      });

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('applies visibility filter', async () => {
      mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useProjectManagement());

      await act(async () => {
        await result.current.getProjects({ visibility: 'public' });
      });

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('visibility', 'public');
    });

    it('applies owned_by_me filter', async () => {
      mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useProjectManagement());

      await act(async () => {
        await result.current.getProjects({ owned_by_me: true });
      });

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('owner_id', mockUser.id);
    });

    it('applies member_of filter', async () => {
      mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useProjectManagement());

      await act(async () => {
        await result.current.getProjects({ member_of: true });
      });

      expect(mockSupabaseQuery.or).toHaveBeenCalledWith(`owner_id.eq.${mockUser.id},project_members.user_id.eq.${mockUser.id}`);
    });

    it('applies limit filter', async () => {
      mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useProjectManagement());

      await act(async () => {
        await result.current.getProjects({ limit: 10 });
      });

      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(10);
    });

    it('handles fetch error', async () => {
      const mockError = new Error('Fetch error');
      mockSupabaseQuery.order.mockResolvedValue({ data: null, error: mockError });

      const { result } = renderHook(() => useProjectManagement());

      await expect(async () => {
        await act(async () => {
          await result.current.getProjects();
        });
      }).rejects.toThrow('Fetch error');
    });
  });

  describe('getProject', () => {
    it('fetches single project successfully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockProject, error: null });

      const { result } = renderHook(() => useProjectManagement());

      let project: any;
      await act(async () => {
        project = await result.current.getProject('project-1');
      });

      expect(project).toEqual(mockProject);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'project-1');
    });

    it('handles project not found', async () => {
      const mockError = new Error('Not found');
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      const { result } = renderHook(() => useProjectManagement());

      await expect(async () => {
        await act(async () => {
          await result.current.getProject('non-existent');
        });
      }).rejects.toThrow('Not found');
    });
  });

  describe('updateProject', () => {
    it('updates project successfully', async () => {
      const updatedProject = { ...mockProject, title: 'Updated Project' };
      mockSupabaseQuery.single.mockResolvedValue({ data: updatedProject, error: null });

      const { result } = renderHook(() => useProjectManagement());

      let project: any;
      await act(async () => {
        project = await result.current.updateProject('project-1', { title: 'Updated Project' });
      });

      expect(project).toEqual(updatedProject);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ title: 'Updated Project' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'project-1');
    });

    it('handles update error', async () => {
      const mockError = new Error('Update failed');
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: mockError });

      const { result } = renderHook(() => useProjectManagement());

      await expect(async () => {
        await act(async () => {
          await result.current.updateProject('project-1', { title: 'Updated Project' });
        });
      }).rejects.toThrow('Update failed');
    });
  });

  describe('deleteProject', () => {
    it('deletes project successfully', async () => {
      mockSupabaseQuery.delete.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useProjectManagement());

      await act(async () => {
        await result.current.deleteProject('project-1');
      });

      expect(mockSupabaseQuery.delete).toHaveBeenCalled();
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'project-1');
    });

    it('handles delete error', async () => {
      const mockError = new Error('Delete failed');
      mockSupabaseQuery.delete.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useProjectManagement());

      await expect(async () => {
        await act(async () => {
          await result.current.deleteProject('project-1');
        });
      }).rejects.toThrow('Delete failed');
    });
  });

  describe('createTask', () => {
    it('creates task successfully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockTask, error: null });

      const { result } = renderHook(() => useProjectManagement());

      let task: any;
      await act(async () => {
        task = await result.current.createTask({
          project_id: 'project-1',
          title: 'Test Task'
        });
      });

      expect(task).toEqual(mockTask);
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        project_id: 'project-1',
        title: 'Test Task',
        creator_id: mockUser.id
      });
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useProjectManagement());

      await expect(async () => {
        await act(async () => {
          await result.current.createTask({
            project_id: 'project-1',
            title: 'Test Task'
          });
        });
      }).rejects.toThrow('User not authenticated');
    });
  });

  describe('createMilestone', () => {
    it('creates milestone successfully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockMilestone, error: null });

      const { result } = renderHook(() => useProjectManagement());

      let milestone: any;
      await act(async () => {
        milestone = await result.current.createMilestone({
          project_id: 'project-1',
          title: 'Test Milestone',
          due_date: '2023-12-31'
        });
      });

      expect(milestone).toEqual(mockMilestone);
      expect(mockSupabase.from).toHaveBeenCalledWith('milestones');
    });
  });

  describe('addProjectMember', () => {
    it('adds member successfully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: mockMember, error: null });

      const { result } = renderHook(() => useProjectManagement());

      let member: any;
      await act(async () => {
        member = await result.current.addProjectMember('project-1', 'user-2', 'member');
      });

      expect(member).toEqual(mockMember);
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        project_id: 'project-1',
        user_id: 'user-2',
        role: 'member',
        invited_by: mockUser.id
      });
    });

    it('throws error when user not authenticated', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useProjectManagement());

      await expect(async () => {
        await act(async () => {
          await result.current.addProjectMember('project-1', 'user-2');
        });
      }).rejects.toThrow('User not authenticated');
    });
  });
});