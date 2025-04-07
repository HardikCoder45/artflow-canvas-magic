
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers as LayersIcon, Eye, EyeOff, Plus, Trash } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fabric } from "fabric";

interface LayersProps {
  canvas: fabric.Canvas | null;
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  objects: fabric.Object[];
}

const LayersPanel = ({ canvas }: LayersProps) => {
  // For the first version, we'll use a simplified layers model
  // In a future version, this could be enhanced to support real layer management
  const [layers, setLayers] = useState<Layer[]>([
    { id: "layer-1", name: "Background", visible: true, objects: [] }
  ]);
  
  // In this version, layers are more of a UI concept
  // We'll implement more advanced layer functionality in future versions
  
  const addLayer = () => {
    const newLayer = {
      id: `layer-${layers.length + 1}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      objects: []
    };
    
    setLayers([...layers, newLayer]);
  };
  
  const toggleLayerVisibility = (layerId: string) => {
    setLayers(
      layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  };
  
  const removeLayer = (layerId: string) => {
    // Don't allow removing the last layer
    if (layers.length <= 1) return;
    
    setLayers(layers.filter(layer => layer.id !== layerId));
  };

  return (
    <Accordion type="single" collapsible defaultValue="layers">
      <AccordionItem value="layers" className="border rounded-lg bg-artflow-soft-gray">
        <AccordionTrigger className="px-4 py-2 hover:no-underline">
          <div className="flex items-center gap-2">
            <LayersIcon size={18} />
            <span>Layers</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="p-2 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-center gap-1"
              onClick={addLayer}
            >
              <Plus size={16} />
              <span>Add Layer</span>
            </Button>
            
            <ScrollArea className="h-[200px] rounded border p-2">
              <div className="space-y-1">
                {layers.map((layer) => (
                  <div 
                    key={layer.id} 
                    className="flex items-center justify-between p-2 hover:bg-background/10 rounded"
                  >
                    <span className="text-sm truncate max-w-[100px]">{layer.name}</span>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => toggleLayerVisibility(layer.id)}
                      >
                        {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeLayer(layer.id)}
                        disabled={layers.length <= 1}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default LayersPanel;
