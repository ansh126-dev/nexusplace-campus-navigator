import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Circle, BookOpen, Building2, MessageSquare, Clock, Mic } from 'lucide-react';
import { HrQuestion, InterviewArchive, PrepTopic, StudentProfile } from '../types/placement';
import { INTERVIEW_ARCHIVES } from '../data/mockPlacementData';
import { MockInterviewSimulator } from './MockInterviewSimulator';
import {
  AnimatedProgressBar,
  EASE_OUT_EXPO,
  SPRING_SNAPPY,
  staggerContainerVariants,
  staggerItemVariants,
} from './MotionPrimitives';

interface PreparationHubViewProps {
  profile?: StudentProfile;
  prepTopics: PrepTopic[];
  hrQuestions: HrQuestion[];
  onToggleTopic: (topicId: string) => void;
  onToggleHrPracticed: (questionId: string) => void;
}

type PrepTab = 'checklist' | 'archives' | 'behavioral' | 'mock_interview';

const CATEGORIES: Array<'All' | PrepTopic['category']> = [
  'All',
  'DSA & Algorithms',
  'System Design',
  'Core CS (OS/DBMS/CN)',
  'Aptitude & SQL',
];

export function PreparationHubView({
  profile,
  prepTopics,
  hrQuestions,
  onToggleTopic,
  onToggleHrPracticed,
}: PreparationHubViewProps) {
  const [activeTab, setActiveTab] = useState<PrepTab>('checklist');
  const [categoryFilter, setCategoryFilter] = useState<'All' | PrepTopic['category']>('All');
  const [revealedHints, setRevealedHints] = useState<Set<string>>(new Set());

  const completedCount = prepTopics.filter((t) => t.completed).length;
  const readinessPercent = prepTopics.length
    ? Math.round((completedCount / prepTopics.length) * 100)
    : 0;

  const filteredTopics =
    categoryFilter === 'All'
      ? prepTopics
      : prepTopics.filter((t) => t.category === categoryFilter);

  const toggleHint = (id: string) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const prepTabs: Array<{ id: PrepTab; label: string; icon: typeof BookOpen }> = [
    { id: 'checklist', label: 'Topic Checklist', icon: BookOpen },
    { id: 'archives', label: 'Company Archives', icon: Building2 },
    { id: 'behavioral', label: 'HR & Behavioral Prep', icon: MessageSquare },
    { id: 'mock_interview', label: 'Mock Interview', icon: Mic },
  ];

  return (
    <div className="space-y-7">
      {/* Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
        className="bg-white border border-[#E8E3DA] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
      >
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-[#6D59A6]">Placement Preparation Hub</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
              Structured Interview &amp; OA Readiness
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-xl">
              Track high-priority DSA patterns, inspect past campus interview questions from
              recruiting partners, and rehearse STAR behavioral answers.
            </p>
          </div>

          <div className="space-y-2 max-w-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Overall Syllabus Completion</span>
              <span className="font-mono font-semibold text-[#0D5C63] tabular-nums">
                {completedCount}/{prepTopics.length} modules · {readinessPercent}%
              </span>
            </div>
            <AnimatedProgressBar
              percent={readinessPercent}
              trackClassName="h-2.5 bg-[#F3EFE8]"
              barClassName="bg-[#0D5C63]"
              delay={0.08}
            />
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[190px] bg-[#FAF8F5]">
          <img
            src="/src/assets/images/prep_interview_banner_1795435997727.jpg"
            alt="Minimalist student desk with architecture notes and laptop ready for technical interview preparation"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      {/* Section Tabs with sliding layoutId indicator */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFE8] border border-[#E8E3DA] rounded-xl w-fit">
        {prepTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active ? 'text-[#181A1F]' : 'text-slate-600 hover:text-[#181A1F]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="prep-tab-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-lg bg-white shadow-xs"
                />
              )}
              <Icon strokeWidth={1.75} className="relative z-10 w-3.5 h-3.5" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'checklist' && (
          <motion.div
            key="prep-checklist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#0D5C63] border-[#0D5C63] text-white'
                      : 'bg-white border-[#E8E3DA] text-slate-600 hover:text-[#181A1F] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>

            <div className="bg-white border border-[#E8E3DA] rounded-2xl divide-y divide-[#F0ECE4]">
              <AnimatePresence mode="popLayout">
                {filteredTopics.map((topic) => (
                  <motion.button
                    key={topic.id}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    onClick={() => onToggleTopic(topic.id)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <motion.div
                        key={topic.completed ? 'checked' : 'unchecked'}
                        initial={{ scale: 0.7 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                        className="shrink-0 mt-0.5"
                      >
                        {topic.completed ? (
                          <CheckCircle2 strokeWidth={1.75} className="w-5 h-5 text-[#0D5C63]" />
                        ) : (
                          <Circle strokeWidth={1.75} className="w-5 h-5 text-slate-300" />
                        )}
                      </motion.div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium transition-colors ${
                            topic.completed ? 'line-through text-slate-400' : 'text-[#181A1F]'
                          }`}
                        >
                          {topic.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {topic.category} · Priority: {topic.priority}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums shrink-0">
                      <Clock strokeWidth={1.75} className="w-3.5 h-3.5 text-slate-400" />
                      {topic.estimatedHours}h
                    </span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeTab === 'archives' && (
          <motion.div
            key="prep-archives"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {INTERVIEW_ARCHIVES.map((archive: InterviewArchive) => (
              <motion.div
                key={archive.id}
                variants={staggerItemVariants}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18 }}
                className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4 hover:border-[#D7D0C4] hover:shadow-[0_12px_28px_-12px_rgba(24,26,31,0.08)] transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {archive.companyName} · Difficulty: {archive.difficulty}
                    </p>
                    <h2 className="font-display text-lg font-semibold text-[#181A1F] mt-0.5">
                      {archive.role}
                    </h2>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl p-3.5">
                  <span className="font-semibold text-[#181A1F] block mb-0.5">OA Pattern</span>
                  {archive.oaFormat}
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#181A1F] mb-2">
                    Frequently Asked Campus Questions
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {archive.sampleQuestions.map((q) => (
                      <li key={q} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3.5 border-t border-[#F0ECE4] text-xs text-slate-600">
                  <span className="font-semibold text-[#6D59A6]">Interviewer Tip: </span>
                  {archive.tip}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'behavioral' && (
          <motion.div
            key="prep-behavioral"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {hrQuestions.map((item) => {
              const hintVisible = revealedHints.has(item.id);
              return (
                <motion.div
                  key={item.id}
                  variants={staggerItemVariants}
                  whileHover={{ y: -2 }}
                  className="bg-white border border-[#E8E3DA] rounded-2xl p-6 flex flex-col justify-between gap-4 hover:border-[#D7D0C4] transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#6D59A6]">
                      Focus: {item.focusArea}
                    </p>
                    <h3 className="font-display text-base font-semibold text-[#181A1F] mt-1.5 leading-snug">
                      &ldquo;{item.prompt}&rdquo;
                    </h3>

                    <AnimatePresence>
                      {hintVisible && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                        >
                          <p className="mt-3.5 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] text-xs text-slate-600 leading-relaxed">
                            <span className="font-semibold text-[#181A1F] block mb-1">
                              STAR Answer Structure
                            </span>
                            {item.starFrameworkHint}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-3.5 border-t border-[#F0ECE4] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleHint(item.id)}
                      className="text-xs font-semibold text-[#0D5C63] hover:text-[#09454B] transition-colors"
                    >
                      {hintVisible ? 'Hide STAR Guide' : 'Show STAR Guide'}
                    </button>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onToggleHrPracticed(item.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        item.practiced
                          ? 'bg-[#EAF3F3] border border-[#0D5C63]/20 text-[#0D5C63]'
                          : 'border border-[#E8E3DA] text-slate-700 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                      <span>{item.practiced ? 'Practiced' : 'Mark Practiced'}</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'mock_interview' && (
          <motion.div
            key="prep-mock-interview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
          >
            <MockInterviewSimulator profile={profile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
