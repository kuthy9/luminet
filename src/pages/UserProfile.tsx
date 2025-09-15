import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Lightbulb, 
  Heart, 
  Bookmark,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  ArrowLeft,
  Share2,
  ExternalLink
} from 'lucide-react';

interface UserProfileData {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills: string[];
  interests: string[];
  collaboration_preferences?: string;
  created_at: string;
  ideas_count: number;
  likes_received: number;
  collaborations_count: number;
}

interface PublicIdea {
  id: string;
  content: string;
  keywords: string[];
  mood: string;
  tags: string[];
  color_signature?: string;
  created_at: string;
  visibility: string;
  collaboration_status: string;
  likes_count: number;
  comments_count: number;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { handleSupabaseError, showSuccess } = useErrorHandler();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [likedIdeas, setLikedIdeas] = useState<PublicIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ideas');

  // Fetch user profile
  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        handleSupabaseError(error, 'fetch user profile');
        return;
      }

      if (!data) {
        navigate('/404');
        return;
      }

      // Get additional stats
      const [ideasResult, likesResult, collaborationsResult] = await Promise.all([
        supabase
          .from('ideas')
          .select('id')
          .eq('user_id', userId)
          .eq('visibility', 'public'),
        supabase
          .from('idea_likes')
          .select('id')
          .eq('idea.user_id', userId),
        supabase
          .from('collaborations')
          .select('id')
          .or(`user_id.eq.${userId},collaborator_id.eq.${userId}`)
      ]);

      const profileData: UserProfileData = {
        ...data,
        ideas_count: ideasResult.data?.length || 0,
        likes_received: likesResult.data?.length || 0,
        collaborations_count: collaborationsResult.data?.length || 0,
      };

      setProfile(profileData);
    } catch (error) {
      handleSupabaseError(error, 'fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's public ideas
  const fetchIdeas = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          idea_likes(id),
          idea_comments(id)
        `)
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'fetch user ideas');
        return;
      }

      const processedIdeas: PublicIdea[] = data?.map(idea => ({
        ...idea,
        likes_count: idea.idea_likes?.length || 0,
        comments_count: idea.idea_comments?.length || 0,
      })) || [];

      setIdeas(processedIdeas);
    } catch (error) {
      handleSupabaseError(error, 'fetch user ideas');
    }
  };

  // Fetch user's liked ideas (if viewing own profile)
  const fetchLikedIdeas = async () => {
    if (!userId || userId !== currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('idea_likes')
        .select(`
          idea:ideas(
            *,
            idea_likes(id),
            idea_comments(id),
            user_profiles!inner(display_name, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .eq('idea.visibility', 'public');

      if (error) {
        handleSupabaseError(error, 'fetch liked ideas');
        return;
      }

      const processedLikedIdeas: PublicIdea[] = data?.map(item => ({
        ...item.idea,
        likes_count: item.idea.idea_likes?.length || 0,
        comments_count: item.idea.idea_comments?.length || 0,
      })) || [];

      setLikedIdeas(processedLikedIdeas);
    } catch (error) {
      handleSupabaseError(error, 'fetch liked ideas');
    }
  };

  // Share profile
  const shareProfile = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name || 'User'}'s Creative Profile`,
          text: profile?.bio || 'Check out this creative profile!',
          url: url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      showSuccess('Link copied!', 'Profile link copied to clipboard.');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (profile) {
      fetchIdeas();
      fetchLikedIdeas();
    }
  }, [profile, currentUser]);

  const renderIdeaCard = (idea: PublicIdea) => (
    <Card 
      key={idea.id} 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/idea/${idea.id}`)}
    >
      <CardContent className="p-4">
        <div 
          className="p-3 rounded-lg border-l-4 mb-3"
          style={{ 
            borderLeftColor: idea.color_signature || '#FF6B6B',
            backgroundColor: `${idea.color_signature || '#FF6B6B'}10`
          }}
        >
          <p className="text-sm text-gray-800 line-clamp-3">
            {idea.content}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {idea.keywords?.slice(0, 3).map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
          {idea.mood && (
            <Badge variant="secondary" className="text-xs">
              {idea.mood}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {idea.likes_count}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {idea.comments_count}
            </div>
          </div>
          <span>{new Date(idea.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 animate-pulse mx-auto mb-4 text-coral-400" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-4">This user profile doesn't exist or is private.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={shareProfile}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Profile
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="w-24 h-24 mx-auto md:mx-0">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-heading mb-2">
                  {profile.display_name || 'Anonymous Creator'}
                </h1>
                
                {profile.bio && (
                  <p className="text-gray-600 mb-4">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-coral-600"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 justify-center md:justify-start">
                  <div className="text-center">
                    <div className="text-xl font-bold text-coral-600">{profile.ideas_count}</div>
                    <div className="text-xs text-muted-foreground">Ideas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-coral-600">{profile.likes_received}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-coral-600">{profile.collaborations_count}</div>
                    <div className="text-xs text-muted-foreground">Collaborations</div>
                  </div>
                </div>
              </div>

              {!isOwnProfile && (
                <div className="flex flex-col gap-2">
                  <Button className="bg-coral-500 hover:bg-coral-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline">
                    Follow
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills and Interests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {profile.skills?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.interests?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Collaboration Preferences */}
        {profile.collaboration_preferences && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Collaboration Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{profile.collaboration_preferences}</p>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Ideas ({ideas.length})
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="liked" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Liked ({likedIdeas.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="ideas" className="mt-6">
            {ideas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-heading mb-2">
                    No public ideas yet
                  </h3>
                  <p className="text-body">
                    {isOwnProfile 
                      ? "Start creating and sharing your ideas with the world!"
                      : "This user hasn't shared any public ideas yet."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ideas.map(renderIdeaCard)}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="liked" className="mt-6">
              {likedIdeas.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-heading mb-2">
                      No liked ideas yet
                    </h3>
                    <p className="text-body">
                      Ideas you like will appear here for easy access.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {likedIdeas.map(renderIdeaCard)}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
