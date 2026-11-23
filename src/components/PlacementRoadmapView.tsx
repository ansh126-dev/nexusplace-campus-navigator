import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Circle,
  Code2,
  FileText,
  MessageSquare,
  RotateCcw,
  Users,
  Calculator,
} from 'lucide-react';
import { WorkspaceTab } from '../types/placement';
import { INITIAL_ROADMAP_MILESTONES } from '../data/mockPlacementData';
import { AnimatedCounter } from './AnimatedCounter';
import {
  AnimatedProgressBar,
  EASE_OUT_EXPO,
  SPRING_SNAPPY,
  staggerContainerVariants,
  staggerItemVariants,
} from './MotionPrimitives';

interface PlacementRoadmapViewProps {
  completedMilestoneIds: Set<string>;
  onToggleMilestone: (milestoneId: string) => void;
  onResetRoadmap: () => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
}

const STEP_ICONS = [
  FileText,
  Calculator,
  Code2,
  MessageSquare,
  Briefcase,
  Award,
  Users,
];

export function PlacementRoadmapView({
  completedMilestoneIds,
  onToggleMilestone,
  onResetRoadmap,
  onNavigateTab,
}: PlacementRoadmapViewProps) {
  const totalCount = INITIAL_ROADMAP_MILESTONES.length;
  const completedCount = INITIAL_ROADMAP_MILESTONES.filter((m) =>
    completedMilestoneIds.has(m.id)
  ).length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const nextMilestone = INITIAL_ROADMAP_MILESTONES.find(
    (m) => !completedMilestoneIds.has(m.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0D5C63] tracking-tight">
            Placement Roadmap
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
            End-to-End Campus Readiness Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Follow the 7-stage placement journey from resume polish to final HR offer conversion.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onResetRoadmap}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8E3DA] bg-white text-xs font-semibold text-[#181A1F] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw strokeWidth={1.75} className="w-3.5 h-3.5" />
          <span>Reset Progress</span>
        </motion.button>
      </div>

      {/* Overall Roadmap Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
        className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Overall Roadmap Completion</p>
            <div className="flex items-baseline gap-3 mt-1">
              <p className="font-display text-3xl font-bold text-[#181A1F] tabular-nums">
                <AnimatedCounter value={progressPercent} suffix="%" />
              </p>
              <span className="font-mono text-xs text-[#0D5C63] font-semibold tabular-nums">
                {completedCount} of {totalCount} milestones completed
              </span>
            </div>
          </div>

          {nextMilestone ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold text-[#C96D3B]">
                  Next Up · Step {nextMilestone.stepNumber}
                </p>
                <p className="text-xs font-semibold text-[#181A1F]">{nextMilestone.title}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab(nextMilestone.targetTab)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] transition-colors shrink-0"
              >
                <span>{nextMilestone.ctaLabel}</span>
                <ArrowRight strokeWidth={1.75} className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-[#EAF3F3] border border-[#0D5C63]/20 px-4 py-2.5 text-xs font-semibold text-[#0D5C63]">
              <CheckCircle2 strokeWidth={1.75} className="w-4 h-4" />
              <span>All 7 placement milestones completed!</span>
            </div>
          )}
        </div>

        <AnimatedProgressBar
          percent={progressPercent}
          trackClassName="h-2.5 bg-[#F3EFE8]"
          barClassName="bg-[#0D5C63]"
        />
      </motion.div>

      {/* Interactive Vertical Timeline */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="relative pl-6 sm:pl-10 space-y-5"
      >
        {/* Vertical Track Line */}
        <div
          aria-hidden="true"
          className="absolute left-3 sm:left-5 top-4 bottom-4 w-0.5 bg-[#E8E3DA] rounded-full overflow-hidden"
        >
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${progressPercent}%` }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
            className="w-full bg-[#0D5C63]"
          />
        </div>

        {INITIAL_ROADMAP_MILESTONES.map((milestone, index) => {
          const completed = completedMilestoneIds.has(milestone.id);
          const Icon = STEP_ICONS[index % STEP_ICONS.length];

          return (
            <motion.div
              key={milestone.id}
              variants={staggerItemVariants}
              className="relative"
            >
              {/* Timeline Node Marker */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                transition={SPRING_SNAPPY}
                onClick={() => onToggleMilestone(milestone.id)}
                aria-label={`Toggle ${milestone.title} completion`}
                className={`absolute -left-6 sm:-left-10 top-6 w-6 h-6 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center transition-colors shadow-xs ${
                  completed
                    ? 'bg-[#0D5C63] border-[#0D5C63] text-white'
                    : 'bg-white border-[#D7D0C4] text-slate-500 hover:border-[#0D5C63]'
                }`}
              >
                {completed ? (
                  <CheckCircle2 strokeWidth={2} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <span className="font-mono text-[11px] font-bold">{milestone.stepNumber}</span>
                )}
              </motion.button>

              {/* Milestone Card */}
              <div
                className={`bg-white border rounded-2xl p-5 sm:p-6 transition-colors ${
                  completed
                    ? 'border-[#0D5C63]/30 bg-[#EAF3F3]/20'
                    : 'border-[#E8E3DA] hover:border-[#D7D0C4]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D59A6]">
                        <Icon strokeWidth={1.75} className="w-3.5 h-3.5" />
                        <span>{milestone.phaseWindow}</span>
                      </span>
                      {completed && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D5C63]">
                          · Completed
                        </span>
                      )}
                    </div>

                    <h2
                      className={`font-display text-lg font-bold ${
                        completed ? 'text-[#0D5C63]' : 'text-[#181A1F]'
                      }`}
                    >
                      {milestone.stepNumber}. {milestone.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {milestone.summary}
                    </p>

                    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      {milestone.deliverables.map((task) => (
                        <li
                          key={task}
                          className="rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] px-3 py-2 text-xs text-slate-600 leading-relaxed"
                        >
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2.5 shrink-0">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onToggleMilestone(milestone.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                        completed
                          ? 'bg-[#EAF3F3] border-[#0D5C63]/25 text-[#0D5C63]'
                          : 'bg-white border-[#E8E3DA] text-[#181A1F] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                      ) : (
                        <Circle strokeWidth={1.75} className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{completed ? 'Completed' : 'Mark Completed'}</span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => onNavigateTab(milestone.targetTab)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D5C63] hover:underline whitespace-nowrap"
                    >
                      <span>{milestone.ctaLabel}</span>
                      <ArrowRight strokeWidth={1.75} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
