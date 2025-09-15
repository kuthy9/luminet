import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Incubator from './Incubator';

// Mock the hooks and components
const mockGetProjects = vi.fn();
const mockCreateProject = vi.fn();
const mockUpdateProject = vi.fn();
const mockDeleteProject = vi.fn();
const mockToast = vi.fn();

const mockProjects = [
  {
    id: '1',
    title: 'AI Chatbot Project',
    description: 'Building an intelligent chatbot for customer service',
    status: 'active',
    visibility: 'private',
    priority: 'high',
    completion_percentage: 75,
    tags: ['ai', 'chatbot', 'customer-service'],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z',
    owner_id: 'current_user',
    members: [
      {
        id: 'member-1',
        user_id: 'current_user',
        role: 'owner',
        user: {
          display_name: 'John Doe',
          email: 'john@example.com'
        }
      }
    ],
    tasks: [
      { id: 'task-1', title: 'Design UI', status: 'done' },
      { id: 'task-2', title: 'Implement backend', status: 'in_progress' },
      { id: 'task-3', title: 'Write tests', status: 'todo' }
    ]
  },
  {
    id: '2',
    title: 'Mobile App Development',
    description: 'Creating a mobile app for project management',
    status: 'planning',
    visibility: 'public',
    priority: 'medium',
    completion_percentage: 25,
    tags: ['mobile', 'react-native'],
    created_at: '2023-01-10T00:00:00Z',
    updated_at: '2023-01-20T00:00:00Z',
    owner_id: 'other_user',
    members: [
      {
        id: 'member-2',
        user_id: 'current_user',
        role: 'member',
        user: {
          display_name: 'Jane Smith',
          email: 'jane@example.com'
        }
      }
    ],
    tasks: []
  },
  {
    id: '3',
    title: 'Completed Website',
    description: 'E-commerce website that was completed',
    status: 'completed',
    visibility: 'private',
    priority: 'low',
    completion_percentage: 100,
    tags: ['web', 'ecommerce'],
    created_at: '2022-12-01T00:00:00Z',
    updated_at: '2022-12-31T00:00:00Z',
    owner_id: 'current_user',
    members: [],
    tasks: [
      { id: 'task-4', title: 'Setup database', status: 'done' },
      { id: 'task-5', title: 'Build frontend', status: 'done' }
    ]
  }
];

vi.mock('@/hooks/useProjectManagement', () => ({
  useProjectManagement: () => ({
    getProjects: mockGetProjects,
    createProject: mockCreateProject,
    updateProject: mockUpdateProject,
    deleteProject: mockDeleteProject,
    loading: false
  })
}));

vi.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast
}));

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  )
}));

vi.mock('@/components/project/KanbanBoard', () => ({
  KanbanBoard: ({ project, onProjectUpdate }: any) => (
    <div data-testid="kanban-board">
      <span>Kanban Board for {project.title}</span>
      <button onClick={() => onProjectUpdate(project)}>Update Project</button>
    </div>
  )
}));

vi.mock('@/components/project/TimelineView', () => ({
  TimelineView: ({ project, onTaskUpdate, onMilestoneUpdate }: any) => (
    <div data-testid="timeline-view">
      <span>Timeline View for {project.title}</span>
      <button onClick={() => onTaskUpdate({ id: 'task-1', title: 'Test Task' })}>Update Task</button>
      <button onClick={() => onMilestoneUpdate({ id: 'milestone-1', title: 'Test Milestone' })}>Update Milestone</button>
    </div>
  )
}));

describe('Incubator Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProjects.mockResolvedValue(mockProjects);
    mockCreateProject.mockResolvedValue({
      id: 'new-project-id',
      title: 'New Test Project',
      description: 'Test description',
      status: 'planning',
      visibility: 'private',
      priority: 'medium',
      completion_percentage: 0,
      tags: [],
      members: [],
      tasks: [],
      created_at: '2023-01-25T00:00:00Z',
      updated_at: '2023-01-25T00:00:00Z'
    });
    mockUpdateProject.mockResolvedValue(mockProjects[0]);
  });

  it('renders the incubator page correctly', async () => {
    render(<Incubator />);
    
    expect(screen.getByText('项目孵化器')).toBeInTheDocument();
    expect(screen.getByText('将创意火花转化为结构化项目，与他人协作实现想法')).toBeInTheDocument();
    expect(screen.getByText('创建新项目')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
  });

  it('loads and displays projects correctly', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(mockGetProjects).toHaveBeenCalledWith({});
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      expect(screen.getByText('Completed Website')).toBeInTheDocument();
    });
  });

  it('displays project tabs with correct counts', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('所有项目')).toBeInTheDocument();
      expect(screen.getByText('我的项目')).toBeInTheDocument();
      expect(screen.getByText('协作项目')).toBeInTheDocument();
      expect(screen.getByText('进行中')).toBeInTheDocument();
      expect(screen.getByText('公开项目')).toBeInTheDocument();
      
      // Check counts
      expect(screen.getByText('(3)')).toBeInTheDocument(); // all projects
    });
  });

  it('filters projects when switching tabs', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
    
    // Click on "进行中" tab
    const activeTab = screen.getByText('进行中');
    fireEvent.click(activeTab);
    
    await waitFor(() => {
      expect(mockGetProjects).toHaveBeenCalledWith({ status: 'active' });
    });
  });

  it('shows loading state', () => {
    vi.mocked(vi.importActual('@/hooks/useProjectManagement')).useProjectManagement = () => ({
      getProjects: mockGetProjects,
      createProject: mockCreateProject,
      updateProject: mockUpdateProject,
      deleteProject: mockDeleteProject,
      loading: true
    });

    render(<Incubator />);
    
    expect(screen.getByText('加载项目中...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no projects exist', async () => {
    mockGetProjects.mockResolvedValue([]);
    
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('还没有项目')).toBeInTheDocument();
      expect(screen.getByText('创建你的第一个项目，开始将创意转化为现实')).toBeInTheDocument();
      expect(screen.getByText('创建项目')).toBeInTheDocument();
    });
  });

  it('displays project information correctly', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      const project = screen.getByText('AI Chatbot Project').closest('div')!;
      
      expect(project).toContainElement(screen.getByText('进行中'));
      expect(project).toContainElement(screen.getByText('Building an intelligent chatbot for customer service'));
      expect(project).toContainElement(screen.getByText('75%'));
      expect(project).toContainElement(screen.getByText('#ai'));
      expect(project).toContainElement(screen.getByText('#chatbot'));
      expect(project).toContainElement(screen.getByText('#customer-service'));
    });
  });

  it('handles corrupted project data gracefully', async () => {
    const corruptedProjects = [
      ...mockProjects,
      {
        id: null, // Missing ID
        title: 'Invalid Project',
        description: 'Should not appear'
      },
      {
        id: '4',
        title: '', // Empty title
        description: 'Also should not appear'
      },
      {
        id: '5',
        title: 'Valid Project with Missing Data',
        description: null,
        status: null,
        tags: null,
        members: null,
        tasks: null,
        completion_percentage: null
      }
    ];
    
    mockGetProjects.mockResolvedValue(corruptedProjects);
    
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
      expect(screen.getByText('Valid Project with Missing Data')).toBeInTheDocument();
      expect(screen.queryByText('Invalid Project')).not.toBeInTheDocument();
    });
  });

  it('opens create project modal', () => {
    render(<Incubator />);
    
    const createButton = screen.getByText('创建新项目');
    fireEvent.click(createButton);
    
    expect(screen.getByText('项目标题 *')).toBeInTheDocument();
    expect(screen.getByText('项目描述')).toBeInTheDocument();
    expect(screen.getByText('可见性')).toBeInTheDocument();
    expect(screen.getByText('优先级')).toBeInTheDocument();
  });

  it('handles project creation successfully', async () => {
    render(<Incubator />);
    
    const createButton = screen.getByText('创建新项目');
    fireEvent.click(createButton);
    
    // Fill in the form
    const titleInput = screen.getByPlaceholderText('输入项目标题...');
    const descriptionInput = screen.getByPlaceholderText('描述你的项目...');
    
    fireEvent.change(titleInput, { target: { value: 'New Test Project' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    const submitButton = screen.getByText('创建项目');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        title: 'New Test Project',
        description: 'Test description',
        visibility: 'private',
        priority: 'medium',
        tags: [],
        due_date: undefined
      });
    });
    
    expect(mockToast).toHaveBeenCalledWith({
      title: "项目已创建",
      description: "项目 \"New Test Project\" 已成功创建",
    });
  });

  it('validates empty project title', async () => {
    render(<Incubator />);
    
    const createButton = screen.getByText('创建新项目');
    fireEvent.click(createButton);
    
    const submitButton = screen.getByText('创建项目');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "标题不能为空",
        description: "请输入项目标题",
        variant: "destructive",
      });
    });
    
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it('handles project creation error', async () => {
    mockCreateProject.mockRejectedValue(new Error('Creation failed'));
    
    render(<Incubator />);
    
    const createButton = screen.getByText('创建新项目');
    fireEvent.click(createButton);
    
    const titleInput = screen.getByPlaceholderText('输入项目标题...');
    fireEvent.change(titleInput, { target: { value: 'Test Project' } });
    
    const submitButton = screen.getByText('创建项目');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "创建失败",
        description: "Creation failed",
        variant: "destructive",
      });
    });
  });

  it('manages form tags correctly', () => {
    render(<Incubator />);
    
    const createButton = screen.getByText('创建新项目');
    fireEvent.click(createButton);
    
    const tagInput = screen.getByPlaceholderText('添加标签...');
    const addTagButton = screen.getByText('添加');
    
    // Add a tag
    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.click(addTagButton);
    
    expect(screen.getByText('test-tag ×')).toBeInTheDocument();
    
    // Add tag with Enter key
    fireEvent.change(tagInput, { target: { value: 'another-tag' } });
    fireEvent.keyPress(tagInput, { key: 'Enter', charCode: 13 });
    
    expect(screen.getByText('another-tag ×')).toBeInTheDocument();
    
    // Remove a tag
    const firstTag = screen.getByText('test-tag ×');
    fireEvent.click(firstTag);
    
    expect(screen.queryByText('test-tag ×')).not.toBeInTheDocument();
  });

  it('opens project detail modal when project is clicked', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
    
    const projectCard = screen.getByText('AI Chatbot Project').closest('div')!;
    fireEvent.click(projectCard);
    
    expect(screen.getByText('项目详情')).toBeInTheDocument();
    expect(screen.getByText('看板视图')).toBeInTheDocument();
    expect(screen.getByText('时间线')).toBeInTheDocument();
    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('分享')).toBeInTheDocument();
  });

  it('displays project details correctly in modal', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
    
    const projectCard = screen.getByText('AI Chatbot Project').closest('div')!;
    fireEvent.click(projectCard);
    
    await waitFor(() => {
      expect(screen.getByText('Building an intelligent chatbot for customer service')).toBeInTheDocument();
      expect(screen.getByText('任务总数')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('已完成')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed tasks
      expect(screen.getByText('团队成员')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('switches to kanban view from project detail', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
    
    const projectCard = screen.getByText('AI Chatbot Project').closest('div')!;
    fireEvent.click(projectCard);
    
    const kanbanButton = screen.getByText('看板视图');
    fireEvent.click(kanbanButton);
    
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    expect(screen.getByText('Kanban Board for AI Chatbot Project')).toBeInTheDocument();
  });

  it('switches to timeline view from project detail', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
    
    const projectCard = screen.getByText('AI Chatbot Project').closest('div')!;
    fireEvent.click(projectCard);
    
    const timelineButton = screen.getByText('时间线');
    fireEvent.click(timelineButton);
    
    expect(screen.getByTestId('timeline-view')).toBeInTheDocument();
    expect(screen.getByText('Timeline View for AI Chatbot Project')).toBeInTheDocument();
  });

  it('handles project update from kanban view', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
    
    const projectCard = screen.getByText('AI Chatbot Project').closest('div')!;
    fireEvent.click(projectCard);
    
    const kanbanButton = screen.getByText('看板视图');
    fireEvent.click(kanbanButton);
    
    const updateButton = screen.getByText('Update Project');
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "项目已更新",
        description: "项目 \"AI Chatbot Project\" 已成功更新",
      });
    });
  });

  it('handles task and milestone updates in timeline view', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
    
    const projectCard = screen.getByText('AI Chatbot Project').closest('div')!;
    fireEvent.click(projectCard);
    
    const timelineButton = screen.getByText('时间线');
    fireEvent.click(timelineButton);
    
    const updateTaskButton = screen.getByText('Update Task');
    fireEvent.click(updateTaskButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Task updated:', { id: 'task-1', title: 'Test Task' });
    
    const updateMilestoneButton = screen.getByText('Update Milestone');
    fireEvent.click(updateMilestoneButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Milestone updated:', { id: 'milestone-1', title: 'Test Milestone' });
    
    consoleSpy.mockRestore();
  });

  it('returns to project list from detail views', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Chatbot Project')).toBeInTheDocument();
    });
    
    const projectCard = screen.getByText('AI Chatbot Project').closest('div')!;
    fireEvent.click(projectCard);
    
    const kanbanButton = screen.getByText('看板视图');
    fireEvent.click(kanbanButton);
    
    const backButton = screen.getByText('← 返回项目列表');
    fireEvent.click(backButton);
    
    expect(screen.getByText('项目孵化器')).toBeInTheDocument();
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();
  });

  it('switches between view modes', () => {
    render(<Incubator />);
    
    const kanbanViewButton = screen.getAllByText('看板')[0];
    fireEvent.click(kanbanViewButton);
    
    const timelineViewButton = screen.getAllByText('时间线')[0];
    fireEvent.click(timelineViewButton);
    
    const gridViewButton = screen.getByText('网格');
    fireEvent.click(gridViewButton);
    
    // Should stay in grid view (default)
    expect(screen.getByText('项目孵化器')).toBeInTheDocument();
  });

  it('handles project data loading error gracefully', async () => {
    mockGetProjects.mockRejectedValue(new Error('Network error'));
    
    render(<Incubator />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "加载失败",
        description: "Network error",
        variant: "destructive",
      });
    });
    
    // Should show empty state
    expect(screen.getByText('还没有项目')).toBeInTheDocument();
  });

  it('displays correct status colors and texts', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      const activeProject = screen.getByText('进行中');
      expect(activeProject).toHaveClass('bg-green-100', 'text-green-700');
      
      const planningProject = screen.getByText('规划中');
      expect(planningProject).toHaveClass('bg-blue-100', 'text-blue-700');
      
      const completedProject = screen.getByText('已完成');
      expect(completedProject).toHaveClass('bg-purple-100', 'text-purple-700');
    });
  });

  it('displays visibility icons correctly', async () => {
    render(<Incubator />);
    
    await waitFor(() => {
      // Check for Globe icon (public project)
      const publicProject = screen.getByText('Mobile App Development').closest('div')!;
      expect(publicProject.querySelector('[data-lucide="globe"]')).toBeInTheDocument();
      
      // Check for Lock icon (private project)
      const privateProject = screen.getByText('AI Chatbot Project').closest('div')!;
      expect(privateProject.querySelector('[data-lucide="lock"]')).toBeInTheDocument();
    });
  });

  it('handles empty tags, members, and tasks arrays safely', async () => {
    const projectWithEmptyArrays = {
      id: '4',
      title: 'Empty Arrays Project',
      description: 'Project with empty arrays',
      status: 'active',
      visibility: 'private',
      priority: 'medium',
      completion_percentage: 50,
      tags: [],
      members: [],
      tasks: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      owner_id: 'current_user'
    };
    
    mockGetProjects.mockResolvedValue([projectWithEmptyArrays]);
    
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('Empty Arrays Project')).toBeInTheDocument();
    });
    
    // Click on project to open details
    const projectCard = screen.getByText('Empty Arrays Project').closest('div')!;
    fireEvent.click(projectCard);
    
    await waitFor(() => {
      expect(screen.getByText('暂无团队成员')).toBeInTheDocument();
      expect(screen.getByText('暂无标签')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Task count
    });
  });

  it('displays tag overflow correctly', async () => {
    const projectWithManyTags = {
      ...mockProjects[0],
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    };
    
    mockGetProjects.mockResolvedValue([projectWithManyTags]);
    
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('#tag1')).toBeInTheDocument();
      expect(screen.getByText('#tag2')).toBeInTheDocument();
      expect(screen.getByText('#tag3')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument(); // Overflow indicator
    });
  });

  it('handles null/undefined project fields gracefully', async () => {
    const projectWithNulls = {
      id: '5',
      title: 'Project with Nulls',
      description: null,
      status: null,
      visibility: null,
      priority: null,
      completion_percentage: null,
      tags: null,
      members: null,
      tasks: null,
      created_at: null,
      updated_at: null,
      owner_id: 'current_user'
    };
    
    mockGetProjects.mockResolvedValue([projectWithNulls]);
    
    render(<Incubator />);
    
    await waitFor(() => {
      expect(screen.getByText('Project with Nulls')).toBeInTheDocument();
      expect(screen.getByText('暂无描述')).toBeInTheDocument();
      expect(screen.getByText('规划中')).toBeInTheDocument(); // Default status
      expect(screen.getByText('0%')).toBeInTheDocument(); // Default completion
    });
  });
});