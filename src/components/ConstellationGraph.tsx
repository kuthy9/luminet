
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface Idea {
  id: number;
  content: string;
  keywords: string[];
  mood: string;
  color: string;
  x: number;
  y: number;
}

interface ConstellationGraphProps {
  ideas: Idea[];
  showConnections?: boolean;
}

export const ConstellationGraph: React.FC<ConstellationGraphProps> = ({ 
  ideas, 
  showConnections = true 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdea, setHoveredIdea] = useState<Idea | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const calculateSimilarity = (idea1: Idea, idea2: Idea): number => {
    const keywords1 = new Set(idea1.keywords.map(k => k.toLowerCase()));
    const keywords2 = new Set(idea2.keywords.map(k => k.toLowerCase()));
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    return intersection.size / union.size;
  };

  const connections = React.useMemo(() => {
    if (!showConnections) return [];
    
    const result: Array<{
      source: Idea;
      target: Idea;
      strength: number;
    }> = [];

    for (let i = 0; i < ideas.length; i++) {
      for (let j = i + 1; j < ideas.length; j++) {
        const similarity = calculateSimilarity(ideas[i], ideas[j]);
        if (similarity > 0.1) {
          result.push({
            source: ideas[i],
            target: ideas[j],
            strength: similarity
          });
        }
      }
    }
    return result;
  }, [ideas, showConnections]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 500 400"
        onMouseMove={handleMouseMove}
      >
        {/* Definitions for glows and patterns */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)"/>
          </radialGradient>
        </defs>

        {/* Connection lines */}
        {connections.map((connection, index) => (
          <line
            key={index}
            x1={connection.source.x}
            y1={connection.source.y}
            x2={connection.target.x}
            y2={connection.target.y}
            stroke={`url(#connectionGradient-${index})`}
            strokeWidth={connection.strength * 3 + 0.5}
            opacity={0.4 + connection.strength * 0.6}
            filter="url(#glow)"
          >
            <animate
              attributeName="opacity"
              values={`${0.2 + connection.strength * 0.4};${0.6 + connection.strength * 0.4};${0.2 + connection.strength * 0.4}`}
              dur="3s"
              repeatCount="indefinite"
            />
          </line>
        ))}

        {/* Define gradients for connections */}
        <defs>
          {connections.map((connection, index) => (
            <linearGradient 
              key={index}
              id={`connectionGradient-${index}`}
              x1="0%" y1="0%" x2="100%" y2="100%"
            >
              <stop offset="0%" stopColor={connection.source.color} />
              <stop offset="100%" stopColor={connection.target.color} />
            </linearGradient>
          ))}
        </defs>

        {/* Idea nodes */}
        {ideas.map((idea) => (
          <g key={idea.id}>
            {/* Outer glow ring */}
            <circle
              cx={idea.x}
              cy={idea.y}
              r="20"
              fill="none"
              stroke={idea.color}
              strokeWidth="1"
              opacity="0.3"
              filter="url(#glow)"
            >
              <animate
                attributeName="r"
                values="15;25;15"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Main node */}
            <circle
              cx={idea.x}
              cy={idea.y}
              r="8"
              fill={idea.color}
              opacity="0.8"
              filter="url(#glow)"
              className="cursor-pointer transition-all duration-200 hover:opacity-100"
              onMouseEnter={() => setHoveredIdea(idea)}
              onMouseLeave={() => setHoveredIdea(null)}
            >
              <animate
                attributeName="r"
                values="8;12;8"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Inner shine */}
            <circle
              cx={idea.x - 2}
              cy={idea.y - 2}
              r="3"
              fill="rgba(255,255,255,0.6)"
              opacity="0.8"
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIdea && (
        <Card 
          className="absolute z-20 bg-slate-800/95 border-purple-500/50 backdrop-blur-sm pointer-events-none max-w-xs"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <CardContent className="p-4">
            <p className="text-white text-sm font-medium mb-2">
              {hoveredIdea.content}
            </p>
            <div className="flex flex-wrap gap-1">
              {hoveredIdea.keywords.slice(0, 3).map((keyword, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1 rounded-full bg-purple-600/30 text-purple-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-400">
              <div 
                className="w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: hoveredIdea.color }}
              />
              {hoveredIdea.mood}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats overlay */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg backdrop-blur-sm">
        <div>{ideas.length} 个灵感节点</div>
        <div>{connections.length} 个思想连接</div>
      </div>
    </div>
  );
};
