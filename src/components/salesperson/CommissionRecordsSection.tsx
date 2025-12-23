import { SalesCommission } from "@/types/sales";
import { CommissionEstimator } from "./CommissionEstimator";

interface CommissionRecordsSectionProps {
  commissions: SalesCommission[];
  salespersonId: string;
}

export function CommissionRecordsSection({ commissions, salespersonId }: CommissionRecordsSectionProps) {
  return (
    <CommissionEstimator 
      commissions={commissions} 
      salespersonId={salespersonId} 
    />
  );
}
