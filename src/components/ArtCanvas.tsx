
import { useState, useEffect, useCallback } from "react";
import { fabric } from "fabric";
import { useToast } from "@/components/ui/use-toast";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import Layers from "./Layers";
import { createBrushTextures, createWatercolorPattern, createChalkPattern } from "@/utils/brushTextures";
import { Brush, Eraser, Crop, Layers as LayersIcon, Download, Share2, UndoIcon, RedoIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ArtCanvas = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTab, setActiveTab] = useState("draw");
  const [currentBrush, setCurrentBrush] = useState("pencil");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [undoStack, setUndoStack] = useState<fabric.Object[][]>([]);
  const [redoStack, setRedoStack] = useState<fabric.Object[][]>([]);
  const [theme, setTheme] = useState("light");
  const { toast } = useToast();

  // Handle canvas creation
  const handleCanvasCreated = useCallback((fabricCanvas: fabric.Canvas) => {
    setCanvas(fabricCanvas);
    
    // Create brush textures
    createBrushTextures(fabricCanvas);
    
    // Initialize history
    fabricCanvas.on('object:added', () => {
      if (canvas) {
        const currentState = [...canvas.getObjects()];
        setUndoStack(prev => [...prev, currentState]);
        setRedoStack([]);
      }
    });
    
    toast({
      title: "Welcome to ArtFlow Canvas!",
      description: "Start creating your digital masterpiece. Choose your tools from the toolbar.",
    });
  }, [toast]);

  // Handle brush selection
  const handleBrushSelect = useCallback((brushType: string) => {
    if (!canvas) return;
    
    setCurrentBrush(brushType);
    canvas.isDrawingMode = true;
    
    switch (brushType) {
      case "pencil":
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = brushColor;
        break;
      case "spray":
        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize * 5;
        canvas.freeDrawingBrush.color = brushColor;
        (canvas.freeDrawingBrush as fabric.SprayBrush).density = 20;
        break;
      case "watercolor":
        canvas.freeDrawingBrush = createWatercolorPattern(canvas, brushColor);
        canvas.freeDrawingBrush.width = brushSize * 3;
        break;
      case "chalk":
        canvas.freeDrawingBrush = createChalkPattern(canvas, brushColor);
        canvas.freeDrawingBrush.width = brushSize * 2;
        break;
      case "eraser":
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize * 2;
        break;
      default:
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
  }, [canvas, brushSize, brushColor]);

  // Handle brush size change
  const handleBrushSizeChange = useCallback((newSize: number) => {
    setBrushSize(newSize);
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = newSize;
    }
  }, [canvas]);

  // Handle brush color change
  const handleColorChange = useCallback((color: string) => {
    setBrushColor(color);
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      if (currentBrush === "watercolor") {
        canvas.freeDrawingBrush = createWatercolorPattern(canvas, color);
        canvas.freeDrawingBrush.width = brushSize * 3;
      } else if (currentBrush === "chalk") {
        canvas.freeDrawingBrush = createChalkPattern(canvas, color);
        canvas.freeDrawingBrush.width = brushSize * 2;
      }
    }
  }, [canvas, currentBrush, brushSize]);

  // Handle undo/redo
  const handleUndo = useCallback(() => {
    if (canvas && undoStack.length > 0) {
      const currentState = [...undoStack[undoStack.length - 1]];
      const newUndoStack = undoStack.slice(0, -1);
      
      setRedoStack(prev => [...prev, currentState]);
      setUndoStack(newUndoStack);
      
      canvas.clear();
      if (newUndoStack.length > 0) {
        const lastState = newUndoStack[newUndoStack.length - 1];
        lastState.forEach(obj => {
          canvas.add(fabric.util.object.clone(obj));
        });
      }
      canvas.renderAll();
    }
  }, [canvas, undoStack]);

  const handleRedo = useCallback(() => {
    if (canvas && redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      
      setUndoStack(prev => [...prev, nextState]);
      setRedoStack(newRedoStack);
      
      canvas.clear();
      nextState.forEach(obj => {
        canvas.add(fabric.util.object.clone(obj));
      });
      canvas.renderAll();
    }
  }, [canvas, redoStack]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1
    });
    
    const link = document.createElement('a');
    link.download = `artflow-creation-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Artwork Exported!",
      description: "Your creation has been downloaded successfully.",
    });
  }, [canvas, toast]);

  // Handle theme toggle
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }, []);

  // Apply theme effects
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);

  return (
    <div className={cn(
      "bg-gradient-to-br from-artflow-soft-gray to-white rounded-xl shadow-xl overflow-hidden",
      theme === "dark" && "from-artflow-dark-purple to-gray-900"
    )}>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <Tabs defaultValue="draw" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="draw" className="gap-2 data-[state=active]:bg-primary/20">
                <Brush size={16} />
                <span>Draw</span>
              </TabsTrigger>
              <TabsTrigger value="layers" className="gap-2 data-[state=active]:bg-primary/20">
                <LayersIcon size={16} />
                <span>Layers</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2 data-[state=active]:bg-primary/20">
                <Share2 size={16} />
                <span>Export</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="draw" className="mt-0">
              <Toolbar 
                onBrushSelect={handleBrushSelect}
                onBrushSizeChange={handleBrushSizeChange}
                onColorChange={handleColorChange}
                currentBrush={currentBrush}
                brushSize={brushSize}
                brushColor={brushColor}
              />
            </TabsContent>
            
            <TabsContent value="layers" className="mt-0">
              <Layers canvas={canvas} />
            </TabsContent>
            
            <TabsContent value="export" className="mt-0">
              <div className="p-4 bg-card rounded-lg space-y-4">
                <h3 className="font-semibold">Export Options</h3>
                <Button onClick={handleExport} className="w-full gap-2">
                  <Download size={16} />
                  Download as PNG
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Share2 size={16} />
                  Share to Community
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="flex-1"
            >
              <UndoIcon size={16} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="flex-1"
            >
              <RedoIcon size={16} />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleTheme}
              className="flex-1"
            >
              <Palette size={16} />
            </Button>
          </div>
        </div>
        
        <div className={cn(
          "relative canvas-container p-2 bg-white rounded-lg shadow-inner",
          theme === "dark" && "bg-gray-800"
        )}>
          <Canvas
            className={activeTab === "draw" ? "brush-cursor" : ""}
            width={800}
            height={600}
            onCanvasCreated={handleCanvasCreated}
          />
        </div>
      </div>
    </div>
  );
};

export default ArtCanvas;
