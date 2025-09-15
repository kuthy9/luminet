
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { Plus, Users, Calendar, Target, Filter, Globe, Lock, Eye, Edit, Share2, LayoutGrid, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectManagement, Project } from '@/hooks/useProjectManagement';
import { KanbanBoard } from '@/components/project/KanbanBoard';
import { TimelineView } from '@/components/project/TimelineView';
import { toast } from '@/hooks/use-toast';

const Incubator = () => {
  const { t } = useI18n();
  const {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    loading
  } = useProjectManagement();

  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'timeline'>('grid');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);

  // 加载项目数据
  useEffect(() => {
    loadProjects();
  }, [activeTab]);

  const loadProjects = async () => {
    try {
      const filters = getFiltersForTab(activeTab);
      const projectData = await getProjects(filters);
      
      if (!projectData) {
        console.warn('No project data returned');
        setProjects([]);
        return;
      }
      
      // Ensure all projects have required fields
      const safeProjects = projectData.filter(project => 
        project?.id && project?.title
      ).map(project => ({
        ...project,
        title: project.title || 'Untitled Project',
        description: project.description || '',
        status: project.status || 'planning',
        visibility: project.visibility || 'private',
        priority: project.priority || 'medium',
        completion_percentage: project.completion_percentage || 0,
        tags: Array.isArray(project.tags) ? project.tags : [],
        created_at: project.created_at || new Date().toISOString(),
        updated_at: project.updated_at || new Date().toISOString(),
        members: Array.isArray(project.members) ? project.members : [],
        tasks: Array.isArray(project.tasks) ? project.tasks : []
      }));
      
      setProjects(safeProjects);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast({
        title: "加载失败",
        description: error?.message || "无法加载项目数据，请稍后重试",
        variant: "destructive",
      });
      setProjects([]); // Set empty array on error
    }
  };

  const getFiltersForTab = (tab: string) => {
    switch (tab) {
      case 'my':
        return { owned_by_me: true };
      case 'collaborating':
        return { member_of: true };
      case 'public':
        return { visibility: 'public' as const };
      case 'active':
        return { status: 'active' as const };
      case 'completed':
        return { status: 'completed' as const };
      default:
        return {};
    }
  };

  const tabs = [
    { id: 'all', label: '所有项目', count: projects?.length || 0 },
    { id: 'my', label: '我的项目', count: projects?.filter(p => p?.owner_id === 'current_user').length || 0 },
    { id: 'collaborating', label: '协作项目', count: projects?.filter(p => p?.members?.some(m => m?.user_id === 'current_user')).length || 0 },
    { id: 'active', label: '进行中', count: projects?.filter(p => p?.status === 'active').length || 0 },
    { id: 'public', label: '公开项目', count: projects?.filter(p => p?.visibility === 'public').length || 0 },
  ];

  // 项目操作处理
  const handleCreateProject = async (projectData: {
    title: string;
    description: string;
    visibility: 'private' | 'team' | 'public';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    due_date?: string;
  }) => {
    if (!projectData.title?.trim()) {
      toast({
        title: "标题不能为空",
        description: "请输入项目标题",
        variant: "destructive",
      });
      return;
    }

    try {
      const newProject = await createProject(projectData);
      
      if (!newProject?.id) {
        throw new Error('Invalid project data returned');
      }

      // Ensure the new project has safe defaults
      const safeProject = {
        ...newProject,
        title: newProject.title || projectData.title,
        description: newProject.description || projectData.description || '',
        tags: Array.isArray(newProject.tags) ? newProject.tags : projectData.tags || [],
        members: Array.isArray(newProject.members) ? newProject.members : [],
        tasks: Array.isArray(newProject.tasks) ? newProject.tasks : [],
        completion_percentage: newProject.completion_percentage || 0
      };

      setProjects(prev => [safeProject, ...(prev || [])]);
      setIsCreateModalOpen(false);

      toast({
        title: "项目已创建",
        description: `项目 "${safeProject.title}" 已成功创建`,
      });
    } catch (error: any) {
      console.error('Create project error:', error);
      toast({
        title: "创建失败",
        description: error?.message || "无法创建项目，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleProjectUpdate = async (updatedProject: Project) => {
    try {
      const project = await updateProject(updatedProject.id, updatedProject);
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));

      toast({
        title: "项目已更新",
        description: `项目 "${project.title}" 已成功更新`,
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description: "无法更新项目，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return '规划中';
      case 'active': return '进行中';
      case 'paused': return '已暂停';
      case 'completed': return '已完成';
      case 'archived': return '已归档';
      default: return status;
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsProjectDetailOpen(true);
  };

  // 如果选中了项目且在看板或时间线视图，显示项目详情
  if (selectedProject && (viewMode === 'kanban' || viewMode === 'timeline')) {
    return (
      <Layout>
        <div className="h-screen flex flex-col">
          {/* 项目头部 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedProject(null)}
              >
                ← 返回项目列表
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{selectedProject.title}</h1>
                <p className="text-muted-foreground">{selectedProject.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'kanban' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="w-4 h-4 mr-1" />
                看板
              </Button>
              <Button
                variant={viewMode === 'timeline' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <Calendar className="w-4 h-4 mr-1" />
                时间线
              </Button>
            </div>
          </div>

          {/* 项目内容 */}
          <div className="flex-1">
            {viewMode === 'kanban' && (
              <KanbanBoard
                project={selectedProject}
                onProjectUpdate={handleProjectUpdate}
              />
            )}
            {viewMode === 'timeline' && (
              <TimelineView
                project={selectedProject}
                onTaskUpdate={(task) => {
                  // 处理任务更新
                  console.log('Task updated:', task);
                }}
                onMilestoneUpdate={(milestone) => {
                  // 处理里程碑更新
                  console.log('Milestone updated:', milestone);
                }}
              />
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12">
            <div>
              <h1 className="text-5xl font-bold text-heading mb-4">
                项目孵化器
              </h1>
              <p className="text-xl text-heading max-w-3xl">
                将创意火花转化为结构化项目，与他人协作实现想法
              </p>
            </div>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="mt-6 lg:mt-0 bg-coral-500 hover:bg-coral-600 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-colors">
                  <Plus className="w-5 h-5" />
                  创建新项目
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建新项目</DialogTitle>
                </DialogHeader>
                <CreateProjectForm onSubmit={handleCreateProject} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs and View Controls */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8">
            <div className="flex flex-wrap gap-2 mb-4 lg:mb-0">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-coral-500 hover:bg-coral-600 text-white'
                      : 'border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-heading'
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs ${activeTab === tab.id ? 'text-white opacity-80' : 'text-heading opacity-70'}`}>
                    ({tab.count})
                  </span>
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4 mr-1" />
                网格
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                看板
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <Calendar className="w-4 h-4 mr-1" />
                时间线
              </Button>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">加载项目中...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto mb-6 text-coral-400" />
              <h3 className="text-2xl font-semibold text-heading mb-4">
                还没有项目
              </h3>
              <p className="text-heading mb-8 max-w-md mx-auto">
                创建你的第一个项目，开始将创意转化为现实
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-coral-500 hover:bg-coral-600 text-white px-8 py-3 rounded-full transition-colors"
              >
                创建项目
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => {
                if (!project?.id || !project?.title) return null;
                
                return (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className="bg-white rounded-3xl p-6 border border-warm-200 hover:border-warm-300 hover:shadow-lg transition-all cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(project.status || 'planning')}>
                          {getStatusText(project.status || 'planning')}
                        </Badge>
                        {project.visibility === 'public' ? (
                          <Globe className="w-4 h-4 text-mint-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-heading" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-heading">
                        <Users className="w-4 h-4" />
                        {project.members?.length || 0}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-heading mb-3">
                      {project.title}
                    </h3>
                    <p className="text-heading mb-4 line-clamp-3">
                      {project.description || '暂无描述'}
                    </p>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                        <span>进度</span>
                        <span>{project.completion_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-coral-500 h-2 rounded-full transition-all"
                          style={{ width: `${project.completion_percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags && Array.isArray(project.tags) && project.tags.slice(0, 3).map((tag) => {
                        if (!tag) return null;
                        return (
                          <span key={tag} className="px-2 py-1 bg-cream-100 text-warm-700 text-xs rounded-full">
                            #{tag}
                          </span>
                        );
                      })}
                      {project.tags && project.tags.length > 3 && (
                        <span className="px-2 py-1 bg-cream-100 text-warm-700 text-xs rounded-full">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm text-heading pt-4 border-t border-warm-100">
                      <span>创建于 {project.created_at ? new Date(project.created_at).toLocaleDateString() : '未知'}</span>
                      <span>更新于 {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '未知'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Project Detail Modal */}
      <Dialog open={isProjectDetailOpen} onOpenChange={setIsProjectDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-heading">项目详情</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-heading mb-2">{selectedProject.title}</h2>
                  <Badge className={getStatusColor(selectedProject.status)}>
                    {getStatusText(selectedProject.status)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewMode('kanban');
                      setIsProjectDetailOpen(false);
                    }}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    看板视图
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewMode('timeline');
                      setIsProjectDetailOpen(false);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    时间线
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    编辑
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    分享
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-heading mb-2">项目描述</h4>
                <p className="text-heading leading-relaxed">{selectedProject.description || '暂无描述'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-heading mb-2">项目进度</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">完成度</span>
                      <span className="text-sm font-medium">{selectedProject.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-coral-500 h-2 rounded-full transition-all"
                        style={{ width: `${selectedProject.completion_percentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">任务总数</span>
                        <p className="font-medium">{selectedProject.tasks && Array.isArray(selectedProject.tasks) ? selectedProject.tasks.length : 0}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">已完成</span>
                        <p className="font-medium">{selectedProject.tasks && Array.isArray(selectedProject.tasks) ? selectedProject.tasks.filter(t => t?.status === 'done').length : 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-heading mb-2">团队成员</h4>
                  <div className="space-y-2">
                    {selectedProject.members && Array.isArray(selectedProject.members) && selectedProject.members.length > 0 ? (
                      selectedProject.members.map((member, index) => {
                        if (!member?.user) return null;
                        return (
                          <div key={member.id || index} className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-mint-100 rounded-full flex items-center justify-center">
                              <span className="text-xs text-mint-600">
                                {member.user?.display_name?.charAt(0) || member.user?.email?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-heading">{member.user?.display_name || member.user?.email || 'Unknown User'}</span>
                              <Badge variant="outline" className="ml-2 text-xs">{member.role || 'member'}</Badge>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无团队成员</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-heading mb-2">标签</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags && Array.isArray(selectedProject.tags) && selectedProject.tags.length > 0 ? (
                    selectedProject.tags.map((tag, index) => {
                      if (!tag) return null;
                      return (
                        <span key={index} className="px-3 py-1 bg-peach-100 text-peach-700 text-sm rounded-full">
                          #{tag}
                        </span>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无标签</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

// =============================================
// 创建项目表单组件
// =============================================

interface CreateProjectFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    visibility: 'private' | 'team' | 'public';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    due_date?: string;
  }) => void;
}

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    visibility: 'private' | 'team' | 'public';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    due_date: string;
  }>({
    title: '',
    description: '',
    visibility: 'private',
    priority: 'medium',
    tags: [],
    due_date: '',
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSubmit({
      ...formData,
      due_date: formData.due_date || undefined,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="title">项目标题 *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="输入项目标题..."
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">项目描述</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="描述你的项目..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="visibility">可见性</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value: 'private' | 'team' | 'public') =>
              setFormData(prev => ({ ...prev, visibility: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">私有</SelectItem>
              <SelectItem value="team">团队</SelectItem>
              <SelectItem value="public">公开</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">优先级</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
              setFormData(prev => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="urgent">紧急</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="due_date">截止日期</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="tags">标签</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="添加标签..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" onClick={addTag} size="sm">
              添加
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          取消
        </Button>
        <Button type="submit" className="bg-coral-500 hover:bg-coral-600">
          创建项目
        </Button>
      </div>
    </form>
  );
};

export default Incubator;
