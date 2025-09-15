import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

type Idea = { id: string; user_id: string | null; keywords: string[] | null; content: string };
type ProfileSketch = { user_id: string; tags: Set<string>; sampleIdeas: Idea[] };

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 && b.size === 0) return 0;
  const inter = new Set([...a].filter(x => b.has(x))).size;
  const union = new Set([...a, ...b]).size;
  return inter / union;
};

const MatchPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [messageTo, setMessageTo] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("Hi, I love your ideas — would you like to connect?");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ideas')
          .select('id, user_id, keywords, content')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setIdeas((data || []) as Idea[]);
      } catch (e) {
        console.error('match load error', e);
        setIdeas([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentUserTags = useMemo(() => {
    const mine = ideas.filter(i => i.user_id === user?.id);
    const tags = new Set<string>();
    mine.forEach(i => (i.keywords || []).forEach(k => tags.add(k.toLowerCase())));
    // fallback: tokenize content if no keywords
    if (tags.size === 0) {
      mine.forEach(i => i.content.split(/\W+/).filter(w => w.length > 3).forEach(w => tags.add(w.toLowerCase())));
    }
    return tags;
  }, [ideas, user?.id]);

  const others: ProfileSketch[] = useMemo(() => {
    const grouped = new Map<string, ProfileSketch>();
    ideas.filter(i => i.user_id && i.user_id !== user?.id).forEach(i => {
      const key = i.user_id as string;
      if (!grouped.has(key)) grouped.set(key, { user_id: key, tags: new Set(), sampleIdeas: [] });
      const entry = grouped.get(key)!;
      (i.keywords || []).forEach(k => entry.tags.add(String(k).toLowerCase()));
      if (entry.sampleIdeas.length < 3) entry.sampleIdeas.push(i);
    });
    // Fallback: content tokens
    grouped.forEach(entry => {
      if (entry.tags.size === 0) {
        entry.sampleIdeas.forEach(i => i.content.split(/\W+/).filter(w => w.length > 3).forEach(w => entry.tags.add(w.toLowerCase())));
      }
    });
    return [...grouped.values()];
  }, [ideas, user?.id]);

  const ranked = useMemo(() => {
    const mine = currentUserTags;
    const scored = others.map(o => ({
      user_id: o.user_id,
      score: Math.round(jaccard(mine, o.tags) * 100) / 100,
      sampleIdeas: o.sampleIdeas,
      tags: [...o.tags].slice(0, 10),
    })).filter(r => r.score > 0);
    return scored.sort((a, b) => b.score - a.score).slice(0, 20);
  }, [others, currentUserTags]);

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">{t('match.title') || 'Potential Collaborators'}</h1>
          {loading ? (
            <div className="text-center text-muted-foreground py-12">Calculating matches…</div>
          ) : ranked.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No matches yet. Try adding keywords to your ideas.</div>
          ) : (
            <div className="space-y-4">
              {ranked.map((m) => (
                <Card key={m.user_id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">User {m.user_id.slice(0, 6)}…</div>
                      <div className="text-sm text-slate-600">Similarity score: {Math.round(m.score * 100)}%</div>
                    </div>
                    <button
                      className="px-3 py-1 rounded bg-coral-500 text-white text-sm disabled:opacity-50"
                      disabled={!user}
                      onClick={() => { setMessageTo(m.user_id); setOpen(true); }}
                    >Say hi</button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-2">
                    {m.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 rounded-full">#{t}</span>
                    ))}
                  </div>
                  <div className="mt-3 text-sm">
                    {m.sampleIdeas.map((i) => (
                      <div key={i.id} className="text-slate-700 truncate">• {i.content}</div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Say hi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!user || !messageTo) return;
                try {
                  await supabase.from('embeds').upsert({
                    id: crypto.randomUUID(),
                    user_id: user.id,
                    type: 'contact_request',
                    title: 'say_hi',
                    content: JSON.stringify({ from: user.id, to: messageTo, message: messageText, status: 'pending' }),
                  });
                  setOpen(false);
                  setMessageTo(null);
                  toast({ title: 'Request sent', description: 'Your introduction has been delivered.' });
                } catch (e) {
                  console.error(e);
                  toast({ title: 'Failed to send', description: 'Please try again later.', variant: 'destructive' });
                }
              }}>Send</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MatchPage;
