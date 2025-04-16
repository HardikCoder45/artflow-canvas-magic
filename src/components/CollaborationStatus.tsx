import React from 'react';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface CollaborationStatusProps {
  isConnected: boolean;
  collaboratorCount: number;
  className?: string;
}

const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  isConnected,
  collaboratorCount,
  className
}) => {
  return (
    <div className={cn(
      "fixed top-4 right-4 bg-background/80 backdrop-blur-md rounded-lg py-1 px-3 shadow-md flex items-center gap-2 z-50",
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500",
        isConnected ? "animate-pulse" : ""
      )} />
      <div className="flex items-center gap-1">
        <Users size={14} />
        <span className="text-xs">
          {collaboratorCount} {collaboratorCount === 1 ? 'user' : 'users'}
        </span>
      </div>
    </div>
  );
};

export default CollaborationStatus; 