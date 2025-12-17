import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = "Select...",
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const displayValue = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0];
    if (selected.length === options.length) return "All selected";
    return `${selected.length} selected`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-secondary/50 border-glass-border/30 rounded-xl text-foreground hover:bg-secondary/70 focus:ring-2 focus:ring-primary/50"
          >
            <span className={cn(selected.length === 0 && "text-muted-foreground")}>
              {displayValue()}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-glass-border/30 rounded-xl z-50" align="start">
          <div className="p-2 border-b border-glass-border/30 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="flex-1 text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {options.map((option) => (
              <div
                key={option}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => handleToggle(option)}
              >
                <Checkbox
                  checked={selected.includes(option)}
                  onCheckedChange={() => handleToggle(option)}
                  className="border-muted-foreground/50"
                />
                <span className="text-sm text-foreground">{option}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs"
            >
              {item}
              <X
                className="h-3 w-3 cursor-pointer hover:text-primary/70"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(item);
                }}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}