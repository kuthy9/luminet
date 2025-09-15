
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Sparkles, Tag, Palette, Link } from 'lucide-react';
import { LuminetLogo } from '@/components/LuminetLogo';
import { SettingsDropdown } from '@/components/SettingsDropdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const [newIdea, setNewIdea] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const moodColors = [
    { name: 'Inspired', color: 'bg-purple-400', value: 'inspired' },
    { name: 'Curious', color: 'bg-blue-400', value: 'curious' },
    { name: 'Creative', color: 'bg-pink-400', value: 'creative' },
    { name: 'Focused', color: 'bg-green-400', value: 'focused' },
    { name: 'Excited', color: 'bg-orange-400', value: 'excited' },
  ];

  const recentIdeas = [
    {
      id: 1,
      content: "A platform that transforms scattered thoughts into living constellation networks",
      mood: "inspired",
      tags: ["innovation", "creativity", "network"],
      connections: 3,
      created: "2 hours ago"
    },
    {
      id: 2,
      content: "What if AI could detect emotional resonance between different ideas?",
      mood: "curious",
      tags: ["AI", "emotion", "connection"],
      connections: 5,
      created: "5 hours ago"
    },
    {
      id: 3,
      content: "Collaborative canvas where thoughts evolve through shared interaction",
      mood: "creative",
      tags: ["collaboration", "canvas", "evolution"],
      connections: 2,
      created: "1 day ago"
    }
  ];

  const handleCreateIdea = () => {
    if (newIdea.trim()) {
      // Here you would typically save to database
      console.log('Creating idea:', { content: newIdea, mood: selectedMood, tags });
      setNewIdea('');
      setSelectedMood('');
      setTags([]);
    }
  };

  return (
    <div className="page-container">
      {/* Navigation */}
      <nav className="page-header">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <LuminetLogo className="w-10 h-10" />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/mesh')}>Mesh</Button>
            <Button variant="ghost" onClick={() => navigate('/canvas')}>Canvas</Button>
            <Button variant="ghost" onClick={() => navigate('/muse')}>Muse</Button>
            <SettingsDropdown />
          </div>
        </div>
      </nav>

      <div className="page-content">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 cosmic-title">
            Spark Creation
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Transform fleeting thoughts into glowing nodes that pulse with potential
          </p>
        </div>

        {/* Idea Creation Card */}
        <Card className="mb-12 max-w-4xl mx-auto memory-chunk">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Capture New Inspiration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Idea Input */}
            <div>
              <Input
                placeholder="What's sparking in your mind right now?"
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                className="text-lg p-4 rounded-xl border-primary/20 focus:border-primary/40"
              />
            </div>

            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Choose your mood:</label>
              <div className="flex gap-3 flex-wrap">
                {moodColors.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                      selectedMood === mood.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${mood.color}`}></div>
                    <span className="text-sm">{mood.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-3">Add tags:</label>
              <div className="flex gap-2 flex-wrap">
                {['innovation', 'creativity', 'AI', 'collaboration', 'design', 'future'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (tags.includes(tag)) {
                        setTags(tags.filter(t => t !== tag));
                      } else {
                        setTags([...tags, tag]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      tags.includes(tag)
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <Tag className="w-3 h-3 inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleCreateIdea}
              className="w-full cosmic-cta"
              disabled={!newIdea.trim()}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Spark
            </Button>
          </CardContent>
        </Card>

        {/* Recent Ideas */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold">Your Constellation</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search ideas..." className="pl-10 w-64" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentIdeas.map((idea) => (
              <Card key={idea.id} className="memory-chunk group">
                <CardContent className="p-6">
                  <p className="text-foreground mb-4 leading-relaxed">{idea.content}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${
                      moodColors.find(m => m.value === idea.mood)?.color || 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-600 capitalize">{idea.mood}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {idea.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Link className="w-4 h-4" />
                      {idea.connections} connections
                    </div>
                    <span>{idea.created}</span>
                  </div>

                  <Button 
                    className="card-action-button w-full mt-4"
                    onClick={() => navigate('/mesh')}
                  >
                    View in Mesh
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cosmic particles */}
      <div className="cosmic-particles" />
    </div>
  );
};

export default Dashboard;
