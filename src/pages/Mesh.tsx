
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { useIdeas } from '@/hooks/useIdeas';
import { useAuth } from '@/hooks/useAuth';
import { Search, Eye, Link, Share2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Mesh = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { ideas, loading } = useIdeas();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<any>(null);

  const filteredIdeas = React.useMemo(() => {
    if (!ideas || ideas.length === 0) return [];
    
    return ideas.filter(idea => {
      if (!idea?.content) return false;
      
      const contentMatch = idea.content.toLowerCase().includes(searchTerm.toLowerCase());
      const keywordMatch = idea.keywords?.some(keyword => 
        keyword && keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return contentMatch || keywordMatch;
    });
  }, [ideas, searchTerm]);

  const handleIdeaClick = (idea: any) => {
    setSelectedIdea(idea);
  };

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-800 mb-4">
              {t('mesh.title')}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Explore your interconnected web of ideas
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your ideas, keywords, or connections..."
                className="pl-10 h-12 border-warm-200 focus:border-coral-300 rounded-xl text-slate-700 placeholder:text-slate-500"
              />
            </div>
            <Button
              variant="outline"
              className="border-warm-200 hover:border-coral-300 hover:bg-coral-50 text-slate-700 px-6 h-12 rounded-xl"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Ideas Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">All Ideas</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-warm-200 animate-pulse">
                    <div className="h-4 bg-warm-200 rounded mb-3"></div>
                    <div className="h-20 bg-warm-200 rounded mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-warm-200 rounded"></div>
                      <div className="h-6 w-20 bg-warm-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-warm-200">
                <div className="w-16 h-16 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-warm-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {ideas.length === 0 ? 'No ideas yet' : 'No matching ideas'}
                </h3>
                <p className="text-slate-600">
                  {ideas.length === 0 
                    ? 'Start by creating your first spark!' 
                    : 'Try adjusting your search terms'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map((idea, index) => {
                  if (!idea?.id || !idea?.content) return null;
                  
                  return (
                    <div
                      key={idea.id}
                      onClick={() => handleIdeaClick(idea)}
                      className="bg-white rounded-2xl p-6 border border-warm-200 hover:border-coral-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: idea.color_signature || '#E07A5F' }}
                        ></div>
                        <span className="text-xs text-slate-500">
                          {idea.created_at ? new Date(idea.created_at).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                      
                      <p className="text-slate-700 mb-4 line-clamp-3 group-hover:text-slate-900">
                        {idea.content}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {idea.keywords && Array.isArray(idea.keywords) && idea.keywords.slice(0, 3).map((keyword, i) => {
                          if (!keyword) return null;
                          return (
                            <span
                              key={i}
                              className="px-2 py-1 bg-warm-100 text-warm-700 text-xs rounded-full"
                            >
                              {keyword}
                            </span>
                          );
                        })}
                        {idea.mood && (
                          <span className="px-2 py-1 bg-mint-100 text-mint-700 text-xs rounded-full">
                            {idea.mood}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Click to expand</span>
                        <div className="flex gap-2">
                          <Eye className="w-4 h-4" />
                          <Link className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Idea Detail Modal */}
        <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedIdea?.color_signature || '#E07A5F' }}
                ></div>
                Idea Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedIdea && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">Content</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedIdea.content}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Type</h3>
                    <span className="px-3 py-1 bg-peach-100 text-peach-700 text-sm rounded-full">
                      {selectedIdea.idea_type || 'General'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Mood</h3>
                    <span className="px-3 py-1 bg-mint-100 text-mint-700 text-sm rounded-full">
                      {selectedIdea.mood || 'Neutral'}
                    </span>
                  </div>
                </div>
                
                {selectedIdea.keywords && Array.isArray(selectedIdea.keywords) && selectedIdea.keywords.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.keywords.map((keyword: string, i: number) => {
                        if (!keyword) return null;
                        return (
                          <span
                            key={i}
                            className="px-2 py-1 bg-warm-100 text-warm-700 text-sm rounded-full"
                          >
                            {keyword}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-warm-200">
                  <span className="text-sm text-slate-500">
                    Created {selectedIdea.created_at ? new Date(selectedIdea.created_at).toLocaleString() : 'Unknown date'}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Link className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Mesh;
