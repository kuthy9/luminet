import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [hasIdeas, setHasIdeas] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('embeds')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'profile')
        .limit(1);
      setHasProfile((profile || []).length > 0);

      const { data: ideas } = await supabase
        .from('ideas')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      setHasIdeas((ideas || []).length > 0);
    };
    check();
  }, [user?.id]);

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold">Welcome to Luminet</h1>
          <p className="text-slate-600">Let’s set you up for the best matches.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">1. Profile</h3>
              <p className="text-sm text-slate-600 mb-3">Add your skills and interests</p>
              <Button onClick={() => navigate('/profile')} className="w-full">Go to Profile</Button>
              {hasProfile && <div className="mt-2 text-xs text-green-600">Done</div>}
            </div>
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">2. Create Ideas</h3>
              <p className="text-sm text-slate-600 mb-3">Capture some ideas (public helps matching)</p>
              <Button onClick={() => navigate('/spark')} className="w-full">Go to Spark</Button>
              {hasIdeas && <div className="mt-2 text-xs text-green-600">Done</div>}
            </div>
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">3. Discover</h3>
              <p className="text-sm text-slate-600 mb-3">Browse and say hi to others</p>
              <Button onClick={() => navigate('/discover')} className="w-full">Go to Discover</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Onboarding;

