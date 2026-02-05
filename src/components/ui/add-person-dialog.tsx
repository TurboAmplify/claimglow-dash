import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Users } from "lucide-react";

type PersonType = "adjuster" | "salesperson" | "none";

interface AddPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personName: string;
  onComplete: (result: { type: PersonType; name: string; office?: string }) => void;
}

const OFFICE_OPTIONS = [
  { value: "Houston", label: "Houston" },
  { value: "Dallas", label: "Dallas" },
  { value: "Louisiana", label: "Louisiana" },
  { value: "Austin", label: "Austin" },
  { value: "San Antonio", label: "San Antonio" },
  { value: "Other", label: "Other" },
];

export function AddPersonDialog({
  open,
  onOpenChange,
  personName,
  onComplete,
}: AddPersonDialogProps) {
  const [selectedType, setSelectedType] = useState<PersonType | null>(null);
  const [office, setOffice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleAddAdjuster = async () => {
    if (!office) {
      toast({
        title: "Missing information",
        description: "Please select an office for the adjuster.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("adjusters").insert({
        name: personName,
        office: office,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Adjuster added",
        description: `${personName} has been added as an adjuster.`,
      });

      queryClient.invalidateQueries({ queryKey: ["adjusters"] });
      onComplete({ type: "adjuster", name: personName, office });
      resetAndClose();
    } catch (error) {
      console.error("Error adding adjuster:", error);
      toast({
        title: "Error",
        description: "Failed to add adjuster. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSalesperson = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("salespeople").insert({
        name: personName,
        is_active: true,
        role: "sales_rep",
      });

      if (error) throw error;

      toast({
        title: "Salesperson added",
        description: `${personName} has been added as a salesperson.`,
      });

      queryClient.invalidateQueries({ queryKey: ["salespeople"] });
      onComplete({ type: "salesperson", name: personName });
      resetAndClose();
    } catch (error) {
      console.error("Error adding salesperson:", error);
      toast({
        title: "Error",
        description: "Failed to add salesperson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJustUseName = () => {
    onComplete({ type: "none", name: personName });
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedType(null);
    setOffice("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Person</DialogTitle>
          <DialogDescription>
            "{personName}" is not in the system. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        {!selectedType ? (
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => setSelectedType("adjuster")}
            >
              <UserPlus className="mr-3 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Add as Adjuster</p>
                <p className="text-xs text-muted-foreground">
                  Add to the adjusters list for future use
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => setSelectedType("salesperson")}
            >
              <Users className="mr-3 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Add as Salesperson</p>
                <p className="text-xs text-muted-foreground">
                  Add to the salespeople list for tracking
                </p>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleJustUseName}
            >
              Just use this name
            </Button>
          </div>
        ) : selectedType === "adjuster" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={personName} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office">Office *</Label>
              <Select value={office} onValueChange={setOffice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  {OFFICE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSelectedType(null)}>
                Back
              </Button>
              <Button onClick={handleAddAdjuster} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Adjuster
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={personName} disabled className="bg-muted" />
            </div>
            <p className="text-sm text-muted-foreground">
              This person will be added as a sales representative.
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSelectedType(null)}>
                Back
              </Button>
              <Button onClick={handleAddSalesperson} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Salesperson
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
