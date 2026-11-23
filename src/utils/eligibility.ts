import { BranchCode, CompanyDrive, CriterionCheck, EligibilityResult } from '../types/placement';

export interface EligibilityCandidateInput {
  branch: BranchCode;
  cgpa: number;
  activeBacklogs: number;
  tenthPercent: number;
  twelfthPercent: number;
}

export function evaluateEligibility(
  candidate: EligibilityCandidateInput,
  drive: CompanyDrive
): EligibilityResult {
  const branchPassed = drive.eligibleBranches.includes(candidate.branch);
  const cgpaPassed = candidate.cgpa >= drive.minCgpa;
  const backlogsPassed = candidate.activeBacklogs <= drive.maxBacklogs;
  const tenthPassed = candidate.tenthPercent >= drive.minTenthPercent;
  const twelfthPassed = candidate.twelfthPercent >= drive.minTwelfthPercent;

  const checks: CriterionCheck[] = [
    {
      label: 'CGPA Cutoff',
      required: `>= ${drive.minCgpa.toFixed(2)}`,
      actual: candidate.cgpa.toFixed(2),
      passed: cgpaPassed,
    },
    {
      label: 'Eligible Branch',
      required: drive.eligibleBranches.join(', '),
      actual: candidate.branch,
      passed: branchPassed,
    },
    {
      label: 'Active Backlogs',
      required: drive.maxBacklogs === 0 ? '0 allowed' : `<= ${drive.maxBacklogs}`,
      actual: `${candidate.activeBacklogs}`,
      passed: backlogsPassed,
    },
    {
      label: '10th & 12th Academics',
      required: `${drive.minTenthPercent}% / ${drive.minTwelfthPercent}%`,
      actual: `${candidate.tenthPercent}% / ${candidate.twelfthPercent}%`,
      passed: tenthPassed && twelfthPassed,
    },
  ];

  const failureReasons: string[] = [];
  if (!cgpaPassed) {
    failureReasons.push(`CGPA ${candidate.cgpa.toFixed(2)} is below ${drive.minCgpa.toFixed(2)} cutoff`);
  }
  if (!branchPassed) {
    failureReasons.push(`Branch ${candidate.branch} is outside [${drive.eligibleBranches.join(', ')}]`);
  }
  if (!backlogsPassed) {
    failureReasons.push(`Active backlogs (${candidate.activeBacklogs}) exceed max allowed (${drive.maxBacklogs})`);
  }
  if (!tenthPassed) {
    failureReasons.push(`10th percentage (${candidate.tenthPercent}%) below ${drive.minTenthPercent}%`);
  }
  if (!twelfthPassed) {
    failureReasons.push(`12th percentage (${candidate.twelfthPercent}%) below ${drive.minTwelfthPercent}%`);
  }

  return {
    eligible: checks.every((c) => c.passed),
    checks,
    failureReasons,
  };
}

// Reference date matching current campus placement season
const REFERENCE_TODAY = new Date('2026-11-23T00:00:00');

export function getDaysRemaining(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const diffMs = target.getTime() - REFERENCE_TODAY.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
