import { useState } from "react";
import { useSalespeople } from "@/hooks/useSalesCommissions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users, User, ChevronDown, Check, X } from "lucide-react";
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
  const [tempCustomSelection, setTempCustomSelection] = useState<string[]>([]);

  if (isLoading) {
    return <div className="w-64 h-10 bg-secondary/30 rounded-md animate-pulse" />;
  }

  const handleModeChange = (mode: SelectionMode) => {
    if (mode === "team") {
      onSelectionChange({ mode: "team", selectedIds: [] });
      setOpen(false);
    } else if (mode === "individual") {
      // Keep it open for individual selection
      onSelectionChange({ mode: "individual", selectedIds: selection.selectedIds.slice(0, 1) });
    } else if (mode === "custom") {
      // Initialize custom selection with current selection
      setTempCustomSelection(selection.selectedIds);
      onSelectionChange({ mode: "custom", selectedIds: selection.selectedIds });
    }
  };

  const handleIndividualSelect = (id: string) => {
    onSelectionChange({ mode: "individual", selectedIds: [id] });
    setOpen(false);
  };

  const handleCustomToggle = (id: string) => {
    const newSelection = tempCustomSelection.includes(id)
      ? tempCustomSelection.filter(i => i !== id)
      : [...tempCustomSelection, id];
    setTempCustomSelection(newSelection);
  };

  const applyCustomSelection = () => {
    onSelectionChange({ mode: "custom", selectedIds: tempCustomSelection });
    setOpen(false);
  };

  const getDisplayValue = () => {
    if (selection.mode === "team") {
      return (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span>Entire Team</span>
        </div>
      );
    }
    if (selection.mode === "custom" && selection.selectedIds.length > 1) {
      return (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span>{selection.selectedIds.length} Team Members</span>
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
        <User className="w-4 h-4" />
        <span>Select Team Member</span>
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
        <PopoverContent className="w-80 p-0 bg-popover border-border" align="start">
          <div className="p-4 border-b border-border">
            <RadioGroup
              value={selection.mode}
              onValueChange={(value) => handleModeChange(value as SelectionMode)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="team" id="team" />
                <Label htmlFor="team" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4 text-primary" />
                  Entire Team
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Individual Member
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Custom Selection
                </Label>
              </div>
            </RadioGroup>
          </div>

          {selection.mode === "individual" && (
            <div className="max-h-60 overflow-y-auto p-2">
              {salespeople?.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => handleIndividualSelect(sp.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors",
                    selection.selectedIds.includes(sp.id) && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{sp.name}</span>
                    {sp.role === "sales_director" && (
                      <span className="text-xs text-muted-foreground">(Director)</span>
                    )}
                  </div>
                  {selection.selectedIds.includes(sp.id) && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}

          {selection.mode === "custom" && (
            <>
              <div className="max-h-60 overflow-y-auto p-2">
                {salespeople?.map((sp) => (
                  <div
                    key={sp.id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary/50"
                  >
                    <Checkbox
                      id={`custom-${sp.id}`}
                      checked={tempCustomSelection.includes(sp.id)}
                      onCheckedChange={() => handleCustomToggle(sp.id)}
                    />
                    <Label htmlFor={`custom-${sp.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                      <User className="w-4 h-4" />
                      <span>{sp.name}</span>
                      {sp.role === "sales_director" && (
                        <span className="text-xs text-muted-foreground">(Director)</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {tempCustomSelection.length} selected
                </span>
                <Button size="sm" onClick={applyCustomSelection} disabled={tempCustomSelection.length === 0}>
                  Apply Selection
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Show selected members as badges for custom selection */}
      {selection.mode === "custom" && selectedNames.length > 0 && (
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
