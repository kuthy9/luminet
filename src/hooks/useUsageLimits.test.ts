import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useUsageLimits } from './useUsageLimits';

// Mock Supabase
const mockRpc = vi.fn();
const mockSupabase = {
  rpc: mockRpc
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

// Mock useSubscription
const mockSubscription = {
  id: 'sub-1',
  user_id: 'test-user-id',
  tier: 'free',
  status: 'active'
};

vi.mock('./useSubscription', () => ({
  useSubscription: () => ({
    subscription: mockSubscription
  })
}));

const mockUsageData = {
  muse_sessions_used: 5,
  ideas_created: 25,
  projects_created: 2,
  collaborations_initiated: 3,
  ai_enhanced_requests: 0,
  subscription_tier: 'free'
};

describe('useUsageLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: mockUsageData, error: null });
  });

  describe('initialization and data fetching', () => {
    it('fetches usage data successfully', async () => {
      const { result } = renderHook(() => useUsageLimits());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRpc).toHaveBeenCalledWith('get_current_usage', {
        p_user_id: mockUser.id
      });

      expect(result.current.usage).toEqual({
        sparksUsed: 25,
        sparksLimit: 50,
        museUsed: 5,
        museLimit: 10,
        projectsUsed: 2,
        projectsLimit: 3,
        collaborationsUsed: 3,
        collaborationsLimit: 5,
        aiEnhancedUsed: 0,
        aiEnhancedLimit: 0,
        canCreateSpark: true,
        canUseMuse: true,
        canCreateProject: true,
        canInitiateCollaboration: true,
        canUseEnhancedAI: false
      });
    });

    it('handles no user gracefully', async () => {
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: null
      });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockRpc).not.toHaveBeenCalled();
      expect(result.current.usage.canCreateSpark).toBe(true);
    });

    it('handles RPC error gracefully with fallback to defaults', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const rpcError = new Error('RPC failed');
      mockRpc.mockResolvedValue({ data: null, error: rpcError });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Supabase RPC error in checkUsage:', rpcError);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Falling back to default usage limits due to RPC error');

      expect(result.current.usage).toEqual({
        sparksUsed: 0,
        sparksLimit: 50,
        museUsed: 0,
        museLimit: 10,
        projectsUsed: 0,
        projectsLimit: 3,
        collaborationsUsed: 0,
        collaborationsLimit: 5,
        aiEnhancedUsed: 0,
        aiEnhancedLimit: 0,
        canCreateSpark: true,
        canUseMuse: true,
        canCreateProject: true,
        canInitiateCollaboration: true,
        canUseEnhancedAI: false
      });

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('handles general error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking usage:', expect.any(Error));

      expect(result.current.usage).toEqual({
        sparksUsed: 0,
        sparksLimit: 50,
        museUsed: 0,
        museLimit: 10,
        projectsUsed: 0,
        projectsLimit: 3,
        collaborationsUsed: 0,
        collaborationsLimit: 5,
        aiEnhancedUsed: 0,
        aiEnhancedLimit: 0,
        canCreateSpark: true,
        canUseMuse: true,
        canCreateProject: true,
        canInitiateCollaboration: true,
        canUseEnhancedAI: false
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('subscription tier handling', () => {
    it('handles pro tier limits correctly', async () => {
      vi.mocked(vi.importActual('./useSubscription')).useSubscription = () => ({
        subscription: { ...mockSubscription, tier: 'pro' }
      });

      mockRpc.mockResolvedValue({
        data: { ...mockUsageData, subscription_tier: 'pro' },
        error: null
      });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage).toEqual({
        sparksUsed: 25,
        sparksLimit: -1, // unlimited
        museUsed: 5,
        museLimit: 100,
        projectsUsed: 2,
        projectsLimit: -1, // unlimited
        collaborationsUsed: 3,
        collaborationsLimit: -1, // unlimited
        aiEnhancedUsed: 0,
        aiEnhancedLimit: 50,
        canCreateSpark: true,
        canUseMuse: true,
        canCreateProject: true,
        canInitiateCollaboration: true,
        canUseEnhancedAI: true
      });
    });

    it('handles studio tier limits correctly', async () => {
      vi.mocked(vi.importActual('./useSubscription')).useSubscription = () => ({
        subscription: { ...mockSubscription, tier: 'studio' }
      });

      mockRpc.mockResolvedValue({
        data: { ...mockUsageData, subscription_tier: 'studio' },
        error: null
      });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage).toEqual({
        sparksUsed: 25,
        sparksLimit: -1, // unlimited
        museUsed: 5,
        museLimit: -1, // unlimited
        projectsUsed: 2,
        projectsLimit: -1, // unlimited
        collaborationsUsed: 3,
        collaborationsLimit: -1, // unlimited
        aiEnhancedUsed: 0,
        aiEnhancedLimit: -1, // unlimited
        canCreateSpark: true,
        canUseMuse: true,
        canCreateProject: true,
        canInitiateCollaboration: true,
        canUseEnhancedAI: true
      });
    });

    it('uses subscription tier from RPC data when available', async () => {
      vi.mocked(vi.importActual('./useSubscription')).useSubscription = () => ({
        subscription: null // No subscription data
      });

      mockRpc.mockResolvedValue({
        data: { ...mockUsageData, subscription_tier: 'pro' },
        error: null
      });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should use 'pro' limits from RPC data
      expect(result.current.usage.sparksLimit).toBe(-1);
      expect(result.current.usage.canUseEnhancedAI).toBe(true);
    });
  });

  describe('usage limit calculations', () => {
    it('correctly calculates when limits are reached', async () => {
      const maxedOutUsage = {
        muse_sessions_used: 10, // At limit
        ideas_created: 50, // At limit
        projects_created: 3, // At limit
        collaborations_initiated: 5, // At limit
        ai_enhanced_requests: 0,
        subscription_tier: 'free'
      };

      mockRpc.mockResolvedValue({ data: maxedOutUsage, error: null });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage).toEqual({
        sparksUsed: 50,
        sparksLimit: 50,
        museUsed: 10,
        museLimit: 10,
        projectsUsed: 3,
        projectsLimit: 3,
        collaborationsUsed: 5,
        collaborationsLimit: 5,
        aiEnhancedUsed: 0,
        aiEnhancedLimit: 0,
        canCreateSpark: false, // At limit
        canUseMuse: false, // At limit
        canCreateProject: false, // At limit
        canInitiateCollaboration: false, // At limit
        canUseEnhancedAI: false
      });
    });

    it('correctly calculates when limits are exceeded', async () => {
      const exceededUsage = {
        muse_sessions_used: 15, // Over limit
        ideas_created: 60, // Over limit
        projects_created: 5, // Over limit
        collaborations_initiated: 8, // Over limit
        ai_enhanced_requests: 1,
        subscription_tier: 'free'
      };

      mockRpc.mockResolvedValue({ data: exceededUsage, error: null });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage).toEqual({
        sparksUsed: 60,
        sparksLimit: 50,
        museUsed: 15,
        museLimit: 10,
        projectsUsed: 5,
        projectsLimit: 3,
        collaborationsUsed: 8,
        collaborationsLimit: 5,
        aiEnhancedUsed: 1,
        aiEnhancedLimit: 0,
        canCreateSpark: false,
        canUseMuse: false,
        canCreateProject: false,
        canInitiateCollaboration: false,
        canUseEnhancedAI: false
      });
    });

    it('handles unlimited tiers correctly', async () => {
      vi.mocked(vi.importActual('./useSubscription')).useSubscription = () => ({
        subscription: { ...mockSubscription, tier: 'pro' }
      });

      const highUsage = {
        muse_sessions_used: 150, // High usage
        ideas_created: 1000, // High usage
        projects_created: 50, // High usage
        collaborations_initiated: 100, // High usage
        ai_enhanced_requests: 25,
        subscription_tier: 'pro'
      };

      mockRpc.mockResolvedValue({ data: highUsage, error: null });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage).toEqual({
        sparksUsed: 1000,
        sparksLimit: -1, // unlimited
        museUsed: 150,
        museLimit: 100,
        projectsUsed: 50,
        projectsLimit: -1, // unlimited
        collaborationsUsed: 100,
        collaborationsLimit: -1, // unlimited
        aiEnhancedUsed: 25,
        aiEnhancedLimit: 50,
        canCreateSpark: true, // unlimited
        canUseMuse: false, // over limit
        canCreateProject: true, // unlimited
        canInitiateCollaboration: true, // unlimited
        canUseEnhancedAI: true // under limit
      });
    });
  });

  describe('data sanitization', () => {
    it('handles corrupted usage data gracefully', async () => {
      const corruptedUsage = {
        muse_sessions_used: 'invalid', // String instead of number
        ideas_created: null, // Null value
        projects_created: undefined, // Undefined value
        collaborations_initiated: -5, // Negative value
        ai_enhanced_requests: 'NaN',
        subscription_tier: 'free'
      };

      mockRpc.mockResolvedValue({ data: corruptedUsage, error: null });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage).toEqual({
        sparksUsed: 0, // Sanitized from null
        sparksLimit: 50,
        museUsed: 0, // Sanitized from 'invalid'
        museLimit: 10,
        projectsUsed: 0, // Sanitized from undefined
        projectsLimit: 3,
        collaborationsUsed: 0, // Sanitized from -5
        collaborationsLimit: 5,
        aiEnhancedUsed: 0, // Sanitized from 'NaN'
        aiEnhancedLimit: 0,
        canCreateSpark: true,
        canUseMuse: true,
        canCreateProject: true,
        canInitiateCollaboration: true,
        canUseEnhancedAI: false
      });
    });

    it('handles array response format', async () => {
      const arrayResponse = [mockUsageData]; // RPC sometimes returns array

      mockRpc.mockResolvedValue({ data: arrayResponse, error: null });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage.sparksUsed).toBe(25);
      expect(result.current.usage.museUsed).toBe(5);
    });

    it('handles empty response gracefully', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage).toEqual({
        sparksUsed: 0,
        sparksLimit: 50,
        museUsed: 0,
        museLimit: 10,
        projectsUsed: 0,
        projectsLimit: 3,
        collaborationsUsed: 0,
        collaborationsLimit: 5,
        aiEnhancedUsed: 0,
        aiEnhancedLimit: 0,
        canCreateSpark: true,
        canUseMuse: true,
        canCreateProject: true,
        canInitiateCollaboration: true,
        canUseEnhancedAI: false
      });
    });
  });

  describe('checkUsage function', () => {
    it('allows manual refresh of usage data', async () => {
      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.usage.sparksUsed).toBe(25);

      // Update mock data
      const updatedUsage = { ...mockUsageData, ideas_created: 30 };
      mockRpc.mockResolvedValue({ data: updatedUsage, error: null });

      await act(async () => {
        await result.current.checkUsage();
      });

      expect(result.current.usage.sparksUsed).toBe(30);
    });

    it('handles manual refresh error gracefully', async () => {
      const { result } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockRejectedValue(new Error('Refresh failed'));

      await act(async () => {
        await result.current.checkUsage();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking usage:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('effect dependencies', () => {
    it('refetches data when user changes', async () => {
      const { rerender } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('get_current_usage', {
          p_user_id: mockUser.id
        });
      });

      // Change user
      const newUser = { id: 'new-user-id', email: 'new@example.com' };
      vi.mocked(vi.importActual('./useAuth')).useAuth = () => ({
        user: newUser
      });

      rerender();

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('get_current_usage', {
          p_user_id: newUser.id
        });
      });
    });

    it('refetches data when subscription changes', async () => {
      const { rerender } = renderHook(() => useUsageLimits());

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledTimes(1);
      });

      // Change subscription
      vi.mocked(vi.importActual('./useSubscription')).useSubscription = () => ({
        subscription: { ...mockSubscription, tier: 'pro' }
      });

      rerender();

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('helper functions', () => {
    it('returns correct limits for free tier', () => {
      const { result } = renderHook(() => useUsageLimits());
      
      // Access the internal function through the hook's behavior
      // We test this indirectly through the main functionality
      expect(result.current.usage.sparksLimit).toBe(50); // free tier limit
      expect(result.current.usage.aiEnhancedLimit).toBe(0); // free tier AI limit
    });
  });
});