import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  Send,
  Clock,
  ShieldCheck,
  ArrowRight,
  Calendar,
  BookOpen,
  UserCheck,
  TrendingUp,
  Compass,
  Kanban,
  User,
  Target,
  Scale,
  Route,
} from 'lucide-react';
import {
  ActivityItem,
  ApplicationRecord,
  CompanyDrive,
  PrepTopic,
  StudentProfile,
  WorkspaceTab,
} from '../types/placement';
import { APPLICATION_STAGES, WEEKLY_PREP_SERIES } from '../data/mockPlacementData';
import { evaluateEligibility, formatDisplayDate, getDaysRemaining } from '../utils/eligibility';
import { AnimatedCounter } from './AnimatedCounter';
import { CompanyLogo } from './CompanyLogo';
import { CalendarView } from './CalendarView';
import {
  AnimatedProgressBar,
  EASE_OUT_EXPO,
  staggerContainerVariants,
  staggerItemVariants,
} from './MotionPrimitives';

interface DashboardViewProps {
  profile: StudentProfile;
  drives: CompanyDrive[];
  applications: ApplicationRecord[];
  prepTopics: PrepTopic[];
  activities: ActivityItem[];
  onNavigateTab: (tab: WorkspaceTab) => void;
  onSelectCompany: (drive: CompanyDrive) => void;
}

export function DashboardView({
  profile,
  drives,
  applications,
  prepTopics,
  activities,
  onNavigateTab,
  onSelectCompany,
}: DashboardViewProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const eligibleDrives = drives.filter((d) => evaluateEligibility(profile, d).eligible);
  const upcomingDeadlines = drives
    .filter((d) => {
      const days = getDaysRemaining(d.deadline);
      return days >= 0 && days <= 10;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const appliedCompanyIds = new Set(applications.map((a) => a.companyId));
  const recommendedDrives = eligibleDrives
    .filter((d) => !appliedCompanyIds.has(d.id))
    .slice(0, 3);

  const completedPrepCount = prepTopics.filter((t) => t.completed).length;
  const prepPercent = prepTopics.length
    ? Math.round((completedPrepCount / prepTopics.length) * 100)
    : 0;

  const summaryCards = [
    {
      label: 'Available Companies',
      value: drives.length,
      detail: 'Active campus recruitment drives',
      icon: Building2,
      iconTone: 'text-[#0D5C63] bg-[#EAF3F3]',
      onClick: () => onNavigateTab('opportunities'),
    },
    {
      label: 'Applications Submitted',
      value: applications.length,
      detail: `${applications.filter((a) => a.stage !== 'Applied').length} in active interview rounds`,
      icon: Send,
      iconTone: 'text-[#6D59A6] bg-[#F3F0FA]',
      onClick: () => onNavigateTab('tracker'),
    },
    {
      label: 'Upcoming Deadlines',
      value: upcomingDeadlines.length,
      detail: 'Closing within the next 10 days',
      icon: Clock,
      iconTone: 'text-[#C96D3B] bg-[#FCF3EC]',
      onClick: () => onNavigateTab('opportunities'),
    },
    {
      label: 'Eligible Opportunities',
      value: eligibleDrives.length,
      detail: `Matched to ${profile.branch} · ${profile.cgpa.toFixed(2)} CGPA`,
      icon: ShieldCheck,
      iconTone: 'text-[#0D5C63] bg-[#EAF3F3]',
      onClick: () => onNavigateTab('eligibility'),
    },
  ];

  const coreModules: Array<{
    tab: WorkspaceTab;
    title: string;
    meta: string;
    icon: typeof Compass;
    tone: string;
  }> = [
    {
      tab: 'opportunities',
      title: 'Explore Drives',
      meta: `${drives.length} active roles`,
      icon: Compass,
      tone: 'text-[#0D5C63] bg-[#EAF3F3]',
    },
    {
      tab: 'eligibility',
      title: 'Eligibility Audit',
      meta: `${eligibleDrives.length}/${drives.length} qualified`,
      icon: ShieldCheck,
      tone: 'text-[#0D5C63] bg-[#EAF3F3]',
    },
    {
      tab: 'tracker',
      title: 'Stage Tracker',
      meta: `${applications.length} in pipeline`,
      icon: Kanban,
      tone: 'text-[#6D59A6] bg-[#F3F0FA]',
    },
    {
      tab: 'preparation',
      title: 'Prep Hub',
      meta: `${prepPercent}% checklist done`,
      icon: BookOpen,
      tone: 'text-[#6D59A6] bg-[#F3F0FA]',
    },
    {
      tab: 'profile',
      title: 'Profile & CGPA',
      meta: `${profile.branch} · ${profile.cgpa.toFixed(2)}`,
      icon: User,
      tone: 'text-[#C96D3B] bg-[#FCF3EC]',
    },
    {
      tab: 'deadlines',
      title: 'Smart Deadlines',
      meta: `${upcomingDeadlines.length} closing soon`,
      icon: Clock,
      tone: 'text-[#C96D3B] bg-[#FCF3EC]',
    },
    {
      tab: 'skill-gap',
      title: 'Skill Gap Analyzer',
      meta: `${profile.skills.length} skills mapped`,
      icon: Target,
      tone: 'text-[#0D5C63] bg-[#EAF3F3]',
    },
    {
      tab: 'compare',
      title: 'Compare Drives',
      meta: 'Side-by-side matrix',
      icon: Scale,
      tone: 'text-[#6D59A6] bg-[#F3F0FA]',
    },
    {
      tab: 'roadmap',
      title: 'Prep Roadmap',
      meta: '7 milestone phases',
      icon: Route,
      tone: 'text-[#0D5C63] bg-[#EAF3F3]',
    },
    {
      tab: 'calendar',
      title: 'Schedule Grid',
      meta: 'Tests & interviews',
      icon: Calendar,
      tone: 'text-[#6D59A6] bg-[#F3F0FA]',
    },
  ];

  // SVG chart coordinates
  const chartWidth = 440;
  const chartHeight = 148;
  const maxHours = 5.5;
  const points = WEEKLY_PREP_SERIES.map((item, idx) => {
    const x = 24 + (idx * (chartWidth - 48)) / (WEEKLY_PREP_SERIES.length - 1);
    const y = chartHeight - 26 - (item.hours / maxHours) * (chartHeight - 44);
    return { x, y, ...item };
  });

  const linePath = points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${chartHeight - 22} L ${points[0].x.toFixed(1)} ${chartHeight - 22} Z`;

  return (
    <div className="space-y-6">
      {/* Top Welcome Strip + Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0D5C63] tracking-tight">Student Overview</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
            Welcome back, {profile.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {profile.branch} · Class of {profile.batchYear} · CGPA{' '}
            <span className="font-mono font-medium text-[#181A1F] tabular-nums">
              {profile.cgpa.toFixed(2)}
            </span>{' '}
            · Prep readiness{' '}
            <span className="font-mono font-semibold text-[#6D59A6] tabular-nums">
              <AnimatedCounter value={prepPercent} suffix="%" />
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigateTab('eligibility')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E3DA] text-xs font-semibold text-[#181A1F] hover:bg-[#FAF8F5] hover:border-[#D7D0C4] transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63]" />
            <span>Check Eligibility</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigateTab('tracker')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E3DA] text-xs font-semibold text-[#181A1F] hover:bg-[#FAF8F5] hover:border-[#D7D0C4] transition-colors whitespace-nowrap shrink-0"
          >
            <Kanban strokeWidth={1.75} className="w-4 h-4 text-[#6D59A6]" />
            <span>Open Tracker</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={() => onNavigateTab('opportunities')}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] transition-colors shadow-[0_2px_6px_rgba(13,92,99,0.2)] whitespace-nowrap shrink-0"
          >
            <span>Browse Drives</span>
            <ArrowRight strokeWidth={1.75} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </div>
      </div>

      {/* Quick-Launch Core Modules Strip for Instant Discoverability */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {coreModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <motion.button
              key={mod.tab}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
              onClick={() => onNavigateTab(mod.tab)}
              className="group text-left bg-white border border-[#E8E3DA] rounded-xl px-3.5 py-2.5 hover:border-[#0D5C63]/40 hover:shadow-[0_8px_20px_-12px_rgba(24,26,31,0.12)] transition-all flex items-center gap-3 cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${mod.tone}`}
              >
                <Icon strokeWidth={1.75} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#181A1F] truncate group-hover:text-[#0D5C63] transition-colors">
                  {mod.title}
                </p>
                <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                  {mod.meta}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 4 Animated KPI Summary Cards */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.label}
              type="button"
              onClick={card.onClick}
              variants={staggerItemVariants}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
              className="group text-left bg-white border border-[#E8E3DA] rounded-2xl p-5 hover:border-[#D7D0C4] hover:shadow-[0_12px_28px_-12px_rgba(24,26,31,0.09)] transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${card.iconTone}`}
                >
                  <Icon strokeWidth={1.75} className="w-4 h-4" />
                </div>
              </div>
              <p className="font-display text-3xl font-bold text-[#181A1F] mt-3 tabular-nums">
                <AnimatedCounter value={card.value} />
              </p>
              <p className="text-xs text-slate-500 mt-1 truncate">{card.detail}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Middle Row: Animated Chart + Application Progress Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Preparation & Application Momentum Chart */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16, ease: EASE_OUT_EXPO }}
          className="lg:col-span-7 bg-white border border-[#E8E3DA] rounded-2xl p-6 sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-[#181A1F]">
                Weekly Preparation Momentum
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Study hours logged &amp; placement consistency over the past 7 days
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-[#0D5C63] tabular-nums">
                <AnimatedCounter value={25.6} decimals={1} suffix=" hrs" />
              </p>
              <p className="text-[11px] text-[#0D5C63] font-medium inline-flex items-center gap-1">
                <TrendingUp strokeWidth={1.75} className="w-3 h-3" />
                +18% vs last week
              </p>
            </div>
          </div>

          <div className="mt-6 relative rounded-xl bg-[#FAF8F5]/75 border border-[#F0ECE4] p-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
              role="img"
              aria-label="Weekly preparation study hours line chart"
            >
              <defs>
                <linearGradient id="prepAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75].map((ratio) => {
                const gy = chartHeight - 26 - ratio * (chartHeight - 44);
                return (
                  <line
                    key={ratio}
                    x1="20"
                    x2={chartWidth - 20}
                    y1={gy}
                    y2={gy}
                    stroke="#E5E0D8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                );
              })}

              <motion.path
                d={areaPath}
                fill="url(#prepAreaGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              />

              <motion.path
                d={linePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
              />

              {points.map((pt, idx) => (
                <g
                  key={pt.day}
                  onMouseEnter={() => setHoveredDay(idx)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="cursor-pointer"
                >
                  <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                  <motion.circle
                    cx={pt.x}
                    cy={pt.y}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: hoveredDay === idx ? 1.35 : 1,
                      opacity: 1,
                    }}
                    transition={{
                      scale: { duration: 0.16 },
                      opacity: { duration: 0.25, delay: 0.25 + idx * 0.05 },
                    }}
                    r={4}
                    fill="#FFFFFF"
                    stroke={hoveredDay === idx ? '#F59E0B' : '#10B981'}
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className={`text-[11px] font-sans transition-colors ${
                      hoveredDay === idx ? 'fill-[#0D5C63] font-semibold' : 'fill-slate-400'
                    }`}
                  >
                    {pt.day}
                  </text>
                  <AnimatePresence>
                    {hoveredDay === idx && (
                      <motion.g
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.14 }}
                      >
                        <rect
                          x={pt.x - 28}
                          y={pt.y - 32}
                          width="56"
                          height="22"
                          rx="6"
                          fill="#181A1F"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 18}
                          textAnchor="middle"
                          className="fill-white text-[11px] font-mono"
                        >
                          {pt.hours}h
                        </text>
                      </motion.g>
                    )}
                  </AnimatePresence>
                </g>
              ))}
            </svg>
          </div>
        </motion.div>

        {/* Application Pipeline Progress */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22, ease: EASE_OUT_EXPO }}
          className="lg:col-span-5 bg-white border border-[#E8E3DA] rounded-2xl p-6 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-[#181A1F]">
                Application Progress
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab('tracker')}
                className="text-xs font-semibold text-[#0D5C63] hover:text-[#09454B] transition-colors"
              >
                Open Tracker
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution across active campus hiring stages
            </p>

            <div className="mt-6 space-y-4">
              {APPLICATION_STAGES.map((stage, idx) => {
                const count = applications.filter((a) => a.stage === stage).length;
                const ratio = applications.length ? (count / applications.length) * 100 : 0;
                const barColors = [
                  'bg-slate-500',
                  'bg-[#6D59A6]',
                  'bg-[#0D5C63]',
                  'bg-[#C96D3B]',
                  'bg-emerald-600',
                ];

                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">{stage}</span>
                      <span className="font-mono text-slate-500 tabular-nums">{count}</span>
                    </div>
                    <AnimatedProgressBar
                      percent={ratio}
                      trackClassName="h-2 bg-[#F3EFE8]"
                      barClassName={barColors[idx]}
                      delay={0.12 + idx * 0.05}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prep Readiness Mini Bar */}
          <div className="mt-6 pt-5 border-t border-[#F0ECE4]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-700">Placement Prep Checklist</span>
              <span className="font-mono font-semibold text-[#6D59A6] tabular-nums">
                {completedPrepCount}/{prepTopics.length} topics ({prepPercent}%)
              </span>
            </div>
            <AnimatedProgressBar
              percent={prepPercent}
              trackClassName="h-2 bg-[#F3EFE8]"
              barClassName="bg-[#6D59A6]"
              delay={0.25}
            />
          </div>
        </motion.div>
      </div>

      {/* Placement Schedule Calendar Grid */}
      <CalendarView
        drives={drives}
        applications={applications}
        onSelectCompany={onSelectCompany}
        onNavigateTab={onNavigateTab}
        embedded
      />

      {/* Bottom Row: Upcoming Deadlines + Recommended Drives + Recent Activity */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Upcoming Placement Drives & Deadline Reminders */}
        <motion.div
          variants={staggerItemVariants}
          className="lg:col-span-5 bg-white border border-[#E8E3DA] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-[#181A1F]">
                Upcoming Deadlines
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prioritized registration cutoffs &amp; drive dates
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('deadlines')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D5C63] hover:underline shrink-0"
            >
              <Calendar strokeWidth={1.75} className="w-3.5 h-3.5" />
              <span>All Reminders</span>
            </button>
          </div>

          <div className="divide-y divide-[#F0ECE4]">
            {upcomingDeadlines.slice(0, 4).map((drive) => {
              const daysLeft = getDaysRemaining(drive.deadline);
              const applied = appliedCompanyIds.has(drive.id);

              return (
                <motion.div
                  key={drive.id}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onSelectCompany(drive)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectCompany(drive);
                    }
                  }}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyLogo
                      companyName={drive.companyName}
                      accentHex={drive.accentHex}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#181A1F] truncate">
                        {drive.companyName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {drive.roleTitle} · {formatDisplayDate(drive.deadline)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-mono font-semibold tabular-nums ${
                        daysLeft <= 3 ? 'text-[#C96D3B]' : 'text-slate-700'
                      }`}
                    >
                      {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {applied ? 'Applied' : drive.ctcDisplay}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recommended Eligible Companies */}
        <motion.div
          variants={staggerItemVariants}
          className="lg:col-span-4 bg-white border border-[#E8E3DA] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-[#181A1F]">
                Recommended for You
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Eligible matches you haven&apos;t applied to yet
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#EAF3F3] text-[#0D5C63] flex items-center justify-center">
              <UserCheck strokeWidth={1.75} className="w-4 h-4" />
            </div>
          </div>

          {recommendedDrives.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                You&apos;ve applied to all top matches!
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('opportunities')}
                className="mt-3 text-xs font-semibold text-[#0D5C63] hover:underline"
              >
                Explore all campus drives
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedDrives.map((drive) => (
                <motion.div
                  key={drive.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.16 }}
                  onClick={() => onSelectCompany(drive)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectCompany(drive);
                    }
                  }}
                  className="p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5]/50 hover:border-[#0D5C63]/40 hover:bg-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CompanyLogo
                        companyName={drive.companyName}
                        accentHex={drive.accentHex}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#181A1F] truncate">
                          {drive.companyName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{drive.roleTitle}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#0D5C63] tabular-nums shrink-0">
                      {drive.ctcDisplay}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 truncate">
                    {drive.requiredSkills.slice(0, 3).join(' · ')}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={staggerItemVariants}
          className="lg:col-span-3 bg-white border border-[#E8E3DA] rounded-2xl p-6"
        >
          <h2 className="font-display text-base font-semibold text-[#181A1F]">Recent Activity</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Your latest placement actions</p>

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {activities.slice(0, 4).map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="text-xs space-y-0.5 pb-3.5 border-b border-[#F0ECE4] last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#181A1F]">{item.action}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">{item.detail}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
