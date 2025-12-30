import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface Salesperson {
  id: string;
  name: string;
}

export interface SalespersonSplit {
  salespersonId: string;
  splitPercentage: number;
}

interface MultiSalespersonSplitProps {
  salespeople: Salesperson[];
  splits: SalespersonSplit[];
  onSplitsChange: (splits: SalespersonSplit[]) => void;
}

export const MultiSalespersonSplit = ({
  salespeople,
  splits,
  onSplitsChange,
}: MultiSalespersonSplitProps) => {
  const totalSplit = splits.reduce((sum, s) => sum + s.splitPercentage, 0);
  const isValidTotal = totalSplit === 100;
  const availableSalespeople = salespeople.filter(
    (sp) => !splits.some((s) => s.salespersonId === sp.id)
  );

  const addSplit = () => {
    if (availableSalespeople.length === 0) return;
    
    // Calculate remaining percentage
    const remaining = 100 - totalSplit;
    onSplitsChange([
      ...splits,
      { salespersonId: "", splitPercentage: remaining > 0 ? remaining : 0 },
    ]);
  };

  const removeSplit = (index: number) => {
    const newSplits = splits.filter((_, i) => i !== index);
    onSplitsChange(newSplits);
  };

  const updateSplit = (index: number, field: keyof SalespersonSplit, value: string | number) => {
    const newSplits = [...splits];
    if (field === "salespersonId") {
      newSplits[index] = { ...newSplits[index], salespersonId: value as string };
    } else {
      newSplits[index] = { ...newSplits[index], splitPercentage: Number(value) || 0 };
    }
    onSplitsChange(newSplits);
  };

  const getAvailableForIndex = (currentIndex: number) => {
    const currentSelection = splits[currentIndex]?.salespersonId;
    return salespeople.filter(
      (sp) => sp.id === currentSelection || !splits.some((s) => s.salespersonId === sp.id)
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Salespeople & Splits *</Label>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isValidTotal ? 'text-green-600' : 'text-amber-600'}`}>
            Total: {totalSplit}%
          </span>
          {splits.length < salespeople.length && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSplit}
              className="h-6 px-2 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>

      {splits.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={addSplit}
          className="w-full h-9 text-sm border-dashed"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Salesperson
        </Button>
      ) : (
        <div className="space-y-2">
          {splits.map((split, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={split.salespersonId}
                onValueChange={(value) => updateSplit(index, "salespersonId", value)}
              >
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableForIndex(index).map((sp) => (
                    <SelectItem key={sp.id} value={sp.id} className="text-sm">
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={split.splitPercentage}
                  onChange={(e) => updateSplit(index, "splitPercentage", e.target.value)}
                  className="w-16 h-9 text-sm text-center"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSplit(index)}
                className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!isValidTotal && splits.length > 0 && (
        <p className="text-xs text-amber-600">
          Split percentages should total 100% (currently {totalSplit}%)
        </p>
      )}
    </div>
  );
};
