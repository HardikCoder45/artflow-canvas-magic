import { useEffect, useCallback, useState, useRef } from 'react';
import { fabric } from 'fabric';
import { ShapeCreator } from '@/components';

type ShapeType = 
  'rectangle' | 'circle' | 'triangle' | 'line' | 
  'star' | 'arrow' | 'polygon' | 'speech-bubble';

interface UseShapeToolsProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  onShapeCreated?: () => void;
}

export const useShapeTools = ({
  canvasRef,
  brushColor,
  brushSize,
  brushOpacity,
  onShapeCreated
}: UseShapeToolsProps) => {
  const [activeShape, setActiveShape] = useState<ShapeType | null>(null);
  const [fillShapes, setFillShapes] = useState(() => {
    const saved = localStorage.getItem('artflow-fill-shapes');
    return saved ? saved === 'true' : false;
  });
  
  const creatorRef = useRef<any>(null);

  // Toggle between filled and outline shapes
  const toggleFillShapes = useCallback(() => {
    setFillShapes(prev => {
      const newValue = !prev;
      localStorage.setItem('artflow-fill-shapes', newValue.toString());
      return newValue;
    });
  }, []);

  // Activate a shape tool
  const activateShapeTool = useCallback((shapeType: ShapeType) => {
    setActiveShape(shapeType);
    
    if (!canvasRef.current) return;
    
    // Configure canvas for shape drawing
    canvasRef.current.isDrawingMode = false;
    canvasRef.current.selection = false;
    canvasRef.current.defaultCursor = 'crosshair';
    canvasRef.current.hoverCursor = 'crosshair';
    
    // Create ShapeCreator component
    creatorRef.current = (
      <ShapeCreator
        canvas={canvasRef.current}
        shapeType={shapeType}
        color={brushColor}
        strokeWidth={brushSize}
        opacity={brushOpacity}
        fillShape={fillShapes}
        onShapeCreated={() => {
          if (onShapeCreated) {
            onShapeCreated();
          }
        }}
      />
    );
  }, [canvasRef, brushColor, brushSize, brushOpacity, fillShapes, onShapeCreated]);

  // Deactivate shape tool
  const deactivateShapeTool = useCallback(() => {
    setActiveShape(null);
    creatorRef.current = null;
    
    if (!canvasRef.current) return;
    
    // Reset cursor
    canvasRef.current.defaultCursor = 'default';
    canvasRef.current.hoverCursor = 'default';
  }, [canvasRef]);

  return {
    activeShape,
    fillShapes,
    toggleFillShapes,
    activateShapeTool,
    deactivateShapeTool,
    shapeCreatorElement: creatorRef.current
  };
};

export default useShapeTools; 