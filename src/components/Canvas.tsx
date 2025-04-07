
import { useEffect, useRef, useState, forwardRef } from "react";
import { fabric } from "fabric";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CanvasProps {
  className?: string;
  width?: number;
  height?: number;
  zoom?: number;
  onCanvasCreated?: (canvas: fabric.Canvas) => void;
}

const Canvas = ({ className, width = 800, height = 600, zoom = 1, onCanvasCreated }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPosX, setLastPosX] = useState(0);
  const [lastPosY, setLastPosY] = useState(0);
  const { toast } = useToast();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create fabric canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      width,
      height,
      isDrawingMode: false,
      selection: true,
      preserveObjectStacking: true,
    });

    // Set up brush
    fabricCanvas.freeDrawingBrush.color = "#000000";
    fabricCanvas.freeDrawingBrush.width = 5;

    // Modify default brush for smooth drawing
    if (fabricCanvas.freeDrawingBrush instanceof fabric.PencilBrush) {
      fabricCanvas.freeDrawingBrush.decimate = 8;
    }

    // Set up custom brush options
    fabric.PatternBrush.prototype.getPatternSrc = function() {
      // Default pattern if none specified
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 10;
      patternCanvas.height = 10;
      const ctx = patternCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = this.color || 'rgb(0,0,0)';
        ctx.fillRect(0, 0, 10, 10);
      }
      return patternCanvas;
    };

    // Set up events
    fabricCanvas.on('mouse:down', (opt) => {
      setIsDrawing(true);
      
      // Handle panning with middle mouse button or space + drag
      if (opt.e.button === 1 || (opt.e.shiftKey && !fabricCanvas.isDrawingMode)) {
        setIsPanning(true);
        fabricCanvas.selection = false;
        setLastPosX(opt.e.clientX);
        setLastPosY(opt.e.clientY);
        fabricCanvas.setCursor('grab');
      }
    });

    fabricCanvas.on('mouse:up', () => {
      setIsDrawing(false);
      setIsPanning(false);
      fabricCanvas.selection = true;
      fabricCanvas.setCursor('default');
    });

    fabricCanvas.on('mouse:move', (event) => {
      // Handle panning
      if (isPanning && event.e) {
        const deltaX = event.e.clientX - lastPosX;
        const deltaY = event.e.clientY - lastPosY;
        
        // Pan the canvas
        fabricCanvas.relativePan({ x: deltaX, y: deltaY });
        
        setLastPosX(event.e.clientX);
        setLastPosY(event.e.clientY);
        return;
      }
      
      if (fabricCanvas.isDrawingMode) {
        // Use mouse velocity to adjust brush width for pressure sensitivity simulation
        if (event.e && isDrawing) {
          const velocity = Math.sqrt(
            Math.pow(event.e.movementX || 0, 2) + 
            Math.pow(event.e.movementY || 0, 2)
          );
          
          // Adjust brush width based on velocity (faster = thinner, slower = thicker)
          // But only if it's not too extreme and we're actually drawing
          if (velocity > 0 && fabricCanvas.freeDrawingBrush) {
            const currentWidth = fabricCanvas.freeDrawingBrush.width;
            const minWidth = Math.max(currentWidth * 0.5, 1); // Don't go below 1px
            const maxWidth = currentWidth * 1.5; // Don't expand too much
            
            // Inverse relationship - faster movement = thinner line
            const speedFactor = Math.max(0.1, Math.min(1.0, 10 / (velocity + 5)));
            const dynamicWidth = currentWidth * speedFactor;
            
            // Apply constrained width
            const newWidth = Math.max(minWidth, Math.min(maxWidth, dynamicWidth));
            fabricCanvas.freeDrawingBrush.width = newWidth;
          }
        }
      }
    });

    // Handle mouse wheel zoom
    fabricCanvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      
      // Get the position of the mouse relative to the canvas
      const point = new fabric.Point(
        opt.e.offsetX, 
        opt.e.offsetY
      );
      
      // Zoom to the point where the mouse is
      fabricCanvas.zoomToPoint(point, zoom);
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    setCanvas(fabricCanvas);
    
    // Notify parent component
    if (onCanvasCreated) {
      onCanvasCreated(fabricCanvas);
    }
    
    toast({
      title: "Canvas Ready",
      description: "Start creating your masterpiece with various brush textures!",
      duration: 3000,
    });

    // Cleanup on unmount
    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height, toast, onCanvasCreated]);

  // Apply zoom when it changes
  useEffect(() => {
    if (canvas && zoom) {
      canvas.setZoom(zoom);
      canvas.renderAll();
    }
  }, [canvas, zoom]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        // Dispatch a custom event that the parent can listen to
        window.dispatchEvent(new CustomEvent('art-canvas-undo'));
        e.preventDefault();
      }
      // Ctrl+Y or Cmd+Y for Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        window.dispatchEvent(new CustomEvent('art-canvas-redo'));
        e.preventDefault();
      }
      // Space key for panning
      if (e.key === ' ' && canvas) {
        canvas.defaultCursor = 'grab';
        document.body.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Space key released
      if (e.key === ' ' && canvas) {
        canvas.defaultCursor = 'default';
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvas]);

  return (
    <div 
      ref={wrapperRef}
      className={cn("relative canvas-wrapper overflow-hidden", className)}
    >
      <canvas 
        ref={canvasRef} 
        className={cn(
          "border rounded-lg shadow-lg transition-all", 
          isDrawing && "shadow-xl"
        )} 
      />
      
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full">
        {width} × {height}
      </div>
    </div>
  );
};

export default Canvas;
