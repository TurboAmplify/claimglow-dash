import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useAggregatedAdjusterRatings } from "@/hooks/useAdjusterRatings";
import { useAdjusters } from "@/hooks/useAdjusters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AdjusterRatingsView() {
  const { data: ratingData, isLoading: ratingsLoading } = useAggregatedAdjusterRatings();
  const { data: adjusters, isLoading: adjustersLoading } = useAdjusters();

  if (ratingsLoading || adjustersLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Adjuster Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-500";
    if (rating >= 5) return "text-amber-500";
    return "text-red-500";
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 8) return "bg-green-500/10";
    if (rating >= 5) return "bg-amber-500/10";
    return "bg-red-500/10";
  };

  // Merge adjuster info with ratings
  const mergedData = adjusters?.map((adjuster) => {
    const ratingInfo = ratingData?.find((r) => r.adjuster === adjuster.name);
    return {
      ...adjuster,
      averageRating: ratingInfo?.averageRating || null,
      ratingCount: ratingInfo?.ratingCount || 0,
    };
  }) || [];

  // Sort: rated adjusters by rating (desc), then unrated adjusters
  const sortedData = [...mergedData].sort((a, b) => {
    if (a.averageRating !== null && b.averageRating !== null) {
      return b.averageRating - a.averageRating;
    }
    if (a.averageRating !== null) return -1;
    if (b.averageRating !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  const ratedCount = sortedData.filter((a) => a.averageRating !== null).length;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-yellow-500" />
          Adjuster Ratings
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          {ratedCount}/{sortedData.length} rated
        </Badge>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No adjusters found.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedData.map((adjuster, index) => (
              <div
                key={adjuster.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-colors",
                  adjuster.averageRating !== null ? getRatingBg(adjuster.averageRating) : "bg-secondary/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/50 text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{adjuster.name}</p>
                    <p className="text-xs text-muted-foreground">{adjuster.office}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {adjuster.averageRating !== null ? (
                    <>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < Math.round(adjuster.averageRating! / 2)
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      <div className="text-right">
                        <span className={cn("font-bold text-lg", getRatingColor(adjuster.averageRating))}>
                          {adjuster.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">/10</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {adjuster.ratingCount} {adjuster.ratingCount === 1 ? "review" : "reviews"}
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs text-muted-foreground">
                      No ratings yet
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
