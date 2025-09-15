
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'pro' | 'studio';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_end?: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      setSubscription({
        id: 'temp-id',
        user_id: user.id,
        tier: data.tier || 'free',
        status: data.status || 'active',
        current_period_end: data.current_period_end,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Default to free tier on error
      setSubscription({
        id: 'temp-id',
        user_id: user.id,
        tier: 'free',
        status: 'active',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (tier: 'pro' | 'studio') => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { tier },
    });

    if (error) throw error;

    // Open Stripe checkout in a new tab
    window.open(data.url, '_blank');
    return data;
  };

  const hasFeatureAccess = (feature: string) => {
    if (!subscription) return false;

    switch (feature) {
      case 'unlimited_sparks':
      case 'muse_ai':
      case 'export':
        return subscription.tier === 'pro' || subscription.tier === 'studio';
      case 'collaboration':
      case 'api_access':
        return subscription.tier === 'studio';
      default:
        return true;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckoutSession,
    hasFeatureAccess,
  };
};
