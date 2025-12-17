export interface Claim {
  id: string;
  name: string;
  adjuster: string;
  office: string | null;
  date_signed: string | null;
  estimate_of_loss: number;
  revised_estimate_of_loss: number;
  percent_change: number;
  dollar_difference: number;
  change_indicator: 'increase' | 'decrease' | 'no_change';
  created_at: string;
  updated_at: string;
}

export interface AdjusterSummary {
  adjuster: string;
  office: string | null;
  totalClaims: number;
  totalEstimate: number;
  totalRevised: number;
  avgPercentChange: number;
  totalDollarDifference: number;
  positiveClaims: number;
  negativeClaims: number;
  positiveDifference: number;
  negativeDifference: number;
  claims: Claim[];
}

export interface OfficeSummary {
  office: string;
  adjusters: string[];
  totalAdjusters: number;
  totalClaims: number;
  avgPercentChange: number;
  totalEstimate: number;
  totalRevised: number;
}

export interface DashboardStats {
  totalClaims: number;
  totalAdjusters: number;
  avgPercentChange: number;
  officeCount: number;
  totalEstimate: number;
  totalRevised: number;
}
