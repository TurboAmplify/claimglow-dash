export interface SalesCommission {
  id: string;
  salesperson_id: string;
  client_name: string;
  adjuster: string | null;
  office: string | null;
  date_signed: string | null;
  year: number | null;
  initial_estimate: number;
  revised_estimate: number;
  percent_change: number;
  insurance_checks_ytd: number;
  old_remainder: number;
  new_remainder: number;
  split_percentage: number;
  fee_percentage: number;
  commission_percentage: number;
  commissions_paid: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Salesperson {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  role: 'sales_director' | 'sales_rep' | string;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesGoal {
  id: string;
  salesperson_id: string;
  year: number;
  target_revenue: number;
  target_deals: number;
  goal_type: 'individual' | 'team_contribution' | 'team_aggregate';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalScenario {
  id: string;
  salesperson_id: string;
  year: number;
  scenario_name: string;
  quarters: {
    q1: { large: number; medium: number; small: number };
    q2: { large: number; medium: number; small: number };
    q3: { large: number; medium: number; small: number };
    q4: { large: number; medium: number; small: number };
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionRow {
  clientName: string;
  adjuster: string;
  office: string;
  percentDifference: number;
  dateSigned: string | null;
  initialEstimate: number;
  revisedEstimate: number;
  insuranceChecks: number;
  oldRemainder: number;
  newRemainder: number;
  splitPercentage: number;
  feePercentage: number;
  commissionPercentage: number;
  commissionsPaid: number;
  year: number;
}

export interface YearSummary {
  year: number;
  totalDeals: number;
  totalInitialEstimate: number;
  totalRevisedEstimate: number;
  avgSplitPercentage: number;
  avgFeePercentage: number;
  avgCommissionPercentage: number;
  totalCommissionsPaid: number;
  projectedCommission: number;
  actualCommission: number;
}
