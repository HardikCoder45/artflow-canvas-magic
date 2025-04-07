
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fabric } from "fabric";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Brush, Eraser, Square, Circle, Mouse, Undo, Redo, Save, Trash, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ToolbarProps {
  canvas: fabric.Canvas | null;
}

export type Tool = "select" | "pen" | "brush" | "eraser" | "rectangle" | "circle";

const Toolbar = ({ canvas }: ToolbarProps) => {
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("#000000");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);

  // Update brush settings when they change
  useEffect(() => {
    if (!canvas) return;

    // Set drawing mode based on active tool
    canvas.isDrawingMode = ["pen", "brush", "eraser"].includes(activeTool);

    // Configure brush
    if (canvas.isDrawingMode) {
      if (activeTool === "eraser") {
        // For eraser, use white color or implement true eraser
        canvas.freeDrawingBrush.color = "#ffffff";
        canvas.freeDrawingBrush.width = brushSize * 2; // Larger size for eraser
      } else {
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
      }
    }
  }, [canvas, activeTool, brushSize, brushColor]);

  // Save canvas state to history after object added
  useEffect(() => {
    if (!canvas) return;

    const saveToHistory = () => {
      if (historyIndex < history.length - 1) {
        // Truncate future history if we've gone back and made changes
        setHistory(history.slice(0, historyIndex + 1));
      }

      const newState = JSON.stringify(canvas.toJSON());
      setHistory([...history, newState]);
      setHistoryIndex(history.length);
    };

    // Add event listeners
    canvas.on("object:added", saveToHistory);
    canvas.on("object:modified", saveToHistory);

    return () => {
      canvas.off("object:added", saveToHistory);
      canvas.off("object:modified", saveToHistory);
    };
  }, [canvas, history, historyIndex]);

  // Tool change handlers
  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
    
    if (!canvas) return;

    // Deselect all objects when changing tools
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    if (tool === "select") {
      canvas.isDrawingMode = false;
    }
  };

  // Shape drawing
  const addShape = (shape: "rectangle" | "circle") => {
    if (!canvas) return;
    
    let shapeObj;
    
    if (shape === "rectangle") {
      shapeObj = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: brushColor,
      });
    } else {
      shapeObj = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: brushColor,
      });
    }
    
    canvas.add(shapeObj);
    canvas.setActiveObject(shapeObj);
    canvas.requestRenderAll();
  };

  // Clear canvas
  const clearCanvas = () => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.requestRenderAll();
    
    // Reset history
    const newState = JSON.stringify(canvas.toJSON());
    setHistory([newState]);
    setHistoryIndex(0);
  };

  // Undo/Redo
  const undo = () => {
    if (!canvas || historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    canvas.loadFromJSON(history[newIndex], () => {
      setHistoryIndex(newIndex);
      canvas.requestRenderAll();
    });
  };

  const redo = () => {
    if (!canvas || historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    canvas.loadFromJSON(history[newIndex], () => {
      setHistoryIndex(newIndex);
      canvas.requestRenderAll();
    });
  };

  // Save canvas as image
  const saveCanvas = () => {
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "artflow-canvas-" + new Date().toISOString() + ".png";
    link.href = canvas.toDataURL({
      format: "png",
      quality: 1,
    });
    link.click();
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-artflow-soft-gray rounded-lg shadow-md">
      <div className="flex flex-wrap gap-2 mb-2">
        <Button
          variant={activeTool === "select" ? "default" : "outline"}
          size="icon"
          onClick={() => handleToolChange("select")}
          title="Select"
        >
          <Mouse size={20} />
        </Button>
        
        <Button
          variant={activeTool === "pen" ? "default" : "outline"}
          size="icon"
          onClick={() => handleToolChange("pen")}
          className={activeTool === "pen" ? "bg-artflow-purple hover:bg-artflow-deep-purple text-white" : ""}
          title="Pen"
        >
          <Brush size={20} />
        </Button>
        
        <Button
          variant={activeTool === "eraser" ? "default" : "outline"}
          size="icon"
          onClick={() => handleToolChange("eraser")}
          title="Eraser"
        >
          <Eraser size={20} />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            handleToolChange("rectangle");
            addShape("rectangle");
          }}
          title="Rectangle"
        >
          <Square size={20} />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            handleToolChange("circle");
            addShape("circle");
          }}
          title="Circle"
        >
          <Circle size={20} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <Button
          variant="outline"
          size="icon"
          onClick={undo}
          disabled={historyIndex <= 0}
          title="Undo"
        >
          <Undo size={20} />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="Redo"
        >
          <Redo size={20} />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={saveCanvas}
          title="Save"
        >
          <Save size={20} />
        </Button>
        
        <Button
          variant="destructive"
          size="icon"
          onClick={clearCanvas}
          title="Clear Canvas"
        >
          <Trash size={20} />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="relative" 
              title="Color"
            >
              <Palette size={20} />
              <div 
                className="absolute w-4 h-4 rounded-full border border-gray-400 bottom-1 right-1" 
                style={{ backgroundColor: brushColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <Tabs defaultValue="picker">
              <TabsList className="mb-4">
                <TabsTrigger value="picker">Color Picker</TabsTrigger>
                <TabsTrigger value="preset">Presets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="picker" className="space-y-4">
                <input 
                  type="color" 
                  value={brushColor} 
                  onChange={(e) => setBrushColor(e.target.value)} 
                  className="w-full h-10 cursor-pointer"
                />
              </TabsContent>
              
              <TabsContent value="preset" className="grid grid-cols-5 gap-2">
                {[
                  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
                  "#ffff00", "#00ffff", "#ff00ff", "#9b87f5", "#F97316",
                  "#7E69AB", "#1A1F2C", "#F1F0FB", "#6E59A5", "#D6BCFA"
                ].map((color) => (
                  <div
                    key={color}
                    className="w-8 h-8 rounded-full cursor-pointer border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setBrushColor(color)}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2 px-2">
        <span className="text-xs">Size:</span>
        <Slider
          className="w-32"
          min={1}
          max={50}
          step={1}
          value={[brushSize]}
          onValueChange={(value) => setBrushSize(value[0])}
        />
        <span className="text-xs w-6">{brushSize}</span>
      </div>
    </div>
  );
};

export default Toolbar;
