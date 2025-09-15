import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { useUserLocalProfile } from '@/hooks/useUserLocalProfile';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const tokenize = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);

const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { profile, setProfile, saveProfile, loading, loaded } = useUserLocalProfile();
  const [bio, setBio] = useState(profile.bio || '');
  const [skills, setSkills] = useState((profile.skills || []).join(', '));
  const [interests, setInterests] = useState((profile.interests || []).join(', '));
  const [available, setAvailable] = useState(!!profile.available_for_collaboration);
  const [inbox, setInbox] = useState<{ id: string; from?: string; to?: string; status?: string; message?: string; created_at?: string; read_at?: string; }[]>([]);
  const [view, setView] = useState<'received'|'sent'>('received');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingInbox, setLoadingInbox] = useState(false);

  const handleSave = async () => {
    const next = {
      bio,
      skills: tokenize(skills),
      interests: tokenize(interests),
      available_for_collaboration: available,
    };
    await saveProfile(next);
    setProfile(next);
  };

  const loadInbox = async () => {
    if (!user) return;
    setLoadingInbox(true);
    try {
      const base = supabase
        .from('embeds')
        .select('id, content, user_id, created_at')
        .eq('type', 'contact_request')
        .order('created_at', { ascending: false })
        .limit(50);
      const { data, error } = view === 'received'
        ? await base.contains('content', { to: user.id })
        : await base.eq('user_id', user.id);
      if (error) throw error;
      const rows = (data || []).map((r: any) => {
        let parsed: any = {};
        try { parsed = JSON.parse(r.content); } catch {}
        return { id: r.id, from: parsed.from, to: parsed.to, status: parsed.status, message: parsed.message, read_at: parsed.read_at, created_at: r.created_at };
      }).filter(m => view === 'received' ? m.to === user.id : true);
      setInbox(rows);
      if (view === 'received') {
        setUnreadCount(rows.filter(r => !r.read_at).length);
      } else {
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('inbox load failed', e);
      setInbox([]);
    } finally {
      setLoadingInbox(false);
    }
  };

  React.useEffect(() => { loadInbox(); }, [user?.id, view]);

  const updateRequest = async (id: string, patch: any) => {
    const row = inbox.find(i => i.id === id);
    if (!row) return;
    const content = { from: row.from, to: row.to, message: row.message, status: row.status, ...patch };
    try {
      await supabase.from('embeds').update({ content: JSON.stringify(content) }).eq('id', id);
      await loadInbox();
      if (patch.status === 'accepted') toast({ title: 'Request accepted' });
      else if (patch.status === 'declined') toast({ title: 'Request declined' });
      else if (patch.read_at) toast({ title: 'Marked as read' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Action failed', description: 'Please try again later.', variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="page-content"><div className="max-w-2xl mx-auto text-center text-muted-foreground">Please sign in to edit your profile.</div></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">{t('profile.title') || 'Your Profile'}</h1>
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Briefly introduce yourself" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g., vue, react, python, design" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Interests (comma separated)</label>
              <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g., AI, sustainability, education" />
            </div>
            <div className="flex items-center gap-2">
              <input id="avail" type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
              <label htmlFor="avail">Available for collaboration</label>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={loading || !loaded} className="bg-coral-500 text-white">Save</Button>
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Inbox {view==='received' && unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-coral-500 text-white">{unreadCount} new</span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant={view==='received'? 'default':'outline'} size="sm" onClick={() => setView('received')}>Received</Button>
                <Button variant={view==='sent'? 'default':'outline'} size="sm" onClick={() => setView('sent')}>Sent</Button>
                <Button variant="outline" size="sm" onClick={loadInbox} disabled={loadingInbox}>Refresh</Button>
              </div>
            </div>
            {loadingInbox ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : inbox.length === 0 ? (
              <div className="text-muted-foreground">No messages yet.</div>
            ) : (
              <ul className="space-y-3">
                {inbox.map((m) => (
                  <li key={m.id} className="text-sm text-slate-700 border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {view==='received' ? (
                            <>From {m.from ? m.from.slice(0,6)+'…' : 'Unknown'}</>
                          ) : (
                            <>To {m.to ? m.to.slice(0,6)+'…' : 'Unknown'}</>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-slate-100">{m.status || 'pending'}</div>
                    </div>
                    {m.message && <div className="mt-2">{m.message}</div>}
                    <div className="mt-3 flex gap-2">
                      {view==='received' ? (
                        <>
                          <Button size="sm" onClick={() => updateRequest(m.id, { status: 'accepted' })}>Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => updateRequest(m.id, { status: 'declined' })}>Decline</Button>
                          <Button size="sm" variant="outline" onClick={() => updateRequest(m.id, { status: m.status || 'pending', read_at: new Date().toISOString() })}>Mark read</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={async () => {
                          try { await supabase.from('embeds').delete().eq('id', m.id); await loadInbox(); toast({ title: 'Deleted' }); }
                          catch(e){ console.error(e); toast({ title: 'Delete failed', variant: 'destructive' }); }
                        }}>Delete</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
