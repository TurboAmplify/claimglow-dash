import { useViewAs } from "@/contexts/ViewAsContext";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewAsSelector() {
  const { viewingAs, setViewingAs, teamMembers, isDirector, isViewingAsOther } = useViewAs();

  if (!isDirector) return null;

  // Filter out the current director from the list (they don't need to view as themselves)
  const otherMembers = teamMembers.filter(m => m.role !== "sales_director");

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Eye className="w-3 h-3" />
        View App As
      </p>
      
      {isViewingAsOther && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/20 border border-primary/30">
          <span className="text-xs text-primary font-medium flex-1">
            Viewing as {viewingAs?.name}
          </span>
          <button
            onClick={() => setViewingAs(null)}
            className="p-1 rounded hover:bg-primary/30 text-primary transition-colors"
            title="Return to your view"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {otherMembers.map((member) => (
          <button
            key={member.id}
            onClick={() => setViewingAs(viewingAs?.id === member.id ? null : member)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md transition-all duration-200",
              viewingAs?.id === member.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {member.name.split(" ")[0]}
          </button>
        ))}
      </div>
      
      {otherMembers.length === 0 && (
        <p className="text-xs text-muted-foreground/70 italic">No team members available</p>
      )}
    </div>
  );
}
