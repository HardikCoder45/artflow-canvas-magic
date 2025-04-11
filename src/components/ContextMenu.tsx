import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Copy, 
  Trash2, 
  Scissors, 
  ClipboardPaste, 
  Layers, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  RotateCw, 
  MousePointer
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  hasSelection: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onAction,
  hasSelection
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Define the menu items
  const menuItems = [
    {
      group: 'Edit',
      items: [
        { id: 'copy', icon: <Copy size={16} />, label: 'Copy', disabled: !hasSelection, shortcut: 'Ctrl+C' },
        { id: 'cut', icon: <Scissors size={16} />, label: 'Cut', disabled: !hasSelection, shortcut: 'Ctrl+X' },
        { id: 'paste', icon: <ClipboardPaste size={16} />, label: 'Paste', disabled: false, shortcut: 'Ctrl+V' },
        { id: 'delete', icon: <Trash2 size={16} />, label: 'Delete', disabled: !hasSelection, shortcut: 'Del' },
      ]
    },
    {
      group: 'Arrange',
      items: [
        { id: 'bringToFront', icon: <Layers size={16} />, label: 'Bring to Front', disabled: !hasSelection },
        { id: 'bringForward', icon: <ChevronUp size={16} />, label: 'Bring Forward', disabled: !hasSelection },
        { id: 'sendBackward', icon: <ChevronDown size={16} />, label: 'Send Backward', disabled: !hasSelection },
        { id: 'sendToBack', icon: <Layers size={16} />, label: 'Send to Back', disabled: !hasSelection },
      ]
    },
    {
      group: 'Transform',
      items: [
        { id: 'rotateLeft', icon: <RotateCcw size={16} />, label: 'Rotate Left 90°', disabled: !hasSelection },
        { id: 'rotateRight', icon: <RotateCw size={16} />, label: 'Rotate Right 90°', disabled: !hasSelection },
      ]
    },
    {
      group: 'Selection',
      items: [
        { id: 'selectAll', icon: <MousePointer size={16} />, label: 'Select All', disabled: false, shortcut: 'Ctrl+A' },
      ]
    }
  ];
  
  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Adjust menu position if it would be off-screen
  const adjustPosition = () => {
    if (!menuRef.current) return { x, y };
    
    const { width, height } = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const adjustedX = x + width > windowWidth ? windowWidth - width - 10 : x;
    const adjustedY = y + height > windowHeight ? windowHeight - height - 10 : y;
    
    return { x: adjustedX, y: adjustedY };
  };
  
  const adjustedPosition = adjustPosition();
  
  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-56 rounded-md shadow-lg bg-slate-900/95 border border-slate-700 backdrop-blur-sm overflow-hidden"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((group, groupIndex) => (
        <div key={group.group} className={cn(groupIndex > 0 && "border-t border-slate-700")}>
          <div className="px-3 py-1.5 text-xs text-slate-400">{group.group}</div>
          <div className="px-1 pb-1">
            {group.items.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-slate-700/70 transition-colors",
                  item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
                onClick={() => !item.disabled && onAction(item.id)}
                disabled={item.disabled}
              >
                <span className="w-5 h-5 mr-2 flex items-center justify-center text-slate-400">
                  {item.icon}
                </span>
                <span className="flex-1 text-left text-slate-200">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-slate-500">{item.shortcut}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContextMenu; 