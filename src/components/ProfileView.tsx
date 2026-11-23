import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  FileText,
  Plus,
  X,
  RotateCcw,
  Upload,
  Save,
  FolderCheck,
  Award,
  GraduationCap,
  ShieldCheck,
  Clock,
  Trash2,
  Camera,
  ImagePlus,
} from 'lucide-react';
import {
  BranchCode,
  DocumentCategory,
  StudentDocument,
  StudentProfile,
} from '../types/placement';
import { INITIAL_STUDENT_DOCUMENTS } from '../data/mockPlacementData';
import { StudentAvatar, resolveCustomAvatarUrl } from './StudentAvatar';
import {
  EASE_OUT_EXPO,
  SPRING_SNAPPY,
  staggerContainerVariants,
  staggerItemVariants,
} from './MotionPrimitives';

interface ProfileViewProps {
  profile: StudentProfile;
  onSaveProfile: (updated: StudentProfile) => void;
  onResetDemoData: () => void;
}

const BRANCHES: BranchCode[] = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];
const DOC_CATEGORIES: DocumentCategory[] = [
  'Resume',
  'Transcript',
  'Marksheet',
  'Certificate',
  'ID Proof',
];

function getInitialDocuments(profile: StudentProfile): StudentDocument[] {
  const baseDocs =
    profile.documents && profile.documents.length > 0
      ? profile.documents
      : INITIAL_STUDENT_DOCUMENTS;
  return baseDocs.map((doc) =>
    doc.id === 'doc-resume'
      ? {
          ...doc,
          fileName: profile.resumeFileName,
          uploadedAt: profile.resumeUpdatedAt,
          status: 'Document Uploaded',
        }
      : doc
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = Math.round(bytes / 1024);
  if (kb < 1024) return `${kb} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAndResizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        reject(new Error('Empty image data.'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        const maxSize = 360;
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputType, 0.88));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileView({
  profile,
  onSaveProfile,
  onResetDemoData,
}: ProfileViewProps) {
  const [draft, setDraft] = useState<StudentProfile>(profile);
  const [cgpaInput, setCgpaInput] = useState(profile.cgpa.toString());
  const [backlogsInput, setBacklogsInput] = useState(profile.activeBacklogs.toString());
  const [tenthInput, setTenthInput] = useState(profile.tenthPercent.toString());
  const [twelfthInput, setTwelfthInput] = useState(profile.twelfthPercent.toString());
  const [newSkill, setNewSkill] = useState('');

  const [documents, setDocuments] = useState<StudentDocument[]>(() =>
    getInitialDocuments(profile)
  );
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Certificate');
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [lastUploadedNotice, setLastUploadedNotice] = useState<{
    title: string;
    fileName: string;
    uploadedAt: string;
  } | null>(() => {
    const initialDocs = getInitialDocuments(profile);
    const firstUploaded = initialDocs.find((d) => d.status === 'Document Uploaded');
    return firstUploaded
      ? {
          title: firstUploaded.title,
          fileName: firstUploaded.fileName,
          uploadedAt: firstUploaded.uploadedAt,
        }
      : null;
  });

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUpdatedNotice, setAvatarUpdatedNotice] = useState(false);

  useEffect(() => {
    setDraft(profile);
    setCgpaInput(profile.cgpa.toString());
    setBacklogsInput(profile.activeBacklogs.toString());
    setTenthInput(profile.tenthPercent.toString());
    setTwelfthInput(profile.twelfthPercent.toString());
    const syncedDocs = getInitialDocuments(profile);
    setDocuments(syncedDocs);
    const firstUploaded = syncedDocs.find((d) => d.status === 'Document Uploaded');
    if (firstUploaded) {
      setLastUploadedNotice({
        title: firstUploaded.title,
        fileName: firstUploaded.fileName,
        uploadedAt: firstUploaded.uploadedAt,
      });
    }
  }, [profile]);

  const buildNormalizedProfile = (
    nextDocs?: StudentDocument[],
    nextAvatarUrl?: string | null
  ): StudentProfile => {
    const resolvedAvatar =
      nextAvatarUrl === null
        ? undefined
        : nextAvatarUrl !== undefined
          ? nextAvatarUrl
          : resolveCustomAvatarUrl(draft.avatarUrl);

    return {
      ...draft,
      cgpa: Math.min(10, Math.max(0, parseFloat(cgpaInput) || 0)),
      activeBacklogs: Math.max(0, parseInt(backlogsInput, 10) || 0),
      tenthPercent: Math.min(100, Math.max(0, parseFloat(tenthInput) || 0)),
      twelfthPercent: Math.min(100, Math.max(0, parseFloat(twelfthInput) || 0)),
      avatarUrl: resolvedAvatar,
      documents: nextDocs ?? documents,
    };
  };

  const handleAvatarFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Profile image must be under 5 MB.');
      return;
    }

    try {
      setAvatarError(null);
      const dataUrl = await readAndResizeAvatar(file);
      const updated = buildNormalizedProfile(undefined, dataUrl);
      setDraft(updated);
      onSaveProfile(updated);
      setAvatarUpdatedNotice(true);
    } catch {
      setAvatarError('Could not process that image. Please try another file.');
    }
  };

  const handleResetAvatar = () => {
    setAvatarError(null);
    const updated = buildNormalizedProfile(undefined, null);
    setDraft(updated);
    onSaveProfile(updated);
    setAvatarUpdatedNotice(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = buildNormalizedProfile();
    setDraft(normalized);
    onSaveProfile(normalized);
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || draft.skills.includes(trimmed)) return;
    const base = buildNormalizedProfile();
    const updated = { ...base, skills: [...base.skills, trimmed] };
    setDraft(updated);
    onSaveProfile(updated);
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    const base = buildNormalizedProfile();
    const updated = { ...base, skills: base.skills.filter((s) => s !== skill) };
    setDraft(updated);
    onSaveProfile(updated);
  };

  const handleSimulateResumeUpdate = () => {
    const nextFileName = `${draft.name.replace(/\s+/g, '_')}_Resume_Updated.pdf`;
    const nextDate = 'Nov 23, 2026';
    const nextDocs = documents.map((doc) =>
      doc.id === 'doc-resume'
        ? {
            ...doc,
            fileName: nextFileName,
            fileSize: '264 KB',
            uploadedAt: nextDate,
            status: 'Document Uploaded' as const,
          }
        : doc
    );
    const base = buildNormalizedProfile(nextDocs);
    const updated: StudentProfile = {
      ...base,
      resumeFileName: nextFileName,
      resumeUpdatedAt: nextDate,
      documents: nextDocs,
    };
    setDocuments(nextDocs);
    setLastUploadedNotice({
      title: 'Primary Placement Resume',
      fileName: nextFileName,
      uploadedAt: nextDate,
    });
    setDraft(updated);
    onSaveProfile(updated);
  };

  const commitUploadedFile = (
    fileName: string,
    fileSize: string,
    targetDocId?: string | null
  ) => {
    const uploadedAt = 'Nov 23, 2026';
    let nextDocs: StudentDocument[];
    let nextResumeName = draft.resumeFileName;
    let nextResumeDate = draft.resumeUpdatedAt;
    let noticeTitle = '';

    if (targetDocId) {
      const target = documents.find((d) => d.id === targetDocId);
      noticeTitle = target?.title ?? 'Academic Document';
      nextDocs = documents.map((doc) =>
        doc.id === targetDocId
          ? {
              ...doc,
              fileName,
              fileSize,
              uploadedAt,
              status: 'Document Uploaded' as const,
            }
          : doc
      );
      if (targetDocId === 'doc-resume') {
        nextResumeName = fileName;
        nextResumeDate = uploadedAt;
      }
    } else {
      noticeTitle =
        customDocTitle.trim() || `${uploadCategory} Document`;
      const newDoc: StudentDocument = {
        id: `doc-${Date.now()}`,
        title: noticeTitle,
        category: uploadCategory,
        fileName,
        fileSize,
        uploadedAt,
        status: 'Document Uploaded',
      };
      nextDocs = [newDoc, ...documents];
      if (uploadCategory === 'Resume') {
        nextResumeName = fileName;
        nextResumeDate = uploadedAt;
      }
    }

    const base = buildNormalizedProfile(nextDocs);
    const updated: StudentProfile = {
      ...base,
      resumeFileName: nextResumeName,
      resumeUpdatedAt: nextResumeDate,
      documents: nextDocs,
    };

    setDocuments(nextDocs);
    setLastUploadedNotice({ title: noticeTitle, fileName, uploadedAt });
    setCustomDocTitle('');
    setDraft(updated);
    onSaveProfile(updated);
  };

  const handleGeneralFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    commitUploadedFile(file.name, formatBytes(file.size), null);
    e.target.value = '';
  };

  const handleReplaceFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingDocId) return;
    commitUploadedFile(file.name, formatBytes(file.size), replacingDocId);
    setReplacingDocId(null);
    e.target.value = '';
  };

  const handleSimulateDocumentUpload = () => {
    const safeName = draft.name.replace(/\s+/g, '_');
    const simulatedName = `${safeName}_${uploadCategory.replace(/\s+/g, '_')}.pdf`;
    commitUploadedFile(simulatedName, '310 KB', null);
  };

  const handleRemoveDocument = (docId: string) => {
    const nextDocs = documents.filter((d) => d.id !== docId);
    const updated = buildNormalizedProfile(nextDocs);
    setDocuments(nextDocs);
    setDraft(updated);
    onSaveProfile(updated);
  };

  const uploadedCount = documents.filter((d) => d.status === 'Document Uploaded').length;
  const hasCustomAvatar = Boolean(resolveCustomAvatarUrl(draft.avatarUrl));

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#0D5C63] tracking-tight">Student Record</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181A1F] mt-1">
            Student Profile &amp; Resume
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Updating your CGPA, branch, or backlogs instantly recalculates eligibility across all
            campus drives.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onResetDemoData}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8E3DA] bg-white text-xs font-semibold text-[#181A1F] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw strokeWidth={1.75} className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </motion.button>
      </div>

      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Main Academic Form */}
        <motion.form
          variants={staggerItemVariants}
          onSubmit={handleSubmit}
          className="lg:col-span-8 bg-white border border-[#E8E3DA] rounded-2xl p-6 sm:p-7 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F0ECE4]">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <StudentAvatar
                  avatarUrl={draft.avatarUrl}
                  name={draft.name}
                  size="lg"
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  aria-label="Change profile photo"
                  title="Upload profile image"
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-[#0D5C63] text-white border-2 border-white flex items-center justify-center shadow-sm hover:bg-[#09454B] transition-colors"
                >
                  <Camera strokeWidth={1.75} className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-[#181A1F]">{draft.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {draft.rollNumber} · {draft.branch} · Class of {draft.batchYear}
                </p>
                {avatarError ? (
                  <p className="text-[11px] font-medium text-[#C96D3B] mt-1.5">{avatarError}</p>
                ) : avatarUpdatedNotice ? (
                  <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D5C63] mt-1.5">
                    <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span>Profile photo updated</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    JPG, PNG, or WebP up to 5 MB
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => void handleAvatarFileSelect(e)}
                className="hidden"
                aria-label="Upload profile image"
              />
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => avatarFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-semibold text-[#181A1F] hover:bg-[#F3EFE8] transition-colors whitespace-nowrap"
              >
                <ImagePlus strokeWidth={1.75} className="w-3.5 h-3.5 text-[#0D5C63]" />
                <span>Upload Photo</span>
              </motion.button>

              {hasCustomAvatar && (
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleResetAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E3DA] bg-white text-xs font-medium text-slate-600 hover:text-[#181A1F] hover:bg-[#FAF8F5] transition-colors whitespace-nowrap"
                >
                  <RotateCcw strokeWidth={1.75} className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </motion.button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="prof-roll" className="block text-xs font-medium text-slate-700 mb-1.5">
                University Roll Number
              </label>
              <input
                id="prof-roll"
                type="text"
                required
                value={draft.rollNumber}
                onChange={(e) => setDraft({ ...draft, rollNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                University Email
              </label>
              <input
                id="prof-email"
                type="email"
                required
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="prof-branch" className="block text-xs font-medium text-slate-700 mb-1.5">
                Branch
              </label>
              <select
                id="prof-branch"
                value={draft.branch}
                onChange={(e) => setDraft({ ...draft, branch: e.target.value as BranchCode })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-cgpa" className="block text-xs font-medium text-slate-700 mb-1.5">
                Cumulative GPA (out of 10.0)
              </label>
              <input
                id="prof-cgpa"
                type="number"
                step={0.01}
                min={0}
                max={10}
                required
                value={cgpaInput}
                onChange={(e) => setCgpaInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="prof-backlogs"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Active Backlogs
              </label>
              <input
                id="prof-backlogs"
                type="number"
                min={0}
                max={15}
                required
                value={backlogsInput}
                onChange={(e) => setBacklogsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="prof-10" className="block text-xs font-medium text-slate-700 mb-1.5">
                10th Percentage (%)
              </label>
              <input
                id="prof-10"
                type="number"
                step={0.1}
                min={35}
                max={100}
                required
                value={tenthInput}
                onChange={(e) => setTenthInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="prof-12" className="block text-xs font-medium text-slate-700 mb-1.5">
                12th Percentage (%)
              </label>
              <input
                id="prof-12"
                type="number"
                step={0.1}
                min={35}
                max={100}
                required
                value={twelfthInput}
                onChange={(e) => setTwelfthInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <motion.button
              type="submit"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold hover:bg-[#09454B] transition-colors"
            >
              <Save strokeWidth={1.75} className="w-4 h-4" />
              <span>Save Profile &amp; Recalculate Eligibility</span>
            </motion.button>
          </div>
        </motion.form>

        {/* Right Column: Skills & Resume */}
        <motion.div variants={staggerItemVariants} className="lg:col-span-4 space-y-6">
          {/* Resume Card */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-[#181A1F]">
                Placement Resume
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D5C63]">
                <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] flex items-center gap-3">
              <FileText strokeWidth={1.75} className="w-5 h-5 text-[#0D5C63] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#181A1F] truncate">
                  {draft.resumeFileName}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Updated {draft.resumeUpdatedAt}
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSimulateResumeUpdate}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E3DA] text-xs font-semibold text-[#181A1F] hover:bg-[#FAF8F5] transition-colors"
            >
              <Upload strokeWidth={1.75} className="w-3.5 h-3.5" />
              <span>Upload Revised PDF</span>
            </motion.button>
          </div>

          {/* Skills Manager */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-[#181A1F]">
              Verified Technical Skills
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. Docker)"
                aria-label="Add technical skill"
                className="flex-1 px-3 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handleAddSkill}
                aria-label="Add skill"
                className="px-3 py-2 rounded-xl bg-[#0D5C63] text-white hover:bg-[#09454B] transition-colors"
              >
                <Plus strokeWidth={1.75} className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {draft.skills.map((skill) => (
                  <motion.div
                    key={skill}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.75, opacity: 0 }}
                    transition={SPRING_SNAPPY}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F0FA] text-xs font-medium text-[#181A1F]"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      className="text-slate-400 hover:text-[#181A1F]"
                    >
                      <X strokeWidth={1.75} className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Documents Section: Uploaded Resume, Academic Records & Upload Status Placeholder */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.12, ease: EASE_OUT_EXPO }}
        aria-label="Academic and Placement Documents"
        className="bg-white border border-[#E8E3DA] rounded-2xl p-6 sm:p-7 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#F0ECE4]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF3F3] text-[#0D5C63] flex items-center justify-center shrink-0">
              <FolderCheck strokeWidth={1.75} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#181A1F]">Documents</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                View your uploaded resume and academic verification records required by campus
                recruiters.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0D5C63] font-mono tabular-nums shrink-0">
            <CheckCircle2 strokeWidth={1.75} className="w-4 h-4" />
            <span>
              {uploadedCount} of {documents.length} Document Uploaded
            </span>
          </div>
        </div>

        {/* Hidden file inputs for real browser file selection */}
        <input
          ref={generalFileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleGeneralFileSelect}
          className="hidden"
        />
        <input
          ref={replaceFileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleReplaceFileSelect}
          className="hidden"
        />

        {/* Placeholder Area for Uploading & Displaying 'Document Uploaded' Statuses */}
        <div className="rounded-2xl border-2 border-dashed border-[#D7D0C4] bg-[#FAF8F5]/75 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#181A1F]">
                Document Upload &amp; Status Placeholder
              </p>
              <p className="text-xs text-slate-500">
                Upload a resume, consolidated marksheet, or certificate (PDF / PNG) to verify your
                academic dossier.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                aria-label="Document category"
                className="px-3 py-2 rounded-xl border border-[#E8E3DA] bg-white text-xs font-medium text-[#181A1F] focus:outline-none focus:border-[#0D5C63]"
              >
                {DOC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={customDocTitle}
                onChange={(e) => setCustomDocTitle(e.target.value)}
                placeholder="Document title (optional)"
                aria-label="Document title"
                className="px-3 py-2 rounded-xl border border-[#E8E3DA] bg-white text-xs text-[#181A1F] placeholder:text-slate-400 focus:outline-none focus:border-[#0D5C63] w-44 sm:w-52"
              />

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => generalFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] transition-colors whitespace-nowrap"
              >
                <Upload strokeWidth={1.75} className="w-3.5 h-3.5" />
                <span>Choose File</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSimulateDocumentUpload}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-white text-xs font-semibold text-[#181A1F] hover:bg-[#F3EFE8] transition-colors whitespace-nowrap"
              >
                <Plus strokeWidth={1.75} className="w-3.5 h-3.5 text-[#0D5C63]" />
                <span>Quick Demo Upload</span>
              </motion.button>
            </div>
          </div>

          {/* Dedicated 'Document Uploaded' Status Placeholder Banner */}
          <AnimatePresence mode="wait">
            {lastUploadedNotice && (
              <motion.div
                key={`${lastUploadedNotice.title}-${lastUploadedNotice.fileName}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                className="rounded-xl border border-[#0D5C63]/25 bg-[#EAF3F3]/75 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0D5C63]">
                      Document Uploaded
                    </p>
                    <p className="text-xs text-[#181A1F] truncate mt-0.5">
                      {lastUploadedNotice.title} ·{' '}
                      <span className="font-mono text-[11px]">{lastUploadedNotice.fileName}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
                  Verified · {lastUploadedNotice.uploadedAt}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Uploaded Resume & Academic Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {documents.map((doc) => {
              const isUploaded = doc.status === 'Document Uploaded';
              const isDefaultDoc = [
                'doc-resume',
                'doc-transcript',
                'doc-12th',
                'doc-10th',
                'doc-internship',
              ].includes(doc.id);

              const CategoryIcon =
                doc.category === 'Transcript'
                  ? GraduationCap
                  : doc.category === 'Certificate'
                    ? Award
                    : doc.category === 'ID Proof'
                      ? ShieldCheck
                      : FileText;

              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  className="rounded-2xl border border-[#E8E3DA] bg-[#FAF8F5]/55 p-4 flex flex-col justify-between gap-3 hover:border-[#D7D0C4] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isUploaded
                            ? 'bg-[#EAF3F3] text-[#0D5C63]'
                            : 'bg-[#FCF3EC] text-[#C96D3B]'
                        }`}
                      >
                        <CategoryIcon strokeWidth={1.75} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#181A1F] truncate">
                          {doc.title}
                        </p>
                        <p className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                          {doc.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                          {doc.category} · {doc.fileSize} · {doc.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 ${
                        isUploaded ? 'text-[#0D5C63]' : 'text-[#C96D3B]'
                      }`}
                    >
                      {isUploaded ? (
                        <CheckCircle2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                      ) : (
                        <Clock strokeWidth={1.75} className="w-3.5 h-3.5" />
                      )}
                      <span>{doc.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#E8E3DA]/80">
                    <button
                      type="button"
                      onClick={() => {
                        setReplacingDocId(doc.id);
                        replaceFileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0D5C63] hover:underline"
                    >
                      <Upload strokeWidth={1.75} className="w-3.5 h-3.5" />
                      <span>{isUploaded ? 'Replace Document' : 'Upload Document'}</span>
                    </button>

                    {!isDefaultDoc && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#C96D3B] transition-colors"
                      >
                        <Trash2 strokeWidth={1.75} className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}
