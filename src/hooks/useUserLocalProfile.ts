import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type LocalProfile = {
  bio?: string;
  skills: string[];
  interests: string[];
  available_for_collaboration: boolean;
  timezone?: string;
  location?: string;
  updated_at?: string;
};

const DEFAULT_PROFILE: LocalProfile = {
  skills: [],
  interests: [],
  available_for_collaboration: true,
};

// Store profile in 'embeds' table as a JSON string content with type 'profile'
export const useUserLocalProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LocalProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('embeds')
        .select('id, content')
        .eq('user_id', user.id)
        .eq('type', 'profile')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      const content = data?.[0]?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          setProfile({ ...DEFAULT_PROFILE, ...parsed });
        } catch {
          // ignore parse error, keep defaults
        }
      }
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (p: LocalProfile) => {
    if (!user?.id) throw new Error('Not authenticated');
    setLoading(true);
    try {
      const payload = {
        id: crypto.randomUUID(),
        user_id: user.id,
        type: 'profile',
        title: 'user_profile',
        content: JSON.stringify({ ...p, updated_at: new Date().toISOString() }),
      };
      const { error } = await supabase
        .from('embeds')
        .upsert(payload);
      if (error) throw error;
      setProfile(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoaded(false);
    if (user?.id) loadProfile();
  }, [user?.id]);

  return { profile, setProfile, saveProfile, loadProfile, loading, loaded };
};

