import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdjusterCard } from "@/components/dashboard/AdjusterCard";
import { ClaimsTable } from "@/components/dashboard/ClaimsTable";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { EditAdjusterDialog } from "@/components/dashboard/EditAdjusterDialog";
import { useClaims, useAdjusterSummaries } from "@/hooks/useClaims";
import { Loader2, X, Edit2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

export default function AdjustersPage() {
  const [selectedAdjusters, setSelectedAdjusters] = useState<string[]>([]);
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAdjuster, setEditingAdjuster] = useState<{ name: string; office: string } | null>(null);
  
  const { data: claims, isLoading, error } = useClaims();
  const adjusterSummaries = useAdjusterSummaries(claims);

  const offices = useMemo(() => {
    return [...new Set(adjusterSummaries.map((a) => a.office).filter(Boolean))] as string[];
  }, [adjusterSummaries]);

  const adjusters = useMemo(() => {
    return adjusterSummaries.map((a) => a.adjuster);
  }, [adjusterSummaries]);

  const filteredSummaries = useMemo(() => {
    let filtered = adjusterSummaries;
    
    if (selectedOffices.length > 0) {
      filtered = filtered.filter((a) => a.office && selectedOffices.includes(a.office));
    }
    
    if (selectedAdjusters.length > 0) {
      filtered = filtered.filter((a) => selectedAdjusters.includes(a.adjuster));
    }
    
    return filtered;
  }, [adjusterSummaries, selectedOffices, selectedAdjusters]);

  const handleEditAdjuster = (adjuster: string, office: string) => {
    setEditingAdjuster({ name: adjuster, office });
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading adjusters...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 text-center">
            <p className="text-destructive">Error loading data</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          View by Adjuster
        </h1>
        <p className="text-muted-foreground">
          Individual adjuster performance and claims
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MultiSelectFilter
            label="Filter by Adjuster"
            options={adjusters}
            selected={selectedAdjusters}
            onChange={setSelectedAdjusters}
            placeholder="Select adjusters..."
          />
          <MultiSelectFilter
            label="Filter by Office"
            options={offices}
            selected={selectedOffices}
            onChange={setSelectedOffices}
            placeholder="Select offices..."
          />
        </div>
      </div>

      {/* Adjuster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSummaries.map((summary, index) => (
          <div key={summary.adjuster} className="relative group">
            <AdjusterCard
              summary={summary}
              delay={index * 50}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditAdjuster(summary.adjuster, summary.office || "")}
              className="absolute top-4 right-4 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 hover:bg-secondary"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {filteredSummaries.length === 0 && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">No adjusters found matching filters.</p>
        </div>
      )}

      <EditAdjusterDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        adjuster={editingAdjuster}
        offices={offices}
      />
    </DashboardLayout>
  );
}
