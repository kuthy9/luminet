
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUsageLimits } from './useUsageLimits';

export interface ChatMessage {
  role: 'user' | 'muse';
  content: string;
  timestamp: string;
}

export const useMuseChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { usage, checkUsage } = useUsageLimits();

  const sendMessage = async (message: string, mode: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!usage.canUseMuse) {
      throw new Error(`You've used all ${usage.museLimit} Muse AI sessions this month. Upgrade to Pro for unlimited access!`);
    }

    setLoading(true);
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('muse-chat', {
        body: {
          message,
          mode,
          userId: user.id,
        },
      });

      if (error) throw error;

      // Add Muse response
      const museMessage: ChatMessage = {
        role: 'muse',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, museMessage]);

      // Refresh usage count
      checkUsage();

      return data.response;
    } catch (error) {
      console.error('Error sending message to Muse:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    loading,
    sendMessage,
    clearMessages,
    usage,
  };
};
