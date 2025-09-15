import { useState, useEffect } from 'react';
import { supabaseLoose } from '@/integrations/supabase/client-patched';
import { useAuth } from './useAuth';

// =============================================
// 类型定义
// =============================================

export interface CollaborationRequest {
  id?: string;
  idea_id?: string;
  requester_id?: string;
  owner_id?: string;
  message?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  requested_role?: string;
  created_at?: string;
  updated_at?: string;
  // 关联数据 - flexible typing
  requester?: Partial<UserProfile>;
  idea?: Partial<{
    id: string;
    content: string;
    collaboration_description: string;
  }>;
  [key: string]: any; // Allow any additional properties
}

export interface Collaboration {
  id: string;
  idea_id: string;
  collaborator_id: string;
  role: string;
  permissions: string[];
  status: 'active' | 'paused' | 'completed' | 'left';
  joined_at: string;
  updated_at: string;
  // 关联数据
  collaborator?: UserProfile;
  idea?: {
    id: string;
    content: string;
  };
}

export interface UserProfile {
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  skills: string[];
  interests: string[];
  location?: string;
  timezone?: string;
  collaboration_preferences: Record<string, any>;
  reputation_score: number;
  collaboration_count: number;
}

export interface CollaborationMatch {
  id: string;
  idea_id: string;
  user_id: string;
  match_score: number;
  match_reasons: Record<string, any>;
  status: 'suggested' | 'viewed' | 'contacted' | 'dismissed';
  created_at: string;
  // 关联数据
  idea?: {
    id: string;
    content: string;
    collaboration_description?: string;
    collaboration_roles?: string[];
  };
  user?: UserProfile;
}

export interface IdeaInteraction {
  id: string;
  idea_id: string;
  user_id: string;
  interaction_type: 'like' | 'bookmark' | 'comment' | 'share' | 'view';
  content?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// =============================================
// 主要 Hook
// =============================================

export const useCollaboration = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // =============================================
  // 协作请求管理
  // =============================================

  const sendCollaborationRequest = async (
    ideaId: string,
    message: string,
    requestedRole?: string
  ): Promise<CollaborationRequest> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // 首先获取 idea 的 owner_id
      const { data: idea, error: ideaError } = await supabaseLoose
        .from('ideas')
        .select('user_id')
        .eq('id', ideaId)
        .single();

      if (ideaError) throw ideaError;
      if (!idea) throw new Error('Idea not found');

      const { data, error } = await supabaseLoose
        .from('collaboration_requests')
        .insert({
          idea_id: ideaId,
          requester_id: user.id,
          owner_id: idea.user_id,
          message,
          requested_role: requestedRole,
        })
        .select(`
          *,
          requester:user_profiles!collaboration_requests_requester_id_fkey(*),
          idea:ideas(id, content, collaboration_description)
        `)
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const respondToCollaborationRequest = async (
    requestId: string,
    response: 'accepted' | 'rejected',
    collaboratorRole?: string,
    permissions?: string[]
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // 更新请求状态
      const { error: updateError } = await supabaseLoose
        .from('collaboration_requests')
        .update({ status: response })
        .eq('id', requestId)
        .eq('owner_id', user.id);

      if (updateError) throw updateError;

      // 如果接受，创建协作关系
      if (response === 'accepted') {
        const { data: request } = await supabaseLoose
          .from('collaboration_requests')
          .select('idea_id, requester_id, requested_role')
          .eq('id', requestId)
          .single();

        if (request) {
          await supabaseLoose
            .from('collaborations')
            .insert({
              idea_id: request.idea_id,
              collaborator_id: request.requester_id,
              role: collaboratorRole || request.requested_role || 'collaborator',
              permissions: permissions || ['view', 'comment'],
            });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getCollaborationRequests = async (type: 'sent' | 'received'): Promise<CollaborationRequest[]> => {
    if (!user) return [];
    
    const column = type === 'sent' ? 'requester_id' : 'owner_id';
    const { data, error } = await supabaseLoose
      .from('collaboration_requests')
      .select(`
        *,
        requester:user_profiles!collaboration_requests_requester_id_fkey(*),
        idea:ideas(id, content, collaboration_description)
      `)
      .eq(column, user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  // =============================================
  // 协作关系管理
  // =============================================

  const getMyCollaborations = async (): Promise<Collaboration[]> => {
    if (!user) return [];
    
    const { data, error } = await supabaseLoose
      .from('collaborations')
      .select(`
        *,
        collaborator:user_profiles!collaborations_collaborator_id_fkey(*),
        idea:ideas(id, content)
      `)
      .eq('collaborator_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const getIdeaCollaborators = async (ideaId: string): Promise<Collaboration[]> => {
    const { data, error } = await supabaseLoose
      .from('collaborations')
      .select(`
        *,
        collaborator:user_profiles!collaborations_collaborator_id_fkey(*)
      `)
      .eq('idea_id', ideaId)
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  };

  const updateCollaborationStatus = async (
    collaborationId: string,
    status: 'active' | 'paused' | 'completed' | 'left'
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabaseLoose
      .from('collaborations')
      .update({ status })
      .eq('id', collaborationId)
      .eq('collaborator_id', user.id);

    if (error) throw error;
  };

  // =============================================
  // 协作匹配系统
  // =============================================

  const getCollaborationMatches = async (limit = 10): Promise<CollaborationMatch[]> => {
    if (!user) return [];
    
    const { data, error } = await supabaseLoose
      .from('collaboration_matches')
      .select(`
        *,
        idea:ideas(id, content, collaboration_description, collaboration_roles),
        user:user_profiles!collaboration_matches_user_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'suggested')
      .order('match_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  const updateMatchStatus = async (
    matchId: string,
    status: 'viewed' | 'contacted' | 'dismissed'
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabaseLoose
      .from('collaboration_matches')
      .update({ status })
      .eq('id', matchId)
      .eq('user_id', user.id);

    if (error) throw error;
  };

  // =============================================
  // 灵感广场
  // =============================================

  const getInspirationPlaza = async (limit = 20): Promise<any[]> => {
    const { data, error } = await supabaseLoose
      .from('inspiration_plaza')
      .select(`
        *,
        idea:ideas(
          id, content, collaboration_description, collaboration_roles,
          user_id, created_at, tags,
          user:users(id, email),
          profile:user_profiles!ideas_user_id_fkey(display_name, avatar_url)
        )
      `)
      .order('priority_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  const addToInspirationPlaza = async (ideaId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    // 首先验证用户是否拥有这个 idea
    const { data: idea, error: ideaError } = await supabaseLoose
      .from('ideas')
      .select('user_id')
      .eq('id', ideaId)
      .single();

    if (ideaError) throw ideaError;
    if (idea.user_id !== user.id) throw new Error('Unauthorized');

    const { error } = await supabaseLoose
      .from('inspiration_plaza')
      .insert({ idea_id: ideaId });

    if (error) throw error;
  };

  return {
    loading,
    // 协作请求
    sendCollaborationRequest,
    respondToCollaborationRequest,
    getCollaborationRequests,
    // 协作关系
    getMyCollaborations,
    getIdeaCollaborators,
    updateCollaborationStatus,
    // 匹配系统
    getCollaborationMatches,
    updateMatchStatus,
    // 灵感广场
    getInspirationPlaza,
    addToInspirationPlaza,
  };
};
