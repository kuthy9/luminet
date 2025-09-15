
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, Brain, Lightbulb, Zap } from 'lucide-react';

interface IdeaInputProps {
  onSubmit: (idea: {
    content: string;
    keywords: string[];
    mood: string;
    color: string;
  }) => void;
}

export const IdeaInput: React.FC<IdeaInputProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('curious');
  const [customKeywords, setCustomKeywords] = useState('');

  const moods = [
    { name: 'curious', label: '好奇', color: '#3b82f6', icon: Brain },
    { name: 'thoughtful', label: '深思', color: '#8b5cf6', icon: Heart },
    { name: 'wonder', label: '惊奇', color: '#06b6d4', icon: Lightbulb },
    { name: 'excited', label: '兴奋', color: '#f59e0b', icon: Zap },
  ];

  const extractKeywords = (text: string) => {
    // Simple keyword extraction (in real app, would use NLP)
    const commonWords = ['是', '的', '了', '在', '有', '和', '就', '不', '都', '会', '说', '要', '又', '与', '及'];
    return text
      .split(/[，。！？、\s]+/)
      .filter(word => word.length > 1 && !commonWords.includes(word))
      .slice(0, 5);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    const autoKeywords = extractKeywords(content);
    const manualKeywords = customKeywords
      .split(/[，,\s]+/)
      .filter(k => k.trim())
      .slice(0, 3);
    
    const allKeywords = [...new Set([...autoKeywords, ...manualKeywords])].slice(0, 6);
    const mood = moods.find(m => m.name === selectedMood);

    onSubmit({
      content: content.trim(),
      keywords: allKeywords,
      mood: selectedMood,
      color: mood?.color || '#3b82f6'
    });

    setContent('');
    setCustomKeywords('');
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            ✨ 记录你的灵感闪现
          </label>
          <Textarea
            placeholder="在这里记录你的想法、问题、感悟或创意..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-slate-700/50 border-purple-500/30 text-white placeholder-slate-400 min-h-[120px] resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-3 block">
            🎭 选择情绪色彩
          </label>
          <div className="grid grid-cols-2 gap-3">
            {moods.map((mood) => {
              const IconComponent = mood.icon;
              return (
                <button
                  key={mood.name}
                  onClick={() => setSelectedMood(mood.name)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                    selectedMood === mood.name
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: mood.color }}
                  />
                  <IconComponent className="w-4 h-4 text-slate-300" />
                  <span className="text-sm text-slate-300 font-medium">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            🏷️ 添加关键词 (可选)
          </label>
          <Input
            placeholder="用逗号分隔关键词，如：科技, 创新, 未来"
            value={customKeywords}
            onChange={(e) => setCustomKeywords(e.target.value)}
            className="bg-slate-700/50 border-purple-500/30 text-white placeholder-slate-400"
          />
        </div>

        {content && (
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              预览关键词
            </label>
            <div className="flex flex-wrap gap-2">
              {extractKeywords(content).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-600/20 text-blue-300">
                  {keyword}
                </Badge>
              ))}
              {customKeywords.split(/[，,\s]+/).filter(k => k.trim()).map((keyword, index) => (
                <Badge key={`custom-${index}`} variant="secondary" className="bg-purple-600/20 text-purple-300">
                  {keyword.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 group"
        >
          <Sparkles className="mr-2 w-4 h-4 group-hover:animate-pulse" />
          点亮思想星点
        </Button>
      </CardContent>
    </Card>
  );
};
