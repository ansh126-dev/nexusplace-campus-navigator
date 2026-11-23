import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Sparkles,
  Check,
  CalendarClock,
} from 'lucide-react';
import { CompanyDrive, StudentProfile, WorkspaceTab } from '../types/placement';
import { evaluateEligibility, formatDisplayDate } from '../utils/eligibility';
import { CompanyLogo } from './CompanyLogo';
import { AnimatedCounter } from './AnimatedCounter';
import {
  AnimatedProgressBar,
  EASE_OUT_EXPO,
  SPRING_SNAPPY,
  staggerContainerVariants,
  staggerItemVariants,
} from './MotionPrimitives';

interface DeadlineReminderViewProps {
  drives: CompanyDrive[];
  profile: StudentProfile;
  appliedCompanyIds: Set<string>;
  completedDeadlineIds: Set<string>;
  onToggleDeadlineCompleted: (companyId: string) => void;
  onSimulateAlert: (drive: CompanyDrive, category: 'Urgent' | 'Upcoming') => void;
  onSelectCompany: (drive: CompanyDrive) => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
}

type DeadlineFilter = 'All' | 'Urgent' | 'Upcoming' | 'Completed';
type DeadlineCategory = 'Urgent' | 'Upcoming' | 'Completed';

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHoursLeft: number;
}

const SEASON_ANCHOR_MS = new Date('2026-11-23T09:00:00').getTime();

function computeCountdown(deadlineDateStr: string, elapsedSessionMs: number): CountdownParts {
  const simulatedNowMs = SEASON_ANCHOR_MS + elapsedSessionMs;
  const deadlineMs = new Date(`${deadlineDateStr}T23:59:59`).getTime();
  const diffMs = Math.max(0, deadlineMs - simulatedNowMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days,
    hours,
    minutes,
    seconds,
    totalHoursLeft: diffMs / 3600000,
  };
}

export function DeadlineReminderView({
  drives,
  profile,
  appliedCompanyIds,
  completedDeadlineIds,
  onToggleDeadlineCompleted,
  onSimulateAlert,
  onSelectCompany,
  onNavigateTab,
}: DeadlineReminderViewProps) {
  const [filter, setFilter] = useState<DeadlineFilter>('All');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [simulatedAlerts, setSimulatedAlerts] = useState<
    Array<{ id: string; title: string; detail: string; time: string; urgent: boolean }>
  >([
    {
      id: 'sim-init-1',
      title: 'Urgent Cutoff Alert: Google',
      detail: 'Registration closes Nov 25, 2026 at 11:59 PM. Resume verification ready.',
      time: 'Just now',
      urgent: true,
    },
  ]);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const enrichedDeadlines = useMemo(() => {
    return drives
      .map((drive) => {
        const countdown = computeCountdown(drive.deadline, elapsedMs);
        const isApplied = appliedCompanyIds.has(drive.id);
        const isMarkedDone = completedDeadlineIds.has(drive.id);
        const isCompleted = isApplied || isMarkedDone || countdown.totalHoursLeft <= 0;

        const category: DeadlineCategory = isCompleted
          ? 'Completed'
          : countdown.days <= 3
            ? 'Urgent'
            : 'Upcoming';

        const eligible = evaluateEligibility(profile, drive).eligible;

        return {
          drive,
          countdown,
          category,
          isApplied,
          isMarkedDone,
          eligible,
        };
      })
      .sort((a, b) => {
        const order: Record<DeadlineCategory, number> = {
          Urgent: 0,
          Upcoming: 1,
          Completed: 2,
        };
        if (order[a.category] !== order[b.category]) {
          return order[a.category] - order[b.category];
        }
        return a.drive.deadline.localeCompare(b.drive.deadline);
      });
  }, [drives, elapsedMs, appliedCompanyIds, completedDeadlineIds, profile]);

  const urgentCount = enrichedDeadlines.filter((d) => d.category === 'Urgent').length;
  const upcomingCount = enrichedDeadlines.filter((d) => d.category === 'Upcoming').length;
  const completedCount = enrichedDeadlines.filter((d) => d.category === 'Completed').length;

  const visibleDeadlines =
    filter === 'All'
      ? enrichedDeadlines
      : enrichedDeadlines.filter((d) => d.category === filter);

  const handleTriggerAlert = (drive: CompanyDrive, category: DeadlineCategory) => {
    const alertType = category === 'Urgent' ? 'Urgent' : 'Upcoming';
    onSimulateAlert(drive, alertType);
    setSimulatedAlerts((prev) => [
      {
        id: `sim-${Date.now()}`,
        title: `${alertType} Reminder: ${drive.companyName}`,
        detail: `${drive.roleTitle} cutoff on ${formatDisplayDate(drive.deadline)} (${drive.ctcDisplay}).`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgent: category === 'Urgent',
      },
      ...prev.slice(0, 4),
    ]);
  };

  const handleBroadcastDigest = () => {
    const nextUrgent = enrichedDeadlines.find((d) => d.category === 'Urgent');
    if (nextUrgent) {
      handleTriggerAlert(nextUrgent.drive, nextUrgent.category);
    } else if (enrichedDeadlines[0]) {
      handleTriggerAlert(enrichedDeadlines[0].drive, enrichedDeadlines[0].category);
    }
  };

  const filterTabs: Array<{ id: DeadlineFilter; label: string; count: number }> = [
    { id: 'All', label: 'All Deadlines', count: enrichedDeadlines.length },
    { id: 'Urgent', label: 'Urgent', count: urgentCount },
    { id: 'Upcoming', label: 'Upcoming', count: upcomingCount },
    { id: 'Completed', label: 'Completed', count: completedCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#C96D3B] tracking-tight">
            Smart Deadline Reminder System
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
            Drive Deadlines &amp; Live Countdowns
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor live registration cutoffs categorized into Urgent, Upcoming, and Completed with
            instant reminder alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBroadcastDigest}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] transition-colors whitespace-nowrap"
          >
            <BellRing strokeWidth={1.75} className="w-3.5 h-3.5" />
            <span>Simulate Deadline Alert</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigateTab('calendar')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-white text-xs font-semibold text-[#181A1F] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap"
          >
            <CalendarClock strokeWidth={1.75} className="w-3.5 h-3.5 text-[#0D5C63]" />
            <span>Open Calendar</span>
          </motion.button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={() => setFilter('Urgent')}
          className="text-left bg-white border border-[#E8E3DA] rounded-2xl p-5 hover:border-[#C96D3B]/45 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#C96D3B]">Urgent (&le; 3 Days)</span>
            <div className="w-8 h-8 rounded-xl bg-[#FCF3EC] text-[#C96D3B] flex items-center justify-center">
              <Flame strokeWidth={1.75} className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#181A1F] mt-2 tabular-nums">
            <AnimatedCounter value={urgentCount} />
          </p>
          <p className="text-xs text-slate-500 mt-1">Immediate registration action required</p>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={() => setFilter('Upcoming')}
          className="text-left bg-white border border-[#E8E3DA] rounded-2xl p-5 hover:border-[#0D5C63]/45 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0D5C63]">Upcoming (&gt; 3 Days)</span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF3F3] text-[#0D5C63] flex items-center justify-center">
              <Clock strokeWidth={1.75} className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#181A1F] mt-2 tabular-nums">
            <AnimatedCounter value={upcomingCount} />
          </p>
          <p className="text-xs text-slate-500 mt-1">Open drives in your upcoming window</p>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={() => setFilter('Completed')}
          className="text-left bg-white border border-[#E8E3DA] rounded-2xl p-5 hover:border-[#6D59A6]/45 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6D59A6]">Completed / Applied</span>
            <div className="w-8 h-8 rounded-xl bg-[#F3F0FA] text-[#6D59A6] flex items-center justify-center">
              <CheckCircle2 strokeWidth={1.75} className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#181A1F] mt-2 tabular-nums">
            <AnimatedCounter value={completedCount} />
          </p>
          <p className="text-xs text-slate-500 mt-1">Submitted or marked complete</p>
        </motion.button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFE8] border border-[#E8E3DA] rounded-xl w-fit">
        {filterTabs.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                active ? 'text-[#181A1F]' : 'text-slate-600 hover:text-[#181A1F]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="deadline-filter-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-lg bg-white shadow-xs"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              <span className="relative z-10 font-mono text-[11px] text-slate-500 tabular-nums">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Grid: Animated Countdown Cards + Simulated Notification Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {visibleDeadlines.map(({ drive, countdown, category, isApplied, isMarkedDone, eligible }) => {
              const urgencyPercent =
                category === 'Completed'
                  ? 100
                  : Math.max(12, Math.min(96, Math.round(((18 - countdown.days) / 18) * 100)));

              const badgeStyle =
                category === 'Urgent'
                  ? 'bg-[#FCF3EC] text-[#C96D3B] border-[#C96D3B]/30'
                  : category === 'Completed'
                    ? 'bg-[#F3F0FA] text-[#6D59A6] border-[#6D59A6]/25'
                    : 'bg-[#EAF3F3] text-[#0D5C63] border-[#0D5C63]/25';

              return (
                <motion.div
                  key={drive.id}
                  layout="position"
                  variants={staggerItemVariants}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  className="bg-white border border-[#E8E3DA] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-[#D7D0C4] transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <CompanyLogo
                          companyName={drive.companyName}
                          accentHex={drive.accentHex}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <h2 className="font-display text-base font-bold text-[#181A1F] truncate">
                            {drive.companyName}
                          </h2>
                          <p className="text-xs text-slate-500 truncate">{drive.roleTitle}</p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shrink-0 ${badgeStyle}`}
                      >
                        {category === 'Urgent' && <AlertTriangle strokeWidth={1.75} className="w-3 h-3" />}
                        {category === 'Completed' && <CheckCircle2 strokeWidth={1.75} className="w-3 h-3" />}
                        <span>{category}</span>
                      </span>
                    </div>

                    {/* Live Ticking Countdown Box */}
                    <div className="rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] p-3.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                        <span>Cutoff: {formatDisplayDate(drive.deadline)}</span>
                        <span className="font-mono font-semibold text-[#181A1F] tabular-nums">
                          {drive.ctcDisplay}
                        </span>
                      </div>

                      {category === 'Completed' ? (
                        <div className="py-1.5 flex items-center gap-2 text-xs font-semibold text-[#0D5C63]">
                          <CheckCircle2 strokeWidth={1.75} className="w-4 h-4" />
                          <span>
                            {isApplied
                              ? 'Application already submitted'
                              : 'Deadline reminder marked complete'}
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { label: 'Days', val: countdown.days },
                            { label: 'Hours', val: countdown.hours },
                            { label: 'Mins', val: countdown.minutes },
                            { label: 'Secs', val: countdown.seconds },
                          ].map((unit) => (
                            <div
                              key={unit.label}
                              className="rounded-lg bg-white border border-[#E8E3DA] py-1.5 px-1"
                            >
                              <p
                                className={`font-mono text-base font-bold tabular-nums ${
                                  category === 'Urgent' ? 'text-[#C96D3B]' : 'text-[#0D5C63]'
                                }`}
                              >
                                {String(unit.val).padStart(2, '0')}
                              </p>
                              <p className="text-[10px] text-slate-500">{unit.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3">
                        <AnimatedProgressBar
                          percent={urgencyPercent}
                          trackClassName="h-1.5 bg-[#E8E3DA]"
                          barClassName={
                            category === 'Urgent'
                              ? 'bg-[#C96D3B]'
                              : category === 'Completed'
                                ? 'bg-[#6D59A6]'
                                : 'bg-[#0D5C63]'
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F0ECE4]">
                    <div className="flex items-center gap-2">
                      {!isApplied && (
                        <button
                          type="button"
                          onClick={() => onToggleDeadlineCompleted(drive.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                            isMarkedDone
                              ? 'border-[#6D59A6]/30 bg-[#F3F0FA] text-[#6D59A6]'
                              : 'border-[#E8E3DA] bg-[#FAF8F5] text-slate-600 hover:text-[#181A1F]'
                          }`}
                        >
                          <Check strokeWidth={1.75} className="w-3 h-3" />
                          <span>{isMarkedDone ? 'Done' : 'Mark Done'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleTriggerAlert(drive, category)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E8E3DA] bg-white text-[11px] font-semibold text-[#0D5C63] hover:bg-[#EAF3F3] transition-colors"
                      >
                        <BellRing strokeWidth={1.75} className="w-3 h-3" />
                        <span>Remind</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectCompany(drive)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#181A1F] hover:text-[#0D5C63] transition-colors"
                    >
                      <span>{eligible ? 'Review & Apply' : 'Details'}</span>
                      <ExternalLink strokeWidth={1.75} className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Right Sidebar: Simulated Notification Alerts Feed */}
        <div className="lg:col-span-4 bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[#F0ECE4]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FCF3EC] text-[#C96D3B] flex items-center justify-center">
                <Sparkles strokeWidth={1.75} className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-[#181A1F]">
                  Simulated Alert Stream
                </h2>
                <p className="text-[11px] text-slate-500">Live reminder notifications</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {simulatedAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-xl border p-3.5 space-y-1 ${
                    alert.urgent
                      ? 'border-[#C96D3B]/30 bg-[#FCF3EC]/70'
                      : 'border-[#E8E3DA] bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#181A1F]">{alert.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.detail}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
