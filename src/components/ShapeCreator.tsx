import { useCallback, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useTheme } from '@/contexts/ThemeContext';

interface ShapeCreatorProps {
  canvas: fabric.Canvas | null;
  shapeType: string;
  color: string;
  strokeWidth: number;
  opacity: number;
  onShapeCreated?: (shape: fabric.Object) => void;
  fillShape?: boolean;
}

const ShapeCreator = ({
  canvas,
  shapeType,
  color,
  strokeWidth,
  opacity,
  onShapeCreated,
  fillShape = false
}: ShapeCreatorProps) => {
  const isDrawing = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const currentShape = useRef<fabric.Object | null>(null);
  const { theme } = useTheme();

  // Handle mouse down event to start drawing
  const handleMouseDown = useCallback((e: fabric.IEvent) => {
    if (!canvas) return;
    
    isDrawing.current = true;
    const pointer = canvas.getPointer(e.e);
    startPoint.current = { x: pointer.x, y: pointer.y };
    
    // Properties based on whether shape should be filled or just outline
    const fillColor = fillShape ? color : 'transparent';
    const strokeColor = color;
    
    // Create initial shape based on type
    switch (shapeType) {
      case 'rectangle':
        currentShape.current = new fabric.Rect({
          left: startPoint.current.x,
          top: startPoint.current.y,
          width: 1,
          height: 1,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: opacity,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true
        });
        break;
      
      case 'circle':
        currentShape.current = new fabric.Circle({
          left: startPoint.current.x,
          top: startPoint.current.y,
          radius: 1,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: opacity,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true
        });
        break;
      
      case 'triangle':
        currentShape.current = new fabric.Triangle({
          left: startPoint.current.x,
          top: startPoint.current.y,
          width: 1,
          height: 1,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: opacity,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true
        });
        break;
      
      case 'line':
        const points = [
          startPoint.current.x, 
          startPoint.current.y, 
          startPoint.current.x + 1, 
          startPoint.current.y + 1
        ];
        currentShape.current = new fabric.Line(points, {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: opacity,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true
        });
        break;
      
      case 'star':
        // Create a 5-pointed star
        const initialRadius = 1;
        const points5 = [];
        
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? initialRadius : initialRadius / 2;
          const angle = Math.PI / 5 * i;
          points5.push({
            x: radius * Math.sin(angle),
            y: radius * Math.cos(angle)
          });
        }
        
        currentShape.current = new fabric.Polygon(points5, {
          left: startPoint.current.x,
          top: startPoint.current.y,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: opacity,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true
        });
        break;
        
      case 'arrow':
        // Simple arrow (will be updated during mouse move)
        const arrowPath = `M ${startPoint.current.x},${startPoint.current.y} L ${startPoint.current.x + 1},${startPoint.current.y + 1}`;
        currentShape.current = new fabric.Path(arrowPath, {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          fill: 'transparent',
          opacity: opacity,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true
        });
        break;
      
      case 'polygon':
        // Regular polygon (hexagon)
        const sides = 6;
        const polyRadius = 1;
        const polyPoints = [];
        
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides;
          polyPoints.push({ 
            x: polyRadius * Math.cos(angle), 
            y: polyRadius * Math.sin(angle) 
          });
        }
        
        currentShape.current = new fabric.Polygon(polyPoints, {
          left: startPoint.current.x,
          top: startPoint.current.y,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: opacity,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true
        });
        break;
      
      case 'speech-bubble':
        // Create speech bubble shape
        const bubbleSize = 1;
        const bubblePath = `
          M0,0 
          L${bubbleSize},0 
          L${bubbleSize},${bubbleSize * 0.7} 
          L${bubbleSize * 0.7},${bubbleSize * 0.7} 
          L${bubbleSize * 0.5},${bubbleSize} 
          L${bubbleSize * 0.4},${bubbleSize * 0.7} 
          L0,${bubbleSize * 0.7} 
          Z
        `;
        
        currentShape.current = new fabric.Path(bubblePath, {
          left: startPoint.current.x,
          top: startPoint.current.y,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: opacity,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true
        });
        break;
    }
    
    if (currentShape.current) {
      canvas.add(currentShape.current);
      canvas.renderAll();
    }
  }, [canvas, shapeType, color, strokeWidth, opacity, fillShape]);
  
  // Handle mouse move event to update the shape
  const handleMouseMove = useCallback((e: fabric.IEvent) => {
    if (!isDrawing.current || !canvas || !currentShape.current) return;
    
    const pointer = canvas.getPointer(e.e);
    const width = Math.abs(pointer.x - startPoint.current.x);
    const height = Math.abs(pointer.y - startPoint.current.y);
    
    // Update shape dimensions based on mouse position
    switch (shapeType) {
      case 'rectangle':
        const rect = currentShape.current as fabric.Rect;
        rect.set({
          left: Math.min(startPoint.current.x, pointer.x),
          top: Math.min(startPoint.current.y, pointer.y),
          width: width,
          height: height
        });
        break;
      
      case 'circle':
        const circle = currentShape.current as fabric.Circle;
        // Use the maximum of width or height for a perfect circle
        const radius = Math.max(width, height) / 2;
        const centerX = (startPoint.current.x + pointer.x) / 2;
        const centerY = (startPoint.current.y + pointer.y) / 2;
        
        circle.set({
          left: centerX - radius,
          top: centerY - radius,
          radius: radius,
          originX: 'center',
          originY: 'center'
        });
        break;
      
      case 'triangle':
        const triangle = currentShape.current as fabric.Triangle;
        triangle.set({
          left: Math.min(startPoint.current.x, pointer.x),
          top: Math.min(startPoint.current.y, pointer.y),
          width: width,
          height: height
        });
        break;
      
      case 'line':
        const line = currentShape.current as fabric.Line;
        line.set({
          x2: pointer.x,
          y2: pointer.y
        });
        break;
      
      case 'star':
        const star = currentShape.current as fabric.Polygon;
        const distance = Math.sqrt(Math.pow(pointer.x - startPoint.current.x, 2) + 
                                  Math.pow(pointer.y - startPoint.current.y, 2));
        
        const starPoints = [];
        const outerRadius = distance;
        const innerRadius = distance / 2;
        
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = Math.PI / 5 * i;
          starPoints.push({
            x: radius * Math.sin(angle),
            y: radius * Math.cos(angle)
          });
        }
        
        star.set({
          points: starPoints,
          left: startPoint.current.x,
          top: startPoint.current.y,
          pathOffset: { x: 0, y: 0 }
        });
        break;
        
      case 'arrow':
        const arrow = currentShape.current as fabric.Path;
        // Calculate arrowhead
        const headLength = strokeWidth * 3;
        const dx = pointer.x - startPoint.current.x;
        const dy = pointer.y - startPoint.current.y;
        const angle = Math.atan2(dy, dx);
        
        // Calculate arrowhead points
        const x1 = pointer.x - headLength * Math.cos(angle - Math.PI/6);
        const y1 = pointer.y - headLength * Math.sin(angle - Math.PI/6);
        const x2 = pointer.x - headLength * Math.cos(angle + Math.PI/6);
        const y2 = pointer.y - headLength * Math.sin(angle + Math.PI/6);
        
        // Create arrow path
        const arrowPath = `
          M ${startPoint.current.x},${startPoint.current.y} 
          L ${pointer.x},${pointer.y}
          M ${pointer.x},${pointer.y} 
          L ${x1},${y1}
          M ${pointer.x},${pointer.y} 
          L ${x2},${y2}
        `;
        
        arrow.set({
          path: arrowPath
        });
        break;
      
      case 'polygon':
        const polygon = currentShape.current as fabric.Polygon;
        const sides = 6; // Hexagon
        const polyDistance = Math.sqrt(Math.pow(pointer.x - startPoint.current.x, 2) + 
                                     Math.pow(pointer.y - startPoint.current.y, 2));
        const polyPoints = [];
        
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides;
          polyPoints.push({ 
            x: polyDistance * Math.cos(angle), 
            y: polyDistance * Math.sin(angle) 
          });
        }
        
        polygon.set({
          points: polyPoints,
          left: startPoint.current.x,
          top: startPoint.current.y
        });
        break;
      
      case 'speech-bubble':
        const bubble = currentShape.current as fabric.Path;
        
        // Create proportional speech bubble
        const bubbleWidth = width;
        const bubbleHeight = height;
        const tailPosition = bubbleWidth * 0.5; // Tail position (middle)
        const tailWidth = bubbleWidth * 0.1;
        const tailHeight = bubbleHeight * 0.3;
        
        const bubblePath = `
          M${Math.min(startPoint.current.x, pointer.x)},${Math.min(startPoint.current.y, pointer.y)}
          L${Math.min(startPoint.current.x, pointer.x) + bubbleWidth},${Math.min(startPoint.current.y, pointer.y)}
          L${Math.min(startPoint.current.x, pointer.x) + bubbleWidth},${Math.min(startPoint.current.y, pointer.y) + bubbleHeight - tailHeight}
          L${Math.min(startPoint.current.x, pointer.x) + tailPosition + tailWidth},${Math.min(startPoint.current.y, pointer.y) + bubbleHeight - tailHeight}
          L${Math.min(startPoint.current.x, pointer.x) + tailPosition},${Math.min(startPoint.current.y, pointer.y) + bubbleHeight}
          L${Math.min(startPoint.current.x, pointer.x) + tailPosition - tailWidth},${Math.min(startPoint.current.y, pointer.y) + bubbleHeight - tailHeight}
          L${Math.min(startPoint.current.x, pointer.x)},${Math.min(startPoint.current.y, pointer.y) + bubbleHeight - tailHeight}
          Z
        `;
        
        bubble.set({
          path: bubblePath,
          left: 0,
          top: 0
        });
        break;
    }
    
    canvas.renderAll();
  }, [canvas, shapeType, strokeWidth]);
  
  // Handle mouse up event to finalize the shape
  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current || !canvas || !currentShape.current) return;
    
    // Set the shape as the active object
    canvas.setActiveObject(currentShape.current);
    
    // Notify parent component about shape creation
    if (onShapeCreated) {
      onShapeCreated(currentShape.current);
    }
    
    // Reset drawing state
    isDrawing.current = false;
    currentShape.current = null;
  }, [canvas, onShapeCreated]);
  
  // Set up event handlers when component mounts or dependencies change
  useEffect(() => {
    if (!canvas) return;
    
    // Set up canvas for shape drawing
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
    
    // Add event listeners
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    
    // Cleanup function to remove event listeners
    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      
      // Reset cursor
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'default';
    };
  }, [canvas, handleMouseDown, handleMouseMove, handleMouseUp]);
  
  return null; // This is a logic-only component
};

export default ShapeCreator; 