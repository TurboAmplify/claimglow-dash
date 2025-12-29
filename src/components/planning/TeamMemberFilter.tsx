import { useState } from "react";
import { useSalespeople } from "@/hooks/useSalesCommissions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users, User, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SelectionMode = "individual" | "custom" | "team";

export interface TeamMemberSelection {
  mode: SelectionMode;
  selectedIds: string[];
}

interface TeamMemberFilterProps {
  selection: TeamMemberSelection;
  onSelectionChange: (selection: TeamMemberSelection) => void;
  className?: string;
}

export function TeamMemberFilter({ selection, onSelectionChange, className }: TeamMemberFilterProps) {
  const { data: salespeople, isLoading } = useSalespeople();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <div className="w-64 h-10 bg-secondary/30 rounded-md animate-pulse" />;
  }

  const allIds = salespeople?.map(sp => sp.id) || [];
  const allSelected = allIds.length > 0 && allIds.every(id => selection.selectedIds.includes(id));

  const handleToggle = (id: string) => {
    const newSelection = selection.selectedIds.includes(id)
      ? selection.selectedIds.filter(i => i !== id)
      : [...selection.selectedIds, id];
    
    // Determine mode based on selection count
    const mode: SelectionMode = 
      newSelection.length === 0 ? "individual" :
      newSelection.length === 1 ? "individual" :
      newSelection.length === allIds.length ? "team" : "custom";
    
    onSelectionChange({ mode, selectedIds: newSelection });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all - keep first one selected
      onSelectionChange({ 
        mode: "individual", 
        selectedIds: allIds.length > 0 ? [allIds[0]] : [] 
      });
    } else {
      // Select all
      onSelectionChange({ mode: "team", selectedIds: allIds });
    }
  };

  const getDisplayValue = () => {
    if (selection.selectedIds.length === 0) {
      return (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>Select Team Member</span>
        </div>
      );
    }
    
    if (selection.selectedIds.length === allIds.length) {
      return (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span>All Team Members</span>
          <Badge variant="secondary" className="ml-1 text-xs">{allIds.length}</Badge>
        </div>
      );
    }
    
    if (selection.selectedIds.length === 1) {
      const person = salespeople?.find(sp => sp.id === selection.selectedIds[0]);
      return (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>{person?.name || "Select..."}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <span>{selection.selectedIds.length} Team Members</span>
      </div>
    );
  };

  const selectedNames = selection.selectedIds
    .map(id => salespeople?.find(sp => sp.id === id)?.name)
    .filter(Boolean);

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium text-muted-foreground">Viewing plan for:</Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-secondary/50 border-border/50 hover:bg-secondary"
          >
            {getDisplayValue()}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 bg-popover border-border" align="start">
          {/* Select All option */}
          <div className="p-3 border-b border-border">
            <div
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer"
              onClick={handleSelectAll}
            >
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="flex items-center gap-2 cursor-pointer flex-1 font-medium">
                <Users className="w-4 h-4 text-primary" />
                <span>Select All</span>
              </Label>
            </div>
          </div>

          {/* Individual team members */}
          <div className="max-h-60 overflow-y-auto p-2">
            {salespeople?.map((sp) => (
              <div
                key={sp.id}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer"
                onClick={() => handleToggle(sp.id)}
              >
                <Checkbox
                  id={`member-${sp.id}`}
                  checked={selection.selectedIds.includes(sp.id)}
                  onCheckedChange={() => handleToggle(sp.id)}
                />
                <Label htmlFor={`member-${sp.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                  <User className="w-4 h-4" />
                  <span>{sp.name}</span>
                  {sp.role === "sales_director" && (
                    <Badge variant="outline" className="text-xs ml-auto">Director</Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>

          {/* Apply button */}
          <div className="p-3 border-t border-border flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selection.selectedIds.length} selected
            </span>
            <Button size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Show selected members as badges when multiple selected */}
      {selection.selectedIds.length > 1 && selection.selectedIds.length < allIds.length && (
        <div className="flex flex-wrap gap-2">
          {selectedNames.map((name, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
