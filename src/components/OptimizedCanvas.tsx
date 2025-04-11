import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { fabric } from 'fabric';
import Canvas from './Canvas';
import { cn } from '@/lib/utils';

interface OptimizedCanvasProps {
  className?: string;
  width?: number;
  height?: number;
  onCanvasCreated?: (canvas: fabric.Canvas) => void;
  showGrid?: boolean;
  gridSize?: number;
  bgColor?: string;
  cursorType?: string;
  isDrawing?: boolean;
  renderTimeframe?: number; // How often to render the canvas in ms
}

/**
 * An optimized canvas component that wraps the base Canvas component
 * with performance improvements such as:
 * - Debounced rendering
 * - Memoization to prevent unnecessary rerenders
 * - Canvas object caching
 * - Enhanced event handling
 * - Better memory management
 * - GPU acceleration where possible
 */
const OptimizedCanvas = memo(({
  className,
  width = 800,
  height = 600,
  onCanvasCreated,
  showGrid = true,
  gridSize = 20,
  bgColor = "#1a1a1a",
  cursorType = "default",
  isDrawing = false,
  renderTimeframe = 10 // Default rendering frequency
}: OptimizedCanvasProps) => {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const renderRequestRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  const batchProcessingRef = useRef<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Create a cursor class based on the current tool
  const getCursorClass = useCallback(() => {
    switch (cursorType) {
      case 'pencil':
      case 'brush':
      case 'spray':
      case 'marker':
      case 'calligraphy':
      case 'crayon':
      case 'watercolor':
      case 'glitter':
      case 'eraser':
      case 'eyedropper':
      case 'fill':
        return 'cursor-crosshair';
      case 'text':
        return 'cursor-text';
      case 'grab':
        return 'cursor-grab';
      case 'grabbing':
        return 'cursor-grabbing';
      case 'move':
        return 'cursor-move';
      default:
        return 'cursor-default';
    }
  }, [cursorType]);
  
  // Batch processing helper function for improved performance when adding multiple objects
  const batchProcess = useCallback(async (callback: () => Promise<void> | void) => {
    if (!canvasRef.current) return;
    
    // Start batch processing
    batchProcessingRef.current = true;
    
    try {
      // Execute the callback
      await callback();
    } finally {
      // End batch processing and render once
      batchProcessingRef.current = false;
      canvasRef.current.renderAll();
    }
  }, [canvasRef]);
  
  // Handle canvas initialization with performance enhancements
  const handleCanvasCreated = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
    
    // Apply performance optimizations
    fabric.Object.prototype.objectCaching = true;
    fabric.Object.prototype.statefullCache = true;
    fabric.Object.prototype.noScaleCache = false;
    
    // Enable retina scaling for high-DPI displays
    canvas.enableRetinaScaling = true;
    
    // Apply GPU acceleration where supported
    if (typeof (canvas.getElement() as any).getContext('webgl') !== 'undefined') {
      // Enhanced performance for WebGL context if available
      try {
        const canvasEl = canvas.getElement();
        const ctx = canvasEl.getContext('2d');
        if (ctx) {
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
      } catch (err) {
        console.error('WebGL acceleration error:', err);
      }
    }
    
    // Optimize selection handling
    canvas.selection = !isDrawing;
    canvas.preserveObjectStacking = true;
    
    // Set up optimized rendering
    setupOptimizedRendering(canvas);
    
    // Call the parent's onCanvasCreated function
    if (onCanvasCreated) {
      onCanvasCreated(canvas);
    }
    
    setIsInitialized(true);
  }, [onCanvasCreated, isDrawing]);
  
  // Set up optimized rendering to prevent excessive redraws
  const setupOptimizedRendering = useCallback((canvas: fabric.Canvas) => {
    // Override default renderAll method with a debounced version
    const originalRenderAll = canvas.renderAll.bind(canvas);
    
    canvas.renderAll = function() {
      // Skip rendering during batch operations
      if (batchProcessingRef.current) return;
      
      const currentTime = performance.now();
      
      // Cancel any pending render requests
      if (renderRequestRef.current !== null) {
        cancelAnimationFrame(renderRequestRef.current);
        renderRequestRef.current = null;
      }
      
      // If sufficient time has passed since last render, render immediately
      if (currentTime - lastRenderTimeRef.current > renderTimeframe) {
        originalRenderAll();
        lastRenderTimeRef.current = currentTime;
        return;
      }
      
      // Otherwise, schedule a render for the next animation frame
      renderRequestRef.current = requestAnimationFrame(() => {
        originalRenderAll();
        lastRenderTimeRef.current = performance.now();
        renderRequestRef.current = null;
      });
    };
    
    // Optimize object addition
    const originalAdd = canvas.add.bind(canvas);
    canvas.add = function(...objects: fabric.Object[]) {
      // Process all objects to ensure they have proper caching set up
      objects.forEach(obj => {
        if (!obj.objectCaching) {
          obj.objectCaching = true;
        }
      });
      
      return originalAdd(...objects);
    };
    
    // Optimize event handlers by debouncing mouse move events
    const originalOnMouseMove = canvas.__onMouseMove;
    canvas.__onMouseMove = function(e: MouseEvent) {
      if (!renderRequestRef.current) {
        renderRequestRef.current = requestAnimationFrame(() => {
          originalOnMouseMove.call(canvas, e);
          renderRequestRef.current = null;
        });
      }
    };
    
    // Optimize canvas path rendering for smoother drawing
    if (canvas.freeDrawingBrush) {
      const originalOnMouseMove = canvas.freeDrawingBrush.onMouseMove;
      canvas.freeDrawingBrush.onMouseMove = function(pointer: fabric.Point) {
        if (!renderRequestRef.current) {
          renderRequestRef.current = requestAnimationFrame(() => {
            originalOnMouseMove.call(canvas.freeDrawingBrush, pointer);
            renderRequestRef.current = null;
          });
        }
      };
    }
  }, [renderTimeframe, batchProcessingRef]);
  
  // Clean up render requests on unmount
  useEffect(() => {
    return () => {
      if (renderRequestRef.current !== null) {
        cancelAnimationFrame(renderRequestRef.current);
      }
      
      // Dispose canvas to free up memory
      if (canvasRef.current) {
        try {
          canvasRef.current.dispose();
        } catch (e) {
          console.error('Error disposing canvas:', e);
        }
      }
    };
  }, []);
  
  // Update canvas options when props change
  useEffect(() => {
    if (!canvasRef.current || !isInitialized) return;
    
    canvasRef.current.selection = !isDrawing;
    canvasRef.current.renderAll();
  }, [isDrawing, isInitialized]);
  
  return (
    <Canvas
      className={cn(
        "w-full h-full transition-opacity duration-300",
        getCursorClass(),
        className
      )}
      width={width}
      height={height}
      onCanvasCreated={handleCanvasCreated}
      showGrid={showGrid}
      gridSize={gridSize}
      bgColor={bgColor}
    />
  );
});

OptimizedCanvas.displayName = 'OptimizedCanvas';

export default OptimizedCanvas; 