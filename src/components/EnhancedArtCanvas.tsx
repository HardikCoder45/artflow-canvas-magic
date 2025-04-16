import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import ArtCanvas from './ArtCanvas';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const loadTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<any>(null);
  const [selectedTool, setSelectedTool] = useState<string>(() => {
    try {
      return localStorage.getItem('artflow-selected-tool') || 'pencil';
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return 'pencil';
    }
  });
  
  // Track loaded state with better error handling
  useEffect(() => {
    // Set loading state
    setIsLoading(true);
    
    // Safety timeout - if canvas doesn't load in 5 seconds, show error
    loadTimerRef.current = window.setTimeout(() => {
      if (!isLoaded) {
        setLoadError("Canvas failed to load in a reasonable time. Please try refreshing the page.");
        setIsLoading(false);
      }
    }, 5000); // Increased timeout to allow more time for initialization
    
    // More reliable initialization approach
    try {
      // We'll mark as loaded when ArtCanvas signals it's ready
      const handleCanvasReady = () => {
        setIsLoaded(true);
        setIsLoading(false);
        if (loadTimerRef.current) {
          clearTimeout(loadTimerRef.current);
          loadTimerRef.current = null;
        }
      };
      
      // Listen for a custom event from ArtCanvas
      window.addEventListener('artcanvas-initialized', handleCanvasReady);
      
      // Fallback in case the event doesn't fire
      setTimeout(() => {
        if (!isLoaded) {
          handleCanvasReady();
        }
      }, 3000);
      
      return () => {
        window.removeEventListener('artcanvas-initialized', handleCanvasReady);
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
        if (loadTimerRef.current) {
          clearTimeout(loadTimerRef.current);
          loadTimerRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error setting up canvas initialization:", error);
      setLoadError("Failed to set up canvas. Please try refreshing the page.");
      setIsLoading(false);
    }
  }, [isLoaded]);

  // Handle tool selection events
  const handleToolSelect = useCallback((tool: string) => {
    try {
    setSelectedTool(tool);
    localStorage.setItem('artflow-selected-tool', tool);
    } catch (e) {
      console.error("Error saving tool selection:", e);
      toast("Could not save your tool preference", {
        description: "Your preferences might not persist between sessions"
      });
    }
  }, []);

  // Adding a custom event handler to capture tool selection
  useEffect(() => {
    const handleToolSelection = (e: CustomEvent) => {
      // This is where we can add any custom behavior when tools change
      try {
      setSelectedTool(e.detail.tool);
      localStorage.setItem('artflow-selected-tool', e.detail.tool);
      } catch (error) {
        console.error("Error handling tool selection event:", error);
      }
    };

    // Listen for custom events from ArtCanvas
    try {
    window.addEventListener('artcanvas-tool-selected' as any, handleToolSelection);
    } catch (error) {
      console.error("Error adding event listener:", error);
    }
    
    return () => {
      try {
      window.removeEventListener('artcanvas-tool-selected' as any, handleToolSelection);
      } catch (error) {
        console.error("Error removing event listener:", error);
      }
    };
  }, []);

  // Add keyboard shortcut handler that applies globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
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
      } catch (error) {
        console.error("Error handling keyboard shortcut:", error);
      }
    };
    
    try {
    window.addEventListener('keydown', handleKeyDown);
    } catch (error) {
      console.error("Error adding keyboard listener:", error);
    }
    
    return () => {
      try {
      window.removeEventListener('keydown', handleKeyDown);
      } catch (error) {
        console.error("Error removing keyboard listener:", error);
      }
    };
  }, [handleToolSelect]);
  
  // Save state to localStorage before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
      if (selectedTool) {
        localStorage.setItem('artflow-selected-tool', selectedTool);
        }
      } catch (error) {
        console.error("Error saving state before unload:", error);
      }
    };
    
    try {
    window.addEventListener('beforeunload', handleBeforeUnload);
    } catch (error) {
      console.error("Error adding beforeunload listener:", error);
    }
    
    return () => {
      try {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      } catch (error) {
        console.error("Error removing beforeunload listener:", error);
      }
    };
  }, [selectedTool]);
  
  // Handle canvas reference - add proper error handling
  const handleCanvasRef = useCallback((canvas: any) => {
    try {
      canvasRef.current = canvas;
      if (canvas) {
        setIsLoaded(true);
        setIsLoading(false);
        if (loadTimerRef.current) {
          clearTimeout(loadTimerRef.current);
          loadTimerRef.current = null;
        }
      }
    } catch (error) {
      console.error("Error handling canvas reference:", error);
    }
  }, []);
  
  // Handle canvas errors with improved reporting
  const handleCanvasError = useCallback((error: Error) => {
    console.error("Canvas error occurred:", error);
    setLoadError(error.message || "An error occurred with the canvas");
    setIsLoading(false);
    toast("Canvas Error", {
      description: "There was a problem with the canvas. Try refreshing the page.",
      duration: 5000
    });
  }, []);
  
  return (
    <motion.div
      className="relative w-full h-full" 
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isLoaded ? 1 : 0,
        transition: { duration: 0.2, ease: 'easeOut' } 
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="text-lg text-foreground/70">Loading canvas...</p>
          </div>
        </div>
      )}
      
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
          <div className="max-w-md p-6 bg-destructive/90 text-white rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-3">Canvas Error</h3>
            <p>{loadError}</p>
            <button 
              className="mt-4 px-4 py-2 bg-white text-destructive font-medium rounded-md hover:bg-white/90 transition-colors"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      
      <ArtCanvas
        fullScreen={fullScreen}
        width={width}
        height={height}
        onChanged={onChanged}
        initialTool={selectedTool}
        onToolSelect={handleToolSelect}
        key="main-art-canvas"
      />
      
      {/* Performance optimization overlay - invisible but helps with rendering */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-0" />
    </motion.div>
  );
});

EnhancedArtCanvas.displayName = 'EnhancedArtCanvas';

export default EnhancedArtCanvas; 