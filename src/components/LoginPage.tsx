import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { BranchCode, StudentProfile } from '../types/placement';
import { NexusPlaceMark } from './CompanyLogo';
import { StudentAvatar } from './StudentAvatar';
import { ThemeToggleButton } from './ThemeToggleButton';
import { AnimatedPlacementBackdrop } from './AnimatedPlacementBackdrop';
import { EASE_OUT_EXPO, SPRING_SNAPPY } from './MotionPrimitives';

interface LoginPageProps {
  existingProfile: StudentProfile;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBackToLanding: () => void;
  onLoginSuccess: (updatedProfile?: Partial<StudentProfile>, isNewAccount?: boolean) => void;
  onNotify: (title: string, description?: string, variant?: 'success' | 'info' | 'warning') => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

const BRANCHES: BranchCode[] = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];

export function LoginPage({
  existingProfile,
  theme,
  onToggleTheme,
  onBackToLanding,
  onLoginSuccess,
  onNotify,
}: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign-In fields
  const [identifier, setIdentifier] = useState(existingProfile.email);
  const [password, setPassword] = useState('campus2027');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign-Up fields
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [branch, setBranch] = useState<BranchCode>('CSE');
  const [cgpaInput, setCgpaInput] = useState('8.40');
  const [signupPassword, setSignupPassword] = useState('');

  // Reset password field
  const [resetEmail, setResetEmail] = useState(existingProfile.email);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg('Please enter your campus email or university roll number.');
      return;
    }
    if (password.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 480));
    setSubmitting(false);

    const trimmedId = identifier.trim();
    const matchesExisting =
      trimmedId.toLowerCase() === existingProfile.email.toLowerCase() ||
      trimmedId.toUpperCase() === existingProfile.rollNumber.toUpperCase();

    if (matchesExisting) {
      onLoginSuccess(undefined, false);
    } else if (trimmedId.includes('@')) {
      const derivedName = trimmedId
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      onLoginSuccess({ name: derivedName, email: trimmedId }, false);
    } else {
      onLoginSuccess({ rollNumber: trimmedId.toUpperCase() }, false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 340));
    setSubmitting(false);
    onLoginSuccess(undefined, false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!rollNumber.trim()) {
      setErrorMsg('Please enter your university roll number.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMsg('Please enter a valid campus email address.');
      return;
    }
    const parsedCgpa = parseFloat(cgpaInput);
    if (Number.isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      setErrorMsg('CGPA must be a valid number between 0.00 and 10.00.');
      return;
    }
    if (signupPassword.trim().length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);

    onLoginSuccess(
      {
        name: fullName.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        email: signupEmail.trim().toLowerCase(),
        branch,
        cgpa: Number(parsedCgpa.toFixed(2)),
        activeBacklogs: 0,
      },
      true
    );
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setErrorMsg('Enter a valid campus email address to receive reset instructions.');
      return;
    }
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 420));
    setSubmitting(false);
    onNotify(
      'Reset link sent',
      `Recovery instructions dispatched to ${resetEmail.trim()}.`,
      'info'
    );
    setMode('signin');
  };

  return (
    <div className="relative min-h-screen bg-[#FAF8F5] text-[#181A1F] flex flex-col">
      <AnimatedPlacementBackdrop />
      {/* Top Minimal Header */}
      <header className="relative z-20 h-16 px-6 border-b border-[#E8E3DA] bg-[#FAF8F5]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 group"
          >
            <NexusPlaceMark className="w-7 h-7 transition-transform group-hover:scale-105" />
            <span className="font-display text-lg font-bold tracking-tight text-[#181A1F]">
              NexusPlace
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-white text-xs font-semibold text-[#181A1F] hover:bg-[#F3EFE8] transition-colors"
          >
            <ArrowLeft strokeWidth={1.75} className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </motion.button>
        </div>
      </header>

      {/* Main Centered Split Auth Layout */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-[#E8E3DA] bg-white shadow-[0_24px_60px_-20px_rgba(15,45,89,0.22)]"
        >
          {/* Left Showcase Panel */}
          <div className="lg:col-span-5 bg-[#0D5C63] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/90">
                <GraduationCap strokeWidth={1.75} className="w-4 h-4" />
                <span>University Placement Portal</span>
              </div>

              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-balance">
                  Your Campus Placement Journey, Simplified.
                </h1>
                <p className="text-sm text-white/80 mt-3 leading-relaxed">
                  Sign in to access verified campus recruitment drives, instant CGPA eligibility
                  audits, application stage tracking, and your Gemini AI interview coach.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <ShieldCheck strokeWidth={1.75} className="w-4 h-4 text-white/90 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">Live Eligibility Matching</p>
                    <p className="text-xs text-white/75 mt-0.5">
                      Automatically compares branch, CGPA, and backlog rules against every drive.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 strokeWidth={1.75} className="w-4 h-4 text-white/90 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">5-Stage Pipeline &amp; Calendar</p>
                    <p className="text-xs text-white/75 mt-0.5">
                      Keep track of OA deadlines, technical rounds, and final HR offers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles strokeWidth={1.75} className="w-4 h-4 text-white/90 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">Placement AI Coach</p>
                    <p className="text-xs text-white/75 mt-0.5">
                      Run mock interviews and get tailored prep strategy in real time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-5 border-t border-white/15">
              <p className="text-[11px] text-white/75 font-mono tabular-nums">
                2026–27 Campus Season · 10 Active Drives · Nov–Dec Schedule
              </p>
            </div>
          </div>

          {/* Right Auth Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-center">
            {mode !== 'reset' && (
              <div className="inline-grid grid-cols-2 p-1 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] self-start mb-6">
                {(
                  [
                    { id: 'signin', label: 'Student Sign In' },
                    { id: 'signup', label: 'Create Account' },
                  ] as const
                ).map((tab) => {
                  const active = mode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setMode(tab.id);
                      }}
                      className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        active
                          ? 'text-[#0D5C63]'
                          : 'text-slate-600 hover:text-[#181A1F]'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="auth-mode-pill"
                          transition={SPRING_SNAPPY}
                          className="absolute inset-0 rounded-lg bg-white border border-[#E8E3DA] shadow-[0_1px_2px_rgba(24,26,31,0.06)]"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'signin' && (
                <motion.div
                  key="signin-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#181A1F]">
                      Welcome back to NexusPlace
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Sign in with your university email or roll number to open your workspace.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-[#C96D3B]/30 bg-[#FCF3EC] px-3.5 py-2.5 text-xs font-medium text-[#C96D3B]">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label
                        htmlFor="login-identifier"
                        className="block text-xs font-semibold text-slate-600 mb-1.5"
                      >
                        Campus Email or Roll Number
                      </label>
                      <div className="relative">
                        <Mail
                          strokeWidth={1.75}
                          className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                        <input
                          id="login-identifier"
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="ananya.sharma@campus.edu or 23BCE1048"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="login-password"
                          className="block text-xs font-semibold text-slate-600"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg(null);
                            setMode('reset');
                          }}
                          className="text-xs font-semibold text-[#0D5C63] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock
                          strokeWidth={1.75}
                          className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#181A1F]"
                        >
                          {showPassword ? (
                            <EyeOff strokeWidth={1.75} className="w-4 h-4" />
                          ) : (
                            <Eye strokeWidth={1.75} className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-[#0D5C63]"
                        />
                        <span>Keep me signed in on this laptop</span>
                      </label>
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.985 }}
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold hover:bg-[#09454B] transition-colors inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_-6px_rgba(13,92,99,0.45)]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 strokeWidth={1.75} className="w-4 h-4 animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Student Dashboard</span>
                          <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </form>

                  {/* Quick Demo Account Access for Live Presentation */}
                  <div className="pt-4 border-t border-[#F0ECE4] space-y-2.5">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Instant Demo Access
                    </p>
                    <motion.button
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      disabled={submitting}
                      onClick={() => void handleDemoLogin()}
                      className="w-full text-left p-3.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] hover:border-[#0D5C63]/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StudentAvatar
                          avatarUrl={existingProfile.avatarUrl}
                          name={existingProfile.name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#181A1F] truncate">
                            Continue as {existingProfile.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                            {existingProfile.rollNumber} · {existingProfile.branch} ·{' '}
                            {existingProfile.cgpa.toFixed(2)} CGPA
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#0D5C63] shrink-0">
                        One-Click Demo
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {mode === 'signup' && (
                <motion.div
                  key="signup-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#181A1F]">
                      Create Student Account
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Register your academic details to immediately match eligible campus drives.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-[#C96D3B]/30 bg-[#FCF3EC] px-3.5 py-2.5 text-xs font-medium text-[#C96D3B]">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSignUp} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label
                          htmlFor="signup-name"
                          className="block text-xs font-semibold text-slate-600 mb-1"
                        >
                          Full Name
                        </label>
                        <div className="relative">
                          <User
                            strokeWidth={1.75}
                            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          />
                          <input
                            id="signup-name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Rohan Kulkarni"
                            className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-roll"
                          className="block text-xs font-semibold text-slate-600 mb-1"
                        >
                          Roll Number
                        </label>
                        <input
                          id="signup-roll"
                          type="text"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="23BCE1120"
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-email"
                        className="block text-xs font-semibold text-slate-600 mb-1"
                      >
                        University Email
                      </label>
                      <input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="rohan.kulkarni@campus.edu"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label
                          htmlFor="signup-branch"
                          className="block text-xs font-semibold text-slate-600 mb-1"
                        >
                          Branch
                        </label>
                        <select
                          id="signup-branch"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value as BranchCode)}
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                        >
                          {BRANCHES.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="signup-cgpa"
                          className="block text-xs font-semibold text-slate-600 mb-1"
                        >
                          Current CGPA
                        </label>
                        <input
                          id="signup-cgpa"
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={cgpaInput}
                          onChange={(e) => setCgpaInput(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-sm text-[#181A1F] tabular-nums focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-password"
                        className="block text-xs font-semibold text-slate-600 mb-1"
                      >
                        Create Password
                      </label>
                      <input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                      />
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.985 }}
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold hover:bg-[#09454B] transition-colors inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_-6px_rgba(13,92,99,0.45)]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 strokeWidth={1.75} className="w-4 h-4 animate-spin" />
                          <span>Setting up workspace...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account &amp; Enter Dashboard</span>
                          <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {mode === 'reset' && (
                <motion.div
                  key="reset-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setMode('signin');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#181A1F] transition-colors"
                  >
                    <ArrowLeft strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>

                  <div>
                    <div className="w-9 h-9 rounded-xl bg-[#EAF3F3] text-[#0D5C63] flex items-center justify-center mb-3">
                      <KeyRound strokeWidth={1.75} className="w-4 h-4" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#181A1F]">
                      Reset Campus Password
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your university email address and we&apos;ll send a reset link.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-[#C96D3B]/30 bg-[#FCF3EC] px-3.5 py-2.5 text-xs font-medium text-[#C96D3B]">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <label
                        htmlFor="reset-email"
                        className="block text-xs font-semibold text-slate-600 mb-1.5"
                      >
                        University Email
                      </label>
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="ananya.sharma@campus.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
                      />
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.985 }}
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold hover:bg-[#09454B] transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 strokeWidth={1.75} className="w-4 h-4 animate-spin" />
                          <span>Sending Reset Link...</span>
                        </>
                      ) : (
                        <span>Send Recovery Link</span>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
