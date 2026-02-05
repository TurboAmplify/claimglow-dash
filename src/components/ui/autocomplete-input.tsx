import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface AutocompleteInputProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  allowCustom?: boolean;
  onNewValue?: (value: string) => void;
}

export function AutocompleteInput({
  value,
  onValueChange,
  options,
  placeholder = "Select or type...",
  emptyMessage = "No results found.",
  className,
  allowCustom = true,
  onNewValue,
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    const searchLower = inputValue.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.value.toLowerCase().includes(searchLower)
    );
  }, [options, inputValue]);

  const isNewValue = React.useMemo(() => {
    if (!inputValue.trim()) return false;
    return !options.some(
      (opt) => opt.label.toLowerCase() === inputValue.toLowerCase()
    );
  }, [options, inputValue]);

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onValueChange(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (search: string) => {
    setInputValue(search);
    // Allow typing custom values
    if (allowCustom) {
      onValueChange(search);
    }
  };

  const handleAddNew = () => {
    if (inputValue.trim() && onNewValue) {
      onNewValue(inputValue.trim());
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-secondary/50 border-glass-border/30 font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {filteredOptions.length === 0 && !isNewValue && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.label)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.label ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {isNewValue && allowCustom && onNewValue && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleAddNew}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{inputValue}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
