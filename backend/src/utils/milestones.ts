/**
 * Reward milestone definitions.
 *
 * The user unlocks a milestone the moment their `successfulTrades` count
 * crosses the threshold. Each milestone can only ever be claimed once
 * (enforced by the unique (userId, milestone) index on RewardRequest).
 *
 * Source of truth: this file. Backend and frontend both derive from the
 * `/api/rewards/milestones` endpoint so we never duplicate the table.
 */

export interface Milestone {
  threshold: number;       // successful trades required to unlock
  popularityReward: number; // BGMI in-game popularity granted (delivered manually by admin)
}

export const MILESTONES: Milestone[] = [
  { threshold: 1,  popularityReward: 1000 },
  { threshold: 3,  popularityReward: 2000 },
  { threshold: 5,  popularityReward: 3000 },
  { threshold: 10, popularityReward: 4000 },
  { threshold: 15, popularityReward: 5000 },
  { threshold: 20, popularityReward: 6000 }
];

export function findMilestone(threshold: number): Milestone | undefined {
  return MILESTONES.find((m) => m.threshold === threshold);
}
