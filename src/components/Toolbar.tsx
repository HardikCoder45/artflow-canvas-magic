
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brush, Eraser, Droplet, Wand2 } from "lucide-react";

interface ToolbarProps {
  onBrushSelect: (brushType: string) => void;
  onBrushSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  currentBrush: string;
  brushSize: number;
  brushColor: string;
}

const Toolbar = ({ 
  onBrushSelect, 
  onBrushSizeChange, 
  onColorChange,
  currentBrush,
  brushSize,
  brushColor
}: ToolbarProps) => {
  const [activeTab, setActiveTab] = useState("brushes");

  // Predefined color palette
  const colorPalette = [
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", 
    "#ffff00", "#ff00ff", "#00ffff", "#ff8000", "#8000ff",
    "#ff0080", "#0080ff", "#80ff00", "#241571", "#845EC2",
    "#D65DB1", "#FF6F91", "#FF9671", "#FFC75F", "#F9F871"
  ];

  // Brush types
  const brushTypes = [
    { id: "pencil", name: "Pencil", icon: <Brush className="w-4 h-4" /> },
    { id: "spray", name: "Spray", icon: <Droplet className="w-4 h-4" /> },
    { id: "watercolor", name: "Watercolor", icon: <Wand2 className="w-4 h-4" /> },
    { id: "chalk", name: "Chalk", icon: <Brush className="w-4 h-4" /> },
    { id: "eraser", name: "Eraser", icon: <Eraser className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-card rounded-lg shadow-lg p-4 h-full flex flex-col">
      <Tabs defaultValue="brushes" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="brushes">Brushes</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="brushes" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {brushTypes.map(brush => (
              <Button
                key={brush.id}
                variant={currentBrush === brush.id ? "default" : "outline"}
                size="sm"
                className={`flex items-center justify-start gap-2 ${
                  currentBrush === brush.id ? "bg-primary text-primary-foreground" : ""
                }`}
                onClick={() => onBrushSelect(brush.id)}
              >
                {brush.icon}
                <span>{brush.name}</span>
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Brush Size</span>
              <span className="text-sm font-medium">{brushSize}px</span>
            </div>
            <Slider 
              value={[brushSize]} 
              min={1} 
              max={30} 
              step={1}
              onValueChange={(value) => onBrushSizeChange(value[0])}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="colors" className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {colorPalette.map(color => (
              <button
                key={color}
                className={`w-10 h-10 rounded-md hover:scale-110 transition-transform ${
                  color === brushColor ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
                aria-label={`Select ${color} color`}
              />
            ))}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="custom-color" className="text-sm font-medium">
              Custom Color
            </label>
            <div className="flex gap-2">
              <input
                id="custom-color"
                type="color"
                value={brushColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-12 h-12 cursor-pointer rounded bg-transparent p-0 border-0"
              />
              <div className="flex-1 border rounded p-2">
                <span className="text-sm">{brushColor}</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Toolbar;
