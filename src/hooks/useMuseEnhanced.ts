import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUsageLimits } from './useUsageLimits';

// =============================================
// 类型定义
// =============================================

export interface StructureRecommendation {
  type: 'ideas' | 'projects';
  content: string;
  timestamp: string;
}

export interface ProjectRecommendation {
  ideaId?: string;
  content: string;
  timestamp: string;
}

export interface ContentSummary {
  type: 'ideas' | 'projects' | 'overall';
  content: string;
  timestamp: string;
}

export interface CollaboratorRecommendation {
  projectId?: string;
  content: string;
  timestamp: string;
}

export interface EnhancedMuseResponse {
  content: string;
  type: 'structure' | 'project' | 'summary' | 'collaborator';
  metadata?: Record<string, any>;
  timestamp: string;
}

// =============================================
// 增强版 Muse Hook
// =============================================

export const useMuseEnhanced = () => {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<EnhancedMuseResponse | null>(null);
  const { user } = useAuth();
  const { usage, checkUsage } = useUsageLimits();

  // =============================================
  // 通用 AI 调用函数
  // =============================================

  const callEnhancedAI = async (
    action: string,
    params: Record<string, any> = {}
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    if (!usage.canUseMuse) {
      throw new Error(`You've used all ${usage.museLimit} Muse AI sessions this month. Upgrade to Pro for unlimited access!`);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('muse-ai-enhanced', {
        body: {
          action,
          ...params,
        },
      });

      if (error) throw error;

      // 更新最后响应
      const response: EnhancedMuseResponse = {
        content: data.response,
        type: action.includes('structure') ? 'structure' : 
              action.includes('project') ? 'project' :
              action.includes('summary') ? 'summary' : 'collaborator',
        metadata: params,
        timestamp: new Date().toISOString(),
      };
      setLastResponse(response);

      // 刷新使用量
      checkUsage();

      return data.response;
    } catch (error) {
      console.error('Enhanced Muse AI error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // 结构重组建议
  // =============================================

  const getStructureRecommendations = async (
    type: 'ideas' | 'projects' = 'ideas'
  ): Promise<string> => {
    const action = type === 'ideas' ? 'structure_recommendations' : 'project_structure_recommendations';
    return await callEnhancedAI(action);
  };

  // =============================================
  // 项目关联推荐
  // =============================================

  const getProjectRecommendations = async (ideaId?: string): Promise<string> => {
    return await callEnhancedAI('project_recommendations', { idea_id: ideaId });
  };

  // =============================================
  // 内容总结功能
  // =============================================

  const getContentSummary = async (
    summaryType: 'ideas' | 'projects' | 'overall' = 'overall'
  ): Promise<string> => {
    return await callEnhancedAI('content_summary', { summary_type: summaryType });
  };

  // =============================================
  // 智能协作者推荐
  // =============================================

  const getCollaboratorRecommendations = async (projectId?: string): Promise<string> => {
    return await callEnhancedAI('collaborator_recommendations', { project_id: projectId });
  };

  // =============================================
  // 批量分析功能
  // =============================================

  const getComprehensiveAnalysis = async (): Promise<{
    structureRecommendations: string;
    projectRecommendations: string;
    contentSummary: string;
    collaboratorRecommendations: string;
  }> => {
    setLoading(true);
    try {
      const [structure, projects, summary, collaborators] = await Promise.all([
        getStructureRecommendations('ideas'),
        getProjectRecommendations(),
        getContentSummary('overall'),
        getCollaboratorRecommendations(),
      ]);

      return {
        structureRecommendations: structure,
        projectRecommendations: projects,
        contentSummary: summary,
        collaboratorRecommendations: collaborators,
      };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // 智能建议生成器
  // =============================================

  const generateSmartSuggestions = async (context: {
    currentPage?: 'spark' | 'mesh' | 'canvas' | 'incubator';
    selectedItems?: string[];
    userIntent?: string;
  }): Promise<{
    suggestions: Array<{
      type: 'structure' | 'project' | 'collaborator' | 'action';
      title: string;
      description: string;
      action: () => Promise<string>;
    }>;
  }> => {
    const suggestions = [];

    // 根据当前页面和上下文生成建议
    switch (context.currentPage) {
      case 'spark':
        suggestions.push({
          type: 'structure' as const,
          title: '整理我的想法',
          description: '分析并重新组织你的创意想法',
          action: () => getStructureRecommendations('ideas'),
        });
        
        if (context.selectedItems?.length) {
          suggestions.push({
            type: 'project' as const,
            title: '转化为项目',
            description: '将选中的想法转化为具体项目',
            action: () => getProjectRecommendations(context.selectedItems?.[0]),
          });
        }
        break;

      case 'incubator':
        suggestions.push({
          type: 'structure' as const,
          title: '优化项目结构',
          description: '分析并改进你的项目组织方式',
          action: () => getStructureRecommendations('projects'),
        });

        if (context.selectedItems?.length) {
          suggestions.push({
            type: 'collaborator' as const,
            title: '寻找协作者',
            description: '为这个项目推荐合适的协作伙伴',
            action: () => getCollaboratorRecommendations(context.selectedItems?.[0]),
          });
        }
        break;

      case 'mesh':
        suggestions.push({
          type: 'project' as const,
          title: '发现项目机会',
          description: '基于想法网络发现新的项目机会',
          action: () => getProjectRecommendations(),
        });
        break;

      default:
        suggestions.push({
          type: 'structure' as const,
          title: '全面分析',
          description: '获取你的创作活动综合分析',
          action: () => getContentSummary('overall'),
        });
    }

    return { suggestions };
  };

  // =============================================
  // 上下文感知建议
  // =============================================

  const getContextualAdvice = async (context: {
    type: 'idea_stuck' | 'project_planning' | 'collaboration_needed' | 'progress_review';
    data?: any;
  }): Promise<string> => {
    switch (context.type) {
      case 'idea_stuck':
        return await getStructureRecommendations('ideas');
      
      case 'project_planning':
        return await getProjectRecommendations(context.data?.ideaId);
      
      case 'collaboration_needed':
        return await getCollaboratorRecommendations(context.data?.projectId);
      
      case 'progress_review':
        return await getContentSummary('overall');
      
      default:
        return await getContentSummary('overall');
    }
  };

  // =============================================
  // 历史分析
  // =============================================

  const getHistoricalInsights = async (): Promise<{
    trends: string;
    patterns: string;
    recommendations: string;
  }> => {
    // 这里可以扩展为更复杂的历史数据分析
    const summary = await getContentSummary('overall');
    
    return {
      trends: summary,
      patterns: summary,
      recommendations: summary,
    };
  };

  // =============================================
  // 个性化建议
  // =============================================

  const getPersonalizedAdvice = async (userGoals?: string[]): Promise<string> => {
    // 可以根据用户设定的目标提供个性化建议
    return await getContentSummary('overall');
  };

  return {
    loading,
    lastResponse,
    
    // 核心功能
    getStructureRecommendations,
    getProjectRecommendations,
    getContentSummary,
    getCollaboratorRecommendations,
    
    // 高级功能
    getComprehensiveAnalysis,
    generateSmartSuggestions,
    getContextualAdvice,
    getHistoricalInsights,
    getPersonalizedAdvice,
    
    // 使用量信息
    usage,
  };
};
