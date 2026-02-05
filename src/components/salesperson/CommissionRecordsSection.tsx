import { SalesCommission } from "@/types/sales";
import { CommissionEstimator } from "./CommissionEstimator";

interface CommissionRecordsSectionProps {
  commissions: SalesCommission[];
  salespersonId: string;
  highlightDealId?: string;
}

export function CommissionRecordsSection({ commissions, salespersonId, highlightDealId }: CommissionRecordsSectionProps) {
  return (
    <CommissionEstimator 
      commissions={commissions} 
      salespersonId={salespersonId}
      highlightDealId={highlightDealId}
    />
  );
}
