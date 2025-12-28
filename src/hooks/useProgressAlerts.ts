import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ProgressData {
  volumeProgress: number;
  dealsProgress: number;
  yearProgress: number;
  volumeVsExpected: number;
  dealsVsExpected: number;
}

const SESSION_STORAGE_KEY = "progress_alerts_shown";

export function useProgressAlerts(progressData: ProgressData | null, enabled: boolean = true) {
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (!enabled || !progressData || hasShownRef.current) return;

    // Check if we've already shown alerts this session
    const alreadyShown = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (alreadyShown) {
      hasShownRef.current = true;
      return;
    }

    const { volumeVsExpected, dealsVsExpected } = progressData;

    // Determine alert type based on variance
    const worstVariance = Math.min(volumeVsExpected, dealsVsExpected);

    if (worstVariance < -15) {
      // Critical: More than 15% behind
      toast.error("You're significantly behind pace", {
        description: `Volume is ${Math.abs(volumeVsExpected).toFixed(0)}% ${volumeVsExpected < 0 ? "behind" : "ahead"} and deals are ${Math.abs(dealsVsExpected).toFixed(0)}% ${dealsVsExpected < 0 ? "behind" : "ahead"}. Review your pipeline for quick wins.`,
        duration: 8000,
      });
    } else if (worstVariance < -5) {
      // Warning: 5-15% behind
      toast.warning("Slightly behind target", {
        description: `You're ${Math.abs(worstVariance).toFixed(0)}% behind pace. Consider focusing on closing pending deals.`,
        duration: 6000,
      });
    } else if (worstVariance > 15) {
      // Celebration: More than 15% ahead
      toast.success("Outstanding progress!", {
        description: `You're ${worstVariance.toFixed(0)}% ahead of pace. Keep up the great work!`,
        duration: 5000,
      });
    } else if (worstVariance > 5) {
      // Good: 5-15% ahead
      toast.success("On track!", {
        description: "You're ahead of pace. Great job!",
        duration: 4000,
      });
    }

    // Mark as shown for this session
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    hasShownRef.current = true;
  }, [progressData, enabled]);
}
