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
