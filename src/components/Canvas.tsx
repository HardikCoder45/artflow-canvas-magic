
import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CanvasProps {
  className?: string;
  width?: number;
  height?: number;
  onCanvasCreated?: (canvas: fabric.Canvas) => void;
}

const Canvas = ({ className, width = 800, height = 600, onCanvasCreated }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
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
    });

    // Set up brush
    fabricCanvas.freeDrawingBrush.color = "#000000";
    fabricCanvas.freeDrawingBrush.width = 5;

    // Modify default brush for smooth drawing
    if (fabricCanvas.freeDrawingBrush instanceof fabric.PencilBrush) {
      fabricCanvas.freeDrawingBrush.decimate = 8;
    }

    setCanvas(fabricCanvas);
    
    // Notify parent component
    if (onCanvasCreated) {
      onCanvasCreated(fabricCanvas);
    }
    
    toast({
      title: "Canvas Ready",
      description: "Start creating your masterpiece!",
      duration: 3000,
    });

    // Cleanup on unmount
    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height, toast, onCanvasCreated]);

  return (
    <div className={cn("relative", className)}>
      <canvas ref={canvasRef} className="border rounded-lg shadow-lg" />
    </div>
  );
};

export default Canvas;
