import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@radix-ui/react-tooltip';
import { Divide as Divider } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brush, 
  Eraser, 
  Droplet, 
  Wand2, 
  Pencil, 
  Highlighter, 
  Sparkles,
  Palette
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  onBrushSelect: (brushType: string) => void;
  onBrushSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onBgColorChange?: (color: string) => void;
  currentBrush: string;
  brushSize: number;
  brushColor: string;
  bgColor?: string;
  fullScreen?: boolean;
  activeTool: string;
  onToolChange: (tool: string) => void;
  brushWidth: number;
  onWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isToolPersistent: boolean;
  onToggleToolPersistence: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onBrushSelect,
  onBrushSizeChange,
  onColorChange,
  onBgColorChange,
  currentBrush,
  brushSize,
  brushColor,
  bgColor = "#ffffff",
  fullScreen = false,
  activeTool,
  onToolChange,
  brushWidth,
  onWidthChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isToolPersistent,
  onToggleToolPersistence
}) => {
  const [activeTab, setActiveTab] = useState("brushes");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Extended color palette
  const colorPalette = [
    // Primary colors
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", 
    // Secondary colors
    "#ffff00", "#ff00ff", "#00ffff", "#ff8000", "#8000ff",
    // Tertiary colors
    "#ff0080", "#0080ff", "#80ff00", "#241571", "#845EC2",
    // Bright pastels
    "#D65DB1", "#FF6F91", "#FF9671", "#FFC75F", "#F9F871",
    // Soft pastels
    "#F2FCE2", "#FEF7CD", "#FEC6A1", "#E5DEFF", "#FFDEE2",
    // Muted tones
    "#403E43", "#8A898C", "#C8C8C9", "#9F9EA1", "#F6F6F7"
  ];

  // Extended brush types
  const brushTypes = [
    { id: "pencil", name: "Pencil", icon: <Pencil className="w-4 h-4" /> },
    { id: "spray", name: "Spray", icon: <Droplet className="w-4 h-4" /> },
    { id: "watercolor", name: "Watercolor", icon: <Wand2 className="w-4 h-4" /> },
    { id: "chalk", name: "Chalk", icon: <Brush className="w-4 h-4" /> },
    { id: "marker", name: "Marker", icon: <Highlighter className="w-4 h-4" /> },
    { id: "glitter", name: "Glitter", icon: <Sparkles className="w-4 h-4" /> },
    { id: "eraser", name: "Eraser", icon: <Eraser className="w-4 h-4" /> }
  ];

  // Handle mouse down on the toolbar header
  const handleMouseDown = (e: React.MouseEvent) => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={toolbarRef}
      className="toolbar" 
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '12px',
        zIndex: 1000,
        userSelect: 'none'
      }}
    >
      <div 
        className="toolbar-header"
        style={{
          padding: '6px',
          cursor: 'move',
          background: '#f3f4f6',
          borderRadius: '6px 6px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}
        onMouseDown={handleMouseDown}
      >
        <span>Tools</span>
        <Tooltip content={isToolPersistent ? "Tool stays selected" : "Tool resets after use"}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleToolPersistence}
          >
            <Icon name={isToolPersistent ? "pin" : "pin-off"} />
          </Button>
        </Tooltip>
      </div>

      <Tabs defaultValue="brushes" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="brushes">Brushes</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="brushes" className="space-y-4">
          <div className={cn(
            "grid gap-2",
            fullScreen ? "grid-cols-3" : "grid-cols-2"
          )}>
            {brushTypes.map(brush => (
              <motion.div key={brush.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={currentBrush === brush.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex items-center justify-start gap-2 w-full",
                    currentBrush === brush.id ? "bg-primary text-primary-foreground" : ""
                  )}
                  onClick={() => onBrushSelect(brush.id)}
                >
                  {brush.icon}
                  <span>{brush.name}</span>
                </Button>
              </motion.div>
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
              className="cursor-pointer"
            />
          </div>
          
          {/* Quick color access in brush tab */}
          <div className="pt-2 border-t">
            <div className="text-sm font-medium mb-2">Quick Colors</div>
            <div className="flex flex-wrap gap-2">
              {colorPalette.slice(0, 10).map(color => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-8 h-8 rounded-md transition-transform",
                    color === brushColor ? 'ring-2 ring-primary ring-offset-2' : ''
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(color)}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="colors" className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {colorPalette.map(color => (
              <motion.button
                key={color}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-10 h-10 rounded-md transition-transform",
                  color === brushColor ? 'ring-2 ring-primary ring-offset-2' : ''
                )}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
                aria-label={`Select ${color} color`}
              />
            ))}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="custom-color" className="text-sm font-medium">
              Custom Brush Color
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
          
          {onBgColorChange && (
            <div className="space-y-2 pt-4 border-t">
              <label htmlFor="bg-color" className="text-sm font-medium flex items-center gap-2">
                <Palette size={16} />
                Canvas Background
              </label>
              <div className="flex gap-2">
                <input
                  id="bg-color"
                  type="color"
                  value={bgColor}
                  onChange={(e) => onBgColorChange(e.target.value)}
                  className="w-12 h-12 cursor-pointer rounded bg-transparent p-0 border-0"
                />
                <div className="flex-1 border rounded p-2">
                  <span className="text-sm">{bgColor}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Gradient presets */}
          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-medium">Gradient Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                className="h-8 rounded-md bg-gradient-to-r from-pink-500 to-purple-500"
                onClick={() => onColorChange('#D65DB1')}
              />
              <button 
                className="h-8 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500"
                onClick={() => onColorChange('#0080ff')}
              />
              <button 
                className="h-8 rounded-md bg-gradient-to-r from-green-500 to-yellow-500"
                onClick={() => onColorChange('#80ff00')}
              />
              <button 
                className="h-8 rounded-md bg-gradient-to-r from-red-500 to-yellow-500"
                onClick={() => onColorChange('#ff0000')}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Toolbar;
