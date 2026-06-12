/**
 * Supplier Model
 */
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  balance: number; // positive: debtor (بدهکار), negative: creditor (بستانکار)
  createdAt: string;
  updatedAt: string;
}
