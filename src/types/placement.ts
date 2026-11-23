export type BranchCode = 'CSE' | 'IT' | 'ECE' | 'EEE' | 'MECH';

export type RoleCategory =
  | 'Software Engineer'
  | 'Data & AI'
  | 'Product & Analyst'
  | 'Embedded / Core';

export type ApplicationStage =
  | 'Applied'
  | 'Online Assessment'
  | 'Technical Interview'
  | 'HR & Managerial'
  | 'Offer Received';

export type WorkspaceTab =
  | 'dashboard'
  | 'opportunities'
  | 'deadlines'
  | 'eligibility'
  | 'compare'
  | 'skill-gap'
  | 'tracker'
  | 'calendar'
  | 'preparation'
  | 'roadmap'
  | 'profile';

export type DocumentCategory =
  | 'Resume'
  | 'Transcript'
  | 'Marksheet'
  | 'Certificate'
  | 'ID Proof';

export interface StudentDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'Document Uploaded' | 'Pending Upload';
}

export interface StudentProfile {
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  branch: BranchCode;
  batchYear: number;
  cgpa: number;
  activeBacklogs: number;
  tenthPercent: number;
  twelfthPercent: number;
  skills: string[];
  resumeFileName: string;
  resumeUpdatedAt: string;
  linkedinUrl: string;
  githubUrl: string;
  avatarUrl?: string;
  documents?: StudentDocument[];
}

export interface CompanyDrive {
  id: string;
  companyName: string;
  tagline: string;
  accentHex: string;
  roleTitle: string;
  roleCategory: RoleCategory;
  driveType: 'Full-Time' | 'Intern + PPO';
  ctcDisplay: string;
  ctcNumericLpa: number;
  location: string;
  deadline: string; // YYYY-MM-DD
  driveDate: string; // YYYY-MM-DD
  minCgpa: number;
  maxBacklogs: number;
  minTenthPercent: number;
  minTwelfthPercent: number;
  eligibleBranches: BranchCode[];
  requiredSkills: string[];
  description: string;
  rounds: string[];
  openingsCount: number;
}

export interface ApplicationRecord {
  id: string;
  companyId: string;
  stage: ApplicationStage;
  appliedAt: string;
  updatedAt: string;
  nextMilestone: string;
  notes: string;
}

export interface PrepTopic {
  id: string;
  category: 'DSA & Algorithms' | 'System Design' | 'Core CS (OS/DBMS/CN)' | 'Aptitude & SQL';
  title: string;
  estimatedHours: number;
  priority: 'High' | 'Medium';
  completed: boolean;
}

export interface InterviewArchive {
  id: string;
  companyName: string;
  role: string;
  difficulty: 'Moderate' | 'Challenging' | 'High';
  oaFormat: string;
  keyTopics: string[];
  sampleQuestions: string[];
  tip: string;
}

export interface HrQuestion {
  id: string;
  prompt: string;
  focusArea: string;
  starFrameworkHint: string;
  practiced: boolean;
}

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  type: 'application' | 'eligibility' | 'prep' | 'profile';
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  unread: boolean;
  targetTab?: WorkspaceTab;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'info' | 'warning';
}

export interface CriterionCheck {
  label: string;
  required: string;
  actual: string;
  passed: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  checks: CriterionCheck[];
  failureReasons: string[];
}

export type ChatRoleMode = 'placement_advisor' | 'mock_interviewer' | 'resume_coach';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  roleMode?: ChatRoleMode;
  isError?: boolean;
}

export interface SkillResource {
  title: string;
  provider: string;
  duration: string;
  focus: string;
}

export interface RoleSkillTarget {
  id: string;
  roleTitle: string;
  category: RoleCategory;
  summary: string;
  coreSkills: string[];
  bonusSkills: string[];
  resourcesBySkill: Record<string, SkillResource[]>;
}

export interface RoadmapMilestone {
  id: string;
  stepNumber: number;
  title: string;
  phaseWindow: string;
  summary: string;
  deliverables: string[];
  targetTab: WorkspaceTab;
  ctaLabel: string;
}

