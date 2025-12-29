import { Settings, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from './ThemeSwitcher';

interface SettingsPanelProps {
  collapsed?: boolean;
}

export function SettingsPanel({ collapsed }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
          collapsed && "justify-center px-3",
          isOpen && "bg-sidebar-accent/50 text-sidebar-foreground"
        )}
      >
        <Settings className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300", isOpen && "rotate-90")} />
        {!collapsed && <span className="font-medium">Settings</span>}
      </button>

      {/* Settings Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className={cn(
            "absolute z-50 bottom-full mb-2 left-0 right-0 min-w-[240px] glass-card p-4 animate-fade-in",
            collapsed && "left-full ml-2 bottom-0 mb-0"
          )}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Settings</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <ThemeSwitcher />
          </div>
        </>
      )}
    </div>
  );
}
