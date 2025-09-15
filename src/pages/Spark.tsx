
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { useIdeas } from '@/hooks/useIdeas';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Send, Lightbulb, Network, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Spark = () => {
  const { t } = useI18n();
  const { createIdea, loading } = useIdeas();
  const { user } = useAuth();
  const [thought, setThought] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create sparks",
        variant: "destructive",
      });
      return;
    }

    // usage limits removed for MVP

    if (!thought.trim()) {
      toast({
        title: "Empty spark",
        description: "Please enter a thought before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const keywords = thought.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      const mood = thought.includes('!') ? 'excited' : 
                   thought.includes('?') ? 'curious' : 'contemplative';
      const ideaType = thought.length > 100 ? 'detailed' : 'concise';
      
      await createIdea({
        content: thought,
        keywords: keywords.slice(0, 5),
        mood,
        idea_type: ideaType,
        color_signature: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        visibility: isPublic ? 'public' : 'private',
      });

      toast({
        title: "✨ Spark captured!",
        description: "Your idea has been transformed into a visual node",
      });
      
      setThought('');
    } catch (error) {
      console.error('Error creating spark:', error);
      toast({
        title: "Error",
        description: "Failed to create spark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-peach-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-coral-600" />
            </div>
            <h1 className="text-5xl font-bold text-slate-800 mb-4">
              {t('spark.title')}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Transform thoughts into visual nodes
            </p>
          </div>

          {/* Usage Counter removed for MVP */}

          {/* Spark Input */}
          <div className="bg-white rounded-3xl p-8 border border-warm-200 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-4">
                  What's sparking in your mind?
                </label>
                {!isPublic && (
                  <div className="mb-3 text-sm text-slate-600 bg-peach-50 border border-peach-200 rounded-md p-3">
                    Share publicly to boost discovery and matching with potential partners.
                  </div>
                )}
                <Textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  placeholder="Share an idea, insight, or inspiration..."
                  className="w-full h-32 text-slate-700 placeholder:text-slate-400 border-warm-200 focus:border-coral-300 rounded-xl resize-none"
                  
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch id="visibility" checked={isPublic} onCheckedChange={setIsPublic} />
                  <Label htmlFor="visibility" className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />} 
                    {isPublic ? 'Public' : 'Private'}
                  </Label>
                </div>
                <div className="text-sm text-slate-500">Public ideas appear in Discover and can be matched.</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  {thought.length}/500 characters
                </div>
                <Button
                  type="submit"
                  disabled={!thought.trim() || isSubmitting || !user}
                  className="bg-coral-500 hover:bg-coral-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Capture Spark
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* How it works / Startup-friendly tone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-mint-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-6 h-6 text-mint-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">From Spark to Startup</h3>
              <p className="text-sm text-slate-600">Turn raw insights into venture-ready opportunities</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-peach-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-peach-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Explore & Validate</h3>
              <p className="text-sm text-slate-600">Explore directions and validate problem–solution fit</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Network className="w-6 h-6 text-coral-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Find Cofounders</h3>
              <p className="text-sm text-slate-600">Meet like-minded builders to launch together</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Spark;
