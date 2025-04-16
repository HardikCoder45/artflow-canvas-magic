import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Circle, CircleDot, Square, SquareDot } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ShapeToggleButtonProps {
  isFilled: boolean;
  onToggle: () => void;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const ShapeToggleButton = ({
  isFilled,
  onToggle,
  variant = 'outline',
  size = 'default',
  className = ''
}: ShapeToggleButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={onToggle}
            className={`${className} transition-colors`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label={isFilled ? "Switch to outline shapes" : "Switch to filled shapes"}
          >
            <div className="relative w-5 h-5">
              {/* First icon - Square */}
              <div className="absolute inset-0 transition-opacity duration-200" 
                style={{ opacity: isFilled ? 1 : 0 }}>
                <SquareDot size={20} />
              </div>
              
              {/* Second icon - Circle */}
              <div className="absolute inset-0 transition-opacity duration-200" 
                style={{ opacity: isFilled ? 0 : 1 }}>
                <Square size={20} />
              </div>
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isFilled ? "Filled shapes (click for outline only)" : "Outline shapes (click for filled)"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ShapeToggleButton; 