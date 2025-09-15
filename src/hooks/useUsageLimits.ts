
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

interface UsageLimits {
  sparksUsed: number;
  sparksLimit: number;
  museUsed: number;
  museLimit: number;
  projectsUsed: number;
  projectsLimit: number;
  collaborationsUsed: number;
  collaborationsLimit: number;
  aiEnhancedUsed: number;
  aiEnhancedLimit: number;
  canCreateSpark: boolean;
  canUseMuse: boolean;
  canCreateProject: boolean;
  canInitiateCollaboration: boolean;
  canUseEnhancedAI: boolean;
}

export const useUsageLimits = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [usage, setUsage] = useState<UsageLimits>({
    sparksUsed: 0,
    sparksLimit: 10,
    museUsed: 0,
    museLimit: 3,
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
    canUseEnhancedAI: false,
  });
  const [loading, setLoading] = useState(true);

  const checkUsage = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 使用新的数据库函数获取使用量
      const { data, error } = await supabase.rpc('get_current_usage', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Supabase RPC error in checkUsage:', error);
        // Fall back to graceful defaults if the RPC fails
        console.warn('Falling back to default usage limits due to RPC error');
        
        const tier = subscription?.tier || 'free';
        const limits = getLimitsForTier(tier);
        
        setUsage({
          sparksUsed: 0,
          sparksLimit: limits.ideas,
          museUsed: 0,
          museLimit: limits.muse_sessions,
          projectsUsed: 0,
          projectsLimit: limits.projects,
          collaborationsUsed: 0,
          collaborationsLimit: limits.collaborations,
          aiEnhancedUsed: 0,
          aiEnhancedLimit: limits.ai_enhanced,
          canCreateSpark: true,
          canUseMuse: true,
          canCreateProject: true,
          canInitiateCollaboration: true,
          canUseEnhancedAI: limits.ai_enhanced > 0 || limits.ai_enhanced === -1,
        });
        return;
      }

      const currentUsage = (Array.isArray(data) ? data[0] : data) || {
        muse_sessions_used: 0,
        ideas_created: 0,
        projects_created: 0,
        collaborations_initiated: 0,
        ai_enhanced_requests: 0,
        subscription_tier: 'free',
      };

      // Ensure all usage values are numbers
      const safeUsage = {
        muse_sessions_used: Math.max(0, parseInt(currentUsage.muse_sessions_used) || 0),
        ideas_created: Math.max(0, parseInt(currentUsage.ideas_created) || 0),
        projects_created: Math.max(0, parseInt(currentUsage.projects_created) || 0),
        collaborations_initiated: Math.max(0, parseInt(currentUsage.collaborations_initiated) || 0),
        ai_enhanced_requests: Math.max(0, parseInt(currentUsage.ai_enhanced_requests) || 0),
        subscription_tier: currentUsage.subscription_tier || 'free',
      };

      // 根据订阅设置限制
      const tier = subscription?.tier || safeUsage.subscription_tier || 'free';
      const limits = getLimitsForTier(tier);

      setUsage({
        sparksUsed: safeUsage.ideas_created,
        sparksLimit: limits.ideas,
        museUsed: safeUsage.muse_sessions_used,
        museLimit: limits.muse_sessions,
        projectsUsed: safeUsage.projects_created,
        projectsLimit: limits.projects,
        collaborationsUsed: safeUsage.collaborations_initiated,
        collaborationsLimit: limits.collaborations,
        aiEnhancedUsed: safeUsage.ai_enhanced_requests,
        aiEnhancedLimit: limits.ai_enhanced,
        canCreateSpark: safeUsage.ideas_created < limits.ideas || limits.ideas === -1,
        canUseMuse: safeUsage.muse_sessions_used < limits.muse_sessions || limits.muse_sessions === -1,
        canCreateProject: safeUsage.projects_created < limits.projects || limits.projects === -1,
        canInitiateCollaboration: safeUsage.collaborations_initiated < limits.collaborations || limits.collaborations === -1,
        canUseEnhancedAI: safeUsage.ai_enhanced_requests < limits.ai_enhanced || limits.ai_enhanced === -1,
      });
    } catch (error: any) {
      console.error('Error checking usage:', error);
      
      // Set safe defaults on any error
      const tier = subscription?.tier || 'free';
      const limits = getLimitsForTier(tier);
      
      setUsage({
        sparksUsed: 0,
        sparksLimit: limits.ideas,
        museUsed: 0,
        museLimit: limits.muse_sessions,
        projectsUsed: 0,
        projectsLimit: limits.projects,
        collaborationsUsed: 0,
        collaborationsLimit: limits.collaborations,
        aiEnhancedUsed: 0,
        aiEnhancedLimit: limits.ai_enhanced,
        canCreateSpark: true,
        canUseMuse: true,
        canCreateProject: true,
        canInitiateCollaboration: true,
        canUseEnhancedAI: limits.ai_enhanced > 0 || limits.ai_enhanced === -1,
      });
    } finally {
      setLoading(false);
    }
  };

  const getLimitsForTier = (tier: string) => {
    switch (tier) {
      case 'pro':
        return {
          ideas: -1, // 无限制
          muse_sessions: 100,
          projects: -1,
          collaborations: -1,
          ai_enhanced: 50,
        };
      case 'studio':
        return {
          ideas: -1,
          muse_sessions: -1,
          projects: -1,
          collaborations: -1,
          ai_enhanced: -1,
        };
      default: // free
        return {
          ideas: 50,
          muse_sessions: 10,
          projects: 3,
          collaborations: 5,
          ai_enhanced: 0,
        };
    }
  };

  const getNextMonth = (monthString: string) => {
    const [year, month] = monthString.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    checkUsage();
  }, [user, subscription]);

  return {
    usage,
    loading,
    checkUsage,
  };
};
