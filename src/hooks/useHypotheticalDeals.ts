import { useState, useCallback, useMemo } from "react";

export interface HypotheticalDeal {
  id: string;
  client_name: string;
  expected_value: number;
  expected_close_date: string;
  category: 'residential' | 'commercial' | 'industrial' | 'religious' | 'school';
  probability: number;
  notes?: string;
}

interface HypotheticalDealsState {
  deals: HypotheticalDeal[];
  isActive: boolean;
}

const STORAGE_KEY = 'hypothetical-deals-sandbox';

const getInitialState = (): HypotheticalDealsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore storage errors
  }
  return { deals: [], isActive: false };
};

export function useHypotheticalDeals() {
  const [state, setState] = useState<HypotheticalDealsState>(getInitialState);

  const persistState = useCallback((newState: HypotheticalDealsState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleSandbox = useCallback(() => {
    persistState({ ...state, isActive: !state.isActive });
  }, [state, persistState]);

  const addDeal = useCallback((deal: Omit<HypotheticalDeal, 'id'>) => {
    const newDeal: HypotheticalDeal = {
      ...deal,
      id: crypto.randomUUID(),
    };
    persistState({
      ...state,
      deals: [...state.deals, newDeal],
    });
    return newDeal;
  }, [state, persistState]);

  const updateDeal = useCallback((id: string, updates: Partial<HypotheticalDeal>) => {
    persistState({
      ...state,
      deals: state.deals.map(d => d.id === id ? { ...d, ...updates } : d),
    });
  }, [state, persistState]);

  const removeDeal = useCallback((id: string) => {
    persistState({
      ...state,
      deals: state.deals.filter(d => d.id !== id),
    });
  }, [state, persistState]);

  const clearAll = useCallback(() => {
    persistState({ deals: [], isActive: false });
  }, [persistState]);

  const aggregates = useMemo(() => {
    const totalValue = state.deals.reduce((sum, d) => sum + d.expected_value, 0);
    const weightedValue = state.deals.reduce((sum, d) => sum + (d.expected_value * d.probability / 100), 0);
    
    // By quarter
    const byQuarter: Record<string, { value: number; weighted: number; count: number }> = {
      Q1: { value: 0, weighted: 0, count: 0 },
      Q2: { value: 0, weighted: 0, count: 0 },
      Q3: { value: 0, weighted: 0, count: 0 },
      Q4: { value: 0, weighted: 0, count: 0 },
    };

    // By category
    const byCategory: Record<string, { value: number; weighted: number; count: number }> = {
      residential: { value: 0, weighted: 0, count: 0 },
      commercial: { value: 0, weighted: 0, count: 0 },
      industrial: { value: 0, weighted: 0, count: 0 },
      religious: { value: 0, weighted: 0, count: 0 },
      school: { value: 0, weighted: 0, count: 0 },
    };

    state.deals.forEach(deal => {
      const month = new Date(deal.expected_close_date).getMonth();
      const quarter = `Q${Math.floor(month / 3) + 1}`;
      const weighted = deal.expected_value * deal.probability / 100;

      if (byQuarter[quarter]) {
        byQuarter[quarter].value += deal.expected_value;
        byQuarter[quarter].weighted += weighted;
        byQuarter[quarter].count += 1;
      }

      if (byCategory[deal.category]) {
        byCategory[deal.category].value += deal.expected_value;
        byCategory[deal.category].weighted += weighted;
        byCategory[deal.category].count += 1;
      }
    });

    return {
      totalValue,
      weightedValue,
      dealCount: state.deals.length,
      byQuarter,
      byCategory,
    };
  }, [state.deals]);

  return {
    deals: state.deals,
    isActive: state.isActive,
    toggleSandbox,
    addDeal,
    updateDeal,
    removeDeal,
    clearAll,
    aggregates,
  };
}
