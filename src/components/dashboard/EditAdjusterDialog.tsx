import { useState, useEffect, forwardRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useToast } from "@/hooks/use-toast";
import { useUpdateAdjuster, useDeleteAdjuster, Adjuster } from "@/hooks/useAdjusters";
import { Loader2, Trash2 } from "lucide-react";

interface EditAdjusterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjuster: Adjuster | null;
  offices: string[];
}

export const EditAdjusterDialog = forwardRef<HTMLDivElement, EditAdjusterDialogProps>(
  function EditAdjusterDialog({ open, onOpenChange, adjuster, offices }, ref) {
    const [name, setName] = useState("");
    const [office, setOffice] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { toast } = useToast();
    const updateMutation = useUpdateAdjuster();
    const deleteMutation = useDeleteAdjuster();

    useEffect(() => {
      if (adjuster) {
        setName(adjuster.name);
        setOffice(adjuster.office);
      }
    }, [adjuster]);

    const handleSave = () => {
      if (!name.trim() || !office || !adjuster) {
        toast({
          title: "Validation error",
          description: "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }

      updateMutation.mutate(
        { id: adjuster.id, name, office, oldName: adjuster.name },
        {
          onSuccess: () => {
            toast({
              title: "Adjuster updated",
              description: "The adjuster information has been saved and synced to commission records.",
            });
            onOpenChange(false);
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: "Failed to update adjuster. Please try again.",
              variant: "destructive",
            });
            console.error("Update error:", error);
          },
        }
      );
    };

    const handleDelete = () => {
      if (!adjuster) return;

      deleteMutation.mutate(adjuster.id, {
        onSuccess: () => {
          toast({
            title: "Adjuster deleted",
            description: `${adjuster.name} has been removed.`,
          });
          setShowDeleteConfirm(false);
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to delete adjuster. Please try again.",
            variant: "destructive",
          });
          console.error("Delete error:", error);
        },
      });
    };

    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent ref={ref} className="bg-background border-glass-border/30 rounded-xl">
            <DialogHeader>
              <DialogTitle>Edit Adjuster</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary/50 border-glass-border/30 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office">Office</Label>
                <Select value={office} onValueChange={setOffice}>
                  <SelectTrigger className="bg-secondary/50 border-glass-border/30 rounded-xl">
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-glass-border/30 rounded-xl">
                    {offices.map((o) => (
                      <SelectItem key={o} value={o} className="rounded-lg">
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteMutation.isPending}
                className="rounded-xl sm:mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="rounded-xl"
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-background border-glass-border/30 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Adjuster?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{adjuster?.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);
