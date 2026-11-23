import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeftRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  Scale,
  XCircle,
} from 'lucide-react';
import { CompanyDrive, StudentProfile } from '../types/placement';
import { evaluateEligibility, formatDisplayDate, getDaysRemaining } from '../utils/eligibility';
import { CompanyLogo } from './CompanyLogo';
import { AnimatedProgressBar, EASE_OUT_EXPO } from './MotionPrimitives';

interface CompanyComparisonViewProps {
  drives: CompanyDrive[];
  profile: StudentProfile;
  appliedCompanyIds: Set<string>;
  onSelectCompany: (drive: CompanyDrive) => void;
  onApply: (drive: CompanyDrive) => Promise<void> | void;
}

const PRESET_PAIRS: Array<{ label: string; aId: string; bId: string }> = [
  { label: 'Google vs Microsoft', aId: 'google-swe', bId: 'microsoft-swe' },
  { label: 'TCS vs Infosys', aId: 'tcs-prime', bId: 'infosys-sp' },
  { label: 'Amazon vs Accenture', aId: 'amazon-sde', bId: 'accenture-ase' },
];

export function CompanyComparisonView({
  drives,
  profile,
  appliedCompanyIds,
  onSelectCompany,
  onApply,
}: CompanyComparisonViewProps) {
  const [companyAId, setCompanyAId] = useState<string>(drives[0]?.id ?? '');
  const [companyBId, setCompanyBId] = useState<string>(drives[1]?.id ?? drives[0]?.id ?? '');

  const companyA = useMemo(
    () => drives.find((d) => d.id === companyAId) ?? drives[0],
    [drives, companyAId]
  );
  const companyB = useMemo(
    () => drives.find((d) => d.id === companyBId) ?? drives[1] ?? drives[0],
    [drives, companyBId]
  );

  const eligA = useMemo(() => evaluateEligibility(profile, companyA), [profile, companyA]);
  const eligB = useMemo(() => evaluateEligibility(profile, companyB), [profile, companyB]);

  const studentSkillSet = useMemo(
    () => new Set(profile.skills.map((s) => s.toLowerCase())),
    [profile.skills]
  );

  const maxCtc = Math.max(companyA.ctcNumericLpa, companyB.ctcNumericLpa, 1);

  const handleSwap = () => {
    setCompanyAId(companyB.id);
    setCompanyBId(companyA.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0D5C63] tracking-tight">
            Side-by-Side Evaluation
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
            Company Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare any two campus placement drives across eligibility, required skills, hiring
            rounds, deadlines, and compensation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_PAIRS.map((pair) => (
            <button
              key={pair.label}
              type="button"
              onClick={() => {
                setCompanyAId(pair.aId);
                setCompanyBId(pair.bId);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#E8E3DA] bg-white text-xs font-medium text-slate-700 hover:border-[#0D5C63]/40 hover:text-[#0D5C63] transition-colors"
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Company Selector Bar */}
      <div className="bg-white border border-[#E8E3DA] rounded-2xl p-5 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        <div className="md:col-span-5">
          <label
            htmlFor="compare-company-a"
            className="block text-[11px] font-semibold text-slate-500 mb-1.5"
          >
            Company A
          </label>
          <select
            id="compare-company-a"
            value={companyA.id}
            onChange={(e) => setCompanyAId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm font-semibold text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
          >
            {drives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.companyName} — {d.roleTitle} ({d.ctcDisplay})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 flex justify-center pt-3 md:pt-5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92, rotate: 180 }}
            onClick={handleSwap}
            aria-label="Swap compared companies"
            className="w-10 h-10 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-[#0D5C63] flex items-center justify-center hover:bg-[#EAF3F3] transition-colors"
          >
            <ArrowLeftRight strokeWidth={1.75} className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="md:col-span-5">
          <label
            htmlFor="compare-company-b"
            className="block text-[11px] font-semibold text-slate-500 mb-1.5"
          >
            Company B
          </label>
          <select
            id="compare-company-b"
            value={companyB.id}
            onChange={(e) => setCompanyBId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm font-semibold text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
          >
            {drives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.companyName} — {d.roleTitle} ({d.ctcDisplay})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Visual Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { drive: companyA, elig: eligA, label: 'Selection A' },
          { drive: companyB, elig: eligB, label: 'Selection B' },
        ].map(({ drive, elig, label }) => {
          const applied = appliedCompanyIds.has(drive.id);
          return (
            <motion.div
              key={`${label}-${drive.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
              className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <CompanyLogo
                    companyName={drive.companyName}
                    accentHex={drive.accentHex}
                    size="md"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono text-slate-400">{label}</span>
                    <h2 className="font-display text-lg font-bold text-[#181A1F] truncate">
                      {drive.companyName}
                    </h2>
                    <p className="text-xs text-slate-500 truncate">{drive.roleTitle}</p>
                  </div>
                </div>

                {elig.eligible ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAF3F3] text-[#0D5C63] text-xs font-semibold shrink-0">
                    <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span>Eligible</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FCF3EC] text-[#C96D3B] text-xs font-semibold shrink-0">
                    <XCircle strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span>Ineligible</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#F0ECE4]">
                <button
                  type="button"
                  onClick={() => onSelectCompany(drive)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D5C63] hover:underline"
                >
                  <span>Full Drive Details</span>
                  <ExternalLink strokeWidth={1.75} className="w-3.5 h-3.5" />
                </button>

                {applied ? (
                  <span className="text-xs font-semibold text-[#0D5C63]">Applied</span>
                ) : (
                  <button
                    type="button"
                    disabled={!elig.eligible}
                    onClick={() => void onApply(drive)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      elig.eligible
                        ? 'bg-[#0D5C63] text-white hover:bg-[#09454B]'
                        : 'bg-[#F3EFE8] text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Structured Comparison Table */}
      <div className="bg-white border border-[#E8E3DA] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0ECE4] flex items-center gap-2">
          <Scale strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63]" />
          <h3 className="font-display text-base font-semibold text-[#181A1F]">
            Attribute Comparison Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-6 w-48">Criterion</th>
                <th className="py-3.5 px-6 text-[#181A1F]">{companyA.companyName}</th>
                <th className="py-3.5 px-6 text-[#181A1F]">{companyB.companyName}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4] text-xs">
              {/* Role */}
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-500 align-top">Role &amp; Type</td>
                {[companyA, companyB].map((d, idx) => (
                  <td key={`role-${idx}-${d.id}`} className="py-4 px-6 align-top space-y-1">
                    <p className="font-semibold text-[#181A1F] text-sm">{d.roleTitle}</p>
                    <p className="text-slate-500">
                      {d.roleCategory} · {d.driveType} · {d.location} ({d.openingsCount} seats)
                    </p>
                  </td>
                ))}
              </tr>

              {/* Package Placeholder */}
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-500 align-top">
                  Package Placeholder
                </td>
                {[companyA, companyB].map((d, idx) => {
                  const ratio = Math.round((d.ctcNumericLpa / maxCtc) * 100);
                  const baseEst = (d.ctcNumericLpa * 0.72).toFixed(1);
                  const bonusEst = (d.ctcNumericLpa * 0.28).toFixed(1);
                  return (
                    <td key={`pkg-${idx}-${d.id}`} className="py-4 px-6 align-top space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-base font-bold text-[#0D5C63] tabular-nums">
                          {d.ctcDisplay}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Est. Base ₹{baseEst}L + Variable/RSU ₹{bonusEst}L
                        </span>
                      </div>
                      <AnimatedProgressBar
                        percent={ratio}
                        trackClassName="h-2 bg-[#F3EFE8]"
                        barClassName="bg-[#0D5C63]"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Eligibility */}
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-500 align-top">
                  Your Eligibility
                </td>
                {[
                  { drive: companyA, elig: eligA },
                  { drive: companyB, elig: eligB },
                ].map(({ drive, elig }, idx) => (
                  <td key={`elig-${idx}-${drive.id}`} className="py-4 px-6 align-top space-y-2">
                    <div className="inline-flex items-center gap-1.5 font-semibold">
                      {elig.eligible ? (
                        <span className="text-[#0D5C63] inline-flex items-center gap-1">
                          <CheckCircle2 strokeWidth={1.75} className="w-4 h-4" />
                          Meets all criteria
                        </span>
                      ) : (
                        <span className="text-[#C96D3B] inline-flex items-center gap-1">
                          <XCircle strokeWidth={1.75} className="w-4 h-4" />
                          {elig.failureReasons[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 font-mono text-[11px] tabular-nums">
                      Min CGPA {drive.minCgpa.toFixed(1)} · Branches:{' '}
                      {drive.eligibleBranches.join(', ')} · Max Backlogs: {drive.maxBacklogs}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Required Skills */}
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-500 align-top">
                  Required Skills
                </td>
                {[companyA, companyB].map((d, idx) => (
                  <td key={`skills-${idx}-${d.id}`} className="py-4 px-6 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {d.requiredSkills.map((skill) => {
                        const matched = Array.from(studentSkillSet).some(
                          (owned) =>
                            skill.toLowerCase().includes(owned) ||
                            owned.includes(skill.toLowerCase())
                        );
                        return (
                          <span
                            key={skill}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                              matched
                                ? 'bg-[#EAF3F3] border-[#0D5C63]/25 text-[#0D5C63]'
                                : 'bg-[#FAF8F5] border-[#E8E3DA] text-slate-700'
                            }`}
                          >
                            {matched && <CheckCircle2 strokeWidth={1.75} className="w-3 h-3" />}
                            <span>{skill}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Recruitment Stages */}
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-500 align-top">
                  Recruitment Stages
                </td>
                {[companyA, companyB].map((d, idx) => (
                  <td key={`rounds-${idx}-${d.id}`} className="py-4 px-6 align-top space-y-2">
                    <div className="inline-flex items-center gap-1.5 font-semibold text-[#6D59A6]">
                      <Layers strokeWidth={1.75} className="w-3.5 h-3.5" />
                      <span>{d.rounds.length} Rounds</span>
                    </div>
                    <ol className="space-y-1.5 text-slate-600 list-decimal pl-4">
                      {d.rounds.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ol>
                  </td>
                ))}
              </tr>

              {/* Deadline */}
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-500 align-top">
                  Deadline &amp; Drive Date
                </td>
                {[companyA, companyB].map((d, idx) => {
                  const days = getDaysRemaining(d.deadline);
                  return (
                    <td key={`dl-${idx}-${d.id}`} className="py-4 px-6 align-top space-y-1">
                      <p
                        className={`font-semibold tabular-nums ${
                          days <= 3 ? 'text-[#C96D3B]' : 'text-[#181A1F]'
                        }`}
                      >
                        Apply by {formatDisplayDate(d.deadline)} ({days}d left)
                      </p>
                      <p className="text-slate-500">
                        Campus Drive: {formatDisplayDate(d.driveDate)}
                      </p>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
