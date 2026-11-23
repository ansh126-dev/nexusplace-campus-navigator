import { motion } from 'motion/react';
import {
  ArrowRight,
  Compass,
  ShieldCheck,
  Kanban,
  BookOpen,
  Clock,
  CheckCircle2,
  Calendar,
  Bot,
  LogIn,
} from 'lucide-react';
import { CompanyDrive, StudentProfile, WorkspaceTab } from '../types/placement';
import { evaluateEligibility, getDaysRemaining } from '../utils/eligibility';
import { CompanyLogo, NexusPlaceMark } from './CompanyLogo';
import { AnimatedCounter } from './AnimatedCounter';
import { ThemeToggleButton } from './ThemeToggleButton';
import { AnimatedPlacementBackdrop } from './AnimatedPlacementBackdrop';
import {
  EASE_OUT_EXPO,
  staggerContainerVariants,
  staggerItemVariants,
} from './MotionPrimitives';

interface LandingPageProps {
  profile: StudentProfile;
  drives: CompanyDrive[];
  appliedCount: number;
  theme: 'light' | 'dark';
  isAuthenticated?: boolean;
  onToggleTheme: () => void;
  onEnterWorkspace: (tab?: WorkspaceTab) => void;
  onOpenDrive: (drive: CompanyDrive) => void;
  onOpenChat?: () => void;
  onOpenLogin?: () => void;
}

const FEATURES = [
  {
    index: '01',
    title: 'Smart Opportunity Discovery',
    description:
      'Filter verified campus drives by branch, CGPA cutoff, role category, and compensation in one unified feed—replacing scattered emails and chat threads.',
    icon: Compass,
    accent: 'text-[#0D5C63] bg-[#EAF3F3]',
    span: 'lg:col-span-2',
    tab: 'opportunities' as WorkspaceTab,
  },
  {
    index: '02',
    title: 'Instant Eligibility Checker',
    description:
      'Audit CGPA, branch rules, active backlogs, and 10th/12th thresholds across every recruiting company in seconds.',
    icon: ShieldCheck,
    accent: 'text-[#0D5C63] bg-[#EAF3F3]',
    span: 'lg:col-span-1',
    tab: 'eligibility' as WorkspaceTab,
  },
  {
    index: '03',
    title: 'Application Tracker',
    description:
      'Track every drive from Applied through Online Assessment, Technical Rounds, HR, and Offer Received with clear stage milestones.',
    icon: Kanban,
    accent: 'text-[#6D59A6] bg-[#F3F0FA]',
    span: 'lg:col-span-1',
    tab: 'tracker' as WorkspaceTab,
  },
  {
    index: '04',
    title: 'Placement Preparation Hub',
    description:
      'Follow structured DSA and core CS checklists alongside campus-specific interview archives and behavioral STAR prompts.',
    icon: BookOpen,
    accent: 'text-[#6D59A6] bg-[#F3F0FA]',
    span: 'lg:col-span-1',
    tab: 'preparation' as WorkspaceTab,
  },
  {
    index: '05',
    title: 'Deadline Management',
    description:
      'Stay ahead of registration cutoffs and pre-placement talks with prioritized countdown reminders and timeline alerts.',
    icon: Clock,
    accent: 'text-[#C96D3B] bg-[#FCF3EC]',
    span: 'lg:col-span-1',
    tab: 'dashboard' as WorkspaceTab,
  },
];

export function LandingPage({
  profile,
  drives,
  appliedCount,
  theme,
  isAuthenticated = true,
  onToggleTheme,
  onEnterWorkspace,
  onOpenDrive,
  onOpenChat,
  onOpenLogin,
}: LandingPageProps) {
  const eligibleDrives = drives.filter((d) => evaluateEligibility(profile, d).eligible);
  const matchingUrgent = drives
    .filter((d) => getDaysRemaining(d.deadline) <= 7)
    .slice(0, 3);
  const urgentDrives = matchingUrgent.length > 0 ? matchingUrgent : drives.slice(0, 3);

  return (
    <div className="relative min-h-screen bg-[#FAF8F5] text-[#181A1F] flex flex-col">
      <AnimatedPlacementBackdrop />
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E3DA]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="flex items-center gap-2.5 text-lg font-display font-bold tracking-tight text-[#181A1F] whitespace-nowrap shrink-0 group"
          >
            <motion.span whileHover={{ rotate: -6, scale: 1.05 }} transition={{ duration: 0.2 }}>
              <NexusPlaceMark className="w-7 h-7" />
            </motion.span>
            <span>NexusPlace</span>
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600"
          >
            <a
              href="#features"
              className="hover:text-[#181A1F] transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#opportunities-preview"
              className="hover:text-[#181A1F] transition-colors whitespace-nowrap shrink-0"
            >
              Opportunities
            </a>
            <a
              href="#workflow"
              className="hover:text-[#181A1F] transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <button
              type="button"
              onClick={() => onEnterWorkspace('preparation')}
              className="hover:text-[#181A1F] transition-colors whitespace-nowrap shrink-0"
            >
              Student Hub
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            {onOpenChat && (
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.16 }}
                onClick={onOpenChat}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E8E3DA] text-[#181A1F] text-sm font-medium hover:bg-[#F3EFE8]/60 hover:border-[#D7D0C4] transition-colors whitespace-nowrap shrink-0"
              >
                <Bot strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63]" />
                <span className="hidden sm:inline">Placement AI</span>
              </motion.button>
            )}
            {onOpenLogin && (
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.16 }}
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E8E3DA] text-[#181A1F] text-sm font-medium hover:bg-[#F3EFE8]/60 hover:border-[#D7D0C4] transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63]" />
                <span>{isAuthenticated ? 'Login' : 'Sign In'}</span>
              </motion.button>
            )}
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16 }}
              onClick={() => onEnterWorkspace('dashboard')}
              className="px-4 py-2 rounded-xl bg-[#0D5C63] text-white text-sm font-medium hover:bg-[#09454B] transition-colors whitespace-nowrap shrink-0 shadow-[0_1px_2px_rgba(13,92,99,0.2)]"
            >
              Student Dashboard
            </motion.button>
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-8 pb-16 lg:pt-12 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <motion.div
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-6 space-y-5 lg:space-y-6"
            >
              <motion.p
                variants={staggerItemVariants}
                className="text-sm font-semibold text-[#0D5C63] tracking-tight"
              >
                NexusPlace · The Complete Campus Recruitment Navigator
              </motion.p>

              <motion.h1
                variants={staggerItemVariants}
                className="font-display text-4xl sm:text-5xl lg:text-[3.1rem] xl:text-[3.4rem] font-bold tracking-tight text-[#181A1F] leading-[1.08] text-balance"
              >
                Your Campus Placement Journey, Simplified.
              </motion.h1>

              <motion.p
                variants={staggerItemVariants}
                className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl"
              >
                Replace scattered placement cell PDFs, missed registration cutoffs, and confusing
                CGPA rules with one calm, centralized student workspace built for university
                recruitment seasons.
              </motion.p>

              <motion.div
                variants={staggerItemVariants}
                className="flex flex-wrap items-center gap-4 pt-1"
              >
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  onClick={() => onEnterWorkspace('dashboard')}
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold hover:bg-[#09454B] transition-colors shadow-[0_6px_18px_-6px_rgba(13,92,99,0.45)] whitespace-nowrap shrink-0"
                >
                  <span>Get Started</span>
                  <ArrowRight strokeWidth={1.75} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  onClick={() => onEnterWorkspace('opportunities')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#E8E3DA] text-[#181A1F] text-sm font-semibold hover:bg-[#F3EFE8]/60 hover:border-[#D7D0C4] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore Opportunities</span>
                </motion.button>
              </motion.div>

              {/* Clean unboxed proof line */}
              <motion.div
                variants={staggerItemVariants}
                className="pt-5 border-t border-[#E8E3DA] flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600"
              >
                <span className="tabular-nums">
                  <strong className="font-semibold text-[#181A1F]">
                    <AnimatedCounter value={drives.length} />
                  </strong>{' '}
                  Active Campus Drives
                </span>
                <span aria-hidden="true" className="text-[#D7D0C4]">
                  ·
                </span>
                <span className="tabular-nums">
                  <strong className="font-semibold text-[#181A1F]">
                    <AnimatedCounter value={eligibleDrives.length} />
                  </strong>{' '}
                  Instant Eligibility Matches
                </span>
                <span aria-hidden="true" className="text-[#D7D0C4]">
                  ·
                </span>
                <span>Zero Missed Deadlines</span>
              </motion.div>
            </motion.div>

            {/* Hero Visual + Floating Interactive Preview */}
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT_EXPO }}
              className="lg:col-span-6 relative"
            >
              <div className="relative rounded-3xl overflow-hidden border border-[#E8E3DA] bg-white shadow-[0_20px_50px_-18px_rgba(24,26,31,0.14)] aspect-[4/3]">
                <img
                  src="/src/assets/images/hero_campus_illustration_1795435996917.jpg"
                  alt="University students reviewing campus placement opportunities on laptops in a bright campus commons"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181A1F]/40 via-transparent to-transparent" />
              </div>

              {/* Subtle floating live dashboard preview card */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                className="mt-4 sm:mt-0 sm:absolute sm:-bottom-7 sm:left-6 sm:right-6 bg-white/95 backdrop-blur-md border border-[#E8E3DA] rounded-2xl shadow-[0_18px_40px_-12px_rgba(24,26,31,0.16)] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#EFECE6]">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Live Student Snapshot · {profile.name}
                    </p>
                    <p className="text-sm font-semibold text-[#181A1F] tabular-nums mt-0.5">
                      {profile.branch} · {profile.cgpa.toFixed(2)} CGPA · {appliedCount} Active
                      Applications
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onEnterWorkspace('dashboard')}
                    className="px-3.5 py-1.5 rounded-lg bg-[#EAF3F3] text-[#0D5C63] text-xs font-semibold hover:bg-[#DCEBEB] transition-colors whitespace-nowrap shrink-0"
                  >
                    Open Workspace
                  </motion.button>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3">
                  {urgentDrives.map((drive) => {
                    const days = getDaysRemaining(drive.deadline);
                    return (
                      <motion.button
                        key={drive.id}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onOpenDrive(drive)}
                        className="text-left group rounded-xl p-2 hover:bg-[#FAF8F5] transition-colors"
                      >
                        <p className="text-xs font-semibold text-[#181A1F] truncate group-hover:text-[#0D5C63] transition-colors">
                          {drive.companyName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {drive.ctcDisplay}
                        </p>
                        <p className="text-[11px] text-[#C96D3B] font-semibold tabular-nums mt-0.5">
                          {days}d left
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Feature Highlights Bento Grid */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-6 py-20 lg:py-24 border-t border-[#E8E3DA]"
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="max-w-2xl mb-14"
          >
            <p className="text-sm font-semibold text-[#6D59A6]">Platform Capabilities</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#181A1F] mt-2 text-balance">
              Everything students need from notice to offer letter
            </h2>
            <p className="text-slate-600 mt-3 text-base leading-relaxed">
              Designed around the real pain points uncovered in campus placement journeys—scattered
              alerts, unclear eligibility cutoffs, and fragmented interview tracking.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.index}
                  variants={staggerItemVariants}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  className={`${feature.span} group bg-white border border-[#E8E3DA] rounded-2xl p-7 flex flex-col justify-between hover:border-[#D7D0C4] hover:shadow-[0_12px_30px_-12px_rgba(24,26,31,0.08)] transition-shadow`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${feature.accent}`}
                      >
                        <Icon strokeWidth={1.75} className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-medium text-slate-400 tabular-nums">
                        {feature.index}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[#181A1F] mt-6">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-2">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F0ECE4]">
                    <button
                      type="button"
                      onClick={() => onEnterWorkspace(feature.tab)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D5C63] hover:text-[#09454B] transition-colors"
                    >
                      <span>Open {feature.title.split(' ')[0]} Workspace</span>
                      <ArrowRight strokeWidth={1.75} className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Live Opportunities Preview */}
        <section
          id="opportunities-preview"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-[#E8E3DA]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-semibold text-[#C96D3B]">Live Campus Feed</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
                Upcoming Recruiting Drives
              </h2>
            </div>
            <motion.button
              type="button"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEnterWorkspace('opportunities')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0D5C63] hover:text-[#09454B] whitespace-nowrap shrink-0"
            >
              <span>View all {drives.length} companies</span>
              <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
            </motion.button>
          </div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {drives.slice(0, 3).map((drive) => {
              const check = evaluateEligibility(profile, drive);
              return (
                <motion.div
                  key={drive.id}
                  variants={staggerItemVariants}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  onClick={() => onOpenDrive(drive)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenDrive(drive);
                    }
                  }}
                  className="bg-white border border-[#E8E3DA] rounded-2xl p-6 hover:border-[#D7D0C4] hover:shadow-[0_12px_30px_-12px_rgba(24,26,31,0.08)] transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyLogo companyName={drive.companyName} accentHex={drive.accentHex} />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 truncate">{drive.companyName}</p>
                        <h3 className="text-base font-semibold text-[#181A1F] truncate">
                          {drive.roleTitle}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-[#181A1F] tabular-nums">
                      {drive.ctcDisplay}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{drive.location}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Min {drive.minCgpa.toFixed(1)} CGPA</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#F0ECE4] flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[#0D5C63] font-semibold">
                      <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                      {check.eligible ? 'Eligible for your profile' : 'Check criteria'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500 tabular-nums">
                      <Calendar strokeWidth={1.75} className="w-3.5 h-3.5" />
                      {drive.deadline}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Workflow & Design Thinking Impact */}
        <section id="workflow" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#E8E3DA]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="bg-white border border-[#E8E3DA] rounded-3xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
          >
            <div className="lg:col-span-7 space-y-5">
              <p className="text-sm font-semibold text-[#0D5C63]">Design Thinking Outcome</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] text-balance">
                From chaotic placement groups to a calm, accountable workflow
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Students previously checked 4+ messaging channels, manually cross-referenced PDF
                eligibility sheets, and tracked interview rounds in spreadsheets. NexusPlace
                compresses eligibility checks to under 15 seconds and keeps every deadline visible.
              </p>
              <div className="pt-2">
                <blockquote className="text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;Having my CGPA check, drive deadlines, and round-by-round prep in one place
                  cut out all the panic during peak November placements.&rdquo;
                </blockquote>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  Rohan Kulkarni · Final-Year Student Placement Coordinator, Class of 2026
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ y: -2 }}
                className="p-5 rounded-2xl bg-[#EAF3F3]/60 border border-[#0D5C63]/15"
              >
                <p className="font-mono text-2xl font-bold text-[#0D5C63] tabular-nums">
                  &lt; <AnimatedCounter value={15} suffix="s" />
                </p>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Full-batch eligibility verification across all active companies
                </p>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="p-5 rounded-2xl bg-[#F3F0FA]/70 border border-[#6D59A6]/15"
              >
                <p className="font-mono text-2xl font-bold text-[#6D59A6] tabular-nums">
                  <AnimatedCounter value={5} suffix=" Stages" />
                </p>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Visual pipeline tracking from submission to final offer
                </p>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="p-5 rounded-2xl bg-[#FCF3EC]/80 border border-[#C96D3B]/15"
              >
                <p className="font-mono text-2xl font-bold text-[#C96D3B] tabular-nums">
                  <AnimatedCounter value={100} suffix="%" />
                </p>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Centralized drive notices, CTC details &amp; round schedules
                </p>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] flex flex-col justify-between"
              >
                <p className="text-sm font-semibold text-[#181A1F]">Ready to explore?</p>
                <button
                  type="button"
                  onClick={() => onEnterWorkspace('dashboard')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D5C63] hover:text-[#09454B] group"
                >
                  <span>Launch Dashboard</span>
                  <ArrowRight strokeWidth={1.75} className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-10 border-t border-[#E8E3DA] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <NexusPlaceMark className="w-6 h-6" />
            <span className="font-display font-semibold text-sm text-[#181A1F]">NexusPlace</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">Your Campus Placement Journey, Simplified.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => onEnterWorkspace('opportunities')}
              className="hover:text-[#181A1F] transition-colors"
            >
              Opportunities
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('eligibility')}
              className="hover:text-[#181A1F] transition-colors"
            >
              Eligibility Checker
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('tracker')}
              className="hover:text-[#181A1F] transition-colors"
            >
              Application Tracker
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('preparation')}
              className="hover:text-[#181A1F] transition-colors"
            >
              Preparation Hub
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
