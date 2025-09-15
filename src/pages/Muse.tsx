
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { useMuseChat } from '@/hooks/useMuseChat';
import { useMuseEnhanced } from '@/hooks/useMuseEnhanced';
import { useAuth } from '@/hooks/useAuth';
import {
  MessageCircle,
  Lightbulb,
  Users,
  Target,
  Send,
  Sparkles,
  BarChart3,
  Network,
  FileText,
  Zap,
  Brain,
  TrendingUp,
  GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

const Muse = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMuseChat();
  const {
    getStructureRecommendations,
    getProjectRecommendations,
    getContentSummary,
    getCollaboratorRecommendations,
    generateSmartSuggestions,
    loading: enhancedLoading,
    lastResponse
  } = useMuseEnhanced();

  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState('expand');
  const [activeTab, setActiveTab] = useState('chat');
  const [enhancedResponse, setEnhancedResponse] = useState<string>('');

  const modes = [
    { id: 'expand', label: 'Expand Ideas', icon: Lightbulb, description: 'Help develop and elaborate concepts' },
    { id: 'connect', label: 'Find Connections', icon: Target, description: 'Discover relationships between ideas' },
    { id: 'collaborate', label: 'Find Collaborators', icon: Users, description: 'Recommend potential team members' },
  ];

  const enhancedFeatures = [
    {
      id: 'structure',
      title: 'Structure Reorganization',
      description: 'Analyze and reorganize your ideas and projects',
      icon: GitBranch,
      action: () => handleEnhancedFeature('structure'),
    },
    {
      id: 'projects',
      title: 'Project Connections',
      description: 'Discover potential connections between ideas and projects',
      icon: Network,
      action: () => handleEnhancedFeature('projects'),
    },
    {
      id: 'summary',
      title: 'Content Analysis',
      description: 'Get comprehensive analysis of your creative activities',
      icon: FileText,
      action: () => handleEnhancedFeature('summary'),
    },
    {
      id: 'collaborators',
      title: 'Smart Collaborator Matching',
      description: 'Match suitable collaboration partners based on skills and interests',
      icon: Users,
      action: () => handleEnhancedFeature('collaborators'),
    },
  ];

  const handleSend = async () => {
    if (!message.trim()) return;

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to use Muse AI",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessage(message, activeMode);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Send Failed",
        description: "Unable to send message, please try again later",
        variant: "destructive",
      });
    }
  };

  const handleEnhancedFeature = async (featureType: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to use enhanced AI features",
        variant: "destructive",
      });
      return;
    }

    try {
      let response = '';

      switch (featureType) {
        case 'structure':
          response = await getStructureRecommendations('ideas');
          break;
        case 'projects':
          response = await getProjectRecommendations();
          break;
        case 'summary':
          response = await getContentSummary('overall');
          break;
        case 'collaborators':
          response = await getCollaboratorRecommendations();
          break;
        default:
          return;
      }

      setEnhancedResponse(response);
      setActiveTab('enhanced');

      toast({
        title: "Analysis Complete",
        description: "AI analysis results have been generated",
      });
    } catch (error) {
      console.error('Enhanced feature error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to generate AI analysis, please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="w-12 h-12 text-coral-500" />
              <h1 className="text-5xl font-bold text-slate-800">
                Muse AI
              </h1>
              <Sparkles className="w-8 h-8 text-coral-400" />
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
              Your AI creative assistant - now with enhanced analysis and recommendation capabilities
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-coral-600 border-coral-300">
                <Zap className="w-3 h-3 mr-1" />
                Enhanced AI Features
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                <TrendingUp className="w-3 h-3 mr-1" />
                Smart Analysis
              </Badge>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat Mode
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Enhanced Features
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Smart Insights
              </TabsTrigger>
            </TabsList>

            {/* Chat Mode */}
            <TabsContent value="chat" className="space-y-8">
              {/* Mode Selection */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Choose Chat Mode:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {modes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        activeMode === mode.id
                          ? 'border-coral-300 bg-coral-50'
                          : 'border-warm-200 hover:border-warm-300 bg-white'
                      }`}
                    >
                      <mode.icon className={`w-8 h-8 mb-3 ${
                        activeMode === mode.id ? 'text-coral-600' : 'text-slate-600'
                      }`} />
                      <h4 className="font-semibold text-slate-800 mb-2">{mode.label}</h4>
                      <p className="text-sm text-slate-600">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="bg-white rounded-3xl border border-warm-200 overflow-hidden">
                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-coral-300 mx-auto mb-4" />
                      <p className="text-slate-500">Start chatting with Muse AI...</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${
                          msg.role === 'user'
                            ? 'bg-coral-500 text-white'
                            : 'bg-cream-50 border border-warm-200'
                        }`}>
                          {msg.role === 'muse' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-coral-500" />
                              <span className="text-xs font-medium text-coral-600">Muse AI</span>
                            </div>
                          )}
                          <p className={`text-sm leading-relaxed whitespace-pre-line ${
                            msg.role === 'user' ? 'text-white' : 'text-slate-700'
                          }`}>{msg.content}</p>
                          <div className={`text-xs mt-2 ${
                            msg.role === 'user' ? 'text-coral-100' : 'text-slate-500'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-cream-50 border border-warm-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-coral-500" />
                          <span className="text-xs font-medium text-coral-600">Muse AI</span>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-coral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-coral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-coral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-warm-200 p-6">
                  <div className="flex gap-4">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask Muse AI for creative expansion, connection discovery, or collaboration suggestions..."
                      className="flex-1 resize-none border-warm-200 focus:border-coral-300 rounded-xl text-slate-700 placeholder:text-slate-400"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || loading || !user}
                      className="px-6 bg-coral-500 hover:bg-coral-600 text-white rounded-xl flex items-center gap-2 self-end"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
                    <span>Mode: {modes.find(m => m.id === activeMode)?.label}</span>
                    <span>Press Enter to send</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Enhanced Features */}
            <TabsContent value="enhanced" className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Enhanced AI Features</h3>
                <p className="text-slate-600">Leverage advanced AI analysis for deep insights and personalized recommendations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enhancedFeatures.map((feature) => (
                  <Card key={feature.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={feature.action}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <feature.icon className="w-6 h-6 text-coral-500" />
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">{feature.description}</p>
                      <Button
                        className="w-full bg-coral-500 hover:bg-coral-600"
                        disabled={enhancedLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          feature.action();
                        }}
                      >
                        {enhancedLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Start Analysis
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Enhanced Response Display */}
              {enhancedResponse && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-coral-500" />
                      AI Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate max-w-none">
                      <div className="whitespace-pre-line text-slate-700 leading-relaxed">
                        {enhancedResponse}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(enhancedResponse)}
                      >
                        Copy Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEnhancedResponse('')}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Smart Insights</h3>
                <p className="text-slate-600">Deep analysis and trend insights generated from your creative data</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Creative Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm mb-3">Analyze your creative patterns and activity changes</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEnhancedFeature('summary')}
                    >
                      View Trends
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Network className="w-5 h-5 text-blue-500" />
                      Connection Network
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm mb-3">Discover hidden connections between ideas and projects</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEnhancedFeature('projects')}
                    >
                      Explore Connections
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-purple-500" />
                      Collaboration Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 text-sm mb-3">Discover potential collaboration partners and opportunities</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEnhancedFeature('collaborators')}
                    >
                      Find Partners
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Muse;
