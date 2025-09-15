import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// =============================================
// 类型定义
// =============================================

export interface UserProfile {
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  skills: string[];
  interests: string[];
  location?: string;
  timezone?: string;
  collaboration_preferences: {
    available_for_collaboration?: boolean;
    preferred_roles?: string[];
    communication_style?: string;
    time_commitment?: string;
    project_types?: string[];
  };
  reputation_score: number;
  collaboration_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  skills?: string[];
  interests?: string[];
  location?: string;
  timezone?: string;
  collaboration_preferences?: Record<string, any>;
}

// =============================================
// 用户档案管理 Hook
// =============================================

export const useUserProfile = (userId?: string) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const targetUserId = userId || user?.id;

  // =============================================
  // 获取用户档案
  // =============================================

  const fetchProfile = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setProfile(data);
      } else if (targetUserId === user?.id) {
        // 如果是当前用户且没有档案，创建默认档案
        await createDefaultProfile();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // 创建默认档案
  // =============================================

  const createDefaultProfile = async () => {
    if (!user) return;

    try {
      const defaultProfile: Partial<UserProfile> = {
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'Anonymous',
        bio: '',
        skills: [],
        interests: [],
        collaboration_preferences: {
          available_for_collaboration: true,
          preferred_roles: [],
          communication_style: 'flexible',
          time_commitment: 'flexible',
          project_types: [],
        },
        reputation_score: 0,
        collaboration_count: 0,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error creating default profile:', error);
    }
  };

  // =============================================
  // 更新用户档案
  // =============================================

  const updateProfile = async (updates: ProfileUpdateData): Promise<UserProfile> => {
    if (!user || !profile) throw new Error('User not authenticated or profile not loaded');
    
    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      return data;
    } finally {
      setUpdating(false);
    }
  };

  // =============================================
  // 技能和兴趣管理
  // =============================================

  const addSkill = async (skill: string): Promise<void> => {
    if (!profile) return;
    
    const updatedSkills = [...new Set([...profile.skills, skill])];
    await updateProfile({ skills: updatedSkills });
  };

  const removeSkill = async (skill: string): Promise<void> => {
    if (!profile) return;
    
    const updatedSkills = profile.skills.filter(s => s !== skill);
    await updateProfile({ skills: updatedSkills });
  };

  const addInterest = async (interest: string): Promise<void> => {
    if (!profile) return;
    
    const updatedInterests = [...new Set([...profile.interests, interest])];
    await updateProfile({ interests: updatedInterests });
  };

  const removeInterest = async (interest: string): Promise<void> => {
    if (!profile) return;
    
    const updatedInterests = profile.interests.filter(i => i !== interest);
    await updateProfile({ interests: updatedInterests });
  };

  // =============================================
  // 协作偏好管理
  // =============================================

  const updateCollaborationPreferences = async (
    preferences: Partial<UserProfile['collaboration_preferences']>
  ): Promise<void> => {
    if (!profile) return;
    
    const updatedPreferences = {
      ...profile.collaboration_preferences,
      ...preferences,
    };
    
    await updateProfile({ collaboration_preferences: updatedPreferences });
  };

  const toggleCollaborationAvailability = async (): Promise<void> => {
    if (!profile) return;
    
    const currentAvailability = profile.collaboration_preferences.available_for_collaboration ?? true;
    await updateCollaborationPreferences({
      available_for_collaboration: !currentAvailability,
    });
  };

  // =============================================
  // 声誉和统计
  // =============================================

  const incrementCollaborationCount = async (): Promise<void> => {
    if (!profile) return;
    
    await updateProfile({
      collaboration_count: profile.collaboration_count + 1,
    });
  };

  const updateReputationScore = async (newScore: number): Promise<void> => {
    if (!profile) return;
    
    await updateProfile({ reputation_score: newScore });
  };

  // =============================================
  // 搜索和发现
  // =============================================

  const searchProfiles = async (query: {
    skills?: string[];
    interests?: string[];
    location?: string;
    available_for_collaboration?: boolean;
    limit?: number;
  }): Promise<UserProfile[]> => {
    let queryBuilder = supabase
      .from('user_profiles')
      .select('*');

    // 技能匹配
    if (query.skills && query.skills.length > 0) {
      queryBuilder = queryBuilder.overlaps('skills', query.skills);
    }

    // 兴趣匹配
    if (query.interests && query.interests.length > 0) {
      queryBuilder = queryBuilder.overlaps('interests', query.interests);
    }

    // 地理位置
    if (query.location) {
      queryBuilder = queryBuilder.ilike('location', `%${query.location}%`);
    }

    // 协作可用性
    if (query.available_for_collaboration !== undefined) {
      queryBuilder = queryBuilder.eq(
        'collaboration_preferences->available_for_collaboration',
        query.available_for_collaboration
      );
    }

    // 限制结果数量
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    // 按声誉分数排序
    queryBuilder = queryBuilder.order('reputation_score', { ascending: false });

    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    return data || [];
  };

  const getTopCollaborators = async (limit = 10): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('collaboration_preferences->available_for_collaboration', true)
      .order('reputation_score', { ascending: false })
      .order('collaboration_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  // =============================================
  // 效果钩子
  // =============================================

  useEffect(() => {
    fetchProfile();
  }, [targetUserId]);

  // =============================================
  // 返回接口
  // =============================================

  return {
    profile,
    loading,
    updating,
    // 基础操作
    fetchProfile,
    updateProfile,
    createDefaultProfile,
    // 技能和兴趣
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    // 协作偏好
    updateCollaborationPreferences,
    toggleCollaborationAvailability,
    // 声誉和统计
    incrementCollaborationCount,
    updateReputationScore,
    // 搜索和发现
    searchProfiles,
    getTopCollaborators,
  };
};
