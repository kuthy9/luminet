import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Calendar,
  User,
  Lightbulb,
  Send,
  ArrowLeft,
  ExternalLink,
  Copy
} from 'lucide-react';

interface PublicIdeaData {
  id: string;
  content: string;
  keywords: string[];
  mood: string;
  tags: string[];
  color_signature?: string;
  created_at: string;
  updated_at: string;
  visibility: string;
  collaboration_status: string;
  collaboration_description?: string;
  collaboration_roles: string[];
  user_id: string;
  user_profile: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    skills: string[];
    interests: string[];
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_profile: {
    display_name?: string;
    avatar_url?: string;
  };
}

const PublicIdea = () => {
  const { ideaId } = useParams<{ ideaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleSupabaseError, showSuccess } = useErrorHandler();
  
  const [idea, setIdea] = useState<PublicIdeaData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch public idea
  const fetchIdea = async () => {
    if (!ideaId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          user_profiles!inner(display_name, avatar_url, bio, skills, interests),
          idea_likes(user_id),
          idea_bookmarks(user_id)
        `)
        .eq('id', ideaId)
        .eq('visibility', 'public')
        .single();

      if (error) {
        handleSupabaseError(error, 'fetch public idea');
        return;
      }

      if (!data) {
        navigate('/404');
        return;
      }

      // Process the data
      const processedIdea: PublicIdeaData = {
        ...data,
        user_profile: data.user_profiles,
        likes_count: data.idea_likes?.length || 0,
        comments_count: 0, // Will be fetched separately
        is_liked: user ? data.idea_likes?.some((like: any) => like.user_id === user.id) : false,
        is_bookmarked: user ? data.idea_bookmarks?.some((bookmark: any) => bookmark.user_id === user.id) : false,
      };

      setIdea(processedIdea);
    } catch (error) {
      handleSupabaseError(error, 'fetch public idea');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    if (!ideaId) return;

    try {
      const { data, error } = await supabase
        .from('idea_comments')
        .select(`
          *,
          user_profiles!inner(display_name, avatar_url)
        `)
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });

      if (error) {
        handleSupabaseError(error, 'fetch comments');
        return;
      }

      const processedComments: Comment[] = data?.map(comment => ({
        ...comment,
        user_profile: comment.user_profiles,
      })) || [];

      setComments(processedComments);
      
      // Update comments count
      if (idea) {
        setIdea({ ...idea, comments_count: processedComments.length });
      }
    } catch (error) {
      handleSupabaseError(error, 'fetch comments');
    }
  };

  // Handle like/unlike
  const handleLike = async () => {
    if (!user || !idea) {
      showSuccess('Please sign in', 'You need to be signed in to like ideas.');
      return;
    }

    try {
      if (idea.is_liked) {
        // Unlike
        const { error } = await supabase
          .from('idea_likes')
          .delete()
          .eq('idea_id', idea.id)
          .eq('user_id', user.id);

        if (error) {
          handleSupabaseError(error, 'unlike idea');
          return;
        }

        setIdea({
          ...idea,
          is_liked: false,
          likes_count: idea.likes_count - 1,
        });
      } else {
        // Like
        const { error } = await supabase
          .from('idea_likes')
          .insert({
            idea_id: idea.id,
            user_id: user.id,
          });

        if (error) {
          handleSupabaseError(error, 'like idea');
          return;
        }

        setIdea({
          ...idea,
          is_liked: true,
          likes_count: idea.likes_count + 1,
        });
      }
    } catch (error) {
      handleSupabaseError(error, 'toggle like');
    }
  };

  // Handle bookmark/unbookmark
  const handleBookmark = async () => {
    if (!user || !idea) {
      showSuccess('Please sign in', 'You need to be signed in to bookmark ideas.');
      return;
    }

    try {
      if (idea.is_bookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('idea_bookmarks')
          .delete()
          .eq('idea_id', idea.id)
          .eq('user_id', user.id);

        if (error) {
          handleSupabaseError(error, 'remove bookmark');
          return;
        }

        setIdea({ ...idea, is_bookmarked: false });
        showSuccess('Bookmark removed', 'Idea removed from your bookmarks.');
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('idea_bookmarks')
          .insert({
            idea_id: idea.id,
            user_id: user.id,
          });

        if (error) {
          handleSupabaseError(error, 'bookmark idea');
          return;
        }

        setIdea({ ...idea, is_bookmarked: true });
        showSuccess('Bookmarked!', 'Idea saved to your bookmarks.');
      }
    } catch (error) {
      handleSupabaseError(error, 'toggle bookmark');
    }
  };

  // Submit comment
  const submitComment = async () => {
    if (!user || !idea || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      
      const { data, error } = await supabase
        .from('idea_comments')
        .insert({
          idea_id: idea.id,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select(`
          *,
          user_profiles!inner(display_name, avatar_url)
        `)
        .single();

      if (error) {
        handleSupabaseError(error, 'submit comment');
        return;
      }

      const newCommentData: Comment = {
        ...data,
        user_profile: data.user_profiles,
      };

      setComments([...comments, newCommentData]);
      setNewComment('');
      setIdea({ ...idea, comments_count: idea.comments_count + 1 });
      showSuccess('Comment posted!', 'Your comment has been added.');
    } catch (error) {
      handleSupabaseError(error, 'submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Share idea
  const shareIdea = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this creative idea!',
          text: idea?.content.slice(0, 100) + '...',
          url: url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      showSuccess('Link copied!', 'Share link copied to clipboard.');
    }
  };

  useEffect(() => {
    fetchIdea();
  }, [ideaId, user]);

  useEffect(() => {
    if (idea) {
      fetchComments();
    }
  }, [idea]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <Lightbulb className="w-12 h-12 animate-pulse mx-auto mb-4 text-coral-400" />
          <p className="text-gray-600">Loading idea...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Idea not found</h2>
          <p className="text-gray-600 mb-4">This idea might be private or doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={shareIdea}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Main Idea Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={idea.user_profile.avatar_url} />
                <AvatarFallback>
                  {idea.user_profile.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">
                    {idea.user_profile.display_name || 'Anonymous'}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {idea.mood}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(idea.created_at).toLocaleDateString()}
                  </div>
                  {idea.collaboration_status !== 'private' && (
                    <Badge variant="secondary" className="text-xs">
                      {idea.collaboration_status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Idea Content */}
            <div 
              className="p-4 rounded-lg border-l-4"
              style={{ 
                borderLeftColor: idea.color_signature || '#FF6B6B',
                backgroundColor: `${idea.color_signature || '#FF6B6B'}10`
              }}
            >
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {idea.content}
              </p>
            </div>

            {/* Keywords and Tags */}
            <div className="flex flex-wrap gap-2">
              {idea.keywords?.map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {idea.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Collaboration Info */}
            {idea.collaboration_description && (
              <div className="bg-mint-50 p-4 rounded-lg border border-mint-200">
                <h4 className="font-medium text-mint-800 mb-2">Looking for collaboration:</h4>
                <p className="text-sm text-mint-700 mb-3">{idea.collaboration_description}</p>
                {idea.collaboration_roles?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {idea.collaboration_roles.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs bg-mint-100">
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={idea.is_liked ? 'text-red-600' : ''}
                >
                  <Heart className={`w-4 h-4 mr-1 ${idea.is_liked ? 'fill-current' : ''}`} />
                  {idea.likes_count}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {idea.comments_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={idea.is_bookmarked ? 'text-blue-600' : ''}
                >
                  <Bookmark className={`w-4 h-4 mr-1 ${idea.is_bookmarked ? 'fill-current' : ''}`} />
                  {idea.is_bookmarked ? 'Saved' : 'Save'}
                </Button>
              </div>
              
              {idea.collaboration_status === 'open' && idea.user_id !== user?.id && (
                <Button size="sm" className="bg-coral-500 hover:bg-coral-600 text-white">
                  <Send className="w-4 h-4 mr-1" />
                  Collaborate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Author Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">About the Creator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={idea.user_profile.avatar_url} />
                <AvatarFallback className="text-lg">
                  {idea.user_profile.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  {idea.user_profile.display_name || 'Anonymous Creator'}
                </h3>
                {idea.user_profile.bio && (
                  <p className="text-gray-600 text-sm mb-3">{idea.user_profile.bio}</p>
                )}
                
                {/* Skills */}
                {idea.user_profile.skills?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {idea.user_profile.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {idea.user_profile.interests?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {idea.user_profile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Comments ({idea.comments_count})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Comment */}
            {user ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Share your thoughts on this idea..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={submitComment}
                    disabled={!newComment.trim() || submittingComment}
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2">Sign in to join the conversation</p>
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </div>
            )}

            <Separator />

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.user_profile.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {comment.user_profile.display_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.user_profile.display_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicIdea;
