
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Idea {
  id: string;
  content: string;
  idea_type?: string;
  mood?: string;
  keywords?: string[];
  color_signature?: string;
  created_at: string;
  visibility?: 'private' | 'public';
}

export const useIdeas = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchIdeas = async () => {
    if (!user?.id) {
      setIdeas([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ideas')
        .select('id, content, idea_type, mood, keywords, color_signature, created_at, visibility')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching ideas:', error);
        throw new Error(`Failed to fetch ideas: ${error.message}`);
      }

      if (!data) {
        console.warn('No data returned from ideas query');
        setIdeas([]);
        return;
      }

      // Ensure all ideas have required fields and safe defaults
      const safeIdeas = data.filter(idea => idea?.id && idea?.content).map(idea => ({
        ...idea,
        content: idea.content || '',
        idea_type: idea.idea_type || 'general',
        mood: idea.mood || 'neutral',
        keywords: Array.isArray(idea.keywords) ? idea.keywords : [],
        color_signature: idea.color_signature || '#E07A5F',
        visibility: (idea as any).visibility || 'private',
        created_at: idea.created_at || new Date().toISOString()
      }));

      setIdeas(safeIdeas);
    } catch (error: any) {
      console.error('Error fetching ideas:', error);
      setIdeas([]); // Set empty array on error to prevent undefined access
      // Don't throw here - let components handle the empty state gracefully
    } finally {
      setLoading(false);
    }
  };

  const createIdea = async (ideaData: { content: string } & Partial<Idea>) => {
    if (!user?.id) throw new Error('User not authenticated');

    if (!ideaData.content?.trim()) {
      throw new Error('Idea content cannot be empty');
    }

    const { data, error } = await supabase
      .from('ideas')
      .insert({
        user_id: user.id,
        content: ideaData.content.trim(),
        idea_type: ideaData.idea_type || 'general',
        mood: ideaData.mood || 'neutral',
        keywords: Array.isArray(ideaData.keywords) ? ideaData.keywords : [],
        color_signature: ideaData.color_signature || '#E07A5F',
        visibility: ideaData.visibility || 'private',
      })
      .select('id, content, idea_type, mood, keywords, color_signature, created_at, visibility')
      .single();

    if (error) {
      console.error('Supabase error creating idea:', error);
      throw new Error(`Failed to create idea: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('No data returned from idea creation');
    }

    // Ensure the created idea has safe defaults
    const safeIdea = {
      ...data,
      content: data.content || ideaData.content,
      idea_type: data.idea_type || 'general',
      mood: data.mood || 'neutral',
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      color_signature: data.color_signature || '#E07A5F',
      visibility: (data as any).visibility || 'private',
      created_at: data.created_at || new Date().toISOString()
    };
    
    setIdeas(prev => [safeIdea, ...(prev || [])]);
    return safeIdea;
  };

  const updateIdea = async (id: string, updates: Partial<Idea>) => {
    if (!user?.id) throw new Error('User not authenticated');
    if (!id?.trim()) throw new Error('Idea ID is required');

    const { data, error } = await supabase
      .from('ideas')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, content, idea_type, mood, keywords, color_signature, created_at, visibility')
      .single();

    if (error) {
      console.error('Supabase error updating idea:', error);
      throw new Error(`Failed to update idea: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('No data returned from idea update');
    }

    // Ensure the updated idea has safe defaults
    const safeIdea = {
      ...data,
      content: data.content || '',
      idea_type: data.idea_type || 'general',
      mood: data.mood || 'neutral',
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      color_signature: data.color_signature || '#E07A5F',
      visibility: (data as any).visibility || 'private',
      created_at: data.created_at || new Date().toISOString()
    };
    
    setIdeas(prev => (prev || []).map(idea => idea.id === id ? safeIdea : idea));
    return safeIdea;
  };

  const deleteIdea = async (id: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    if (!id?.trim()) throw new Error('Idea ID is required');

    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase error deleting idea:', error);
      throw new Error(`Failed to delete idea: ${error.message}`);
    }
    
    setIdeas(prev => (prev || []).filter(idea => idea.id !== id));
  };

  useEffect(() => {
    fetchIdeas();
  }, [user]);

  return {
    ideas,
    loading,
    createIdea,
    updateIdea,
    deleteIdea,
    refetch: fetchIdeas,
  };
};
