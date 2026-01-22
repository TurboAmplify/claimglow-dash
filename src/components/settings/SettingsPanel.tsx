import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from './ThemeSwitcher';
import { DensitySwitcher } from './DensitySwitcher';
import { PeopleManagement } from './PeopleManagement';
import { ViewAsSelector } from './ViewAsSelector';
import { useCurrentSalesperson } from '@/hooks/useCurrentSalesperson';
import { Separator } from '@/components/ui/separator';

interface SettingsPanelProps {
  collapsed?: boolean;
}

export function SettingsPanel({ collapsed }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const { isDirector } = useCurrentSalesperson();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle click outside to close the panel
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add listener with a slight delay to avoid immediate close on open click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-all duration-200",
          collapsed && "justify-center px-2",
          isOpen && "bg-sidebar-accent/40 text-sidebar-foreground"
        )}
      >
        <div className="relative w-4 h-4 flex flex-col justify-center items-center gap-0.5">
          <span className={cn(
            "block w-3 h-0.5 bg-current rounded-full transition-all duration-300",
            isOpen && "rotate-45 translate-y-[2px]"
          )} />
          <span className={cn(
            "block w-3 h-0.5 bg-current rounded-full transition-all duration-300",
            isOpen && "opacity-0"
          )} />
          <span className={cn(
            "block w-3 h-0.5 bg-current rounded-full transition-all duration-300",
            isOpen && "-rotate-45 -translate-y-[2px]"
          )} />
        </div>
        {!collapsed && <span className="font-medium text-xs">Settings</span>}
      </button>

      {/* Settings Dropdown */}
      {shouldRender && (
        <div className={cn(
          "absolute z-[100] bottom-full mb-2 left-0 right-0 min-w-[260px] glass-card p-4 transition-all duration-200 ease-out",
          collapsed && "left-full ml-2 bottom-0 mb-0",
          isAnimating 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-2 scale-95"
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
          
          <div className="space-y-4">
            <ThemeSwitcher />
            <DensitySwitcher />
            
            {isDirector && (
              <>
                <Separator className="my-3" />
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Administration</p>
                  <ViewAsSelector />
                  <PeopleManagement />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
