import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  LayoutDashboard,
  Compass,
  ShieldCheck,
  Kanban,
  BookOpen,
  User,
  Search,
  Bell,
  Menu,
  X,
  ArrowLeft,
  Check,
  Bot,
  Calendar,
  LogOut,
  Clock,
  Scale,
  Target,
  Route,
} from 'lucide-react';
import {
  ActivityItem,
  ApplicationRecord,
  ApplicationStage,
  AppNotification,
  ChatMessage,
  ChatRoleMode,
  CompanyDrive,
  HrQuestion,
  PrepTopic,
  StudentProfile,
  ToastMessage,
  WorkspaceTab,
} from './types/placement';
import {
  COMPANY_DRIVES,
  INITIAL_ACTIVITIES,
  INITIAL_APPLICATIONS,
  INITIAL_HR_QUESTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PREP_TOPICS,
  INITIAL_STUDENT_PROFILE,
} from './data/mockPlacementData';
import { evaluateEligibility, getDaysRemaining } from './utils/eligibility';
import { NexusPlaceMark } from './components/CompanyLogo';
import { StudentAvatar, resolveCustomAvatarUrl } from './components/StudentAvatar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { OpportunitiesView } from './components/OpportunitiesView';
import { EligibilityCheckerView } from './components/EligibilityCheckerView';
import { ApplicationTrackerView } from './components/ApplicationTrackerView';
import { PreparationHubView } from './components/PreparationHubView';
import { ProfileView } from './components/ProfileView';
import { CalendarView } from './components/CalendarView';
import { DeadlineReminderView } from './components/DeadlineReminderView';
import { SkillGapAnalyzerView } from './components/SkillGapAnalyzerView';
import { CompanyComparisonView } from './components/CompanyComparisonView';
import { PlacementRoadmapView } from './components/PlacementRoadmapView';
import { LoginPage } from './components/LoginPage';
import { CompanyDetailDrawer } from './components/CompanyDetailDrawer';
import { PlacementChatDrawer, ChatStudentContext } from './components/PlacementChatDrawer';
import { ThemeToggleButton } from './components/ThemeToggleButton';
import { AnimatedPlacementBackdrop } from './components/AnimatedPlacementBackdrop';
import { ToastContainer } from './components/ToastContainer';
import { EASE_OUT_EXPO, SPRING_SNAPPY } from './components/MotionPrimitives';

const STORAGE_KEY = 'nexusplace_workspace_v1';
const CHAT_STORAGE_KEY = 'nexusplace_chat_v1';
const THEME_STORAGE_KEY = 'nexusplace_theme_v2';
const AUTH_STORAGE_KEY = 'nexusplace_auth_v1';

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'opportunities', label: 'Opportunities', icon: Compass },
  { id: 'deadlines', label: 'Deadlines', icon: Clock },
  { id: 'eligibility', label: 'Eligibility Checker', icon: ShieldCheck },
  { id: 'compare', label: 'Company Compare', icon: Scale },
  { id: 'skill-gap', label: 'Skill Gap Analyzer', icon: Target },
  { id: 'tracker', label: 'Application Tracker', icon: Kanban },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'preparation', label: 'Preparation Hub', icon: BookOpen },
  { id: 'roadmap', label: 'Placement Roadmap', icon: Route },
  { id: 'profile', label: 'Profile', icon: User },
];

interface PersistedState {
  profile: StudentProfile;
  applications: ApplicationRecord[];
  prepTopics: PrepTopic[];
  hrQuestions: HrQuestion[];
  bookmarkedIds: string[];
  activities: ActivityItem[];
  notifications: AppNotification[];
  completedDeadlineIds?: string[];
  completedRoadmapIds?: string[];
}

function loadInitialState(): PersistedState {
  const validDriveIds = new Set(COMPANY_DRIVES.map((d) => d.id));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      const validApps = Array.isArray(parsed.applications)
        ? parsed.applications.filter((a) => validDriveIds.has(a.companyId))
        : [];
      const validBookmarks = Array.isArray(parsed.bookmarkedIds)
        ? parsed.bookmarkedIds.filter((id) => validDriveIds.has(id))
        : [];

      const migrated = validApps.length > 0;
      return {
        ...parsed,
        profile: {
          ...parsed.profile,
          avatarUrl: resolveCustomAvatarUrl(parsed.profile?.avatarUrl),
        },
        applications: migrated ? validApps : INITIAL_APPLICATIONS,
        bookmarkedIds: migrated ? validBookmarks : ['google-swe', 'nvidia-systems'],
        activities: migrated ? parsed.activities : INITIAL_ACTIVITIES,
        notifications: migrated ? parsed.notifications : INITIAL_NOTIFICATIONS,
        completedDeadlineIds: Array.isArray(parsed.completedDeadlineIds)
          ? parsed.completedDeadlineIds.filter((id) => validDriveIds.has(id))
          : [],
        completedRoadmapIds: Array.isArray(parsed.completedRoadmapIds)
          ? parsed.completedRoadmapIds
          : ['rm-resume'],
      };
    }
  } catch {
    // Fallback to clean mock state
  }
  return {
    profile: INITIAL_STUDENT_PROFILE,
    applications: INITIAL_APPLICATIONS,
    prepTopics: INITIAL_PREP_TOPICS,
    hrQuestions: INITIAL_HR_QUESTIONS,
    bookmarkedIds: ['google-swe', 'nvidia-systems'],
    activities: INITIAL_ACTIVITIES,
    notifications: INITIAL_NOTIFICATIONS,
    completedDeadlineIds: [],
    completedRoadmapIds: ['rm-resume'],
  };
}

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'workspace'>('landing');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [pendingRedirectTab, setPendingRedirectTab] = useState<WorkspaceTab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved === 'false') return false;
    } catch {
      // Ignore storage access errors
    }
    return true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const initial = useMemo(() => loadInitialState(), []);

  const [profile, setProfile] = useState<StudentProfile>(initial.profile);
  const [applications, setApplications] = useState<ApplicationRecord[]>(initial.applications);
  const [prepTopics, setPrepTopics] = useState<PrepTopic[]>(initial.prepTopics);
  const [hrQuestions, setHrQuestions] = useState<HrQuestion[]>(initial.hrQuestions);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(initial.bookmarkedIds);
  const [activities, setActivities] = useState<ActivityItem[]>(initial.activities);
  const [notifications, setNotifications] = useState<AppNotification[]>(initial.notifications);
  const [completedDeadlineIds, setCompletedDeadlineIds] = useState<string[]>(
    initial.completedDeadlineIds ?? []
  );
  const [completedRoadmapIds, setCompletedRoadmapIds] = useState<string[]>(
    initial.completedRoadmapIds ?? ['rm-resume']
  );

  const [selectedDrive, setSelectedDrive] = useState<CompanyDrive | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchSeed, setSearchSeed] = useState<{ query: string; nonce: number }>({
    query: '',
    nonce: 0,
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Ignore storage access errors
    }
    return 'dark';
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [chatRoleMode, setChatRoleMode] = useState<ChatRoleMode>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { roleMode?: ChatRoleMode };
        if (parsed.roleMode) return parsed.roleMode;
      }
    } catch {
      // Ignore parse issues
    }
    return 'placement_advisor';
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { messages?: ChatMessage[] };
        if (Array.isArray(parsed.messages)) return parsed.messages;
      }
    } catch {
      // Ignore parse issues
    }
    return [];
  });
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        profile,
        applications,
        prepTopics,
        hrQuestions,
        bookmarkedIds,
        activities,
        notifications,
        completedDeadlineIds,
        completedRoadmapIds,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota issues
    }
  }, [
    profile,
    applications,
    prepTopics,
    hrQuestions,
    bookmarkedIds,
    activities,
    notifications,
    completedDeadlineIds,
    completedRoadmapIds,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({ roleMode: chatRoleMode, messages: chatMessages })
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [chatRoleMode, chatMessages]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota issues
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const pushToast = (
    title: string,
    description?: string,
    variant: ToastMessage['variant'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addActivity = (
    action: string,
    detail: string,
    type: ActivityItem['type']
  ) => {
    const newItem: ActivityItem = {
      id: `act-${Date.now()}`,
      action,
      detail,
      timestamp: 'Just now',
      type,
    };
    setActivities((prev) => [newItem, ...prev.slice(0, 9)]);
  };

  const appliedCompanyIds = useMemo(
    () => new Set(applications.map((a) => a.companyId)),
    [applications]
  );

  const bookmarkedSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);
  const unreadNotificationCount = notifications.filter((n) => n.unread).length;

  const chatStudentContext = useMemo<ChatStudentContext>(() => {
    const eligibleCount = COMPANY_DRIVES.filter(
      (d) => evaluateEligibility(profile, d).eligible
    ).length;
    const completedTopics = prepTopics.filter((t) => t.completed).length;
    const prepPercent = prepTopics.length
      ? Math.round((completedTopics / prepTopics.length) * 100)
      : 0;

    const applicationsSummary = applications.map((app) => {
      const drive = COMPANY_DRIVES.find((d) => d.id === app.companyId);
      return drive ? `${drive.companyName} (${drive.roleTitle}): ${app.stage}` : app.stage;
    });

    const upcomingDeadlinesSummary = COMPANY_DRIVES.filter((d) => {
      const days = getDaysRemaining(d.deadline);
      return days >= 0 && days <= 10;
    })
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 5)
      .map((d) => `${d.companyName} (${d.deadline}, ${getDaysRemaining(d.deadline)}d left)`);

    return {
      name: profile.name,
      branch: profile.branch,
      batchYear: profile.batchYear,
      cgpa: profile.cgpa,
      activeBacklogs: profile.activeBacklogs,
      skills: profile.skills,
      eligibleCount,
      totalDrives: COMPANY_DRIVES.length,
      prepPercent,
      applicationsSummary,
      upcomingDeadlinesSummary,
    };
  }, [profile, applications, prepTopics]);

  const handleEnterWorkspace = (tab: WorkspaceTab = 'dashboard') => {
    if (!isAuthenticated) {
      setPendingRedirectTab(tab);
      setViewMode('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveTab(tab);
    setViewMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (
    updatedProfile?: Partial<StudentProfile>,
    isNewAccount?: boolean
  ) => {
    let activeName = profile.name;
    if (updatedProfile) {
      const merged: StudentProfile = { ...profile, ...updatedProfile };
      activeName = merged.name;
      setProfile(merged);
      if (isNewAccount) {
        const eligibleCount = COMPANY_DRIVES.filter(
          (d) => evaluateEligibility(merged, d).eligible
        ).length;
        addActivity(
          'Account Created',
          `Welcome ${merged.name} (${merged.branch} · ${merged.cgpa.toFixed(2)} CGPA — ${eligibleCount} eligible drives)`,
          'profile'
        );
      }
    }

    setIsAuthenticated(true);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage issues
    }

    setActiveTab(pendingRedirectTab);
    setViewMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    pushToast(
      `Welcome, ${activeName.split(' ')[0]}!`,
      isNewAccount
        ? 'Your student workspace and eligibility matches are ready.'
        : 'Signed in to your NexusPlace workspace.'
    );
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'false');
    } catch {
      // Ignore storage issues
    }
    setPendingRedirectTab('dashboard');
    setViewMode('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    pushToast('Signed out', 'Sign in anytime to resume your placement workspace.', 'info');
  };

  const handleNavigateTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDriveFromLanding = (drive: CompanyDrive) => {
    setActiveTab('opportunities');
    setViewMode('workspace');
    setSelectedDrive(drive);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyToDrive = async (drive: CompanyDrive) => {
    if (appliedCompanyIds.has(drive.id)) return;

    const eligibility = evaluateEligibility(profile, drive);
    if (!eligibility.eligible) {
      pushToast(
        'Not eligible for this drive',
        eligibility.failureReasons[0],
        'warning'
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 480));

    const newApp: ApplicationRecord = {
      id: `app-${Date.now()}`,
      companyId: drive.id,
      stage: 'Applied',
      appliedAt: 'Nov 23, 2026',
      updatedAt: 'Nov 23, 2026',
      nextMilestone: `Shortlist update after ${drive.deadline}`,
      notes: `Submitted ${profile.resumeFileName} for ${drive.roleTitle}.`,
    };

    setApplications((prev) => [newApp, ...prev]);
    addActivity('Application Submitted', `Applied to ${drive.companyName} — ${drive.roleTitle}`, 'application');
    pushToast(
      `Applied to ${drive.companyName}`,
      `${drive.roleTitle} added to your Application Tracker.`
    );
  };

  const handleToggleBookmark = (companyId: string) => {
    const drive = COMPANY_DRIVES.find((d) => d.id === companyId);
    setBookmarkedIds((prev) => {
      const exists = prev.includes(companyId);
      if (exists) {
        if (drive) pushToast(`Removed ${drive.companyName} bookmark`, undefined, 'info');
        return prev.filter((id) => id !== companyId);
      } else {
        if (drive) pushToast(`Saved ${drive.companyName}`, 'Bookmarked for quick review.', 'info');
        return [...prev, companyId];
      }
    });
  };

  const handleUpdateStage = (applicationId: string, nextStage: ApplicationStage) => {
    const targetApp = applications.find((a) => a.id === applicationId);
    const drive = targetApp
      ? COMPANY_DRIVES.find((d) => d.id === targetApp.companyId)
      : undefined;

    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, stage: nextStage, updatedAt: 'Nov 23, 2026' }
          : app
      )
    );

    if (drive) {
      addActivity('Stage Updated', `${drive.companyName} moved to ${nextStage}`, 'application');
      if (nextStage === 'Offer Received') {
        pushToast(
          `Offer recorded for ${drive.companyName}!`,
          `${drive.roleTitle} moved to Offer Received — congratulations!`
        );
      } else {
        pushToast(`${drive.companyName} updated`, `Status moved to ${nextStage}.`);
      }
    }
  };

  const handleUpdateNotes = (applicationId: string, nextMilestone: string, notes: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, nextMilestone, notes, updatedAt: 'Nov 23, 2026' }
          : app
      )
    );
    pushToast('Application notes saved');
  };

  const handleWithdrawApplication = (applicationId: string) => {
    const target = applications.find((a) => a.id === applicationId);
    const drive = target ? COMPANY_DRIVES.find((d) => d.id === target.companyId) : undefined;
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    if (drive) {
      pushToast(`Withdrew ${drive.companyName}`, 'Removed from active tracker.', 'info');
    }
  };

  const handleTogglePrepTopic = (topicId: string) => {
    setPrepTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          addActivity('Topic Completed', `Finished ${t.title}`, 'prep');
          pushToast('Prep module completed', t.title);
        }
        return { ...t, completed: nextCompleted };
      })
    );
  };

  const handleToggleHrPracticed = (questionId: string) => {
    setHrQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const nextVal = !q.practiced;
        if (nextVal) {
          pushToast('Behavioral prompt marked practiced', q.focusArea);
        }
        return { ...q, practiced: nextVal };
      })
    );
  };

  const handleSaveProfile = (updated: StudentProfile) => {
    setProfile(updated);
    const eligibleCount = COMPANY_DRIVES.filter(
      (d) => evaluateEligibility(updated, d).eligible
    ).length;
    addActivity(
      'Profile Updated',
      `${updated.branch} · ${updated.cgpa.toFixed(2)} CGPA (${eligibleCount} eligible drives)`,
      'profile'
    );
    pushToast(
      'Profile saved & eligibility refreshed',
      `You currently qualify for ${eligibleCount} of ${COMPANY_DRIVES.length} drives.`
    );
  };

  const handleResetDemoData = () => {
    setProfile(INITIAL_STUDENT_PROFILE);
    setApplications(INITIAL_APPLICATIONS);
    setPrepTopics(INITIAL_PREP_TOPICS);
    setHrQuestions(INITIAL_HR_QUESTIONS);
    setBookmarkedIds(['google-swe', 'nvidia-systems']);
    setActivities(INITIAL_ACTIVITIES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCompletedDeadlineIds([]);
    setCompletedRoadmapIds(['rm-resume']);
    setChatMessages([]);
    setChatRoleMode('placement_advisor');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    pushToast('Demo workspace restored', 'All sample drives, tracker stages, and profile reset.', 'info');
  };

  const handleToggleDeadlineCompleted = (companyId: string) => {
    setCompletedDeadlineIds((prev) => {
      const exists = prev.includes(companyId);
      if (exists) {
        return prev.filter((id) => id !== companyId);
      }
      pushToast('Deadline marked completed', 'Moved to your Completed deadlines list.');
      return [...prev, companyId];
    });
  };

  const handleSimulateDeadlineAlert = (
    drive: CompanyDrive,
    category: 'Urgent' | 'Upcoming'
  ) => {
    const newAlert: AppNotification = {
      id: `notif-sim-${Date.now()}`,
      title: `${category} Cutoff: ${drive.companyName}`,
      description: `${drive.roleTitle} (${drive.ctcDisplay}) registration closes ${drive.deadline}.`,
      timeLabel: 'Just now',
      unread: true,
      targetTab: 'deadlines',
    };
    setNotifications((prev) => [newAlert, ...prev]);
    pushToast(
      `${category} Deadline Alert: ${drive.companyName}`,
      `${drive.roleTitle} closes ${drive.deadline}.`,
      category === 'Urgent' ? 'warning' : 'info'
    );
  };

  const handleToggleRoadmapMilestone = (milestoneId: string) => {
    setCompletedRoadmapIds((prev) => {
      const exists = prev.includes(milestoneId);
      if (exists) {
        return prev.filter((id) => id !== milestoneId);
      }
      addActivity('Roadmap Milestone', 'Marked placement roadmap step completed', 'prep');
      pushToast('Roadmap milestone completed!');
      return [...prev, milestoneId];
    });
  };

  const handleSyncSkillsFromAnalyzer = (skills: string[]) => {
    const updated = { ...profile, skills };
    setProfile(updated);
    addActivity('Skills Updated', `Synced ${skills.length} skills from Skill Gap Analyzer`, 'profile');
    pushToast('Skills synced to profile', `${skills.length} verified skills saved.`);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchSeed((prev) => ({ query: globalSearch, nonce: prev.nonce + 1 }));
    setActiveTab('opportunities');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentNavLabel =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? 'Dashboard';

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {viewMode === 'landing' ? (
          <motion.div
            key="landing-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          >
            <LandingPage
              profile={profile}
              drives={COMPANY_DRIVES}
              appliedCount={applications.length}
              theme={theme}
              isAuthenticated={isAuthenticated}
              onToggleTheme={toggleTheme}
              onEnterWorkspace={handleEnterWorkspace}
              onOpenDrive={handleOpenDriveFromLanding}
              onOpenChat={() => setChatOpen(true)}
              onOpenLogin={() => {
                setPendingRedirectTab('dashboard');
                setViewMode('login');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </motion.div>
        ) : viewMode === 'login' ? (
          <motion.div
            key="login-screen"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
          >
            <LoginPage
              existingProfile={profile}
              theme={theme}
              onToggleTheme={toggleTheme}
              onBackToLanding={() => setViewMode('landing')}
              onLoginSuccess={handleLoginSuccess}
              onNotify={pushToast}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workspace-screen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
            className="relative min-h-screen bg-[#FAF8F5] text-[#181A1F] flex"
          >
            <AnimatedPlacementBackdrop withSidebarOffset />
            {/* Desktop Left Sidebar */}
            <aside className="hidden lg:flex lg:w-[248px] lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#E8E3DA] z-30">
              <div className="h-16 px-5 flex items-center justify-between border-b border-[#F0ECE4]">
                <button
                  type="button"
                  onClick={() => setViewMode('landing')}
                  className="flex items-center gap-2.5 text-left group"
                >
                  <NexusPlaceMark className="w-7 h-7 transition-transform group-hover:scale-105 group-hover:-rotate-3" />
                  <span className="font-display text-base font-bold tracking-tight text-[#181A1F]">
                    NexusPlace
                  </span>
                </button>
              </div>

              <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      whileHover={{ x: isActive ? 0 : 2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handleNavigateTab(item.id)}
                      className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-[#0D5C63]'
                          : 'text-slate-600 hover:text-[#181A1F] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          transition={SPRING_SNAPPY}
                          className="absolute inset-0 rounded-xl bg-[#EAF3F3]"
                        />
                      )}
                      <Icon
                        strokeWidth={1.75}
                        className={`relative z-10 w-4 h-4 shrink-0 transition-transform duration-200 ${
                          isActive ? 'scale-105 text-[#0D5C63]' : ''
                        }`}
                      />
                      <span className="relative z-10 truncate">{item.label}</span>
                      {item.id === 'tracker' && applications.length > 0 && (
                        <motion.span
                          key={applications.length}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={SPRING_SNAPPY}
                          className="relative z-10 ml-auto font-mono text-[11px] font-semibold text-[#6D59A6] tabular-nums"
                        >
                          {applications.length}
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[#F0ECE4] space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <StudentAvatar
                    avatarUrl={profile.avatarUrl}
                    name={profile.name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#181A1F] truncate">{profile.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                      {profile.branch} · {profile.cgpa.toFixed(2)} CGPA
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setViewMode('landing')}
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-medium text-slate-600 hover:text-[#181A1F] hover:bg-[#F3EFE8] transition-colors"
                  >
                    <ArrowLeft strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSignOut}
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-medium text-[#C96D3B] hover:bg-[#FCF3EC] transition-colors"
                  >
                    <LogOut strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              </div>
            </aside>

            {/* Mobile Slide-Out Sidebar */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-[#181A1F]/25 backdrop-blur-[2px] lg:hidden"
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
                    className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E8E3DA] flex flex-col lg:hidden"
                  >
                    <div className="h-16 px-5 flex items-center justify-between border-b border-[#F0ECE4]">
                      <div className="flex items-center gap-2.5">
                        <NexusPlaceMark className="w-7 h-7" />
                        <span className="font-display text-base font-bold text-[#181A1F]">
                          NexusPlace
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close navigation menu"
                        className="p-2 rounded-lg text-slate-500 hover:bg-[#FAF8F5]"
                      >
                        <X strokeWidth={1.75} className="w-4 h-4" />
                      </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-3.5 space-y-1">
                      {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => handleNavigateTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-[#EAF3F3] text-[#0D5C63]'
                                : 'text-slate-600 hover:bg-[#FAF8F5] hover:text-[#181A1F]'
                            }`}
                          >
                            <Icon strokeWidth={1.75} className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </nav>

                    <div className="p-4 border-t border-[#F0ECE4] grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setViewMode('landing');
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-medium text-[#181A1F]"
                      >
                        <ArrowLeft strokeWidth={1.75} className="w-3.5 h-3.5" />
                        <span>Home</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-medium text-[#C96D3B]"
                      >
                        <LogOut strokeWidth={1.75} className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Main Workspace Area */}
            <div className="relative z-10 flex-1 lg:pl-[248px] flex flex-col min-w-0">
              {/* Top Workspace Header */}
              <header className="sticky top-0 z-20 h-16 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E3DA] px-4 sm:px-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open navigation menu"
                    className="lg:hidden p-2 rounded-xl border border-[#E8E3DA] bg-white text-slate-600 hover:bg-[#F3EFE8]"
                  >
                    <Menu strokeWidth={1.75} className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 text-sm truncate">
                    <span className="text-slate-400 hidden sm:inline">NexusPlace</span>
                    <span className="text-slate-300 hidden sm:inline">/</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={currentNavLabel}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16 }}
                        className="font-display font-semibold text-[#181A1F] truncate"
                      >
                        {currentNavLabel}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Global Search */}
                  <form
                    onSubmit={handleGlobalSearchSubmit}
                    className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-white focus-within:border-[#0D5C63] transition-all w-64"
                  >
                    <Search strokeWidth={1.75} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      placeholder="Search companies or roles..."
                      aria-label="Global company search"
                      className="w-full bg-transparent text-xs text-[#181A1F] placeholder:text-slate-400 focus:outline-none"
                    />
                    {globalSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setGlobalSearch('');
                          setSearchSeed((prev) => ({ query: '', nonce: prev.nonce + 1 }));
                        }}
                        aria-label="Clear global search"
                        className="text-slate-400 hover:text-[#181A1F]"
                      >
                        <X strokeWidth={1.75} className="w-3 h-3" />
                      </button>
                    )}
                  </form>

                  {/* Dark Mode Toggle */}
                  <ThemeToggleButton theme={theme} onToggle={toggleTheme} />

                  {/* Placement AI Coach Trigger */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setChatOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#0D5C63]/25 bg-[#EAF3F3] text-[#0D5C63] text-xs font-semibold hover:bg-[#DCEBEB] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Bot strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Placement AI</span>
                  </motion.button>

                  {/* Notifications Dropdown */}
                  <div ref={notificationsRef} className="relative">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setNotificationsOpen((prev) => !prev)}
                      aria-label="Notifications"
                      className="relative p-2.5 rounded-xl border border-[#E8E3DA] bg-white text-slate-600 hover:text-[#181A1F] hover:bg-[#F3EFE8]/60 transition-colors"
                    >
                      <Bell strokeWidth={1.75} className="w-4 h-4" />
                      <AnimatePresence>
                        {unreadNotificationCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={SPRING_SNAPPY}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C96D3B] text-white font-mono text-[10px] font-bold flex items-center justify-center tabular-nums"
                          >
                            {unreadNotificationCount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                      {notificationsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={SPRING_SNAPPY}
                          style={{ transformOrigin: 'top right' }}
                          className="absolute right-0 mt-2 w-80 bg-white border border-[#E8E3DA] rounded-2xl shadow-xl p-4 z-40"
                        >
                          <div className="flex items-center justify-between pb-2.5 border-b border-[#F0ECE4]">
                            <span className="text-xs font-semibold text-[#181A1F]">
                              Placement Alerts
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setNotifications((prev) =>
                                  prev.map((n) => ({ ...n, unread: false }))
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D5C63] hover:underline"
                            >
                              <Check strokeWidth={1.75} className="w-3 h-3" />
                              Mark all read
                            </button>
                          </div>

                          <div className="divide-y divide-[#F0ECE4] mt-1 max-h-72 overflow-y-auto">
                            {notifications.map((notif) => (
                              <button
                                key={notif.id}
                                type="button"
                                onClick={() => {
                                  setNotifications((prev) =>
                                    prev.map((n) =>
                                      n.id === notif.id ? { ...n, unread: false } : n
                                    )
                                  );
                                  if (notif.targetTab) handleNavigateTab(notif.targetTab);
                                }}
                                className="w-full text-left py-3 hover:bg-[#FAF8F5] -mx-1 px-1 rounded-xl transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`text-xs font-semibold ${
                                      notif.unread ? 'text-[#181A1F]' : 'text-slate-600'
                                    }`}
                                  >
                                    {notif.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {notif.timeLabel}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                  {notif.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Avatar */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleNavigateTab('profile')}
                    aria-label="Open student profile"
                    className="flex items-center gap-2 p-1 pr-3 rounded-xl border border-[#E8E3DA] bg-white hover:bg-[#F3EFE8]/60 transition-colors"
                  >
                    <StudentAvatar
                      avatarUrl={profile.avatarUrl}
                      name={profile.name}
                      size="sm"
                      className="border-0"
                    />
                    <span className="hidden sm:inline text-xs font-medium text-[#181A1F] whitespace-nowrap">
                      {profile.name.split(' ')[0]}
                    </span>
                  </motion.button>
                </div>
              </header>

              {/* Animated Page Viewport */}
              <main className="flex-1 px-4 py-5 sm:px-7 sm:py-6 max-w-[1340px] w-full mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                  >
                    {activeTab === 'dashboard' && (
                      <DashboardView
                        profile={profile}
                        drives={COMPANY_DRIVES}
                        applications={applications}
                        prepTopics={prepTopics}
                        activities={activities}
                        onNavigateTab={handleNavigateTab}
                        onSelectCompany={(drive) => setSelectedDrive(drive)}
                      />
                    )}

                    {activeTab === 'opportunities' && (
                      <OpportunitiesView
                        drives={COMPANY_DRIVES}
                        profile={profile}
                        appliedCompanyIds={appliedCompanyIds}
                        bookmarkedIds={bookmarkedSet}
                        searchSeed={searchSeed}
                        onSelectCompany={(drive) => setSelectedDrive(drive)}
                        onApply={handleApplyToDrive}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    )}

                    {activeTab === 'deadlines' && (
                      <DeadlineReminderView
                        drives={COMPANY_DRIVES}
                        profile={profile}
                        appliedCompanyIds={appliedCompanyIds}
                        completedDeadlineIds={new Set(completedDeadlineIds)}
                        onToggleDeadlineCompleted={handleToggleDeadlineCompleted}
                        onSimulateAlert={handleSimulateDeadlineAlert}
                        onSelectCompany={(drive) => setSelectedDrive(drive)}
                        onNavigateTab={handleNavigateTab}
                      />
                    )}

                    {activeTab === 'eligibility' && (
                      <EligibilityCheckerView
                        profile={profile}
                        drives={COMPANY_DRIVES}
                        appliedCompanyIds={appliedCompanyIds}
                        onSelectCompany={(drive) => setSelectedDrive(drive)}
                        onApply={handleApplyToDrive}
                      />
                    )}

                    {activeTab === 'compare' && (
                      <CompanyComparisonView
                        drives={COMPANY_DRIVES}
                        profile={profile}
                        appliedCompanyIds={appliedCompanyIds}
                        onSelectCompany={(drive) => setSelectedDrive(drive)}
                        onApply={handleApplyToDrive}
                      />
                    )}

                    {activeTab === 'skill-gap' && (
                      <SkillGapAnalyzerView
                        profile={profile}
                        onSyncSkillsToProfile={handleSyncSkillsFromAnalyzer}
                        onNavigateTab={handleNavigateTab}
                        onAskAiPlan={(roleTitle, missingSkills) => {
                          setChatRoleMode('resume_coach');
                          setPendingChatPrompt(
                            missingSkills.length > 0
                              ? `Create a focused 2-week placement preparation plan for ${roleTitle} covering my missing skills: ${missingSkills.join(', ')}.`
                              : `I already match all required skills for ${roleTitle}. What advanced projects or mock rounds should I prioritize?`
                          );
                          setChatOpen(true);
                        }}
                      />
                    )}

                    {activeTab === 'tracker' && (
                      <ApplicationTrackerView
                        applications={applications}
                        drives={COMPANY_DRIVES}
                        onUpdateStage={handleUpdateStage}
                        onUpdateNotes={handleUpdateNotes}
                        onWithdraw={handleWithdrawApplication}
                        onNavigateTab={handleNavigateTab}
                        onSelectCompany={(drive) => setSelectedDrive(drive)}
                      />
                    )}

                    {activeTab === 'calendar' && (
                      <CalendarView
                        drives={COMPANY_DRIVES}
                        applications={applications}
                        onSelectCompany={(drive) => setSelectedDrive(drive)}
                        onNavigateTab={handleNavigateTab}
                      />
                    )}

                    {activeTab === 'preparation' && (
                      <PreparationHubView
                        profile={profile}
                        prepTopics={prepTopics}
                        hrQuestions={hrQuestions}
                        onToggleTopic={handleTogglePrepTopic}
                        onToggleHrPracticed={handleToggleHrPracticed}
                      />
                    )}

                    {activeTab === 'roadmap' && (
                      <PlacementRoadmapView
                        completedMilestoneIds={new Set(completedRoadmapIds)}
                        onToggleMilestone={handleToggleRoadmapMilestone}
                        onResetRoadmap={() => {
                          setCompletedRoadmapIds(['rm-resume']);
                          pushToast('Placement roadmap reset', undefined, 'info');
                        }}
                        onNavigateTab={handleNavigateTab}
                      />
                    )}

                    {activeTab === 'profile' && (
                      <ProfileView
                        profile={profile}
                        onSaveProfile={handleSaveProfile}
                        onResetDemoData={handleResetDemoData}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Company Detail Drawer */}
      <CompanyDetailDrawer
        drive={selectedDrive}
        profile={profile}
        isApplied={selectedDrive ? appliedCompanyIds.has(selectedDrive.id) : false}
        isBookmarked={selectedDrive ? bookmarkedSet.has(selectedDrive.id) : false}
        onClose={() => setSelectedDrive(null)}
        onApply={handleApplyToDrive}
        onToggleBookmark={handleToggleBookmark}
        onGoToTracker={() => {
          setSelectedDrive(null);
          setViewMode('workspace');
          setActiveTab('tracker');
        }}
        onAskAi={(drive) => {
          setSelectedDrive(null);
          setChatRoleMode('placement_advisor');
          setPendingChatPrompt(
            `Give me a concise preparation & interview strategy for ${drive.companyName} (${drive.roleTitle}, ${drive.ctcDisplay}), tailored to my ${profile.branch} · ${profile.cgpa.toFixed(2)} CGPA profile.`
          );
          setChatOpen(true);
        }}
      />

      {/* Multi-Turn Gemini Placement AI Chat Drawer */}
      <PlacementChatDrawer
        open={chatOpen}
        messages={chatMessages}
        roleMode={chatRoleMode}
        studentContext={chatStudentContext}
        pendingPrompt={pendingChatPrompt}
        onConsumePendingPrompt={() => setPendingChatPrompt(null)}
        onChangeRoleMode={setChatRoleMode}
        onUpdateMessages={setChatMessages}
        onClearHistory={() => setChatMessages([])}
        onNavigateTab={(tab) => {
          setViewMode('workspace');
          handleNavigateTab(tab);
        }}
        onClose={() => setChatOpen(false)}
      />

      {/* Floating Placement AI Quick Launcher */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_SNAPPY}
            onClick={() => setChatOpen(true)}
            aria-label="Open NexusPlace AI Coach"
            className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#0D5C63] text-white text-xs font-semibold shadow-[0_12px_28px_-8px_rgba(13,92,99,0.5)] hover:bg-[#09454B] transition-colors"
          >
            <Bot strokeWidth={1.75} className="w-4 h-4" />
            <span>Ask Placement AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Animated Toast Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </MotionConfig>
  );
}
