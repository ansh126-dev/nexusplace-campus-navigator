import { useEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  LayoutGrid,
  Table2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  ApplicationRecord,
  ApplicationStage,
  CompanyDrive,
  WorkspaceTab,
} from '../types/placement';
import { APPLICATION_STAGES } from '../data/mockPlacementData';
import { CompanyLogo } from './CompanyLogo';
import { AnimatedProgressBar, EASE_OUT_EXPO, SPRING_SNAPPY } from './MotionPrimitives';

interface ApplicationTrackerViewProps {
  applications: ApplicationRecord[];
  drives: CompanyDrive[];
  onUpdateStage: (applicationId: string, nextStage: ApplicationStage) => void;
  onUpdateNotes: (applicationId: string, nextMilestone: string, notes: string) => void;
  onWithdraw: (applicationId: string) => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
  onSelectCompany: (drive: CompanyDrive) => void;
}

const STAGE_ACCENTS: Record<ApplicationStage, string> = {
  Applied: 'bg-slate-500',
  'Online Assessment': 'bg-[#6D59A6]',
  'Technical Interview': 'bg-[#0D5C63]',
  'HR & Managerial': 'bg-[#C96D3B]',
  'Offer Received': 'bg-emerald-600',
};

export function ApplicationTrackerView({
  applications,
  drives,
  onUpdateStage,
  onUpdateNotes,
  onWithdraw,
  onNavigateTab,
  onSelectCompany,
}: ApplicationTrackerViewProps) {
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [draftMilestone, setDraftMilestone] = useState('');
  const [draftNotes, setDraftNotes] = useState('');

  useEffect(() => {
    if (!editingAppId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingAppId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingAppId]);

  const driveMap = new Map(drives.map((d) => [d.id, d]));

  const openNotesEditor = (app: ApplicationRecord) => {
    setEditingAppId(app.id);
    setDraftMilestone(app.nextMilestone);
    setDraftNotes(app.notes);
  };

  const saveNotes = () => {
    if (!editingAppId) return;
    onUpdateNotes(editingAppId, draftMilestone, draftNotes);
    setEditingAppId(null);
  };

  const editingApp = applications.find((a) => a.id === editingAppId);
  const editingDrive = editingApp ? driveMap.get(editingApp.companyId) : undefined;

  return (
    <div className="space-y-7">
      {/* Header + View Switch */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#6D59A6] tracking-tight">Pipeline Status</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
            Application Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Move active drives across recruitment stages, monitor progress, and keep interview notes
            organized.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#F3EFE8] rounded-xl border border-[#E8E3DA]">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'board' ? 'text-[#181A1F]' : 'text-slate-600 hover:text-[#181A1F]'
              }`}
            >
              {viewMode === 'board' && (
                <motion.span
                  layoutId="tracker-view-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-lg bg-white shadow-xs"
                />
              )}
              <LayoutGrid strokeWidth={1.75} className="relative z-10 w-3.5 h-3.5" />
              <span className="relative z-10">Pipeline Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'text-[#181A1F]' : 'text-slate-600 hover:text-[#181A1F]'
              }`}
            >
              {viewMode === 'table' && (
                <motion.span
                  layoutId="tracker-view-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-lg bg-white shadow-xs"
                />
              )}
              <Table2 strokeWidth={1.75} className="relative z-10 w-3.5 h-3.5" />
              <span className="relative z-10">Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {applications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E8E3DA] rounded-2xl p-12 text-center"
        >
          <p className="font-display text-lg font-semibold text-[#181A1F]">
            No applications tracked yet
          </p>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Apply to eligible campus drives in the Opportunity Explorer to automatically track
            their stages here.
          </p>
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigateTab('opportunities')}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold hover:bg-[#09454B] transition-colors"
          >
            <span>Explore Opportunities</span>
            <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
          </motion.button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'board' ? (
            /* Kanban Pipeline Board */
            <motion.div
              key="board-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
            >
              <LayoutGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
                  {APPLICATION_STAGES.map((stage, stageIdx) => {
                    const stageApps = applications.filter((a) => a.stage === stage);
                    const progressPct = ((stageIdx + 1) / APPLICATION_STAGES.length) * 100;

                    return (
                      <div
                        key={stage}
                        className="bg-[#F3EFE8]/75 border border-[#E8E3DA] rounded-2xl p-3 flex flex-col gap-3 min-h-[340px]"
                      >
                        <div className="flex items-center justify-between gap-2 px-1">
                          <div className="min-w-0">
                            <h2 className="text-xs font-semibold text-[#181A1F] truncate">{stage}</h2>
                            <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                              Stage {stageIdx + 1}/{APPLICATION_STAGES.length}
                            </p>
                          </div>
                          <motion.span
                            key={stageApps.length}
                            initial={{ scale: 0.85 }}
                            animate={{ scale: 1 }}
                            transition={SPRING_SNAPPY}
                            className="w-6 h-6 rounded-lg bg-white border border-[#E8E3DA] text-xs font-mono font-semibold text-[#181A1F] flex items-center justify-center tabular-nums shrink-0"
                          >
                            {stageApps.length}
                          </motion.span>
                        </div>

                        {/* Stage cards */}
                        <div className="space-y-3 flex-1">
                          {stageApps.map((app) => {
                            const drive = driveMap.get(app.companyId);
                            if (!drive) return null;

                            const canStepBack = stageIdx > 0;
                            const canStepForward = stageIdx < APPLICATION_STAGES.length - 1;

                            return (
                              <motion.div
                                key={app.id}
                                layout
                                layoutId={app.id}
                                whileHover={{ y: -2 }}
                                transition={SPRING_SNAPPY}
                                className="bg-white border border-[#E8E3DA] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(24,26,31,0.03)] hover:border-[#D7D0C4] hover:shadow-sm transition-shadow space-y-3"
                              >
                                <div className="flex items-start gap-2.5">
                                  <CompanyLogo
                                    companyName={drive.companyName}
                                    accentHex={drive.accentHex}
                                    size="sm"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => onSelectCompany(drive)}
                                      className="text-left text-sm font-semibold text-[#181A1F] hover:text-[#0D5C63] truncate block w-full transition-colors"
                                    >
                                      {drive.companyName}
                                    </button>
                                    <p className="text-xs text-slate-500 truncate">{drive.roleTitle}</p>
                                  </div>
                                </div>

                                {/* GPU-composited Progress bar */}
                                <div className="space-y-1.5">
                                  <AnimatedProgressBar
                                    percent={progressPct}
                                    trackClassName="h-1.5 bg-[#F3EFE8]"
                                    barClassName={STAGE_ACCENTS[stage]}
                                    delay={0.04}
                                  />
                                  <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                    <Calendar strokeWidth={1.75} className="w-3 h-3 shrink-0 text-slate-400" />
                                    <span className="truncate">{app.nextMilestone}</span>
                                  </p>
                                </div>

                                {/* Stage Controls */}
                                <div className="pt-2.5 border-t border-[#F0ECE4] flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1">
                                    <motion.button
                                      type="button"
                                      whileTap={canStepBack ? { scale: 0.9 } : undefined}
                                      disabled={!canStepBack}
                                      onClick={() =>
                                        canStepBack &&
                                        onUpdateStage(app.id, APPLICATION_STAGES[stageIdx - 1])
                                      }
                                      aria-label="Move to previous stage"
                                      className="p-1.5 rounded-lg border border-[#E8E3DA] text-slate-600 hover:bg-[#FAF8F5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <ChevronLeft strokeWidth={1.75} className="w-3.5 h-3.5" />
                                    </motion.button>
                                    <motion.button
                                      type="button"
                                      whileHover={canStepForward ? { x: 1 } : undefined}
                                      whileTap={canStepForward ? { scale: 0.94 } : undefined}
                                      disabled={!canStepForward}
                                      onClick={() =>
                                        canStepForward &&
                                        onUpdateStage(app.id, APPLICATION_STAGES[stageIdx + 1])
                                      }
                                      aria-label="Advance to next stage"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAF3F3] text-[#0D5C63] hover:bg-[#DCEBEB] disabled:opacity-35 disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                                    >
                                      <span>{canStepForward ? 'Advance' : 'Offered'}</span>
                                      {canStepForward ? (
                                        <ChevronRight strokeWidth={1.75} className="w-3 h-3" />
                                      ) : (
                                        <CheckCircle2 strokeWidth={1.75} className="w-3 h-3" />
                                      )}
                                    </motion.button>
                                  </div>

                                  <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => openNotesEditor(app)}
                                    aria-label="Edit milestone and notes"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#181A1F] hover:bg-[#FAF8F5] transition-colors"
                                  >
                                    <FileText strokeWidth={1.75} className="w-3.5 h-3.5" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}

                          {stageApps.length === 0 && (
                            <div className="h-24 border border-dashed border-[#D7D0C4] rounded-xl flex items-center justify-center text-xs text-slate-400">
                              No drives in {stage}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LayoutGroup>
            </motion.div>
          ) : (
            /* Compact Data Table View */
            <motion.div
              key="table-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
              className="bg-white border border-[#E8E3DA] rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E3DA] bg-[#FAF8F5] text-xs font-medium text-slate-500">
                      <th className="py-3.5 px-5">Company &amp; Role</th>
                      <th className="py-3.5 px-4">Current Stage</th>
                      <th className="py-3.5 px-4">Next Milestone</th>
                      <th className="py-3.5 px-4 text-right">Package</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE4] text-sm">
                    {applications.map((app) => {
                      const drive = driveMap.get(app.companyId);
                      if (!drive) return null;

                      return (
                        <tr key={app.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <CompanyLogo
                                companyName={drive.companyName}
                                accentHex={drive.accentHex}
                                size="sm"
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => onSelectCompany(drive)}
                                  className="font-semibold text-[#181A1F] hover:text-[#0D5C63] transition-colors"
                                >
                                  {drive.companyName}
                                </button>
                                <p className="text-xs text-slate-500">{drive.roleTitle}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={app.stage}
                              onChange={(e) =>
                                onUpdateStage(app.id, e.target.value as ApplicationStage)
                              }
                              aria-label={`Stage for ${drive.companyName}`}
                              className="px-2.5 py-1.5 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-medium text-[#181A1F] focus:outline-none focus:border-[#0D5C63]"
                            >
                              {APPLICATION_STAGES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">{app.nextMilestone}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-[#181A1F] tabular-nums">
                            {drive.ctcDisplay}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.96 }}
                                onClick={() => openNotesEditor(app)}
                                className="px-2.5 py-1.5 rounded-lg border border-[#E8E3DA] text-xs font-medium text-[#181A1F] hover:bg-[#FAF8F5]"
                              >
                                Notes
                              </motion.button>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onWithdraw(app.id)}
                                aria-label={`Withdraw ${drive.companyName} application`}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#C96D3B] hover:bg-[#FCF3EC] transition-colors"
                              >
                                <Trash2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Notes & Milestone Modal */}
      <AnimatePresence>
        {editingApp && editingDrive && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setEditingAppId(null)}
              className="fixed inset-0 z-40 bg-[#181A1F]/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={SPRING_SNAPPY}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md bg-white border border-[#E8E3DA] rounded-2xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{editingDrive.companyName}</p>
                    <h3 className="font-display text-base font-bold text-[#181A1F]">
                      Round Milestone &amp; Notes
                    </h3>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.16 }}
                    onClick={() => setEditingAppId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#181A1F] hover:bg-[#FAF8F5]"
                  >
                    <X strokeWidth={1.75} className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="edit-stage"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Pipeline Stage
                    </label>
                    <select
                      id="edit-stage"
                      value={editingApp.stage}
                      onChange={(e) =>
                        onUpdateStage(editingApp.id, e.target.value as ApplicationStage)
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                    >
                      {APPLICATION_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="edit-milestone"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Next Milestone / Interview Date
                    </label>
                    <input
                      id="edit-milestone"
                      type="text"
                      value={draftMilestone}
                      onChange={(e) => setDraftMilestone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-notes"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Preparation &amp; Interview Notes
                    </label>
                    <textarea
                      id="edit-notes"
                      rows={4}
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onWithdraw(editingApp.id);
                      setEditingAppId(null);
                    }}
                    className="text-xs font-medium text-[#C96D3B] hover:underline transition-colors"
                  >
                    Withdraw Application
                  </button>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setEditingAppId(null)}
                      className="px-3.5 py-2 rounded-xl border border-[#E8E3DA] text-xs font-medium text-[#181A1F] hover:bg-[#FAF8F5]"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={saveNotes}
                      className="px-4 py-2 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B]"
                    >
                      Save Notes
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
