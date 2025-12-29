import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from './ThemeSwitcher';
import { DensitySwitcher } from './DensitySwitcher';

interface SettingsPanelProps {
  collapsed?: boolean;
}

export function SettingsPanel({ collapsed }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-all duration-200",
          collapsed && "justify-center px-3",
          isOpen && "bg-sidebar-accent/40 text-sidebar-foreground"
        )}
      >
        <div className="relative w-5 h-5 flex flex-col justify-center items-center gap-1">
          <span className={cn(
            "block w-4 h-0.5 bg-current rounded-full transition-all duration-300",
            isOpen && "rotate-45 translate-y-[3px]"
          )} />
          <span className={cn(
            "block w-4 h-0.5 bg-current rounded-full transition-all duration-300",
            isOpen && "opacity-0"
          )} />
          <span className={cn(
            "block w-4 h-0.5 bg-current rounded-full transition-all duration-300",
            isOpen && "-rotate-45 -translate-y-[3px]"
          )} />
        </div>
        {!collapsed && <span className="font-medium text-sm">Menu</span>}
      </button>

      {/* Settings Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop - closes menu when clicking outside */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className={cn(
            "absolute z-50 bottom-full mb-2 left-0 right-0 min-w-[260px] glass-card p-4 animate-fade-in",
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
            
            <div className="space-y-5">
              <ThemeSwitcher />
              <DensitySwitcher />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
