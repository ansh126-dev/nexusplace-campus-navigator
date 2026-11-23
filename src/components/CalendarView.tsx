import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Users,
  FileCheck2,
  X,
  Briefcase,
} from 'lucide-react';
import { ApplicationRecord, CompanyDrive, WorkspaceTab } from '../types/placement';
import { formatDisplayDate } from '../utils/eligibility';
import { CompanyLogo } from './CompanyLogo';
import { EASE_OUT_EXPO, SPRING_SNAPPY } from './MotionPrimitives';

export type ScheduleTaskCategory = 'deadline' | 'interview' | 'aptitude';

export interface CalendarTaskItem {
  id: string;
  dateStr: string; // YYYY-MM-DD
  category: ScheduleTaskCategory;
  title: string;
  detail: string;
  metaLabel: string;
  companyName: string;
  accentHex: string;
  drive: CompanyDrive;
  targetTab?: WorkspaceTab;
}

interface CalendarViewProps {
  drives: CompanyDrive[];
  applications: ApplicationRecord[];
  onSelectCompany: (drive: CompanyDrive) => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
  embedded?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY_ISO = '2026-11-23';

const CATEGORY_META: Record<
  ScheduleTaskCategory,
  {
    label: string;
    shortLabel: string;
    dotClass: string;
    chipClass: string;
    textClass: string;
    icon: typeof Clock;
  }
> = {
  deadline: {
    label: 'Application Deadlines',
    shortLabel: 'Deadline',
    dotClass: 'bg-[#6D59A6]',
    chipClass: 'bg-[#F3F0FA] text-[#6D59A6] border-[#6D59A6]/20',
    textClass: 'text-[#6D59A6]',
    icon: Clock,
  },
  interview: {
    label: 'Interview Dates',
    shortLabel: 'Interview',
    dotClass: 'bg-[#0D5C63]',
    chipClass: 'bg-[#EAF3F3] text-[#0D5C63] border-[#0D5C63]/20',
    textClass: 'text-[#0D5C63]',
    icon: Users,
  },
  aptitude: {
    label: 'Aptitude Test Schedules',
    shortLabel: 'Aptitude Test',
    dotClass: 'bg-[#C96D3B]',
    chipClass: 'bg-[#FCF3EC] text-[#C96D3B] border-[#C96D3B]/20',
    textClass: 'text-[#C96D3B]',
    icon: FileCheck2,
  },
};

function shiftIsoDate(dateStr: string, deltaDays: number): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  dt.setDate(dt.getDate() + deltaDays);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseMilestoneDate(text: string): string | null {
  const isoMatch = text.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  const monthMap: Record<string, string> = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };

  const textMatch = text.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\b/i
  );
  if (textMatch) {
    const mon = monthMap[textMatch[1].slice(0, 3).toLowerCase()];
    const day = String(Number(textMatch[2])).padStart(2, '0');
    const year = mon === '01' || mon === '02' ? '2027' : '2026';
    return `${year}-${mon}-${day}`;
  }
  return null;
}

export function CalendarView({
  drives,
  applications,
  onSelectCompany,
  onNavigateTab,
  embedded = false,
}: CalendarViewProps) {
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10); // 10 = November (current month)
  const [activeDatePopover, setActiveDatePopover] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | ScheduleTaskCategory>('all');
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeDatePopover) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        gridContainerRef.current &&
        !gridContainerRef.current.contains(e.target as Node)
      ) {
        setActiveDatePopover(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDatePopover(null);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDatePopover]);

  const allTasks = useMemo<CalendarTaskItem[]>(() => {
    const tasks: CalendarTaskItem[] = [];

    // 1. Application tracker milestones (interviews, OAs, shortlist deadlines)
    for (const app of applications) {
      const drive = drives.find((d) => d.id === app.companyId);
      if (!drive) continue;

      const parsedDate = parseMilestoneDate(app.nextMilestone);
      if (parsedDate) {
        let category: ScheduleTaskCategory = 'deadline';
        if (
          app.stage === 'Technical Interview' ||
          app.stage === 'HR & Managerial' ||
          /interview|round|culture|discussion/i.test(app.nextMilestone)
        ) {
          category = 'interview';
        } else if (
          app.stage === 'Online Assessment' ||
          /oa|codility|hackerrank|assessment|test|aptitude/i.test(app.nextMilestone)
        ) {
          category = 'aptitude';
        }

        tasks.push({
          id: `app-${app.id}`,
          dateStr: parsedDate,
          category,
          title: `${drive.companyName} · ${app.stage}`,
          detail: app.nextMilestone,
          metaLabel: `${drive.roleTitle} · ${drive.ctcDisplay}`,
          companyName: drive.companyName,
          accentHex: drive.accentHex,
          drive,
          targetTab: 'tracker',
        });
      }
    }

    // 2. Company drive application deadlines, aptitude test schedules & campus interview dates
    for (const drive of drives) {
      tasks.push({
        id: `deadline-${drive.id}`,
        dateStr: drive.deadline,
        category: 'deadline',
        title: `${drive.companyName} · Application Deadline`,
        detail: `Registration closes for ${drive.roleTitle}`,
        metaLabel: `${drive.ctcDisplay} · ${drive.openingsCount} openings`,
        companyName: drive.companyName,
        accentHex: drive.accentHex,
        drive,
        targetTab: 'opportunities',
      });

      // Aptitude / online test schedule scheduled midpoint between deadline and drive date
      const deadlineMs = new Date(`${drive.deadline}T00:00:00`).getTime();
      const driveMs = new Date(`${drive.driveDate}T00:00:00`).getTime();
      const gapDays = Math.round((driveMs - deadlineMs) / (1000 * 60 * 60 * 24));
      const testDate = shiftIsoDate(drive.deadline, Math.max(1, Math.floor(gapDays / 2)));

      tasks.push({
        id: `aptitude-${drive.id}`,
        dateStr: testDate,
        category: 'aptitude',
        title: `${drive.companyName} · Aptitude & Coding Test`,
        detail: drive.rounds[0] ?? 'Online screening assessment',
        metaLabel: `${drive.roleTitle} · Round 1`,
        companyName: drive.companyName,
        accentHex: drive.accentHex,
        drive,
        targetTab: 'preparation',
      });

      tasks.push({
        id: `interview-${drive.id}`,
        dateStr: drive.driveDate,
        category: 'interview',
        title: `${drive.companyName} · Campus Interviews`,
        detail: `${drive.rounds[1] ?? 'Technical & HR interviews'} (${drive.location})`,
        metaLabel: `${drive.roleTitle} · ${drive.driveType}`,
        companyName: drive.companyName,
        accentHex: drive.accentHex,
        drive,
        targetTab: 'opportunities',
      });
    }

    return tasks.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [drives, applications]);

  const filteredTasks = useMemo(() => {
    if (categoryFilter === 'all') return allTasks;
    return allTasks.filter((t) => t.category === categoryFilter);
  }, [allTasks, categoryFilter]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTaskItem[]>();
    for (const task of filteredTasks) {
      const list = map.get(task.dateStr) ?? [];
      list.push(task);
      map.set(task.dateStr, list);
    }
    return map;
  }, [filteredTasks]);

  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      iso: string;
      dayNumber: number;
      inCurrentMonth: boolean;
    }> = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        iso: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
        dayNumber: dayNum,
        inCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        iso: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNumber: d,
        inCurrentMonth: true,
      });
    }

    const totalSlots = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalSlots) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        iso: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`,
        dayNumber: nextDay,
        inCurrentMonth: false,
      });
      nextDay++;
    }

    return cells;
  }, [viewYear, viewMonth]);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthTasks = useMemo(
    () => allTasks.filter((t) => t.dateStr.startsWith(monthKey)),
    [allTasks, monthKey]
  );

  const monthCounts = useMemo(() => {
    return {
      deadline: monthTasks.filter((t) => t.category === 'deadline').length,
      aptitude: monthTasks.filter((t) => t.category === 'aptitude').length,
      interview: monthTasks.filter((t) => t.category === 'interview').length,
    };
  }, [monthTasks]);

  const nextUpcomingTask = useMemo(
    () => filteredTasks.find((t) => t.dateStr >= TODAY_ISO) ?? null,
    [filteredTasks]
  );

  const handlePrevMonth = () => {
    setActiveDatePopover(null);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setActiveDatePopover(null);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    setViewYear(2026);
    setViewMonth(10);
    setActiveDatePopover(TODAY_ISO);
  };

  const filterTabs: Array<{ id: 'all' | ScheduleTaskCategory; label: string }> = [
    { id: 'all', label: 'All Tasks' },
    { id: 'deadline', label: 'Deadlines' },
    { id: 'aptitude', label: 'Aptitude Tests' },
    { id: 'interview', label: 'Interviews' },
  ];

  const totalRows = Math.ceil(calendarCells.length / 7);

  return (
    <div className={embedded ? '' : 'space-y-6'}>
      {/* Standalone Page Header (when opened as dedicated Calendar tab) */}
      {!embedded && (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0D5C63] tracking-tight">
              Schedule &amp; Milestones
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
              Placement Calendar
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Click any date in the monthly grid to inspect application deadlines, aptitude tests,
              and scheduled interviews.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E3DA] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6D59A6]" />
              <span className="text-slate-600">Deadlines:</span>
              <span className="font-mono font-semibold text-[#181A1F] tabular-nums">
                {monthCounts.deadline}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E3DA] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C96D3B]" />
              <span className="text-slate-600">Aptitude Tests:</span>
              <span className="font-mono font-semibold text-[#181A1F] tabular-nums">
                {monthCounts.aptitude}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E3DA] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0D5C63]" />
              <span className="text-slate-600">Interviews:</span>
              <span className="font-mono font-semibold text-[#181A1F] tabular-nums">
                {monthCounts.interview}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
        aria-label="Monthly Placement Calendar Grid"
        className="bg-white border border-[#E8E3DA] rounded-2xl p-5 sm:p-6"
      >
        {/* Controls Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#F0ECE4]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3F3] text-[#0D5C63] flex items-center justify-center shrink-0 mt-0.5">
              <CalendarIcon strokeWidth={1.75} className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display text-base font-semibold text-[#181A1F]">
                  {MONTH_NAMES[viewMonth]} {viewYear} Schedule
                </h2>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  · {monthTasks.length} scheduled items
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any date cell to open task details · Synced with active drives &amp; tracker
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Tabs */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA]">
              {filterTabs.map((tab) => {
                const active = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'text-[#0D5C63]'
                        : 'text-slate-600 hover:text-[#181A1F]'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId={embedded ? 'cal-embed-pill' : 'cal-full-pill'}
                        transition={SPRING_SNAPPY}
                        className="absolute inset-0 rounded-lg bg-white border border-[#E8E3DA] shadow-[0_1px_2px_rgba(24,26,31,0.05)]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleJumpToday}
                className="px-3 py-1.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-semibold text-slate-700 hover:bg-[#F3EFE8] hover:text-[#181A1F] transition-colors"
              >
                Today
              </button>
              <div className="inline-flex items-center rounded-xl border border-[#E8E3DA] bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="p-2 text-slate-600 hover:bg-[#FAF8F5] hover:text-[#181A1F] transition-colors"
                >
                  <ChevronLeft strokeWidth={1.75} className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-display font-semibold text-[#181A1F] min-w-[126px] text-center tabular-nums">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="p-2 text-slate-600 hover:bg-[#FAF8F5] hover:text-[#181A1F] transition-colors"
                >
                  <ChevronRight strokeWidth={1.75} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Legend & Quick Full-View Link */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {(Object.keys(CATEGORY_META) as ScheduleTaskCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <div key={cat} className="inline-flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                  <span className="font-medium">{meta.label}</span>
                </div>
              );
            })}
          </div>

          {embedded && (
            <button
              type="button"
              onClick={() => onNavigateTab('calendar')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D5C63] hover:text-[#09454B] transition-colors"
            >
              <span>Open Full Calendar</span>
              <ArrowUpRight strokeWidth={1.75} className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 7-Column Calendar Grid Container (overflow-visible so date popovers render cleanly) */}
        <div
          ref={gridContainerRef}
          className="border border-[#E8E3DA] rounded-2xl bg-white relative"
        >
          {/* Weekday Header Row */}
          <div className="grid grid-cols-7 border-b border-[#E8E3DA] bg-[#FAF8F5] rounded-t-2xl overflow-hidden">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Grid Cells */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewYear}-${viewMonth}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
              className="grid grid-cols-7"
            >
              {calendarCells.map((cell, idx) => {
                const dayTasks = tasksByDate.get(cell.iso) ?? [];
                const isToday = cell.iso === TODAY_ISO;
                const isPopoverOpen = activeDatePopover === cell.iso;
                const colIdx = idx % 7;
                const rowIdx = Math.floor(idx / 7);
                const alignRight = colIdx >= 4;
                const openUpward = rowIdx >= totalRows - 2;
                const isLastRow = rowIdx === totalRows - 1;

                return (
                  <div
                    key={cell.iso}
                    className={`relative border-b border-r border-[#EFECE6] ${
                      colIdx === 6 ? 'border-r-0' : ''
                    } ${isLastRow ? 'border-b-0' : ''} ${
                      isLastRow && colIdx === 0 ? 'rounded-bl-2xl' : ''
                    } ${isLastRow && colIdx === 6 ? 'rounded-br-2xl' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDatePopover((prev) =>
                          prev === cell.iso ? null : cell.iso
                        )
                      }
                      aria-expanded={isPopoverOpen}
                      aria-label={`${formatDisplayDate(cell.iso)}${
                        dayTasks.length > 0 ? `, ${dayTasks.length} scheduled items` : ''
                      }`}
                      className={`w-full min-h-[82px] sm:min-h-[96px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-colors focus:outline-none ${
                        !cell.inCurrentMonth
                          ? 'bg-[#FAF8F5]/65 text-slate-400'
                          : 'bg-white'
                      } ${
                        isPopoverOpen
                          ? 'ring-2 ring-inset ring-[#0D5C63] bg-[#EAF3F3]/35'
                          : 'hover:bg-[#FAF8F5]'
                      } ${isLastRow && colIdx === 0 ? 'rounded-bl-2xl' : ''} ${
                        isLastRow && colIdx === 6 ? 'rounded-br-2xl' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-mono tabular-nums flex items-center justify-center ${
                            isToday
                              ? 'bg-[#0D5C63] text-white font-bold'
                              : isPopoverOpen
                                ? 'text-[#0D5C63] font-bold'
                                : cell.inCurrentMonth
                                  ? 'text-[#181A1F] font-medium'
                                  : 'text-slate-400'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {dayTasks.length > 0 && (
                          <span className="font-mono text-[10px] font-semibold text-slate-400 tabular-nums hidden sm:inline">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {/* Compact mobile dots */}
                      {dayTasks.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 sm:hidden">
                          {dayTasks.slice(0, 3).map((task) => (
                            <span
                              key={task.id}
                              className={`w-1.5 h-1.5 rounded-full ${
                                CATEGORY_META[task.category].dotClass
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Desktop / Laptop event chips inside grid cells */}
                      <div className="hidden sm:flex flex-col gap-1 mt-1.5 w-full">
                        {dayTasks.slice(0, 2).map((task) => {
                          const meta = CATEGORY_META[task.category];
                          return (
                            <div
                              key={task.id}
                              className={`px-1.5 py-0.5 rounded-md border text-[10px] font-medium truncate flex items-center gap-1 ${meta.chipClass}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`}
                              />
                              <span className="truncate">
                                {task.companyName} · {meta.shortLabel}
                              </span>
                            </div>
                          );
                        })}
                        {dayTasks.length > 2 && (
                          <span className="text-[10px] font-mono text-slate-500 pl-1 tabular-nums">
                            +{dayTasks.length - 2} more
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Anchored Date Task Details Popover */}
                    <AnimatePresence>
                      {isPopoverOpen && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            scale: 0.95,
                            y: openUpward ? 6 : -6,
                          }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            y: openUpward ? 6 : -6,
                          }}
                          transition={SPRING_SNAPPY}
                          role="dialog"
                          aria-label={`Schedule details for ${formatDisplayDate(cell.iso)}`}
                          className={`absolute z-30 w-72 sm:w-80 bg-white border border-[#E8E3DA] rounded-2xl shadow-[0_20px_48px_-12px_rgba(24,26,31,0.22)] p-4 ${
                            alignRight ? 'right-0' : 'left-0'
                          } ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                        >
                          {/* Popover Header */}
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#F0ECE4]">
                            <div>
                              <p className="text-[11px] font-semibold text-[#0D5C63]">
                                {isToday ? 'Today · Scheduled Tasks' : 'Date Schedule'}
                              </p>
                              <h3 className="font-display text-sm font-bold text-[#181A1F] mt-0.5 tabular-nums">
                                {formatDisplayDate(cell.iso)}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveDatePopover(null)}
                              aria-label="Close date details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#181A1F] hover:bg-[#FAF8F5] transition-colors"
                            >
                              <X strokeWidth={1.75} className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Popover Task List */}
                          {dayTasks.length === 0 ? (
                            <div className="py-4 text-center space-y-2.5">
                              <p className="text-xs font-medium text-slate-700">
                                No deadlines, aptitude tests, or interviews on this date.
                              </p>
                              {nextUpcomingTask && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const dt = new Date(
                                      `${nextUpcomingTask.dateStr}T00:00:00`
                                    );
                                    setViewYear(dt.getFullYear());
                                    setViewMonth(dt.getMonth());
                                    setActiveDatePopover(nextUpcomingTask.dateStr);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF3F3] text-[#0D5C63] text-xs font-semibold hover:bg-[#DCEBEB] transition-colors"
                                >
                                  <span>
                                    Jump to {formatDisplayDate(nextUpcomingTask.dateStr)}
                                  </span>
                                  <ArrowUpRight strokeWidth={1.75} className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                              {dayTasks.map((task) => {
                                const meta = CATEGORY_META[task.category];
                                const Icon = meta.icon;
                                return (
                                  <div
                                    key={task.id}
                                    className="rounded-xl border border-[#E8E3DA] bg-[#FAF8F5]/75 p-3 space-y-2"
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <CompanyLogo
                                        companyName={task.companyName}
                                        accentHex={task.accentHex}
                                        size="sm"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <span
                                          className={`inline-flex items-center gap-1 text-[10px] font-semibold ${meta.textClass}`}
                                        >
                                          <Icon strokeWidth={1.75} className="w-3 h-3" />
                                          <span>{meta.shortLabel}</span>
                                        </span>
                                        <p className="text-xs font-semibold text-[#181A1F] leading-snug mt-0.5">
                                          {task.title}
                                        </p>
                                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                          {task.detail}
                                        </p>
                                        <p className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                                          <Briefcase strokeWidth={1.75} className="w-3 h-3" />
                                          <span>{task.metaLabel}</span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-1.5 border-t border-[#E8E3DA]/80">
                                      {task.targetTab === 'tracker' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveDatePopover(null);
                                            onNavigateTab('tracker');
                                          }}
                                          className="text-[11px] font-semibold text-[#6D59A6] hover:underline"
                                        >
                                          Open Tracker
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveDatePopover(null);
                                          onSelectCompany(task.drive);
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D5C63] hover:underline"
                                      >
                                        <span>View Drive</span>
                                        <ArrowUpRight
                                          strokeWidth={1.75}
                                          className="w-3 h-3"
                                        />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}
