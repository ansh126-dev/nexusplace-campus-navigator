import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Loader2,
  ArrowRight,
  Users,
  Sparkles,
} from 'lucide-react';
import { CompanyDrive, StudentProfile } from '../types/placement';
import { evaluateEligibility, formatDisplayDate, getDaysRemaining } from '../utils/eligibility';
import { CompanyLogo } from './CompanyLogo';
import {
  SPRING_DRAWER,
  staggerContainerVariants,
  staggerItemVariants,
} from './MotionPrimitives';

interface CompanyDetailDrawerProps {
  drive: CompanyDrive | null;
  profile: StudentProfile;
  isApplied: boolean;
  isBookmarked: boolean;
  onClose: () => void;
  onApply: (drive: CompanyDrive) => Promise<void> | void;
  onToggleBookmark: (companyId: string) => void;
  onGoToTracker: () => void;
  onAskAi?: (drive: CompanyDrive) => void;
}

export function CompanyDetailDrawer({
  drive,
  profile,
  isApplied,
  isBookmarked,
  onClose,
  onApply,
  onToggleBookmark,
  onGoToTracker,
  onAskAi,
}: CompanyDetailDrawerProps) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSubmitting(false);
  }, [drive?.id]);

  useEffect(() => {
    if (!drive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drive, onClose]);

  const handleApplyClick = async () => {
    if (!drive || isApplied || submitting) return;
    setSubmitting(true);
    await onApply(drive);
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {drive && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#181A1F]/25 backdrop-blur-[2px]"
          />

          <motion.aside
            key="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING_DRAWER}
            aria-label={`${drive.companyName} drive details`}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white border-l border-[#E8E3DA] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#EFECE6] flex items-start justify-between gap-4 bg-[#FAF8F5]/60">
              <div className="flex items-start gap-3.5 min-w-0">
                <CompanyLogo
                  companyName={drive.companyName}
                  accentHex={drive.accentHex}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    {drive.companyName} · {drive.driveType}
                  </p>
                  <h2 className="text-lg font-bold text-[#181A1F] leading-snug mt-0.5">
                    {drive.roleTitle}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin strokeWidth={1.75} className="w-3.5 h-3.5" />
                      {drive.location}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-semibold text-[#181A1F] tabular-nums">
                      {drive.ctcDisplay}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users strokeWidth={1.75} className="w-3.5 h-3.5" />
                      {drive.openingsCount} openings
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={() => onToggleBookmark(drive.id)}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark opportunity'}
                  className={`p-2 rounded-xl border transition-colors ${
                    isBookmarked
                      ? 'bg-[#EAF3F3] border-[#0D5C63]/30 text-[#0D5C63]'
                      : 'bg-white border-[#E8E3DA] text-slate-500 hover:text-[#181A1F] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <motion.div
                    key={isBookmarked ? 'saved' : 'unsaved'}
                    initial={{ scale: 0.75 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 480, damping: 20 }}
                  >
                    <Bookmark strokeWidth={1.75} className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </motion.div>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.16 }}
                  onClick={onClose}
                  aria-label="Close details"
                  className="p-2 rounded-xl bg-white border border-[#E8E3DA] text-slate-500 hover:text-[#181A1F] hover:bg-[#FAF8F5] transition-colors"
                >
                  <X strokeWidth={1.75} className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <motion.div
              key={drive.id}
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
            >
              {(() => {
                const eligibility = evaluateEligibility(profile, drive);
                const daysLeft = getDaysRemaining(drive.deadline);

                return (
                  <>
                    {/* Live Eligibility Banner */}
                    <motion.div
                      variants={staggerItemVariants}
                      className={`rounded-2xl border p-4 ${
                        eligibility.eligible
                          ? 'bg-[#EAF3F3]/75 border-[#0D5C63]/20'
                          : 'bg-[#FCF3EC] border-[#C96D3B]/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.12 }}
                          >
                            {eligibility.eligible ? (
                              <CheckCircle2 strokeWidth={1.75} className="w-5 h-5 text-[#0D5C63] shrink-0" />
                            ) : (
                              <AlertCircle strokeWidth={1.75} className="w-5 h-5 text-[#C96D3B] shrink-0" />
                            )}
                          </motion.div>
                          <div>
                            <p className="text-sm font-semibold text-[#181A1F]">
                              {eligibility.eligible
                                ? 'You meet all eligibility criteria'
                                : 'Eligibility criteria not met'}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Evaluated against {profile.name}&apos;s profile ({profile.branch} ·{' '}
                              <span className="font-mono tabular-nums">
                                {profile.cgpa.toFixed(2)} CGPA
                              </span>
                              )
                            </p>
                          </div>
                        </div>
                        {onAskAi && (
                          <button
                            type="button"
                            onClick={() => onAskAi(drive)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E8E3DA] text-[11px] font-semibold text-[#0D5C63] hover:border-[#0D5C63]/40 transition-colors shrink-0"
                          >
                            <Sparkles strokeWidth={1.75} className="w-3.5 h-3.5" />
                            <span>Prep with AI</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-[#E8E3DA]/80">
                        {eligibility.checks.map((check) => (
                          <div key={check.label} className="text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">{check.label}</span>
                              <span
                                className={`font-semibold ${
                                  check.passed ? 'text-[#0D5C63]' : 'text-[#C96D3B]'
                                }`}
                              >
                                {check.passed ? 'Pass' : 'Mismatch'}
                              </span>
                            </div>
                            <p className="font-mono text-[#181A1F] mt-0.5 tabular-nums truncate">
                              Req: {check.required} · Yours: {check.actual}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Key Dates */}
                    <motion.div variants={staggerItemVariants} className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-[#E8E3DA] bg-[#FAF8F5]/60 p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar strokeWidth={1.75} className="w-3.5 h-3.5" />
                          <span>Application Deadline</span>
                        </div>
                        <p className="text-sm font-semibold text-[#181A1F] mt-1.5 tabular-nums">
                          {formatDisplayDate(drive.deadline)}
                        </p>
                        <p
                          className={`text-xs mt-0.5 tabular-nums ${
                            daysLeft <= 3 ? 'text-[#C96D3B] font-medium' : 'text-slate-500'
                          }`}
                        >
                          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Closes today'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#E8E3DA] bg-[#FAF8F5]/60 p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Briefcase strokeWidth={1.75} className="w-3.5 h-3.5" />
                          <span>Campus Drive Date</span>
                        </div>
                        <p className="text-sm font-semibold text-[#181A1F] mt-1.5 tabular-nums">
                          {formatDisplayDate(drive.driveDate)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Virtual + On-campus PPT</p>
                      </div>
                    </motion.div>

                    {/* Role Overview */}
                    <motion.div variants={staggerItemVariants}>
                      <h3 className="text-sm font-semibold text-[#181A1F]">Role Overview</h3>
                      <p className="text-sm text-slate-600 leading-relaxed mt-2">
                        {drive.description}
                      </p>
                    </motion.div>

                    {/* Required Skills */}
                    <motion.div variants={staggerItemVariants}>
                      <h3 className="text-sm font-semibold text-[#181A1F]">Required Skills</h3>
                      <p className="text-sm text-slate-700 mt-2">
                        {drive.requiredSkills.join('  ·  ')}
                      </p>
                    </motion.div>

                    {/* Hiring Pipeline */}
                    <motion.div variants={staggerItemVariants}>
                      <h3 className="text-sm font-semibold text-[#181A1F]">Selection Process</h3>
                      <ol className="mt-3 space-y-2.5">
                        {drive.rounds.map((round, idx) => (
                          <li key={round} className="flex items-start gap-3 text-sm">
                            <span className="w-6 h-6 rounded-lg bg-[#F3F0FA] text-[#6D59A6] font-mono text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                              {idx + 1}
                            </span>
                            <span className="text-slate-700 leading-snug pt-0.5">{round}</span>
                          </li>
                        ))}
                      </ol>
                    </motion.div>
                  </>
                );
              })()}
            </motion.div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[#E8E3DA] bg-[#FAF8F5] flex items-center justify-between gap-4">
              {(() => {
                const eligibility = evaluateEligibility(profile, drive);

                return (
                  <AnimatePresence mode="wait">
                    {isApplied ? (
                      <motion.div
                        key="applied-footer"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="w-full flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-[#0D5C63]">
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                          >
                            <CheckCircle2 strokeWidth={1.75} className="w-4 h-4" />
                          </motion.div>
                          <span>Application Submitted</span>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={onGoToTracker}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D5C63] text-white text-sm font-medium hover:bg-[#09454B] transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>Track in Pipeline</span>
                          <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="unapplied-footer"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="w-full flex items-center justify-between gap-4"
                      >
                        <div className="text-xs text-slate-500 truncate">
                          Resume:{' '}
                          <span className="font-medium text-[#181A1F]">
                            {profile.resumeFileName}
                          </span>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={eligibility.eligible ? { y: -1 } : undefined}
                          whileTap={eligibility.eligible ? { scale: 0.97 } : undefined}
                          disabled={!eligibility.eligible || submitting}
                          onClick={handleApplyClick}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                            eligibility.eligible
                              ? 'bg-[#0D5C63] text-white hover:bg-[#09454B]'
                              : 'bg-[#ECE8E0] text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {submitting ? (
                            <>
                              <Loader2 strokeWidth={1.75} className="w-4 h-4 animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : eligibility.eligible ? (
                            <>
                              <span>Submit Application</span>
                              <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
                            </>
                          ) : (
                            <span>Not Eligible</span>
                          )}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })()}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
