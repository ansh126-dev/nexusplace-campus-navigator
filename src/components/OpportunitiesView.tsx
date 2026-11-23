import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  X,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Loader2,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import {
  BranchCode,
  CompanyDrive,
  RoleCategory,
  StudentProfile,
} from '../types/placement';
import { evaluateEligibility, formatDisplayDate, getDaysRemaining } from '../utils/eligibility';
import { CompanyLogo } from './CompanyLogo';
import { EASE_OUT_EXPO, SPRING_SNAPPY } from './MotionPrimitives';

interface OpportunitiesViewProps {
  drives: CompanyDrive[];
  profile: StudentProfile;
  appliedCompanyIds: Set<string>;
  bookmarkedIds: Set<string>;
  searchSeed?: { query: string; nonce: number };
  onSelectCompany: (drive: CompanyDrive) => void;
  onApply: (drive: CompanyDrive) => Promise<void> | void;
  onToggleBookmark: (companyId: string) => void;
}

type SortOption = 'deadline' | 'ctc' | 'cgpa';
type CgpaFilter = 'all' | '7.0' | '7.5' | '8.0' | '8.5' | 'eligible';

const BRANCH_OPTIONS: Array<'All' | BranchCode> = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH'];
const ROLE_OPTIONS: Array<'All' | RoleCategory> = [
  'All',
  'Software Engineer',
  'Data & AI',
  'Product & Analyst',
  'Embedded / Core',
];

export function OpportunitiesView({
  drives,
  profile,
  appliedCompanyIds,
  bookmarkedIds,
  searchSeed,
  onSelectCompany,
  onApply,
  onToggleBookmark,
}: OpportunitiesViewProps) {
  const [searchQuery, setSearchQuery] = useState(searchSeed?.query ?? '');
  const [branchFilter, setBranchFilter] = useState<'All' | BranchCode>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | RoleCategory>('All');
  const [cgpaFilter, setCgpaFilter] = useState<CgpaFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('deadline');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (searchSeed && searchSeed.nonce > 0) {
      setSearchQuery(searchSeed.query);
    }
  }, [searchSeed]);

  const filteredDrives = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return drives
      .filter((drive) => {
        if (query) {
          const haystack = `${drive.companyName} ${drive.roleTitle} ${drive.location} ${drive.requiredSkills.join(' ')}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        if (branchFilter !== 'All' && !drive.eligibleBranches.includes(branchFilter)) {
          return false;
        }
        if (roleFilter !== 'All' && drive.roleCategory !== roleFilter) {
          return false;
        }
        if (cgpaFilter === 'eligible') {
          if (!evaluateEligibility(profile, drive).eligible) return false;
        } else if (cgpaFilter !== 'all') {
          if (drive.minCgpa > parseFloat(cgpaFilter)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') return a.deadline.localeCompare(b.deadline);
        if (sortBy === 'ctc') return b.ctcNumericLpa - a.ctcNumericLpa;
        return a.minCgpa - b.minCgpa;
      });
  }, [drives, searchQuery, branchFilter, roleFilter, cgpaFilter, sortBy, profile]);

  const handleQuickApply = async (drive: CompanyDrive) => {
    if (appliedCompanyIds.has(drive.id) || applyingId) return;
    setApplyingId(drive.id);
    await onApply(drive);
    setApplyingId(null);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setBranchFilter('All');
    setRoleFilter('All');
    setCgpaFilter('all');
    setSortBy('deadline');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    branchFilter !== 'All' ||
    roleFilter !== 'All' ||
    cgpaFilter !== 'all';

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0D5C63] tracking-tight">Campus Drives</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
            Opportunity Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified campus drives, audit CGPA criteria, and submit applications in one place.
          </p>
        </div>
        <motion.p
          key={filteredDrives.length}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-mono text-slate-500 tabular-nums shrink-0"
        >
          Showing {filteredDrives.length} of {drives.length} drives
        </motion.p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E8E3DA] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Animated Search Input */}
          <motion.div
            animate={{
              borderColor: searchFocused ? '#0D5C63' : '#E8E3DA',
              boxShadow: searchFocused ? '0 0 0 3px rgba(13, 92, 99, 0.1)' : '0 0 0 0px transparent',
            }}
            transition={{ duration: 0.18 }}
            className="lg:col-span-5 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border bg-[#FAF8F5]"
          >
            <Search
              strokeWidth={1.75}
              className={`w-4 h-4 shrink-0 transition-colors ${
                searchFocused ? 'text-[#0D5C63]' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, role, location, or skill..."
              aria-label="Search campus placement opportunities"
              className="w-full bg-transparent text-sm text-[#181A1F] placeholder:text-slate-400 focus:outline-none"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X strokeWidth={1.75} className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Role Filter */}
          <div className="lg:col-span-3">
            <label className="sr-only" htmlFor="role-filter">
              Filter by role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'All' | RoleCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-white text-sm text-slate-700 focus:outline-none focus:border-[#0D5C63]"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role === 'All' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </div>

          {/* CGPA Filter */}
          <div className="lg:col-span-2">
            <label className="sr-only" htmlFor="cgpa-filter">
              Filter by CGPA requirement
            </label>
            <select
              id="cgpa-filter"
              value={cgpaFilter}
              onChange={(e) => setCgpaFilter(e.target.value as CgpaFilter)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-white text-sm text-slate-700 focus:outline-none focus:border-[#0D5C63]"
            >
              <option value="all">Any CGPA</option>
              <option value="eligible">Eligible for Me</option>
              <option value="7.0">Cutoff &le; 7.0</option>
              <option value="7.5">Cutoff &le; 7.5</option>
              <option value="8.0">Cutoff &le; 8.0</option>
              <option value="8.5">Cutoff &le; 8.5</option>
            </select>
          </div>

          {/* Sort */}
          <div className="lg:col-span-2">
            <label className="sr-only" htmlFor="sort-drives">
              Sort opportunities
            </label>
            <div className="relative flex items-center">
              <ArrowUpDown strokeWidth={1.75} className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                id="sort-drives"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#E8E3DA] bg-white text-sm text-slate-700 focus:outline-none focus:border-[#0D5C63]"
              >
                <option value="deadline">Deadline: Soonest</option>
                <option value="ctc">Package: Highest</option>
                <option value="cgpa">CGPA: Lowest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interactive Branch Segmented Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFE8] rounded-xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 text-xs font-medium text-slate-500">
              <SlidersHorizontal strokeWidth={1.75} className="w-3.5 h-3.5" />
              Branch:
            </span>
            {BRANCH_OPTIONS.map((branch) => {
              const active = branchFilter === branch;
              return (
                <button
                  key={branch}
                  type="button"
                  onClick={() => setBranchFilter(branch)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'text-[#181A1F]' : 'text-slate-600 hover:text-[#181A1F]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="branch-filter-pill"
                      transition={SPRING_SNAPPY}
                      className="absolute inset-0 rounded-lg bg-white shadow-xs"
                    />
                  )}
                  <span className="relative z-10">
                    {branch === 'All' ? 'All Branches' : branch}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-[#0D5C63] hover:text-[#09454B] transition-colors"
              >
                Reset all filters
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Company Cards Grid */}
      {filteredDrives.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E8E3DA] rounded-2xl p-12 text-center"
        >
          <p className="font-display text-lg font-semibold text-[#181A1F]">
            No placement drives match these filters
          </p>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Try clearing your search query or expanding the branch and CGPA cutoff filters.
          </p>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetFilters}
            className="mt-5 px-4 py-2.5 rounded-xl bg-[#0D5C63] text-white text-sm font-medium hover:bg-[#09454B] transition-colors"
          >
            Reset Filters
          </motion.button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDrives.map((drive, idx) => {
              const eligibility = evaluateEligibility(profile, drive);
              const applied = appliedCompanyIds.has(drive.id);
              const bookmarked = bookmarkedIds.has(drive.id);
              const isSubmitting = applyingId === drive.id;
              const daysLeft = getDaysRemaining(drive.deadline);

              return (
                <motion.article
                  key={drive.id}
                  layout="position"
                  initial={{ opacity: 0, y: 14, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -3 }}
                  transition={{
                    duration: 0.26,
                    delay: Math.min(idx * 0.035, 0.25),
                    ease: EASE_OUT_EXPO,
                  }}
                  className="bg-white border border-[#E8E3DA] rounded-2xl p-6 flex flex-col justify-between hover:border-[#D7D0C4] hover:shadow-[0_12px_30px_-12px_rgba(24,26,31,0.08)] transition-shadow"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <CompanyLogo
                          companyName={drive.companyName}
                          accentHex={drive.accentHex}
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 truncate">
                            {drive.companyName} · {drive.driveType} · {drive.location}
                          </p>
                          <h2 className="font-display text-lg font-semibold text-[#181A1F] truncate mt-0.5">
                            {drive.roleTitle}
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-sm font-bold text-[#181A1F] tabular-nums">
                          {drive.ctcDisplay}
                        </span>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.85 }}
                          onClick={() => onToggleBookmark(drive.id)}
                          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark drive'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            bookmarked
                              ? 'text-[#0D5C63] bg-[#EAF3F3]'
                              : 'text-slate-400 hover:text-[#181A1F] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <motion.div
                            key={bookmarked ? 'bm-on' : 'bm-off'}
                            initial={{ scale: 0.7 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                          >
                            <Bookmark strokeWidth={1.75} className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                          </motion.div>
                        </motion.button>
                      </div>
                    </div>

                    {/* Clean unboxed eligibility & criteria metadata */}
                    <div className="mt-5 pt-4 border-t border-[#F0ECE4] grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">Eligibility Criteria</span>
                        <span className="font-medium text-[#181A1F] mt-1 block tabular-nums">
                          CGPA {drive.minCgpa.toFixed(1)}+ · {drive.eligibleBranches.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Registration Deadline</span>
                        <span
                          className={`font-medium mt-1 block tabular-nums ${
                            daysLeft <= 3 ? 'text-[#C96D3B] font-semibold' : 'text-[#181A1F]'
                          }`}
                        >
                          {formatDisplayDate(drive.deadline)} ({daysLeft}d left)
                        </span>
                      </div>
                    </div>

                    {/* Required skills - plain typographic list */}
                    <div className="mt-4 text-xs text-slate-500 truncate">
                      <span className="text-slate-400 mr-1.5">Skills:</span>
                      <span className="text-slate-700">{drive.requiredSkills.join(' · ')}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-4 border-t border-[#F0ECE4] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium min-w-0">
                      {eligibility.eligible ? (
                        <>
                          <CheckCircle2 strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63] shrink-0" />
                          <span className="text-[#0D5C63] font-semibold truncate">Eligible</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle strokeWidth={1.75} className="w-4 h-4 text-[#C96D3B] shrink-0" />
                          <span className="text-[#C96D3B] truncate">
                            {eligibility.failureReasons[0]}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelectCompany(drive)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E3DA] text-xs font-semibold text-[#181A1F] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>View Details</span>
                        <ExternalLink strokeWidth={1.75} className="w-3 h-3" />
                      </motion.button>

                      <AnimatePresence mode="wait">
                        {applied ? (
                          <motion.span
                            key="btn-applied"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={SPRING_SNAPPY}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAF3F3] border border-[#0D5C63]/20 text-xs font-semibold text-[#0D5C63] whitespace-nowrap shrink-0"
                          >
                            <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                            <span>Applied</span>
                          </motion.span>
                        ) : (
                          <motion.button
                            key="btn-apply"
                            type="button"
                            whileHover={eligibility.eligible ? { y: -1 } : undefined}
                            whileTap={eligibility.eligible ? { scale: 0.95 } : undefined}
                            disabled={!eligibility.eligible || isSubmitting}
                            onClick={() => handleQuickApply(drive)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                              eligibility.eligible
                                ? 'bg-[#0D5C63] text-white hover:bg-[#09454B]'
                                : 'bg-[#F3EFE8] text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 strokeWidth={1.75} className="w-3.5 h-3.5 animate-spin" />
                                <span>Applying...</span>
                              </>
                            ) : (
                              <span>Apply</span>
                            )}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
