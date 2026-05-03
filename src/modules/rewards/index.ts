export {
  listProgramsWithRewards,
  listRewards,
  createProgram,
  updateProgram,
  createReward,
  updateReward,
  enrollCustomer,
  listEnrollments,
  listActivePrograms,
  getProgramById,
  getRewardById,
} from './reward.service';
export { listRewardsByProgram } from './reward.repository';
export type {
  Reward,
  RewardProgram,
  ProgramType,
  ProgramStatus,
  ProgramConfig,
  CustomerProgramEnrollment,
} from '@/lib/types';
