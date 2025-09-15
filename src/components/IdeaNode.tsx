
import React from 'react';
import { cn } from '@/lib/utils';

interface IdeaNodeProps {
  emoji: string;
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IdeaNode: React.FC<IdeaNodeProps> = ({
  emoji,
  label,
  isActive = false,
  onClick,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "idea-node",
          sizeClasses[size],
          isActive && "border-accent scale-110",
          className
        )}
        onClick={onClick}
      >
        <span className="relative z-10">{emoji}</span>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground text-center max-w-20">
          {label}
        </span>
      )}
    </div>
  );
};
