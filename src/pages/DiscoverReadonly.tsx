import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type PublicIdea = {
  id: string;
  content: string;
  keywords: string[] | null;
  mood: string | null;
  created_at: string;
};

const DiscoverReadonly: React.FC = () => {
  const { t } = useI18n();
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ideas')
        .select('id, content, keywords, mood, created_at, visibility')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (q.trim()) {
        query = query.ilike('content', `%${q.trim()}%`);
      }
      if (tags.length > 0) {
        query = (query as any).contains('keywords', tags);
      }

      const { data, error } = await query;
      if (error) throw error;
      setIdeas((data || []).map((d) => ({
        id: d.id,
        content: d.content,
        keywords: Array.isArray(d.keywords) ? d.keywords : [],
        mood: d.mood || null,
        created_at: d.created_at,
      })));
    } catch (e) {
      console.error('Discover load error', e);
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{t('discover.title') || 'Discover'}</h1>
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <Input placeholder="Search content..." value={q} onChange={(e) => setQ(e.target.value)} />
            <Input placeholder="Tags (comma separated)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
            <Button onClick={() => { setTags(tagInput.split(',').map(s=>s.trim()).filter(Boolean)); load(); }}>Apply</Button>
            <Button variant="outline" onClick={() => { setQ(''); setTagInput(''); setTags([]); load(); }}>Reset</Button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading ideas…</div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No ideas yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {ideas.map((idea) => (
                <Card key={idea.id} className="p-4">
                  <div className="text-slate-800 whitespace-pre-wrap break-words">{idea.content}</div>
                  <div className="mt-2 text-sm text-slate-500 flex flex-wrap gap-2">
                    {idea.keywords?.slice(0, 5).map((k) => (
                      <span key={k} className="px-2 py-0.5 bg-slate-100 rounded-full">#{k}</span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(idea.created_at).toLocaleString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DiscoverReadonly;
