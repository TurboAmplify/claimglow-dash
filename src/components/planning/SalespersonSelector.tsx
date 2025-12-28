import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalespeople } from "@/hooks/useSalesCommissions";
import { Users, User } from "lucide-react";

interface SalespersonSelectorProps {
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  showTeamOption?: boolean;
}

export function SalespersonSelector({ selectedId, onSelect, showTeamOption = false }: SalespersonSelectorProps) {
  const { data: salespeople, isLoading } = useSalespeople();

  if (isLoading) {
    return (
      <div className="w-48 h-10 bg-secondary/30 rounded-md animate-pulse" />
    );
  }

  return (
    <Select value={selectedId || ""} onValueChange={onSelect}>
      <SelectTrigger className="w-[200px] bg-secondary/50">
        <SelectValue placeholder="Select salesperson" />
      </SelectTrigger>
      <SelectContent>
        {showTeamOption && (
          <SelectItem value="team">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Team View</span>
            </div>
          </SelectItem>
        )}
        {salespeople?.map((sp) => (
          <SelectItem key={sp.id} value={sp.id}>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{sp.name}</span>
              {sp.role === "sales_director" && (
                <span className="text-xs text-muted-foreground">(Director)</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
