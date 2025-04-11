import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Brush, 
  Eraser, 
  Droplet, 
  Sparkles, 
  Settings2,
  Palette,
  Zap,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrushSettingsProps {
  onBrushSizeChange: (size: number) => void;
  onBrushOpacityChange: (opacity: number) => void;
  onBrushTypeChange: (type: string) => void;
  onPressureSensitivityChange: (enabled: boolean) => void;
  onBlendModeChange: (mode: string) => void;
  currentBrushSize: number;
  currentOpacity: number;
  currentBrushType: string;
  isPressureSensitive: boolean;
  currentBlendMode: string;
}

const brushTypes = [
  { id: "pencil", label: "Pencil", icon: <Brush size={16} /> },
  { id: "watercolor", label: "Watercolor", icon: <Droplet size={16} /> },
  { id: "spray", label: "Spray", icon: <Sparkles size={16} /> },
  { id: "eraser", label: "Eraser", icon: <Eraser size={16} /> },
];

const blendModes = [
  { id: "normal", label: "Normal", icon: <Settings2 size={16} /> },
  { id: "multiply", label: "Multiply", icon: <Palette size={16} /> },
  { id: "screen", label: "Screen", icon: <Zap size={16} /> },
  { id: "overlay", label: "Overlay", icon: <Sun size={16} /> },
  { id: "darken", label: "Darken", icon: <Moon size={16} /> },
];

const BrushSettings = ({
  onBrushSizeChange,
  onBrushOpacityChange,
  onBrushTypeChange,
  onPressureSensitivityChange,
  onBlendModeChange,
  currentBrushSize,
  currentOpacity,
  currentBrushType,
  isPressureSensitive,
  currentBlendMode,
}: BrushSettingsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Brush Settings</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Settings2 size={16} />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Brush Type Selection */}
          <div className="grid grid-cols-4 gap-2">
            {brushTypes.map((brush) => (
              <Button
                key={brush.id}
                variant={currentBrushType === brush.id ? "default" : "outline"}
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2"
                onClick={() => onBrushTypeChange(brush.id)}
              >
                {brush.icon}
                <span className="text-xs">{brush.label}</span>
              </Button>
            ))}
          </div>

          {/* Brush Size Slider */}
          <div className="space-y-2">
            <Label>Brush Size</Label>
            <Slider
              value={[currentBrushSize]}
              onValueChange={([value]) => onBrushSizeChange(value)}
              min={1}
              max={50}
              step={1}
            />
          </div>

          {/* Opacity Slider */}
          <div className="space-y-2">
            <Label>Opacity</Label>
            <Slider
              value={[currentOpacity]}
              onValueChange={([value]) => onBrushOpacityChange(value)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Pressure Sensitivity Toggle */}
          <div className="flex items-center justify-between">
            <Label>Pressure Sensitivity</Label>
            <Switch
              checked={isPressureSensitive}
              onCheckedChange={onPressureSensitivityChange}
            />
          </div>

          {/* Blend Mode Selection */}
          {isExpanded && (
            <div className="space-y-2">
              <Label>Blend Mode</Label>
              <div className="grid grid-cols-5 gap-2">
                {blendModes.map((mode) => (
                  <Button
                    key={mode.id}
                    variant={currentBlendMode === mode.id ? "default" : "outline"}
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2"
                    onClick={() => onBlendModeChange(mode.id)}
                  >
                    {mode.icon}
                    <span className="text-xs">{mode.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BrushSettings; 