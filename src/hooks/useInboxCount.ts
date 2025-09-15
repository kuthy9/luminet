import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useInboxCount = () => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = async () => {
    if (!user?.id) { setUnread(0); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('embeds')
        .select('id, content')
        .eq('type', 'contact_request')
        .contains('content', { to: user.id })
        .limit(200);
      if (error) throw error;
      const rows = (data || []) as any[];
      const count = rows.reduce((acc, r) => {
        try {
          const c = JSON.parse((r as any).content);
          return acc + (c && !c.read_at ? 1 : 0);
        } catch { return acc; }
      }, 0);
      setUnread(count);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { unread, loading, refresh: fetchCount };
};

