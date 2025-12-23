import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { EditAdjusterDialog } from "@/components/dashboard/EditAdjusterDialog";
import { AdjusterCard } from "@/components/dashboard/AdjusterCard";
import { useAdjusters, Adjuster } from "@/hooks/useAdjusters";
import { useClaims, useAdjusterSummaries } from "@/hooks/useClaims";
import { AdjusterSummary } from "@/types/claims";
import { Loader2, Edit2, User, Building2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MergedAdjuster {
  adjuster: Adjuster;
  summary: AdjusterSummary | null;
}

export default function AdjustersPage() {
  const [selectedAdjusters, setSelectedAdjusters] = useState<string[]>([]);
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAdjuster, setEditingAdjuster] = useState<Adjuster | null>(null);

  const { data: adjusters, isLoading: adjustersLoading, error: adjustersError } = useAdjusters();
  const { data: claims, isLoading: claimsLoading } = useClaims();
  const adjusterSummaries = useAdjusterSummaries(claims);

  const isLoading = adjustersLoading || claimsLoading;

  // Merge adjusters table with claims summaries
  const mergedAdjusters = useMemo((): MergedAdjuster[] => {
    if (!adjusters) return [];

    return adjusters.map((adjuster) => {
      // Find matching summary by name (case-insensitive, trim whitespace)
      const summary = adjusterSummaries.find(
        (s) => s.adjuster.toLowerCase().trim() === adjuster.name.toLowerCase().trim()
      ) || null;

      return { adjuster, summary };
    });
  }, [adjusters, adjusterSummaries]);

  const offices = useMemo(() => {
    if (!adjusters) return [];
    return [...new Set(adjusters.map((a) => a.office).filter(Boolean))];
  }, [adjusters]);

  const adjusterNames = useMemo(() => {
    if (!adjusters) return [];
    return adjusters.map((a) => a.name);
  }, [adjusters]);

  const filteredAdjusters = useMemo(() => {
    let filtered = mergedAdjusters;

    if (selectedOffices.length > 0) {
      filtered = filtered.filter((m) => selectedOffices.includes(m.adjuster.office));
    }

    if (selectedAdjusters.length > 0) {
      filtered = filtered.filter((m) => selectedAdjusters.includes(m.adjuster.name));
    }

    // Sort by total claims descending, those without claims go to end
    return filtered.sort((a, b) => {
      const aTotal = a.summary?.totalClaims ?? -1;
      const bTotal = b.summary?.totalClaims ?? -1;
      return bTotal - aTotal;
    });
  }, [mergedAdjusters, selectedOffices, selectedAdjusters]);

  const handleEditAdjuster = (adjuster: Adjuster) => {
    setEditingAdjuster(adjuster);
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

  if (adjustersError) {
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
          All adjusters and their performance metrics
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MultiSelectFilter
            label="Filter by Adjuster"
            options={adjusterNames}
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
        {filteredAdjusters.map((merged, index) => (
          merged.summary ? (
            <AdjusterCardWithEdit
              key={merged.adjuster.id}
              summary={merged.summary}
              adjuster={merged.adjuster}
              delay={index * 50}
              onEdit={() => handleEditAdjuster(merged.adjuster)}
            />
          ) : (
            <AdjusterSimpleCard
              key={merged.adjuster.id}
              adjuster={merged.adjuster}
              delay={index * 50}
              onEdit={() => handleEditAdjuster(merged.adjuster)}
            />
          )
        ))}
      </div>

      {filteredAdjusters.length === 0 && (
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

// Wrapper for AdjusterCard with edit button overlay
interface AdjusterCardWithEditProps {
  summary: AdjusterSummary;
  adjuster: Adjuster;
  delay?: number;
  onEdit: () => void;
}

function AdjusterCardWithEdit({ summary, adjuster, delay = 0, onEdit }: AdjusterCardWithEditProps) {
  return (
    <div className="relative group">
      <AdjusterCard summary={summary} delay={delay} />
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="absolute top-4 right-4 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 hover:bg-secondary z-10"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Simple card for adjusters without claims data
interface AdjusterSimpleCardProps {
  adjuster: Adjuster;
  delay?: number;
  onEdit: () => void;
}

function AdjusterSimpleCard({ adjuster, delay = 0, onEdit }: AdjusterSimpleCardProps) {
  const isHouston = adjuster.office?.toLowerCase() === "houston";
  const isDallas = adjuster.office?.toLowerCase() === "dallas";

  const getOfficeStyles = () => {
    if (isHouston) {
      return {
        cardBg: "bg-blue-950/40",
        borderColor: "border-l-blue-500",
        officeBadge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-400",
      };
    }
    if (isDallas) {
      return {
        cardBg: "bg-cyan-950/30",
        borderColor: "border-l-cyan-400",
        officeBadge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        iconBg: "bg-cyan-500/20",
        iconColor: "text-cyan-400",
      };
    }
    return {
      cardBg: "bg-secondary/30",
      borderColor: "border-l-muted-foreground",
      officeBadge: "bg-muted/20 text-muted-foreground border-muted/30",
      iconBg: "bg-muted/20",
      iconColor: "text-muted-foreground",
    };
  };

  const styles = getOfficeStyles();

  return (
    <div
      className={cn(
        "glass-card p-5 transition-all duration-300 animate-fade-in border-l-4 relative group",
        styles.cardBg,
        styles.borderColor
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="absolute top-4 right-4 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 hover:bg-secondary"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-3">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", styles.iconBg)}>
          <User className={cn("w-6 h-6", styles.iconColor)} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{adjuster.name}</h3>
          <div className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1",
            styles.officeBadge
          )}>
            <Building2 className="w-3 h-3" />
            <span>{adjuster.office}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">No claims data</p>
        </div>
      </div>
    </div>
  );
}
