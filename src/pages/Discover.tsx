import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Heart, 
  MessageCircle, 
  Users, 
  Lightbulb,
  Star,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react';

interface PublicIdea {
  id: string;
  content: string;
  keywords: string[];
  mood: string;
  collaboration_status: 'private' | 'open' | 'seeking' | 'collaborating';
  collaboration_roles: string[];
  collaboration_description?: string;
  tags: string[];
  visibility: 'private' | 'public' | 'friends';
  created_at: string;
  user_id: string;
  user_profile?: {
    display_name?: string;
    avatar_url?: string;
    skills: string[];
    interests: string[];
  };
  likes_count?: number;
  comments_count?: number;
  collaborators_count?: number;
}

const Discover = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { handleSupabaseError, showSuccess } = useErrorHandler();
  
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState('discover');

  // Fetch public ideas
  const fetchPublicIdeas = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('ideas')
        .select(`
          *,
          user_profiles!inner(display_name, avatar_url, skills, interests)
        `)
        .eq('visibility', 'public')
        .neq('collaboration_status', 'private');

      // Apply filters
      if (selectedMood !== 'all') {
        query = query.eq('mood', selectedMood);
      }
      
      if (selectedStatus !== 'all') {
        query = query.eq('collaboration_status', selectedStatus);
      }

      // Apply search
      if (searchQuery) {
        query = query.or(`content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          // In a real app, you'd have a likes/views count
          query = query.order('created_at', { ascending: false });
          break;
        case 'trending':
          // In a real app, you'd calculate trending based on recent activity
          query = query.order('updated_at', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(20);

      if (error) {
        handleSupabaseError(error, 'fetch public ideas');
        return;
      }

      setIdeas(data || []);
    } catch (error) {
      handleSupabaseError(error, 'fetch public ideas');
    } finally {
      setLoading(false);
    }
  };

  // Handle collaboration request
  const handleCollaborationRequest = async (ideaId: string) => {
    if (!user) {
      showSuccess('Please sign in to collaborate', 'You need to be signed in to send collaboration requests.');
      return;
    }

    try {
      const { error } = await supabase
        .from('collaboration_requests')
        .insert({
          idea_id: ideaId,
          requester_id: user.id,
          status: 'pending',
          message: 'I would like to collaborate on this idea!',
        });

      if (error) {
        handleSupabaseError(error, 'send collaboration request');
        return;
      }

      showSuccess('Collaboration request sent!', 'The idea owner will be notified of your request.');
    } catch (error) {
      handleSupabaseError(error, 'send collaboration request');
    }
  };

  // Handle like idea
  const handleLikeIdea = async (ideaId: string) => {
    if (!user) {
      showSuccess('Please sign in to like ideas', 'You need to be signed in to like ideas.');
      return;
    }

    try {
      const { error } = await supabase
        .from('idea_likes')
        .upsert({
          idea_id: ideaId,
          user_id: user.id,
        });

      if (error) {
        handleSupabaseError(error, 'like idea');
        return;
      }

      showSuccess('Idea liked!', 'You can find liked ideas in your profile.');
    } catch (error) {
      handleSupabaseError(error, 'like idea');
    }
  };

  useEffect(() => {
    fetchPublicIdeas();
  }, [searchQuery, selectedMood, selectedStatus, sortBy]);

  const renderIdeaCard = (idea: PublicIdea) => (
    <Card key={idea.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-coral-400 to-peach-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {idea.user_profile?.display_name?.[0] || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">
                {idea.user_profile?.display_name || 'Anonymous'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(idea.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge 
            variant={idea.collaboration_status === 'open' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {idea.collaboration_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{idea.content}</p>
        
        {/* Tags and Keywords */}
        <div className="flex flex-wrap gap-1">
          {idea.keywords?.slice(0, 3).map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
          {idea.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Collaboration Info */}
        {idea.collaboration_description && (
          <div className="bg-mint-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-mint-700 mb-1">Looking for:</p>
            <p className="text-xs text-mint-600">{idea.collaboration_description}</p>
            {idea.collaboration_roles?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {idea.collaboration_roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs bg-mint-100">
                    {role}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Skills */}
        {idea.user_profile?.skills?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Skills:</p>
            <div className="flex flex-wrap gap-1">
              {idea.user_profile.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeIdea(idea.id)}
              className="text-xs"
            >
              <Heart className="w-4 h-4 mr-1" />
              {idea.likes_count || 0}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              <MessageCircle className="w-4 h-4 mr-1" />
              {idea.comments_count || 0}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              <Users className="w-4 h-4 mr-1" />
              {idea.collaborators_count || 0}
            </Button>
          </div>
          
          {idea.collaboration_status === 'open' && idea.user_id !== user?.id && (
            <Button
              size="sm"
              onClick={() => handleCollaborationRequest(idea.id)}
              className="bg-coral-500 hover:bg-coral-600 text-white text-xs"
            >
              Collaborate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-heading mb-4">
              Discover Ideas
            </h1>
            <p className="text-lg text-body max-w-2xl mx-auto">
              Explore creative ideas from the community and find collaboration opportunities
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl p-6 border border-warm-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedMood} onValueChange={setSelectedMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  <SelectItem value="excited">Excited</SelectItem>
                  <SelectItem value="curious">Curious</SelectItem>
                  <SelectItem value="contemplative">Contemplative</SelectItem>
                  <SelectItem value="focused">Focused</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open for Collaboration</SelectItem>
                  <SelectItem value="seeking">Seeking Collaborators</SelectItem>
                  <SelectItem value="collaborating">Currently Collaborating</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Recent
                    </div>
                  </SelectItem>
                  <SelectItem value="popular">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      Popular
                    </div>
                  </SelectItem>
                  <SelectItem value="trending">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Trending
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ideas Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 text-coral-400" />
              <h3 className="text-xl font-semibold text-heading mb-2">
                No ideas found
              </h3>
              <p className="text-body">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map(renderIdeaCard)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
