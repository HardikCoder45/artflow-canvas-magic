import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import ArtCanvas from './ArtCanvas';
import { motion } from 'framer-motion';

interface EnhancedArtCanvasProps {
  fullScreen?: boolean;
  width?: number;
  height?: number;
  onChanged?: (changed: boolean) => void;
}

/**
 * Enhanced Art Canvas component that wraps the ArtCanvas
 * with performance optimizations and additional features
 */
const EnhancedArtCanvas = memo(({
  fullScreen = false,
  width = 800,
  height = 600,
  onChanged
}: EnhancedArtCanvasProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const frameRef = useRef<number | null>(null);
  const canvasRef = useRef<any>(null);
  const [selectedTool, setSelectedTool] = useState<string>(() => {
    return localStorage.getItem('artflow-selected-tool') || 'pencil';
  });
  
  // Track loaded state for fade-in animation
  useEffect(() => {
    // Delay loading slightly to ensure canvas initialization is complete
    frameRef.current = requestAnimationFrame(() => {
      setTimeout(() => {
        setIsLoaded(true);
      }, 100);
    });
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Handle tool selection events
  const handleToolSelect = useCallback((tool: string) => {
    setSelectedTool(tool);
    localStorage.setItem('artflow-selected-tool', tool);
  }, []);

  // Adding a custom event handler to capture tool selection
  useEffect(() => {
    const handleToolSelection = (e: CustomEvent) => {
      // This is where we can add any custom behavior when tools change
      setSelectedTool(e.detail.tool);
      localStorage.setItem('artflow-selected-tool', e.detail.tool);
    };

    // Listen for custom events from ArtCanvas
    window.addEventListener('artcanvas-tool-selected' as any, handleToolSelection);
    
    return () => {
      window.removeEventListener('artcanvas-tool-selected' as any, handleToolSelection);
    };
  }, []);

  // Add keyboard shortcut handler that applies globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if modifier keys are pressed (except for shortcuts that need modifiers)
      if (e.altKey) return;
      
      // Skip if user is typing in input or textarea
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      
      // Common keyboard shortcuts for tools
      if (!e.ctrlKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'v': handleToolSelect('select'); break;
          case 'b': handleToolSelect('brush'); break;
          case 'p': handleToolSelect('pencil'); break;
          case 'e': handleToolSelect('eraser'); break;
          case 't': handleToolSelect('text'); break;
          case 'f': handleToolSelect('fill'); break;
          case 'r': handleToolSelect('rectangle'); break;
          case 'c': handleToolSelect('circle'); break;
          case 'l': handleToolSelect('line'); break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleToolSelect]);
  
  // Save state to localStorage before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedTool) {
        localStorage.setItem('artflow-selected-tool', selectedTool);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedTool]);
  
  return (
    <motion.div
      className="relative w-full h-full" 
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isLoaded ? 1 : 0,
        transition: { duration: 0.3, ease: 'easeInOut' }
      }}
    >
      <ArtCanvas 
        fullScreen={fullScreen}
        width={width}
        height={height}
        onChanged={onChanged}
        initialTool={selectedTool}
        onToolSelect={handleToolSelect}
      />
      
      {/* Performance optimization overlay - invisible but helps with rendering */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-0" />
    </motion.div>
  );
});

EnhancedArtCanvas.displayName = 'EnhancedArtCanvas';

export default EnhancedArtCanvas; 