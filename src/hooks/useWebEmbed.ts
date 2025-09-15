
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface EmbedData {
  id: string;
  type: 'canvas' | 'project' | 'mesh';
  title: string;
  content: any;
  isPublic: boolean;
  shareUrl: string;
  embedCode: string;
}

export const useWebEmbed = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createEmbed = async (
    type: 'canvas' | 'project' | 'mesh',
    title: string,
    content: any,
    isPublic: boolean = false
  ): Promise<EmbedData> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const embedId = `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const embedData = {
        id: embedId,
        user_id: user.id,
        type,
        title,
        content: JSON.stringify(content),
        is_public: isPublic,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('embeds')
        .insert(embedData);

      if (error) throw error;

      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/embed/${embedId}`;
      const embedCode = `<iframe src="${shareUrl}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`;

      return {
        id: embedId,
        type,
        title,
        content,
        isPublic,
        shareUrl,
        embedCode,
      };
    } catch (error) {
      console.error('Error creating embed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async (embedId: string, isPublic: boolean) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('embeds')
      .update({ is_public: isPublic })
      .eq('id', embedId)
      .eq('user_id', user.id);

    if (error) throw error;
  };

  return {
    loading,
    createEmbed,
    togglePublic,
  };
};
