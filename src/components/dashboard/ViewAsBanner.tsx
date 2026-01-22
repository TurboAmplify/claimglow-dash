import { useViewAs } from "@/contexts/ViewAsContext";
import { Eye, X } from "lucide-react";

export function ViewAsBanner() {
  const { viewingAs, clearViewAs, isViewingAsOther } = useViewAs();

  if (!isViewingAsOther) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-primary/90 text-primary-foreground py-1.5 px-4 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
      <Eye className="w-4 h-4" />
      <span>Viewing app as <strong>{viewingAs?.name}</strong></span>
      <button
        onClick={clearViewAs}
        className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors text-xs"
      >
        <X className="w-3 h-3" />
        Exit
      </button>
    </div>
  );
}
