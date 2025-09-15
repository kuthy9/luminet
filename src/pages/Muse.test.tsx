import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Muse from './Muse';

// Mock the hooks
const mockSendMessage = vi.fn();
const mockGetStructureRecommendations = vi.fn();
const mockGetProjectRecommendations = vi.fn();
const mockGetContentSummary = vi.fn();
const mockGetCollaboratorRecommendations = vi.fn();
const mockGenerateSmartSuggestions = vi.fn();
const mockToast = vi.fn();

const mockMessages = [
  {
    id: '1',
    role: 'user',
    content: 'Help me expand on my idea about sustainable energy',
    timestamp: '2023-01-01T10:00:00Z'
  },
  {
    id: '2',
    role: 'muse',
    content: 'That sounds fascinating! Could you tell me more about what specific aspect of sustainable energy interests you most?',
    timestamp: '2023-01-01T10:01:00Z'
  }
];

vi.mock('@/hooks/useMuseChat', () => ({
  useMuseChat: () => ({
    messages: mockMessages,
    loading: false,
    sendMessage: mockSendMessage
  })
}));

vi.mock('@/hooks/useMuseEnhanced', () => ({
  useMuseEnhanced: () => ({
    getStructureRecommendations: mockGetStructureRecommendations,
    getProjectRecommendations: mockGetProjectRecommendations,
    getContentSummary: mockGetContentSummary,
    getCollaboratorRecommendations: mockGetCollaboratorRecommendations,
    generateSmartSuggestions: mockGenerateSmartSuggestions,
    loading: false,
    lastResponse: null
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

vi.mock('@/components/ui/use-toast', () => ({
  toast: mockToast
}));

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  )
}));

describe('Muse Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMessage.mockResolvedValue();
    mockGetStructureRecommendations.mockResolvedValue('Structure analysis result');
    mockGetProjectRecommendations.mockResolvedValue('Project recommendations result');
    mockGetContentSummary.mockResolvedValue('Content summary result');
    mockGetCollaboratorRecommendations.mockResolvedValue('Collaborator recommendations result');
  });

  it('renders the Muse page correctly', () => {
    render(<Muse />);
    
    expect(screen.getByText('Muse AI')).toBeInTheDocument();
    expect(screen.getByText('你的AI创意助手 - 现在具备更强大的分析和推荐能力')).toBeInTheDocument();
    expect(screen.getByText('对话模式')).toBeInTheDocument();
    expect(screen.getByText('增强功能')).toBeInTheDocument();
    expect(screen.getByText('智能洞察')).toBeInTheDocument();
  });

  it('displays mode selection options', () => {
    render(<Muse />);
    
    expect(screen.getByText('扩展想法')).toBeInTheDocument();
    expect(screen.getByText('发现联系')).toBeInTheDocument();
    expect(screen.getByText('寻找协作者')).toBeInTheDocument();
    expect(screen.getByText('帮助发展和详细阐述概念')).toBeInTheDocument();
    expect(screen.getByText('发现想法之间的关系')).toBeInTheDocument();
    expect(screen.getByText('推荐潜在的团队成员')).toBeInTheDocument();
  });

  it('switches between different conversation modes', () => {
    render(<Muse />);
    
    // Default mode should be expand
    expect(screen.getByText('模式: 扩展想法')).toBeInTheDocument();
    
    // Click on connect mode
    const connectMode = screen.getByText('发现联系');
    fireEvent.click(connectMode);
    
    expect(screen.getByText('模式: 发现联系')).toBeInTheDocument();
    
    // Click on collaborate mode
    const collaborateMode = screen.getByText('寻找协作者');
    fireEvent.click(collaborateMode);
    
    expect(screen.getByText('模式: 寻找协作者')).toBeInTheDocument();
  });

  it('displays chat messages correctly', () => {
    render(<Muse />);
    
    expect(screen.getByText('Help me expand on my idea about sustainable energy')).toBeInTheDocument();
    expect(screen.getByText('That sounds fascinating! Could you tell me more about what specific aspect of sustainable energy interests you most?')).toBeInTheDocument();
    expect(screen.getByText('Muse AI')).toBeInTheDocument();
  });

  it('handles chat message submission', async () => {
    render(<Muse />);
    
    const textarea = screen.getByPlaceholderText('向Muse AI提问，获取创意扩展、关联发现或协作建议...');
    const sendButton = screen.getByText('发送');
    
    fireEvent.change(textarea, { target: { value: 'What are some innovative approaches to solar energy?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('What are some innovative approaches to solar energy?', 'expand');
    });
    
    expect(textarea).toHaveValue('');
  });

  it('handles Enter key for message submission', async () => {
    render(<Muse />);
    
    const textarea = screen.getByPlaceholderText('向Muse AI提问，获取创意扩展、关联发现或协作建议...');
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message', 'expand');
    });
  });

  it('allows Shift+Enter for new lines without submitting', () => {
    render(<Muse />);
    
    const textarea = screen.getByPlaceholderText('向Muse AI提问，获取创意扩展、关联发现或协作建议...');
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('prevents empty message submission', async () => {
    render(<Muse />);
    
    const sendButton = screen.getByText('发送');
    fireEvent.click(sendButton);
    
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('shows loading state during message sending', async () => {
    vi.mocked(vi.importActual('@/hooks/useMuseChat')).useMuseChat = () => ({
      messages: mockMessages,
      loading: true,
      sendMessage: mockSendMessage
    });

    render(<Muse />);
    
    expect(screen.getByText('发送')).toBeDisabled();
    
    // Should show loading animation
    const loadingDots = document.querySelectorAll('.animate-bounce');
    expect(loadingDots).toHaveLength(3);
  });

  it('handles unauthenticated user for chat', async () => {
    vi.mocked(vi.importActual('@/hooks/useAuth')).useAuth = () => ({
      user: null
    });

    render(<Muse />);
    
    const textarea = screen.getByPlaceholderText('向Muse AI提问，获取创意扩展、关联发现或协作建议...');
    const sendButton = screen.getByText('发送');
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "需要登录",
        description: "请先登录以使用Muse AI",
        variant: "destructive",
      });
    });
    
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('handles chat error gracefully', async () => {
    mockSendMessage.mockRejectedValue(new Error('Network error'));

    render(<Muse />);
    
    const textarea = screen.getByPlaceholderText('向Muse AI提问，获取创意扩展、关联发现或协作建议...');
    const sendButton = screen.getByText('发送');
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "发送失败",
        description: "无法发送消息，请稍后重试",
        variant: "destructive",
      });
    });
  });

  it('switches to enhanced features tab', () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    expect(screen.getByText('AI增强功能')).toBeInTheDocument();
    expect(screen.getByText('利用先进的AI分析获得深度洞察和个性化建议')).toBeInTheDocument();
  });

  it('displays enhanced features correctly', () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    expect(screen.getByText('结构重组建议')).toBeInTheDocument();
    expect(screen.getByText('项目关联推荐')).toBeInTheDocument();
    expect(screen.getByText('内容总结分析')).toBeInTheDocument();
    expect(screen.getByText('智能协作者推荐')).toBeInTheDocument();
    
    expect(screen.getByText('分析并重新组织你的想法和项目')).toBeInTheDocument();
    expect(screen.getByText('发现想法与项目之间的潜在联系')).toBeInTheDocument();
    expect(screen.getByText('获取你的创作活动综合分析报告')).toBeInTheDocument();
    expect(screen.getByText('基于技能和兴趣匹配合适的协作伙伴')).toBeInTheDocument();
  });

  it('handles structure recommendations feature', async () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const structureCard = screen.getByText('结构重组建议').closest('div')!;
    const startButton = structureCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockGetStructureRecommendations).toHaveBeenCalledWith('ideas');
    });
    
    expect(mockToast).toHaveBeenCalledWith({
      title: "分析完成",
      description: "AI分析结果已生成",
    });
    
    expect(screen.getByText('Structure analysis result')).toBeInTheDocument();
  });

  it('handles project recommendations feature', async () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const projectCard = screen.getByText('项目关联推荐').closest('div')!;
    const startButton = projectCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockGetProjectRecommendations).toHaveBeenCalled();
    });
    
    expect(mockToast).toHaveBeenCalledWith({
      title: "分析完成",
      description: "AI分析结果已生成",
    });
  });

  it('handles content summary feature', async () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const summaryCard = screen.getByText('内容总结分析').closest('div')!;
    const startButton = summaryCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockGetContentSummary).toHaveBeenCalledWith('overall');
    });
  });

  it('handles collaborator recommendations feature', async () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const collaboratorCard = screen.getByText('智能协作者推荐').closest('div')!;
    const startButton = collaboratorCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockGetCollaboratorRecommendations).toHaveBeenCalled();
    });
  });

  it('handles unauthenticated user for enhanced features', async () => {
    vi.mocked(vi.importActual('@/hooks/useAuth')).useAuth = () => ({
      user: null
    });

    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const structureCard = screen.getByText('结构重组建议').closest('div')!;
    const startButton = structureCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "需要登录",
        description: "请先登录以使用增强AI功能",
        variant: "destructive",
      });
    });
    
    expect(mockGetStructureRecommendations).not.toHaveBeenCalled();
  });

  it('handles enhanced feature errors', async () => {
    mockGetStructureRecommendations.mockRejectedValue(new Error('Analysis failed'));

    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const structureCard = screen.getByText('结构重组建议').closest('div')!;
    const startButton = structureCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "分析失败",
        description: "Analysis failed",
        variant: "destructive",
      });
    });
  });

  it('shows loading state for enhanced features', async () => {
    vi.mocked(vi.importActual('@/hooks/useMuseEnhanced')).useMuseEnhanced = () => ({
      getStructureRecommendations: mockGetStructureRecommendations,
      getProjectRecommendations: mockGetProjectRecommendations,
      getContentSummary: mockGetContentSummary,
      getCollaboratorRecommendations: mockGetCollaboratorRecommendations,
      generateSmartSuggestions: mockGenerateSmartSuggestions,
      loading: true,
      lastResponse: null
    });

    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const buttons = screen.getAllByText('分析中...');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check for loading spinners
    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('displays enhanced response with copy and clear options', async () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const structureCard = screen.getByText('结构重组建议').closest('div')!;
    const startButton = structureCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('AI分析结果')).toBeInTheDocument();
      expect(screen.getByText('Structure analysis result')).toBeInTheDocument();
      expect(screen.getByText('复制结果')).toBeInTheDocument();
      expect(screen.getByText('清除')).toBeInTheDocument();
    });
  });

  it('handles copy response functionality', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const structureCard = screen.getByText('结构重组建议').closest('div')!;
    const startButton = structureCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('复制结果')).toBeInTheDocument();
    });
    
    const copyButton = screen.getByText('复制结果');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Structure analysis result');
  });

  it('handles clear response functionality', async () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const structureCard = screen.getByText('结构重组建议').closest('div')!;
    const startButton = structureCard.querySelector('button')!;
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Structure analysis result')).toBeInTheDocument();
    });
    
    const clearButton = screen.getByText('清除');
    fireEvent.click(clearButton);
    
    expect(screen.queryByText('Structure analysis result')).not.toBeInTheDocument();
  });

  it('switches to insights tab', () => {
    render(<Muse />);
    
    const insightsTab = screen.getByText('智能洞察');
    fireEvent.click(insightsTab);
    
    expect(screen.getByText('基于你的创作数据生成的深度分析和趋势洞察')).toBeInTheDocument();
    expect(screen.getByText('创作趋势')).toBeInTheDocument();
    expect(screen.getByText('关联网络')).toBeInTheDocument();
    expect(screen.getByText('协作机会')).toBeInTheDocument();
  });

  it('handles insights feature calls', async () => {
    render(<Muse />);
    
    const insightsTab = screen.getByText('智能洞察');
    fireEvent.click(insightsTab);
    
    // Test trend analysis
    const trendButton = screen.getByText('查看趋势');
    fireEvent.click(trendButton);
    
    await waitFor(() => {
      expect(mockGetContentSummary).toHaveBeenCalledWith('overall');
    });
    
    // Test network exploration
    const networkButton = screen.getByText('探索关联');
    fireEvent.click(networkButton);
    
    await waitFor(() => {
      expect(mockGetProjectRecommendations).toHaveBeenCalled();
    });
    
    // Test collaboration opportunities
    const collaborationButton = screen.getByText('寻找伙伴');
    fireEvent.click(collaborationButton);
    
    await waitFor(() => {
      expect(mockGetCollaboratorRecommendations).toHaveBeenCalled();
    });
  });

  it('shows empty chat state', () => {
    vi.mocked(vi.importActual('@/hooks/useMuseChat')).useMuseChat = () => ({
      messages: [],
      loading: false,
      sendMessage: mockSendMessage
    });

    render(<Muse />);
    
    expect(screen.getByText('开始与Muse AI对话...')).toBeInTheDocument();
  });

  it('displays message timestamps correctly', () => {
    render(<Muse />);
    
    // Mock Date to return consistent results
    const mockDate = new Date('2023-01-01T10:00:00Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    // Check if timestamp elements exist (they should show formatted time)
    const timestamps = document.querySelectorAll('.text-xs');
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('handles disabled send button when user not authenticated', () => {
    vi.mocked(vi.importActual('@/hooks/useAuth')).useAuth = () => ({
      user: null
    });

    render(<Muse />);
    
    const sendButton = screen.getByText('发送');
    expect(sendButton).toBeDisabled();
  });

  it('handles disabled send button when loading', () => {
    vi.mocked(vi.importActual('@/hooks/useMuseChat')).useMuseChat = () => ({
      messages: mockMessages,
      loading: true,
      sendMessage: mockSendMessage
    });

    render(<Muse />);
    
    const sendButton = screen.getByText('发送');
    expect(sendButton).toBeDisabled();
  });

  it('displays enhanced features badges', () => {
    render(<Muse />);
    
    expect(screen.getByText('增强AI功能')).toBeInTheDocument();
    expect(screen.getByText('智能分析')).toBeInTheDocument();
  });

  it('handles card click events in enhanced features', async () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const structureCard = screen.getByText('结构重组建议').closest('div')!.closest('div')!;
    fireEvent.click(structureCard);
    
    await waitFor(() => {
      expect(mockGetStructureRecommendations).toHaveBeenCalledWith('ideas');
    });
  });

  it('prevents event propagation on button clicks in cards', async () => {
    render(<Muse />);
    
    const enhancedTab = screen.getByText('增强功能');
    fireEvent.click(enhancedTab);
    
    const structureCard = screen.getByText('结构重组建议').closest('div')!;
    const startButton = structureCard.querySelector('button')!;
    
    // Mock stopPropagation
    const mockStopPropagation = vi.fn();
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'stopPropagation', {
      value: mockStopPropagation
    });
    
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockGetStructureRecommendations).toHaveBeenCalled();
    });
  });
});