/**
 * Customer Model
 */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // positive: debtor (بدهکار), negative: creditor (بستانکار), zero: settled
  createdAt: string;
  updatedAt: string;
}
