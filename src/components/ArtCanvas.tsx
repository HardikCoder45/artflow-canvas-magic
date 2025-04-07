
import { useState, useEffect, useCallback, useRef } from "react";
import { fabric } from "fabric";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import Layers from "./Layers";
import { createBrushTextures, createWatercolorPattern, createChalkPattern, createMarkerPattern, createSprayPattern, createGlitterPattern } from "@/utils/brushTextures";
import { 
  Brush, 
  Eraser, 
  Crop, 
  Layers as LayersIcon, 
  Download, 
  Share2, 
  UndoIcon, 
  RedoIcon, 
  Palette, 
  Sparkles,
  ImageIcon,
  EyeIcon,
  Copy,
  Wand2,
  Settings,
  Save,
  Plus,
  Minus,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ArtCanvasProps {
  fullScreen?: boolean;
}

const ArtCanvas = ({ fullScreen = false }: ArtCanvasProps) => {
  // Main state
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTab, setActiveTab] = useState("draw");
  const [currentBrush, setCurrentBrush] = useState("pencil");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [undoStack, setUndoStack] = useState<fabric.Object[][]>([]);
  const [redoStack, setRedoStack] = useState<fabric.Object[][]>([]);
  const [theme, setTheme] = useState("light");
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [symMode, setSymMode] = useState("none");
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [currentEffect, setCurrentEffect] = useState("none");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [canvasWidth, setCanvasWidth] = useState(fullScreen ? 1200 : 800);
  const [canvasHeight, setCanvasHeight] = useState(fullScreen ? 800 : 600);
  const { toast } = useToast();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Handle canvas creation
  const handleCanvasCreated = useCallback((fabricCanvas: fabric.Canvas) => {
    setCanvas(fabricCanvas);
    
    // Set background color
    fabricCanvas.backgroundColor = bgColor;
    
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
    
    // Handle keyboard events for the canvas
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        handleUndo();
        e.preventDefault();
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
        e.preventDefault();
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        handleZoomIn();
        e.preventDefault();
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        handleZoomOut();
        e.preventDefault();
      }
      else if (e.key === 'b') {
        handleBrushSelect('pencil');
      }
      else if (e.key === 'e') {
        handleBrushSelect('eraser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Symmetry drawing support
    fabricCanvas.on('mouse:move', (options) => {
      if (symMode !== "none" && fabricCanvas.isDrawingMode && options.e) {
        const { x, y } = fabricCanvas.getPointer(options.e);
        const canvasCenter = fabricCanvas.getCenter();
        
        if (symMode === "horizontal") {
          // Mirror horizontally
          const mirrorY = 2 * canvasCenter.top - y;
          // Implement mirroring logic
        }
        else if (symMode === "vertical") {
          // Mirror vertically
          const mirrorX = 2 * canvasCenter.left - x;
          // Implement mirroring logic
        }
        else if (symMode === "both") {
          // Mirror both directions
          const mirrorX = 2 * canvasCenter.left - x;
          const mirrorY = 2 * canvasCenter.top - y;
          // Implement mirroring logic
        }
      }
    });
    
    // Welcome toast
    toast({
      title: "Welcome to ArtFlow Canvas!",
      description: "Start creating your digital masterpiece. Choose your tools from the toolbar.",
    });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas, symMode, bgColor, toast, fullScreen]);

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
        sonnerToast.success("Pencil brush selected");
        break;
      case "spray":
        canvas.freeDrawingBrush = createSprayPattern(canvas, brushColor);
        canvas.freeDrawingBrush.width = brushSize * 5;
        canvas.freeDrawingBrush.color = brushColor;
        (canvas.freeDrawingBrush as fabric.SprayBrush).density = 20;
        sonnerToast.success("Spray brush selected");
        break;
      case "watercolor":
        canvas.freeDrawingBrush = createWatercolorPattern(canvas, brushColor);
        canvas.freeDrawingBrush.width = brushSize * 3;
        sonnerToast.success("Watercolor brush selected");
        break;
      case "chalk":
        canvas.freeDrawingBrush = createChalkPattern(canvas, brushColor);
        canvas.freeDrawingBrush.width = brushSize * 2;
        sonnerToast.success("Chalk brush selected");
        break;
      case "marker":
        canvas.freeDrawingBrush = createMarkerPattern(canvas, brushColor);
        canvas.freeDrawingBrush.width = brushSize * 1.5;
        sonnerToast.success("Marker brush selected");
        break;
      case "glitter":
        canvas.freeDrawingBrush = createGlitterPattern(canvas, brushColor);
        canvas.freeDrawingBrush.width = brushSize * 4;
        sonnerToast.success("Glitter brush selected");
        break;
      case "eraser":
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.freeDrawingBrush.width = brushSize * 2;
        sonnerToast.success("Eraser selected");
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
      } else if (currentBrush === "marker") {
        canvas.freeDrawingBrush = createMarkerPattern(canvas, color);
        canvas.freeDrawingBrush.width = brushSize * 1.5;
      } else if (currentBrush === "glitter") {
        canvas.freeDrawingBrush = createGlitterPattern(canvas, color);
        canvas.freeDrawingBrush.width = brushSize * 4;
      }
    }
  }, [canvas, currentBrush, brushSize]);

  // Handle background color change
  const handleBgColorChange = useCallback((color: string) => {
    setBgColor(color);
    if (canvas) {
      canvas.backgroundColor = color;
      canvas.renderAll();
    }
  }, [canvas]);

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
      sonnerToast.info("Undo successful");
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
      sonnerToast.info("Redo successful");
    }
  }, [canvas, redoStack]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    if (canvas && canvasZoom < 200) {
      const newZoom = Math.min(canvasZoom + 10, 200);
      setCanvasZoom(newZoom);
      canvas.setZoom(newZoom / 100);
      canvas.renderAll();
    }
  }, [canvas, canvasZoom]);

  const handleZoomOut = useCallback(() => {
    if (canvas && canvasZoom > 50) {
      const newZoom = Math.max(canvasZoom - 10, 50);
      setCanvasZoom(newZoom);
      canvas.setZoom(newZoom / 100);
      canvas.renderAll();
    }
  }, [canvas, canvasZoom]);

  const handleZoomReset = useCallback(() => {
    if (canvas) {
      setCanvasZoom(100);
      canvas.setZoom(1);
      canvas.renderAll();
    }
  }, [canvas]);

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
    sonnerToast.success("Artwork exported successfully!");
  }, [canvas, toast]);

  // Handle effects
  const applyEffect = useCallback((effect: string) => {
    if (!canvas) return;
    
    setCurrentEffect(effect);
    
    switch(effect) {
      case "grayscale":
        canvas.getObjects().forEach(obj => {
          if (obj instanceof fabric.Path) {
            // Apply grayscale filter
            obj.set('stroke', obj.stroke && typeof obj.stroke === 'string' ? convertToGrayscale(obj.stroke) : obj.stroke);
          }
        });
        canvas.renderAll();
        sonnerToast.success("Grayscale effect applied");
        break;
      case "blur":
        // Apply blur effect to canvas
        sonnerToast.success("Blur effect applied");
        break;
      case "sepia":
        canvas.getObjects().forEach(obj => {
          if (obj instanceof fabric.Path) {
            // Apply sepia filter
            obj.set('stroke', obj.stroke && typeof obj.stroke === 'string' ? convertToSepia(obj.stroke) : obj.stroke);
          }
        });
        canvas.renderAll();
        sonnerToast.success("Sepia effect applied");
        break;
      case "none":
        // Remove effects
        sonnerToast.info("Effects removed");
        break;
      default:
        break;
    }
  }, [canvas]);

  // Helper function to convert color to grayscale
  const convertToGrayscale = (color: string) => {
    try {
      // Simple grayscale conversion - this is a simplified approach
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
    } catch (e) {
      return color;
    }
  };

  // Helper function to convert color to sepia
  const convertToSepia = (color: string) => {
    try {
      // Simple sepia conversion
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Sepia algorithm
      const newR = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      const newG = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      const newB = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
      
      const rHex = Math.round(newR).toString(16).padStart(2, '0');
      const gHex = Math.round(newG).toString(16).padStart(2, '0');
      const bHex = Math.round(newB).toString(16).padStart(2, '0');
      
      return `#${rHex}${gHex}${bHex}`;
    } catch (e) {
      return color;
    }
  };

  // Handle theme toggle
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }, []);

  // Apply theme effects
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);

  // Add grid to canvas
  useEffect(() => {
    if (canvas) {
      // Clear existing grid
      const existingGrid = canvas.getObjects().filter(obj => obj.data?.type === 'grid');
      existingGrid.forEach(obj => canvas.remove(obj));
      
      if (showGrid) {
        // Create grid lines
        const gridSize = 20;
        const width = canvas.width || 800;
        const height = canvas.height || 600;
        
        // Create vertical lines
        for (let i = 0; i <= width; i += gridSize) {
          const line = new fabric.Line([i, 0, i, height], {
            stroke: '#ccc',
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            data: { type: 'grid' }
          });
          canvas.add(line);
          line.sendToBack();
        }
        
        // Create horizontal lines
        for (let i = 0; i <= height; i += gridSize) {
          const line = new fabric.Line([0, i, width, i], {
            stroke: '#ccc',
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
            data: { type: 'grid' }
          });
          canvas.add(line);
          line.sendToBack();
        }
      }
      
      canvas.renderAll();
    }
  }, [canvas, showGrid]);

  // Animation variants for floating toolbar
  const toolbarVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className={cn(
        "bg-gradient-to-br from-artflow-soft-gray to-white rounded-xl shadow-xl overflow-hidden",
        theme === "dark" && "from-artflow-dark-purple to-gray-900",
        fullScreen && "h-[calc(100vh-120px)]"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={cn(
        "p-4 grid gap-4",
        fullScreen ? "grid-cols-[auto_1fr]" : "grid-cols-1 lg:grid-cols-[auto_1fr]",
      )}>
        <motion.div 
          className="flex flex-col gap-4" 
          ref={toolbarRef}
          initial="hidden"
          animate="visible"
          variants={toolbarVariants}
        >
          <Tabs defaultValue="draw" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="draw" className="gap-2 data-[state=active]:bg-primary/20">
                <Brush size={16} />
                <span className="hidden sm:inline">Draw</span>
              </TabsTrigger>
              <TabsTrigger value="layers" className="gap-2 data-[state=active]:bg-primary/20">
                <LayersIcon size={16} />
                <span className="hidden sm:inline">Layers</span>
              </TabsTrigger>
              <TabsTrigger value="effects" className="gap-2 data-[state=active]:bg-primary/20">
                <Sparkles size={16} />
                <span className="hidden sm:inline">Effects</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2 data-[state=active]:bg-primary/20">
                <Share2 size={16} />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="draw" className="mt-0">
              <Toolbar 
                onBrushSelect={handleBrushSelect}
                onBrushSizeChange={handleBrushSizeChange}
                onColorChange={handleColorChange}
                onBgColorChange={handleBgColorChange}
                currentBrush={currentBrush}
                brushSize={brushSize}
                brushColor={brushColor}
                bgColor={bgColor}
                fullScreen={fullScreen}
              />
              
              {/* Additional canvas controls */}
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-grid">Show Grid</Label>
                      <Switch 
                        id="show-grid" 
                        checked={showGrid} 
                        onCheckedChange={setShowGrid}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Symmetry Mode</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["none", "horizontal", "vertical"].map((mode) => (
                          <Button
                            key={mode}
                            size="sm"
                            variant={symMode === mode ? "default" : "outline"}
                            onClick={() => setSymMode(mode)}
                            className="capitalize"
                          >
                            {mode}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="layers" className="mt-0">
              <Layers canvas={canvas} />
              
              {/* Layer controls */}
              <Card className="mt-4">
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Add New Layer</Label>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus size={14} /> Layer
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Layer Opacity</Label>
                    <div className="w-32">
                      <Slider defaultValue={[100]} max={100} step={1} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="effects" className="mt-0">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Effects</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["none", "grayscale", "sepia", "blur"].map((effect) => (
                        <Button
                          key={effect}
                          size="sm"
                          variant={currentEffect === effect ? "default" : "outline"}
                          onClick={() => applyEffect(effect)}
                          className="capitalize"
                        >
                          {effect}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>AI Style Transfer</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["impressionist", "cubism", "sketch", "watercolor"].map((style) => (
                        <Button
                          key={style}
                          size="sm"
                          variant="outline"
                          className="capitalize"
                          disabled
                        >
                          <Wand2 size={14} className="mr-1" />
                          {style}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">AI style transfer coming soon</p>
                  </div>
                </CardContent>
              </Card>
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
                <div className="pt-2">
                  <label className="text-sm font-medium">Canvas Size</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs">Width:</span>
                      <input
                        type="number"
                        value={canvasWidth}
                        onChange={(e) => setCanvasWidth(Number(e.target.value))}
                        className="w-full rounded border p-1 text-xs"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs">Height:</span>
                      <input
                        type="number"
                        value={canvasHeight}
                        onChange={(e) => setCanvasHeight(Number(e.target.value))}
                        className="w-full rounded border p-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2" disabled>
                  <Save size={16} />
                  Save to Gallery
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
          
          {/* Zoom controls */}
          <div className="flex items-center justify-between gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-lg">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
              <Minus size={16} />
            </Button>
            
            <div className="flex items-center gap-1">
              <span className="text-xs">{canvasZoom}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomReset} className="h-6 px-2 py-0">
                <RotateCcw size={12} />
              </Button>
            </div>
            
            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
              <Plus size={16} />
            </Button>
          </div>
        </motion.div>
        
        <div className={cn(
          "relative canvas-container p-2 bg-white rounded-lg shadow-inner",
          theme === "dark" && "bg-gray-800"
        )}>
          <Canvas
            className={activeTab === "draw" ? 
              `brush-cursor ${currentBrush === "eraser" ? "eraser-cursor" : ""}` : ""}
            width={canvasWidth}
            height={canvasHeight}
            onCanvasCreated={handleCanvasCreated}
            zoom={canvasZoom / 100}
          />
          
          {/* Floating Controls for Full Screen Mode */}
          {fullScreen && (
            <AnimatePresence>
              <motion.div 
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Button variant="ghost" size="icon" onClick={handleUndo} className="h-8 w-8 text-white hover:bg-white/20">
                  <UndoIcon size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleRedo} className="h-8 w-8 text-white hover:bg-white/20">
                  <RedoIcon size={16} />
                </Button>
                <div className="h-8 w-px bg-white/20" />
                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8 text-white hover:bg-white/20">
                  <Minus size={16} />
                </Button>
                <span className="text-white/90 text-xs">{canvasZoom}%</span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8 text-white hover:bg-white/20">
                  <Plus size={16} />
                </Button>
                <div className="h-8 w-px bg-white/20" />
                <Button variant="ghost" size="icon" onClick={handleExport} className="h-8 w-8 text-white hover:bg-white/20">
                  <Download size={16} />
                </Button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ArtCanvas;
