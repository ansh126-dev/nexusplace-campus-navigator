import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { StudentProfile, WorkspaceTab } from '../types/placement';
import { ALL_ANALYZER_SKILLS, TARGET_ROLE_SKILLS } from '../data/mockPlacementData';
import { AnimatedCounter } from './AnimatedCounter';
import { AnimatedProgressBar, EASE_OUT_EXPO, SPRING_SNAPPY } from './MotionPrimitives';

interface SkillGapAnalyzerViewProps {
  profile: StudentProfile;
  onSyncSkillsToProfile: (skills: string[]) => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
  onAskAiPlan: (roleTitle: string, missingSkills: string[]) => void;
}

export function SkillGapAnalyzerView({
  profile,
  onSyncSkillsToProfile,
  onNavigateTab,
  onAskAiPlan,
}: SkillGapAnalyzerViewProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(TARGET_ROLE_SKILLS[0].id);
  const [currentSkills, setCurrentSkills] = useState<string[]>(profile.skills);
  const [customSkillInput, setCustomSkillInput] = useState('');

  useEffect(() => {
    setCurrentSkills(profile.skills);
  }, [profile.skills]);

  const targetRole = useMemo(
    () => TARGET_ROLE_SKILLS.find((r) => r.id === selectedRoleId) ?? TARGET_ROLE_SKILLS[0],
    [selectedRoleId]
  );

  const normalizedCurrentSet = useMemo(
    () => new Set(currentSkills.map((s) => s.toLowerCase())),
    [currentSkills]
  );

  const allRoleSkills = useMemo(
    () => [...targetRole.coreSkills, ...targetRole.bonusSkills],
    [targetRole]
  );

  const matchedCore = targetRole.coreSkills.filter((s) =>
    normalizedCurrentSet.has(s.toLowerCase())
  );
  const missingCore = targetRole.coreSkills.filter(
    (s) => !normalizedCurrentSet.has(s.toLowerCase())
  );

  const matchedBonus = targetRole.bonusSkills.filter((s) =>
    normalizedCurrentSet.has(s.toLowerCase())
  );
  const missingBonus = targetRole.bonusSkills.filter(
    (s) => !normalizedCurrentSet.has(s.toLowerCase())
  );

  const missingAll = [...missingCore, ...missingBonus];

  // Weighted readiness score: core skills 75%, bonus skills 25%
  const coreRatio = targetRole.coreSkills.length
    ? matchedCore.length / targetRole.coreSkills.length
    : 1;
  const bonusRatio = targetRole.bonusSkills.length
    ? matchedBonus.length / targetRole.bonusSkills.length
    : 1;
  const readinessScore = Math.round(coreRatio * 75 + bonusRatio * 25);

  const selectableSkillPool = useMemo(() => {
    const merged = new Set([...ALL_ANALYZER_SKILLS, ...allRoleSkills, ...currentSkills]);
    return Array.from(merged);
  }, [allRoleSkills, currentSkills]);

  const toggleSkill = (skill: string) => {
    setCurrentSkills((prev) => {
      const exists = prev.some((s) => s.toLowerCase() === skill.toLowerCase());
      if (exists) {
        return prev.filter((s) => s.toLowerCase() !== skill.toLowerCase());
      }
      return [...prev, skill];
    });
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setCurrentSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkillInput('');
  };

  const skillsModified =
    currentSkills.length !== profile.skills.length ||
    currentSkills.some((s, idx) => s !== profile.skills[idx]);

  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - readinessScore / 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#6D59A6] tracking-tight">
            Skill Gap Analyzer
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
            Role Readiness &amp; Skill Gap Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Select a target placement role, toggle your active skillset, and get curated resources
            for missing competencies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {skillsModified && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSyncSkillsToProfile(currentSkills)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] transition-colors whitespace-nowrap"
            >
              <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
              <span>Save Skills to Profile</span>
            </motion.button>
          )}
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAskAiPlan(targetRole.roleTitle, missingAll)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-white text-xs font-semibold text-[#181A1F] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap"
          >
            <Sparkles strokeWidth={1.75} className="w-3.5 h-3.5 text-[#6D59A6]" />
            <span>Ask AI for Study Sprint</span>
          </motion.button>
        </div>
      </div>

      {/* Role Selector Strip */}
      <div className="bg-white border border-[#E8E3DA] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#181A1F]">1. Select Target Role</p>
            <p className="text-xs text-slate-500 mt-0.5">{targetRole.summary}</p>
          </div>
          <span className="text-xs font-mono text-[#0D5C63] font-semibold shrink-0">
            {targetRole.category}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TARGET_ROLE_SKILLS.map((role) => {
            const active = role.id === selectedRoleId;
            return (
              <motion.button
                key={role.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRoleId(role.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-[#0D5C63] border-[#0D5C63] text-white'
                    : 'bg-[#FAF8F5] border-[#E8E3DA] text-slate-700 hover:bg-white hover:border-[#0D5C63]/40'
                }`}
              >
                {role.roleTitle}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Interactive Current Skill Selection + Animated Gap Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Select Current Skills & Required Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0ECE4]">
              <div>
                <h2 className="font-display text-base font-semibold text-[#181A1F]">
                  2. Select Your Current Skills
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-loaded from your student profile. Click any skill to toggle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentSkills(profile.skills)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D5C63] hover:underline shrink-0"
              >
                <RotateCcw strokeWidth={1.75} className="w-3 h-3" />
                <span>Reset to Profile</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectableSkillPool.map((skill) => {
                const selected = normalizedCurrentSet.has(skill.toLowerCase());
                const isRequired = allRoleSkills.some(
                  (r) => r.toLowerCase() === skill.toLowerCase()
                );

                return (
                  <motion.button
                    key={skill}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    transition={SPRING_SNAPPY}
                    onClick={() => toggleSkill(skill)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-[#EAF3F3] border-[#0D5C63]/35 text-[#0D5C63] font-semibold'
                        : isRequired
                          ? 'bg-[#FCF3EC]/70 border-[#C96D3B]/30 text-[#181A1F] hover:border-[#C96D3B]'
                          : 'bg-[#FAF8F5] border-[#E8E3DA] text-slate-600 hover:text-[#181A1F]'
                    }`}
                  >
                    {selected && <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />}
                    <span>{skill}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder="Add another skill (e.g. Kubernetes, GraphQL)..."
                aria-label="Add custom current skill"
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] transition-colors"
              >
                <Plus strokeWidth={1.75} className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Required Skills & Missing Skills Breakdown */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-5">
            <h2 className="font-display text-base font-semibold text-[#181A1F]">
              Required Skills Breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#0D5C63]/20 bg-[#EAF3F3]/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0D5C63]">Matched Skills</span>
                  <span className="font-mono font-bold text-[#0D5C63] tabular-nums">
                    {matchedCore.length + matchedBonus.length}/{allRoleSkills.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[...matchedCore, ...matchedBonus].length === 0 ? (
                    <span className="text-xs text-slate-500">No role skills selected yet</span>
                  ) : (
                    [...matchedCore, ...matchedBonus].map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#0D5C63]/20 text-[11px] font-semibold text-[#0D5C63]"
                      >
                        <CheckCircle2 strokeWidth={1.75} className="w-3 h-3" />
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#C96D3B]/30 bg-[#FCF3EC]/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#C96D3B]">Missing Skills</span>
                  <span className="font-mono font-bold text-[#C96D3B] tabular-nums">
                    {missingAll.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {missingAll.length === 0 ? (
                    <span className="text-xs font-medium text-[#0D5C63]">
                      Zero gaps — all required &amp; bonus skills covered!
                    </span>
                  ) : (
                    missingAll.map((skill) => {
                      const isCore = missingCore.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          title="Click if you already know this skill"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#C96D3B]/30 text-[11px] font-semibold text-[#C96D3B] hover:border-[#0D5C63]"
                        >
                          <AlertCircle strokeWidth={1.75} className="w-3 h-3" />
                          <span>
                            {skill} {isCore ? '(Core)' : ''}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Animated Visualization + Preparation Resources */}
        <div className="lg:col-span-5 space-y-6">
          {/* Animated Skill Gap Ring & Bars */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63]" />
                <h3 className="font-display text-base font-semibold text-[#181A1F]">
                  Skill Coverage Visualization
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#0D5C63] tabular-nums">
                {readinessScore}% Fit
              </span>
            </div>

            <div className="flex items-center gap-6 py-2">
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r={ringRadius}
                    fill="none"
                    stroke="#E8E3DA"
                    strokeWidth="9"
                  />
                  <motion.circle
                    cx="56"
                    cy="56"
                    r={ringRadius}
                    fill="none"
                    stroke="#0D5C63"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    initial={{ strokeDashoffset: ringCircumference }}
                    animate={{ strokeDashoffset: ringOffset }}
                    transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold text-[#181A1F] tabular-nums">
                    <AnimatedCounter value={readinessScore} suffix="%" />
                  </span>
                  <span className="text-[10px] text-slate-500">Match</span>
                </div>
              </div>

              <div className="flex-1 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Core Role Skills</span>
                    <span className="font-mono text-[#0D5C63] font-semibold tabular-nums">
                      {matchedCore.length}/{targetRole.coreSkills.length}
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percent={Math.round(coreRatio * 100)}
                    trackClassName="h-2 bg-[#F3EFE8]"
                    barClassName="bg-[#0D5C63]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Bonus Differentiators</span>
                    <span className="font-mono text-[#6D59A6] font-semibold tabular-nums">
                      {matchedBonus.length}/{targetRole.bonusSkills.length}
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percent={Math.round(bonusRatio * 100)}
                    trackClassName="h-2 bg-[#F3EFE8]"
                    barClassName="bg-[#6D59A6]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Preparation Resources for Missing Skills */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F0ECE4]">
              <div className="flex items-center gap-2">
                <BookOpen strokeWidth={1.75} className="w-4 h-4 text-[#6D59A6]" />
                <h3 className="font-display text-base font-semibold text-[#181A1F]">
                  Suggested Prep Resources
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('preparation')}
                className="text-xs font-semibold text-[#0D5C63] hover:underline"
              >
                Open Prep Hub
              </button>
            </div>

            {missingAll.length === 0 ? (
              <div className="rounded-xl bg-[#EAF3F3] border border-[#0D5C63]/20 p-4 text-xs text-[#0D5C63] space-y-2">
                <p className="font-semibold">All skills for {targetRole.roleTitle} are covered!</p>
                <p className="text-slate-600">
                  Head to the Opportunity Explorer or run a Gemini Mock Interview to test your
                  readiness.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab('opportunities')}
                  className="inline-flex items-center gap-1 font-semibold text-[#0D5C63] hover:underline"
                >
                  <Compass strokeWidth={1.75} className="w-3.5 h-3.5" />
                  <span>Explore matching drives</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {missingAll.map((skill) => {
                    const resources = targetRole.resourcesBySkill[skill] ?? [
                      {
                        title: `${skill} Core Fundamentals & Interview Drills`,
                        provider: 'NexusPlace Prep Track',
                        duration: '4 hrs',
                        focus: 'Hands-on patterns and common campus interview questions',
                      },
                    ];

                    return resources.map((res) => (
                      <motion.div
                        key={`${skill}-${res.title}`}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                        className="rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-[#C96D3B]">Missing: {skill}</span>
                          <span className="font-mono text-slate-500">{res.duration}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#181A1F]">{res.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {res.provider} · {res.focus}
                        </p>
                        <button
                          type="button"
                          onClick={() => onNavigateTab('preparation')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D5C63] hover:underline pt-1"
                        >
                          <span>Start module in Prep Hub</span>
                          <ArrowRight strokeWidth={1.75} className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ));
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
