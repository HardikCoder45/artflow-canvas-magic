import { useCallback, MutableRefObject } from 'react';
import { fabric } from 'fabric';

type BrushTypes = 
  'pencil' | 
  'brush' | 
  'spray' | 
  'marker' | 
  'calligraphy' | 
  'crayon' | 
  'watercolor' | 
  'glitter' | 
  'eraser';

interface UseCanvasBrushesParams {
  canvasRef: MutableRefObject<fabric.Canvas | null>;
  brushColor: string;
  brushWidth: number;
  brushOpacity: number;
  bgColor: string;
}

interface BrushHandlers {
  configureBrush: (brushType: BrushTypes) => void;
  updateBrushSettings: (settings: {
    color?: string;
    width?: number;
    opacity?: number;
  }) => void;
  createCustomBrush: (options: any) => fabric.BaseBrush | null;
}

/**
 * Custom hook for managing canvas brushes with advanced features
 */
export const useCanvasBrushes = ({
  canvasRef,
  brushColor,
  brushWidth,
  brushOpacity,
  bgColor
}: UseCanvasBrushesParams): BrushHandlers => {
  
  // Configure brush based on type
  const configureBrush = useCallback((brushType: BrushTypes) => {
    if (!canvasRef.current) return;
    
    // Enable drawing mode
    canvasRef.current.isDrawingMode = true;
    canvasRef.current.selection = false;
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    
    // Set up brush based on type
    switch (brushType) {
      case 'pencil':
        const pencilBrush = new fabric.PencilBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = pencilBrush;
        pencilBrush.width = brushWidth;
        pencilBrush.color = brushColor;
        pencilBrush.strokeLineCap = 'round';
        pencilBrush.strokeLineJoin = 'round';
        pencilBrush.opacity = brushOpacity;
        break;
        
      case 'brush':
        const brush = new fabric.PencilBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = brush;
        brush.width = brushWidth * 2;  // Thicker than pencil
        brush.color = brushColor;
        brush.strokeLineCap = 'round';
        brush.strokeLineJoin = 'round';
        brush.opacity = brushOpacity;
        break;
        
      case 'spray':
        const sprayBrush = new fabric.SprayBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = sprayBrush;
        sprayBrush.width = brushWidth * 5;
        sprayBrush.density = brushWidth * 2;
        sprayBrush.dotWidth = brushWidth / 2;
        sprayBrush.color = brushColor;
        sprayBrush.opacity = brushOpacity;
        break;
        
      case 'marker':
        const markerBrush = new fabric.PencilBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = markerBrush;
        markerBrush.width = brushWidth * 3;
        markerBrush.color = brushColor;
        markerBrush.opacity = 0.5;  // Markers are naturally semi-transparent
        markerBrush.strokeLineCap = 'square';
        break;
        
      case 'calligraphy':
        const calligraphyBrush = new fabric.PencilBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = calligraphyBrush;
        calligraphyBrush.width = brushWidth;
        calligraphyBrush.color = brushColor;
        calligraphyBrush.opacity = brushOpacity;
        calligraphyBrush.strokeLineCap = 'butt';
        calligraphyBrush.strokeLineJoin = 'miter';
        
        // For calligraphy effect, use shadow with slight offset
        calligraphyBrush.shadow = new fabric.Shadow({
          color: brushColor,
          blur: 0,
          offsetX: brushWidth / 3,
          offsetY: brushWidth / 3
        });
        break;
        
      case 'crayon':
        const crayonBrush = new fabric.PencilBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = crayonBrush;
        crayonBrush.width = brushWidth;
        crayonBrush.color = brushColor;
        crayonBrush.opacity = brushOpacity;
        crayonBrush.strokeLineCap = 'round';
        crayonBrush.strokeLineJoin = 'round';
        
        // Add crayon-like texture with shadow
        crayonBrush.shadow = new fabric.Shadow({
          color: brushColor,
          blur: 2,
          offsetX: 1,
          offsetY: 1
        });
        break;
        
      case 'watercolor':
        const watercolorBrush = new fabric.PencilBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = watercolorBrush;
        watercolorBrush.width = brushWidth * 2;
        watercolorBrush.color = brushColor;
        watercolorBrush.opacity = 0.7;  // Watercolor is semi-transparent
        watercolorBrush.strokeLineCap = 'round';
        watercolorBrush.strokeLineJoin = 'round';
        
        // Add blur effect for watercolor
        watercolorBrush.shadow = new fabric.Shadow({
          color: brushColor,
          blur: 10,
          offsetX: 0,
          offsetY: 0
        });
        break;
        
      case 'glitter':
        const glitterBrush = new fabric.SprayBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = glitterBrush;
        glitterBrush.width = brushWidth * 3;
        glitterBrush.density = brushWidth * 3;
        glitterBrush.dotWidth = 2;
        glitterBrush.color = brushColor;
        glitterBrush.opacity = brushOpacity;
        glitterBrush.randomOpacity = true;  // Creates sparkle effect
        break;
        
      case 'eraser':
        const eraserBrush = new fabric.PencilBrush(canvasRef.current);
        canvasRef.current.freeDrawingBrush = eraserBrush;
        eraserBrush.width = brushWidth * 2;
        eraserBrush.color = bgColor;
        eraserBrush.opacity = 1;
        eraserBrush.strokeLineCap = 'round';
        eraserBrush.strokeLineJoin = 'round';
        
        // Set composite operation for erasing
        eraserBrush.globalCompositeOperation = 'destination-out';
        break;
    }
    
    canvasRef.current.renderAll();
  }, [canvasRef, brushColor, brushWidth, brushOpacity, bgColor]);
  
  // Update brush settings (color, width, opacity)
  const updateBrushSettings = useCallback(({
    color,
    width,
    opacity
  }: {
    color?: string;
    width?: number;
    opacity?: number;
  }) => {
    if (!canvasRef.current || !canvasRef.current.freeDrawingBrush) return;
    
    const brush = canvasRef.current.freeDrawingBrush;
    
    if (color !== undefined) {
      brush.color = color;
      
      // If the brush has a shadow, update shadow color too
      if ('shadow' in brush && brush.shadow) {
        brush.shadow.color = color;
      }
    }
    
    if (width !== undefined) {
      brush.width = width;
      
      // Update related settings for special brushes
      if (brush instanceof fabric.SprayBrush) {
        brush.density = width * 2;
        brush.dotWidth = width / 2;
      }
    }
    
    if (opacity !== undefined) {
      // @ts-ignore - Fabric types don't include opacity but it works
      brush.opacity = opacity;
    }
    
    canvasRef.current.renderAll();
  }, [canvasRef]);
  
  // Create custom brush with specific options
  const createCustomBrush = useCallback((options: any) => {
    if (!canvasRef.current) return null;
    
    try {
      // Base brush creation
      const customBrush = new fabric.PencilBrush(canvasRef.current);
      
      // Apply all specified options
      Object.keys(options).forEach(key => {
        (customBrush as any)[key] = options[key];
      });
      
      return customBrush;
    } catch (error) {
      console.error("Failed to create custom brush:", error);
      return null;
    }
  }, [canvasRef]);
  
  return {
    configureBrush,
    updateBrushSettings,
    createCustomBrush
  };
};

export default useCanvasBrushes; 