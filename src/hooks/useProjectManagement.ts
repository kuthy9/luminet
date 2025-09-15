import { useState, useEffect } from 'react';
// Use a loose-typed client to avoid type errors in MVP
import { supabaseLoose as supabase } from '@/integrations/supabase/client-patched';
import { useAuth } from './useAuth';

// =============================================
// 类型定义
// =============================================

export interface Project {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  visibility: 'private' | 'team' | 'public';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  due_date?: string;
  completion_percentage: number;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // 关联数据 - with flexible typing
  owner?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string; // Added for compatibility
    [key: string]: any; // Allow additional properties
  };
  members?: ProjectMember[];
  stages?: ProjectStage[];
  tasks?: Task[];
  milestones?: Milestone[];
}

export interface ProjectStage {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  stage_order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  start_date?: string;
  end_date?: string;
  completion_percentage: number;
  color: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  tasks?: Task[];
}

export interface Task {
  id: string;
  project_id: string;
  stage_id?: string;
  title: string;
  description?: string;
  assignee_id?: string;
  creator_id: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  task_order: number;
  labels: string[];
  dependencies: string[];
  created_at: string;
  updated_at: string;
  // 关联数据 - with flexible typing for missing fields
  assignee?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string; // Added for compatibility
    [key: string]: any; // Allow additional properties
  };
  creator?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string; // Added for compatibility
    [key: string]: any; // Allow additional properties
  };
  comments?: TaskComment[];
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'achieved' | 'missed' | 'cancelled';
  achievement_date?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  joined_at: string;
  invited_by?: string;
  status: 'active' | 'inactive' | 'pending';
  // 关联数据
  user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  comment_type: 'comment' | 'status_change' | 'assignment' | 'attachment';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // 关联数据
  user?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id?: string;
  activity_type: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  // 关联数据
  user?: {
    id: string;
    email: string;
    display_name?: string;
  };
}

// =============================================
// 项目管理 Hook
// =============================================

export const useProjectManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // =============================================
  // 项目 CRUD 操作
  // =============================================

  const createProject = async (projectData: {
    title: string;
    description?: string;
    visibility?: Project['visibility'];
    priority?: Project['priority'];
    start_date?: string;
    due_date?: string;
    tags?: string[];
  }): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          owner_id: user.id,
        })
        .select(`
          *,
          owner:users!projects_owner_id_fkey(id, email)
        `)
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const getProjects = async (filters?: {
    status?: Project['status'];
    visibility?: Project['visibility'];
    owned_by_me?: boolean;
    member_of?: boolean;
    limit?: number;
  }): Promise<Project[]> => {
    if (!user) return [];
    
    let query = supabase
      .from('projects')
      .select(`
        *,
        owner:users!projects_owner_id_fkey(id, email),
        members:project_members(
          id, role, status,
          user:users!project_members_user_id_fkey(id, email)
        )
      `);

    // 应用过滤器
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.visibility) {
      query = query.eq('visibility', filters.visibility);
    }

    if (filters?.owned_by_me) {
      query = query.eq('owner_id', user.id);
    }

    if (filters?.member_of) {
      query = query.or(`owner_id.eq.${user.id},project_members.user_id.eq.${user.id}`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const getProject = async (projectId: string): Promise<Project | null> => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:users!projects_owner_id_fkey(id, email),
        members:project_members(
          id, role, status, joined_at,
          user:users!project_members_user_id_fkey(id, email)
        ),
        stages:project_stages(
          id, name, description, stage_order, status, 
          completion_percentage, color,
          tasks:tasks(
            id, title, status, priority, assignee_id, due_date,
            assignee:users!tasks_assignee_id_fkey(id, email)
          )
        ),
        milestones:milestones(*)
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  };

  const updateProject = async (
    projectId: string, 
    updates: Partial<Project>
  ): Promise<Project> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select(`
          *,
          owner:users!projects_owner_id_fkey(id, email)
        `)
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  };

  // =============================================
  // 阶段管理
  // =============================================

  const createStage = async (stageData: {
    project_id: string;
    name: string;
    description?: string;
    stage_order: number;
    color?: string;
  }): Promise<ProjectStage> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_stages')
        .insert(stageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (
    stageId: string,
    updates: Partial<ProjectStage>
  ): Promise<ProjectStage> => {
    const { data, error } = await supabase
      .from('project_stages')
      .update(updates)
      .eq('id', stageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteStage = async (stageId: string): Promise<void> => {
    const { error } = await supabase
      .from('project_stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;
  };

  const reorderStages = async (
    projectId: string,
    stageOrders: { id: string; stage_order: number }[]
  ): Promise<void> => {
    const updates = stageOrders.map(({ id, stage_order }) => 
      supabase
        .from('project_stages')
        .update({ stage_order })
        .eq('id', id)
    );

    await Promise.all(updates);
  };

  // =============================================
  // 任务管理
  // =============================================

  const createTask = async (taskData: {
    project_id: string;
    stage_id?: string;
    title: string;
    description?: string;
    assignee_id?: string;
    priority?: Task['priority'];
    due_date?: string;
    estimated_hours?: number;
    labels?: string[];
  }): Promise<Task> => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          creator_id: user.id,
        })
        .select(`
          *,
          assignee:users!tasks_assignee_id_fkey(id, email),
          creator:users!tasks_creator_id_fkey(id, email)
        `)
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task> => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        assignee:users!tasks_assignee_id_fkey(id, email),
        creator:users!tasks_creator_id_fkey(id, email)
      `)
      .single();

    if (error) throw error;
    return data;
  };

  const moveTask = async (
    taskId: string,
    newStageId: string,
    newOrder: number
  ): Promise<void> => {
    await updateTask(taskId, {
      stage_id: newStageId,
      task_order: newOrder,
    } as Partial<Task>);
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  };

  // =============================================
  // 里程碑管理
  // =============================================

  const createMilestone = async (milestoneData: {
    project_id: string;
    title: string;
    description?: string;
    due_date: string;
    color?: string;
  }): Promise<Milestone> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('milestones')
        .insert(milestoneData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateMilestone = async (
    milestoneId: string,
    updates: Partial<Milestone>
  ): Promise<Milestone> => {
    const { data, error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const achieveMilestone = async (milestoneId: string): Promise<void> => {
    await updateMilestone(milestoneId, {
      status: 'achieved',
      achievement_date: new Date().toISOString().split('T')[0],
    });
  };

  // =============================================
  // 成员管理
  // =============================================

  const addProjectMember = async (
    projectId: string,
    userId: string,
    role: ProjectMember['role'] = 'member'
  ): Promise<ProjectMember> => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
        invited_by: user.id,
      })
      .select(`
        *,
        user:users!project_members_user_id_fkey(id, email)
      `)
      .single();

    if (error) throw error;
    return data;
  };

  const updateMemberRole = async (
    memberId: string,
    role: ProjectMember['role']
  ): Promise<void> => {
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;
  };

  const removeMember = async (memberId: string): Promise<void> => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  };

  // =============================================
  // 活动日志
  // =============================================

  const getProjectActivities = async (
    projectId: string,
    limit = 50
  ): Promise<ProjectActivity[]> => {
    const { data, error } = await supabase
      .from('project_activities')
      .select(`
        *,
        user:users!project_activities_user_id_fkey(id, email)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  return {
    loading,
    // 项目管理
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    // 阶段管理
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    // 任务管理
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    // 里程碑管理
    createMilestone,
    updateMilestone,
    achieveMilestone,
    // 成员管理
    addProjectMember,
    updateMemberRole,
    removeMember,
    // 活动日志
    getProjectActivities,
  };
};
