import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Spark from './Spark';

// Mock the hooks
const mockCreateIdea = vi.fn();
const mockCheckUsage = vi.fn();
const mockToast = vi.fn();

vi.mock('@/hooks/useIdeas', () => ({
  useIdeas: () => ({
    createIdea: mockCreateIdea,
    loading: false
  })
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

vi.mock('@/hooks/useUsageLimits', () => ({
  useUsageLimits: () => ({
    usage: {
      canCreateSpark: true,
      sparksUsed: 5,
      sparksLimit: 50
    },
    checkUsage: mockCheckUsage
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

describe('Spark Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateIdea.mockResolvedValue({
      id: 'test-idea-id',
      content: 'Test idea',
      keywords: ['test'],
      mood: 'excited',
      idea_type: 'detailed'
    });
  });

  it('renders the spark page correctly', () => {
    render(<Spark />);
    
    expect(screen.getByText('spark.title')).toBeInTheDocument();
    expect(screen.getByText('Transform thoughts into visual nodes')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share an idea, insight, or inspiration...')).toBeInTheDocument();
    expect(screen.getByText('Capture Spark')).toBeInTheDocument();
  });

  it('shows usage statistics when user can create sparks', () => {
    render(<Spark />);
    
    expect(screen.getByText('Sparks used this month: 5 / 50')).toBeInTheDocument();
  });

  it('shows usage limit warning when limit is reached', () => {
    vi.mocked(vi.importActual('@/hooks/useUsageLimits')).useUsageLimits = () => ({
      usage: {
        canCreateSpark: false,
        sparksUsed: 50,
        sparksLimit: 50
      },
      checkUsage: mockCheckUsage
    });

    render(<Spark />);
    
    expect(screen.getByText('Spark Limit Reached')).toBeInTheDocument();
    expect(screen.getByText("You've used all 50 sparks this month. Upgrade to Pro for unlimited sparks!")).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    fireEvent.change(textarea, { target: { value: 'This is my amazing idea!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateIdea).toHaveBeenCalledWith('This is my amazing idea!', {
        keywords: ['This', 'amazing', 'idea!'],
        mood: 'excited',
        idea_type: 'concise',
        color_signature: expect.any(String)
      });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: '✨ Spark captured!',
      description: 'Your idea has been transformed into a visual node'
    });

    expect(mockCheckUsage).toHaveBeenCalled();
  });

  it('shows character count', () => {
    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    expect(screen.getByText('11/500 characters')).toBeInTheDocument();
  });

  it('handles empty form submission', async () => {
    render(<Spark />);
    
    const submitButton = screen.getByText('Capture Spark');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Empty spark',
        description: 'Please enter a thought before submitting',
        variant: 'destructive'
      });
    });

    expect(mockCreateIdea).not.toHaveBeenCalled();
  });

  it('handles unauthenticated user', async () => {
    vi.mocked(vi.importActual('@/hooks/useAuth')).useAuth = () => ({
      user: null
    });

    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    fireEvent.change(textarea, { target: { value: 'Test idea' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Authentication required',
        description: 'Please sign in to create sparks',
        variant: 'destructive'
      });
    });

    expect(mockCreateIdea).not.toHaveBeenCalled();
  });

  it('handles usage limit reached', async () => {
    vi.mocked(vi.importActual('@/hooks/useUsageLimits')).useUsageLimits = () => ({
      usage: {
        canCreateSpark: false,
        sparksUsed: 50,
        sparksLimit: 50
      },
      checkUsage: mockCheckUsage
    });

    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    fireEvent.change(textarea, { target: { value: 'Test idea' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Spark limit reached',
        description: "You've used all 50 sparks this month. Upgrade to Pro for unlimited sparks!",
        variant: 'destructive'
      });
    });

    expect(mockCreateIdea).not.toHaveBeenCalled();
  });

  it('handles idea creation error', async () => {
    mockCreateIdea.mockRejectedValue(new Error('Failed to create idea'));

    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    fireEvent.change(textarea, { target: { value: 'Test idea' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create spark. Please try again.',
        variant: 'destructive'
      });
    });
  });

  it('shows loading state during submission', async () => {
    let resolvePromise: (value: any) => void;
    const createIdeaPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockCreateIdea.mockReturnValue(createIdeaPromise);

    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    fireEvent.change(textarea, { target: { value: 'Test idea' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    resolvePromise!({
      id: 'test-id',
      content: 'Test idea',
      keywords: ['test'],
      mood: 'contemplative',
      idea_type: 'concise'
    });
    
    await waitFor(() => {
      expect(screen.getByText('Capture Spark')).toBeInTheDocument();
    });
  });

  it('analyzes thought mood correctly', async () => {
    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    // Test excited mood
    fireEvent.change(textarea, { target: { value: 'This is amazing!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateIdea).toHaveBeenCalledWith('This is amazing!', {
        keywords: ['This', 'amazing!'],
        mood: 'excited',
        idea_type: 'concise',
        color_signature: expect.any(String)
      });
    });

    vi.clearAllMocks();
    
    // Test curious mood
    fireEvent.change(textarea, { target: { value: 'What if we could?' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateIdea).toHaveBeenCalledWith('What if we could?', {
        keywords: ['What', 'could?'],
        mood: 'curious',
        idea_type: 'concise',
        color_signature: expect.any(String)
      });
    });
  });

  it('determines idea type based on length', async () => {
    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    // Test detailed type (>100 characters)
    const longText = 'This is a very long idea that contains many words and should be classified as detailed because it exceeds one hundred characters in total length.';
    fireEvent.change(textarea, { target: { value: longText } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateIdea).toHaveBeenCalledWith(longText, {
        keywords: ['This', 'very', 'long', 'idea', 'that'],
        mood: 'contemplative',
        idea_type: 'detailed',
        color_signature: expect.any(String)
      });
    });
  });

  it('extracts keywords correctly', async () => {
    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    fireEvent.change(textarea, { target: { value: 'artificial intelligence machine learning deep neural networks' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateIdea).toHaveBeenCalledWith('artificial intelligence machine learning deep neural networks', {
        keywords: ['artificial', 'intelligence', 'machine', 'learning', 'deep'],
        mood: 'contemplative',
        idea_type: 'concise',
        color_signature: expect.any(String)
      });
    });
  });

  it('shows how it works section', () => {
    render(<Spark />);
    
    expect(screen.getByText('Capture Ideas')).toBeInTheDocument();
    expect(screen.getByText('Write down any thought, no matter how small')).toBeInTheDocument();
    expect(screen.getByText('Auto-Enhancement')).toBeInTheDocument();
    expect(screen.getByText('AI analyzes and tags your ideas automatically')).toBeInTheDocument();
    expect(screen.getByText('Visual Nodes')).toBeInTheDocument();
    expect(screen.getByText('Ideas become interactive nodes in your mesh')).toBeInTheDocument();
  });

  it('disables submit when conditions are not met', () => {
    vi.mocked(vi.importActual('@/hooks/useAuth')).useAuth = () => ({
      user: null
    });

    render(<Spark />);
    
    const submitButton = screen.getByText('Capture Spark');
    expect(submitButton).toBeDisabled();
  });

  it('clears form after successful submission', async () => {
    render(<Spark />);
    
    const textarea = screen.getByPlaceholderText('Share an idea, insight, or inspiration...');
    const submitButton = screen.getByText('Capture Spark');
    
    fireEvent.change(textarea, { target: { value: 'Test idea' } });
    expect(textarea).toHaveValue('Test idea');
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
});