import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { BranchCode, CompanyDrive, StudentProfile } from '../types/placement';
import { EligibilityCandidateInput, evaluateEligibility } from '../utils/eligibility';
import { CompanyLogo } from './CompanyLogo';
import {
  EASE_OUT_EXPO,
  staggerContainerVariants,
  staggerItemVariants,
} from './MotionPrimitives';

interface EligibilityCheckerViewProps {
  profile: StudentProfile;
  drives: CompanyDrive[];
  appliedCompanyIds: Set<string>;
  onSelectCompany: (drive: CompanyDrive) => void;
  onApply: (drive: CompanyDrive) => Promise<void> | void;
}

const BRANCHES: BranchCode[] = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];

interface TestScenario {
  label: string;
  input: FormStringState;
}

interface FormStringState {
  branch: BranchCode;
  cgpa: string;
  activeBacklogs: string;
  tenthPercent: string;
  twelfthPercent: string;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    label: 'Borderline (IT · 7.35)',
    input: {
      branch: 'IT',
      cgpa: '7.35',
      activeBacklogs: '0',
      tenthPercent: '82',
      twelfthPercent: '80',
    },
  },
  {
    label: 'Core (ECE · 7.90, 1 Backlog)',
    input: {
      branch: 'ECE',
      cgpa: '7.90',
      activeBacklogs: '1',
      tenthPercent: '85',
      twelfthPercent: '81',
    },
  },
  {
    label: 'Honors (CSE · 9.15)',
    input: {
      branch: 'CSE',
      cgpa: '9.15',
      activeBacklogs: '0',
      tenthPercent: '95',
      twelfthPercent: '94',
    },
  },
];

function toStringState(profile: StudentProfile): FormStringState {
  return {
    branch: profile.branch,
    cgpa: profile.cgpa.toString(),
    activeBacklogs: profile.activeBacklogs.toString(),
    tenthPercent: profile.tenthPercent.toString(),
    twelfthPercent: profile.twelfthPercent.toString(),
  };
}

function parseCandidate(form: FormStringState): EligibilityCandidateInput {
  const cgpa = Math.min(10, Math.max(0, parseFloat(form.cgpa) || 0));
  const activeBacklogs = Math.max(0, parseInt(form.activeBacklogs, 10) || 0);
  const tenthPercent = Math.min(100, Math.max(0, parseFloat(form.tenthPercent) || 0));
  const twelfthPercent = Math.min(100, Math.max(0, parseFloat(form.twelfthPercent) || 0));
  return {
    branch: form.branch,
    cgpa,
    activeBacklogs,
    tenthPercent,
    twelfthPercent,
  };
}

export function EligibilityCheckerView({
  profile,
  drives,
  appliedCompanyIds,
  onSelectCompany,
  onApply,
}: EligibilityCheckerViewProps) {
  const [formInput, setFormInput] = useState<FormStringState>(() => toStringState(profile));
  const [targetCompanyId, setTargetCompanyId] = useState<string>('all');
  const [checking, setChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [evaluatedSnapshot, setEvaluatedSnapshot] = useState<EligibilityCandidateInput>(() =>
    parseCandidate(toStringState(profile))
  );
  const [evaluatedCompanyFilter, setEvaluatedCompanyFilter] = useState<string>('all');

  useEffect(() => {
    const next = toStringState(profile);
    setFormInput(next);
    setEvaluatedSnapshot(parseCandidate(next));
  }, [profile]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = parseCandidate(formInput);
    setFormInput({
      branch: normalized.branch,
      cgpa: normalized.cgpa.toString(),
      activeBacklogs: normalized.activeBacklogs.toString(),
      tenthPercent: normalized.tenthPercent.toString(),
      twelfthPercent: normalized.twelfthPercent.toString(),
    });
    setChecking(true);
    setHasChecked(false);

    setTimeout(() => {
      setEvaluatedSnapshot(normalized);
      setEvaluatedCompanyFilter(targetCompanyId);
      setChecking(false);
      setHasChecked(true);
    }, 620);
  };

  const handleLoadProfile = () => {
    const next = toStringState(profile);
    setFormInput(next);
    setEvaluatedSnapshot(parseCandidate(next));
    setTargetCompanyId('all');
    setEvaluatedCompanyFilter('all');
    setHasChecked(true);
  };

  const handleApplyScenario = (scenario: TestScenario) => {
    setFormInput(scenario.input);
    const normalized = parseCandidate(scenario.input);
    setChecking(true);
    setHasChecked(false);
    setTimeout(() => {
      setEvaluatedSnapshot(normalized);
      setEvaluatedCompanyFilter(targetCompanyId);
      setChecking(false);
      setHasChecked(true);
    }, 480);
  };

  const handleQuickApply = async (drive: CompanyDrive) => {
    if (appliedCompanyIds.has(drive.id) || applyingId) return;
    setApplyingId(drive.id);
    await onApply(drive);
    setApplyingId(null);
  };

  const drivesToEvaluate =
    evaluatedCompanyFilter === 'all'
      ? drives
      : drives.filter((d) => d.id === evaluatedCompanyFilter);

  const results = drivesToEvaluate.map((drive) => ({
    drive,
    evaluation: evaluateEligibility(evaluatedSnapshot, drive),
  }));

  const eligibleCount = results.filter((r) => r.evaluation.eligible).length;
  const ineligibleCount = results.length - eligibleCount;

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold text-[#0D5C63] tracking-tight">Criteria Audit</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
          Eligibility Checker
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Verify academic criteria against every recruiting drive or simulate &ldquo;what-if&rdquo;
          CGPA scenarios before deadlines close.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Panel */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[#F0ECE4]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EAF3F3] text-[#0D5C63] flex items-center justify-center">
                <ShieldCheck strokeWidth={1.75} className="w-4 h-4" />
              </div>
              <h2 className="font-display text-base font-semibold text-[#181A1F]">
                Academic Parameters
              </h2>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadProfile}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D5C63] hover:text-[#09454B]"
            >
              <RotateCcw strokeWidth={1.75} className="w-3 h-3" />
              <span>Sync Profile</span>
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="elig-branch" className="block text-xs font-medium text-slate-700 mb-1.5">
                Engineering Branch
              </label>
              <select
                id="elig-branch"
                value={formInput.branch}
                onChange={(e) =>
                  setFormInput((prev) => ({ ...prev, branch: e.target.value as BranchCode }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="elig-cgpa" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Current CGPA
                </label>
                <input
                  id="elig-cgpa"
                  type="number"
                  min={0}
                  max={10}
                  step={0.01}
                  required
                  value={formInput.cgpa}
                  onChange={(e) =>
                    setFormInput((prev) => ({ ...prev, cgpa: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="elig-backlogs"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Active Backlogs
                </label>
                <input
                  id="elig-backlogs"
                  type="number"
                  min={0}
                  max={15}
                  required
                  value={formInput.activeBacklogs}
                  onChange={(e) =>
                    setFormInput((prev) => ({ ...prev, activeBacklogs: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="elig-10" className="block text-xs font-medium text-slate-700 mb-1.5">
                  10th %
                </label>
                <input
                  id="elig-10"
                  type="number"
                  min={35}
                  max={100}
                  step={0.1}
                  required
                  value={formInput.tenthPercent}
                  onChange={(e) =>
                    setFormInput((prev) => ({ ...prev, tenthPercent: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label htmlFor="elig-12" className="block text-xs font-medium text-slate-700 mb-1.5">
                  12th %
                </label>
                <input
                  id="elig-12"
                  type="number"
                  min={35}
                  max={100}
                  step={0.1}
                  required
                  value={formInput.twelfthPercent}
                  onChange={(e) =>
                    setFormInput((prev) => ({ ...prev, twelfthPercent: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="elig-target" className="block text-xs font-medium text-slate-700 mb-1.5">
                Target Company
              </label>
              <select
                id="elig-target"
                value={targetCompanyId}
                onChange={(e) => setTargetCompanyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              >
                <option value="all">All Campus Drives ({drives.length})</option>
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.companyName} — {d.roleTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            disabled={checking}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold hover:bg-[#09454B] transition-colors disabled:opacity-75"
          >
            {checking ? (
              <>
                <Loader2 strokeWidth={1.75} className="w-4 h-4 animate-spin" />
                <span>Verifying Criteria...</span>
              </>
            ) : (
              <>
                <ShieldCheck strokeWidth={1.75} className="w-4 h-4" />
                <span>Check Eligibility</span>
              </>
            )}
          </motion.button>

          {/* Quick Test Scenarios for Live Testing */}
          <div className="pt-3 border-t border-[#F0ECE4] space-y-2">
            <p className="text-[11px] font-medium text-slate-500">
              Quick Test Scenarios
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEST_SCENARIOS.map((scenario) => (
                <motion.button
                  key={scenario.label}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  disabled={checking}
                  onClick={() => handleApplyScenario(scenario)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] text-[11px] font-medium text-slate-700 hover:border-[#0D5C63]/40 hover:text-[#0D5C63] transition-colors"
                >
                  {scenario.label}
                </motion.button>
              ))}
            </div>
          </div>
        </form>

        {/* Results Panel */}
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
            {checking ? (
              <motion.div
                key="checking-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-[#E8E3DA] rounded-2xl p-12 text-center space-y-4"
              >
                <Loader2 strokeWidth={1.75} className="w-8 h-8 text-[#0D5C63] animate-spin mx-auto" />
                <div className="space-y-1">
                  <p className="font-display text-base font-semibold text-[#181A1F]">
                    Auditing company eligibility cutoffs...
                  </p>
                  <p className="text-xs text-slate-500">
                    Comparing {formInput.branch} · {(parseFloat(formInput.cgpa) || 0).toFixed(2)} CGPA ·{' '}
                    {parseInt(formInput.activeBacklogs, 10) || 0} backlogs across drives
                  </p>
                </div>
                <div className="max-w-xs mx-auto h-1.5 rounded-full bg-[#F3EFE8] overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.58, ease: EASE_OUT_EXPO }}
                    style={{ transformOrigin: 'left' }}
                    className="h-full w-full rounded-full bg-[#0D5C63]"
                  />
                </div>
              </motion.div>
            ) : (
              hasChecked && (
                <motion.div
                  key={`results-${evaluatedSnapshot.branch}-${evaluatedSnapshot.cgpa}-${evaluatedSnapshot.activeBacklogs}-${evaluatedCompanyFilter}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                  className="space-y-4"
                >
                  {/* Result Summary Bar */}
                  <div className="bg-white border border-[#E8E3DA] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Audit Snapshot · {evaluatedSnapshot.branch} ·{' '}
                        <span className="font-mono tabular-nums">
                          {evaluatedSnapshot.cgpa.toFixed(2)} CGPA
                        </span>{' '}
                        · {evaluatedSnapshot.activeBacklogs} backlogs
                      </p>
                      <p className="font-display text-lg font-bold text-[#181A1F] mt-0.5 tabular-nums">
                        {eligibleCount} Eligible · {ineligibleCount} Ineligible
                      </p>
                    </div>

                    <div className="flex items-center gap-5 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D5C63]">
                        <CheckCircle2 strokeWidth={1.75} className="w-4 h-4" />
                        <span className="tabular-nums">{eligibleCount} Qualified</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#C96D3B]">
                        <XCircle strokeWidth={1.75} className="w-4 h-4" />
                        <span className="tabular-nums">{ineligibleCount} Unqualified</span>
                      </span>
                    </div>
                  </div>

                  {/* Individual Company Result Cards */}
                  <motion.div
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3.5"
                  >
                    {results.map(({ drive, evaluation }) => {
                      const alreadyApplied = appliedCompanyIds.has(drive.id);
                      const isSubmitting = applyingId === drive.id;

                      return (
                        <motion.div
                          key={drive.id}
                          variants={staggerItemVariants}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.18 }}
                          className={`bg-white border rounded-2xl p-5 transition-colors ${
                            evaluation.eligible
                              ? 'border-[#0D5C63]/25'
                              : 'border-[#E8E3DA]'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5 min-w-0">
                              <CompanyLogo
                                companyName={drive.companyName}
                                accentHex={drive.accentHex}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-display text-base font-semibold text-[#181A1F] truncate">
                                    {drive.companyName}
                                  </h3>
                                  <span className="text-xs text-slate-400">·</span>
                                  <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                                    {drive.ctcDisplay}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{drive.roleTitle}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {evaluation.eligible ? (
                                <motion.div
                                  initial={{ scale: 0.85, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D5C63]"
                                >
                                  <CheckCircle2 strokeWidth={1.75} className="w-4 h-4" />
                                  <span>Eligible</span>
                                </motion.div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C96D3B]">
                                  <XCircle strokeWidth={1.75} className="w-4 h-4" />
                                  <span>Not Eligible</span>
                                </div>
                              )}

                              {evaluation.eligible &&
                                (alreadyApplied ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF3F3] border border-[#0D5C63]/20 text-xs font-semibold text-[#0D5C63]">
                                    <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                                    <span>Applied</span>
                                  </span>
                                ) : (
                                  <motion.button
                                    type="button"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.96 }}
                                    disabled={isSubmitting}
                                    onClick={() => handleQuickApply(drive)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] transition-colors disabled:opacity-75"
                                  >
                                    {isSubmitting ? (
                                      <>
                                        <Loader2 strokeWidth={1.75} className="w-3 h-3 animate-spin" />
                                        <span>Applying...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>Quick Apply</span>
                                        <ArrowRight strokeWidth={1.75} className="w-3 h-3" />
                                      </>
                                    )}
                                  </motion.button>
                                ))}

                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.96 }}
                                onClick={() => onSelectCompany(drive)}
                                className="px-3 py-1.5 rounded-xl border border-[#E8E3DA] text-xs font-medium text-[#181A1F] hover:bg-[#FAF8F5] transition-colors"
                              >
                                Details
                              </motion.button>
                            </div>
                          </div>

                          {/* Criterion-by-criterion mini row */}
                          <div className="mt-4 pt-3.5 border-t border-[#F0ECE4] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {evaluation.checks.map((check) => (
                              <div key={check.label}>
                                <span className="text-slate-400 block">{check.label}</span>
                                <span
                                  className={`font-mono font-medium mt-0.5 block tabular-nums ${
                                    check.passed ? 'text-[#181A1F]' : 'text-[#C96D3B]'
                                  }`}
                                >
                                  {check.actual}{' '}
                                  <span className="text-slate-400 font-sans">
                                    (req {check.required})
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
