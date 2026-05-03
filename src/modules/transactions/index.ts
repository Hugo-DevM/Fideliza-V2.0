export {
  processTransaction,
  redeemReward,
  markRedemptionUsed,
  getCustomerTransactionHistory,
} from './transaction.service';
export type {
  Transaction,
  TransactionType,
  CustomerProgramEnrollment,
  CustomerRewardRedemption,
  RedemptionStatus,
} from '@/lib/types';
