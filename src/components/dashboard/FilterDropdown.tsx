import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
}: FilterDropdownProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-secondary/50 border-glass-border/30 rounded-xl text-foreground focus:ring-2 focus:ring-primary/50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-popover border-glass-border/30 rounded-xl">
          <SelectItem value="all" className="rounded-lg">
            All
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="rounded-lg">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
