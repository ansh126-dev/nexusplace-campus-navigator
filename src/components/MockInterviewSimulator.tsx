import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Mic,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react';
import { CompanyDrive, StudentProfile } from '../types/placement';
import { COMPANY_DRIVES, INTERVIEW_ARCHIVES } from '../data/mockPlacementData';
import { CompanyLogo } from './CompanyLogo';
import { EASE_OUT_EXPO, SPRING_SNAPPY } from './MotionPrimitives';

interface MockInterviewSimulatorProps {
  profile?: StudentProfile;
}

type InterviewTrack = 'Mixed' | 'Technical' | 'Behavioral';

interface GeneratedMockQuestion {
  id: string;
  companyId: string;
  companyName: string;
  roleTitle: string;
  question: string;
  category: 'Technical' | 'Behavioral';
  focusArea: string;
  difficulty: 'Moderate' | 'Challenging' | 'High';
  interviewerHint: string;
  expectedSignals: string[];
}

interface MockEvaluationResult {
  overallScore: number;
  verdict: string;
  summaryFeedback: string;
  strengths: string[];
  improvements: string[];
  sampleStrongPoints: string;
}

interface SessionHistoryEntry {
  id: string;
  question: GeneratedMockQuestion;
  answer: string;
  responseMode: 'typed' | 'recorded';
  evaluation: MockEvaluationResult;
  completedAt: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read audio recording.'));
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      if (!base64) {
        reject(new Error('Encoded audio data was empty.'));
        return;
      }
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function MockInterviewSimulator({ profile }: MockInterviewSimulatorProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    COMPANY_DRIVES[0]?.id ?? 'google-swe'
  );
  const [track, setTrack] = useState<InterviewTrack>('Mixed');

  const [currentQuestion, setCurrentQuestion] = useState<GeneratedMockQuestion | null>(null);
  const [askedHistoryMap, setAskedHistoryMap] = useState<Record<string, string[]>>({});
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);

  const [answerText, setAnswerText] = useState('');
  const [responseMode, setResponseMode] = useState<'typed' | 'recorded'>('typed');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<MockEvaluationResult | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const hasAutoStartedRef = useRef(false);

  const selectedDrive: CompanyDrive = useMemo(
    () => COMPANY_DRIVES.find((d) => d.id === selectedCompanyId) ?? COMPANY_DRIVES[0],
    [selectedCompanyId]
  );

  const matchingArchive = useMemo(
    () =>
      INTERVIEW_ARCHIVES.find(
        (a) => a.companyName.toLowerCase() === selectedDrive.companyName.toLowerCase()
      ),
    [selectedDrive]
  );

  const cleanupAudioResources = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors on unmount
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  const generateQuestion = async (
    targetDrive: CompanyDrive = selectedDrive,
    targetTrack: InterviewTrack = track
  ) => {
    setLoadingQuestion(true);
    setQuestionError(null);
    setHintVisible(false);
    setEvaluation(null);
    setEvaluationError(null);
    setAnswerText('');
    setResponseMode('typed');
    setRecordingError(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }

    const archive = INTERVIEW_ARCHIVES.find(
      (a) => a.companyName.toLowerCase() === targetDrive.companyName.toLowerCase()
    );
    const previousQuestions = askedHistoryMap[targetDrive.id] ?? [];

    try {
      const res = await fetch('/api/mock-interview/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: targetDrive.companyName,
          roleTitle: targetDrive.roleTitle,
          tagline: targetDrive.tagline,
          requiredSkills: targetDrive.requiredSkills,
          rounds: targetDrive.rounds,
          archiveTip: archive?.tip,
          track: targetTrack,
          previousQuestions,
          studentProfile: profile
            ? {
                branch: profile.branch,
                skills: profile.skills,
                cgpa: profile.cgpa,
              }
            : undefined,
        }),
      });

      const data = (await res.json()) as Partial<GeneratedMockQuestion> & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate a mock interview question.');
      }

      const generated: GeneratedMockQuestion = {
        id: `mq-${Date.now()}`,
        companyId: targetDrive.id,
        companyName: targetDrive.companyName,
        roleTitle: targetDrive.roleTitle,
        question: data.question || '',
        category: data.category === 'Behavioral' ? 'Behavioral' : 'Technical',
        focusArea: data.focusArea || 'Problem Solving',
        difficulty:
          data.difficulty === 'High' || data.difficulty === 'Moderate'
            ? data.difficulty
            : 'Challenging',
        interviewerHint: data.interviewerHint || '',
        expectedSignals: Array.isArray(data.expectedSignals) ? data.expectedSignals : [],
      };

      setCurrentQuestion(generated);
      setAskedHistoryMap((prev) => ({
        ...prev,
        [targetDrive.id]: [...(prev[targetDrive.id] ?? []), generated.question].slice(-12),
      }));
    } catch (err) {
      setQuestionError(
        err instanceof Error ? err.message : 'Failed to connect to the Gemini interview service.'
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    if (!hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      void generateQuestion(selectedDrive, track);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId);
    const nextDrive = COMPANY_DRIVES.find((d) => d.id === newCompanyId);
    if (nextDrive) {
      void generateQuestion(nextDrive, track);
    }
  };

  const handleTrackChange = (nextTrack: InterviewTrack) => {
    setTrack(nextTrack);
    void generateQuestion(selectedDrive, nextTrack);
  };

  const transcribeRecordedAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setRecordingError(null);
    try {
      const audioBase64 = await blobToBase64(blob);
      const res = await fetch('/api/mock-interview/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || 'audio/webm',
        }),
      });
      const data = (await res.json()) as { transcript?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transcribe recorded audio.');
      }
      const cleanTranscript = (data.transcript ?? '').trim();
      if (cleanTranscript) {
        setAnswerText((prev) =>
          prev.trim() ? `${prev.trim()}\n${cleanTranscript}` : cleanTranscript
        );
        setResponseMode('recorded');
      }
    } catch (err) {
      setRecordingError(
        err instanceof Error ? err.message : 'Could not transcribe recording.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStartRecording = async () => {
    setRecordingError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError(
        'Audio recording is not supported in this browser. You can type your response directly below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        setIsRecording(false);

        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          const url = URL.createObjectURL(audioBlob);
          setAudioPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
          void transcribeRecordedAudio(audioBlob);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setRecordingError(
        'Microphone access was blocked or unavailable. Please allow microphone permissions or type your answer.'
      );
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!currentQuestion || !answerText.trim()) return;
    setEvaluating(true);
    setEvaluationError(null);

    try {
      const res = await fetch('/api/mock-interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: currentQuestion.companyName,
          roleTitle: currentQuestion.roleTitle,
          question: currentQuestion.question,
          category: currentQuestion.category,
          focusArea: currentQuestion.focusArea,
          expectedSignals: currentQuestion.expectedSignals,
          answer: answerText.trim(),
          responseMode,
        }),
      });

      const data = (await res.json()) as Partial<MockEvaluationResult> & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Could not evaluate your response.');
      }

      const result: MockEvaluationResult = {
        overallScore: Number(data.overallScore) || 6,
        verdict: data.verdict || 'Evaluated',
        summaryFeedback: data.summaryFeedback || '',
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        sampleStrongPoints: data.sampleStrongPoints || '',
      };

      setEvaluation(result);
      setSessionHistory((prev) => [
        {
          id: `hist-${Date.now()}`,
          question: currentQuestion,
          answer: answerText.trim(),
          responseMode,
          evaluation: result,
          completedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ]);
    } catch (err) {
      setEvaluationError(
        err instanceof Error ? err.message : 'Failed to evaluate your mock interview answer.'
      );
    } finally {
      setEvaluating(false);
    }
  };

  const handleRestoreHistoryItem = (entry: SessionHistoryEntry) => {
    setSelectedCompanyId(entry.question.companyId);
    setCurrentQuestion(entry.question);
    setAnswerText(entry.answer);
    setResponseMode(entry.responseMode);
    setEvaluation(entry.evaluation);
    setEvaluationError(null);
    setQuestionError(null);
    setHintVisible(false);
  };

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* Simulator Configuration Strip */}
      <div className="bg-white border border-[#E8E3DA] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 min-w-0">
          <CompanyLogo
            companyName={selectedDrive.companyName}
            accentHex={selectedDrive.accentHex}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <label
              htmlFor="mock-company-select"
              className="block text-[11px] font-semibold text-slate-500 mb-1"
            >
              Target Company &amp; Role
            </label>
            <select
              id="mock-company-select"
              value={selectedCompanyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
              disabled={loadingQuestion || isRecording}
              className="w-full sm:w-80 px-3 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-semibold text-[#181A1F] focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors"
            >
              {COMPANY_DRIVES.map((drive) => (
                <option key={drive.id} value={drive.id}>
                  {drive.companyName} — {drive.roleTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F3EFE8] border border-[#E8E3DA]">
            {(['Mixed', 'Technical', 'Behavioral'] as InterviewTrack[]).map((option) => {
              const active = track === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={loadingQuestion || isRecording}
                  onClick={() => handleTrackChange(option)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#181A1F] shadow-xs'
                      : 'text-slate-600 hover:text-[#181A1F]'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            disabled={loadingQuestion || isRecording}
            onClick={() => void generateQuestion(selectedDrive, track)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {loadingQuestion ? (
              <Loader2 strokeWidth={1.75} className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw strokeWidth={1.75} className="w-3.5 h-3.5" />
            )}
            <span>{currentQuestion ? 'New Random Question' : 'Ask Question'}</span>
          </motion.button>
        </div>
      </div>

      {/* Main 12-Col Simulation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question + Response Input */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Question Card */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#F0ECE4]">
              <div className="flex items-center gap-2">
                <Sparkles strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63]" />
                <span className="text-xs font-semibold text-[#0D5C63]">
                  Gemini Interviewer · {selectedDrive.companyName}
                </span>
              </div>
              {currentQuestion && !loadingQuestion && (
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                  <span className="text-[#6D59A6] font-semibold">{currentQuestion.category}</span>
                  <span>·</span>
                  <span>{currentQuestion.focusArea}</span>
                  <span>·</span>
                  <span className="font-mono">{currentQuestion.difficulty}</span>
                </div>
              )}
            </div>

            {questionError ? (
              <div className="rounded-xl border border-[#C96D3B]/35 bg-[#FCF3EC] p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle strokeWidth={1.75} className="w-4 h-4 text-[#C96D3B] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#181A1F]">
                      Could not load interview question
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{questionError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void generateQuestion(selectedDrive, track)}
                  className="text-xs font-semibold text-[#0D5C63] hover:underline shrink-0"
                >
                  Retry
                </button>
              </div>
            ) : loadingQuestion ? (
              <div className="py-6 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 strokeWidth={1.75} className="w-4 h-4 animate-spin text-[#0D5C63]" />
                  <span>
                    Generating randomized {track.toLowerCase()} question for{' '}
                    {selectedDrive.companyName}...
                  </span>
                </div>
                <div className="h-4 w-5/6 rounded-lg bg-[#F3EFE8] animate-pulse" />
                <div className="h-4 w-2/3 rounded-lg bg-[#F3EFE8] animate-pulse" />
              </div>
            ) : currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                className="space-y-4"
              >
                <h2 className="font-display text-lg sm:text-xl font-semibold text-[#181A1F] leading-snug">
                  &ldquo;{currentQuestion.question}&rdquo;
                </h2>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setHintVisible((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D5C63] hover:text-[#09454B] transition-colors"
                  >
                    <Lightbulb strokeWidth={1.75} className="w-3.5 h-3.5" />
                    <span>{hintVisible ? 'Hide Interviewer Hint' : 'Show Interviewer Hint'}</span>
                  </button>

                  {matchingArchive && (
                    <span className="text-[11px] text-slate-500">
                      OA context: {matchingArchive.oaFormat.split(',')[0]}
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {hintVisible && currentQuestion.interviewerHint && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                      className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] text-xs text-slate-600 leading-relaxed"
                    >
                      <span className="font-semibold text-[#181A1F]">Interviewer Hint: </span>
                      {currentQuestion.interviewerHint}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : null}
          </div>

          {/* Student Response Recorder & Editor */}
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-[#181A1F]">
                  Your Response
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record a spoken answer for Gemini transcription or type your explanation directly.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isRecording ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleStopRecording}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#C96D3B] text-white text-xs font-semibold hover:opacity-95 transition-opacity"
                  >
                    <Square strokeWidth={1.75} className="w-3.5 h-3.5 fill-current" />
                    <span className="font-mono tabular-nums">
                      Stop ({formatDuration(recordingSeconds)})
                    </span>
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={loadingQuestion || isTranscribing || !currentQuestion}
                    onClick={() => void handleStartRecording()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-semibold text-[#181A1F] hover:bg-[#F3EFE8] disabled:opacity-50 transition-colors"
                  >
                    <Mic strokeWidth={1.75} className="w-3.5 h-3.5 text-[#0D5C63]" />
                    <span>Record Answer</span>
                  </motion.button>
                )}
              </div>
            </div>

            {isRecording && (
              <div className="rounded-xl border border-[#C96D3B]/35 bg-[#FCF3EC] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#C96D3B] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#C96D3B] animate-pulse" />
                  <span>Recording voice response...</span>
                </div>
                <span className="font-mono text-slate-600 tabular-nums">
                  {formatDuration(recordingSeconds)}
                </span>
              </div>
            )}

            {isTranscribing && (
              <div className="rounded-xl border border-[#0D5C63]/25 bg-[#EAF3F3] px-3.5 py-2.5 flex items-center gap-2 text-xs font-medium text-[#0D5C63]">
                <Loader2 strokeWidth={1.75} className="w-3.5 h-3.5 animate-spin" />
                <span>Transcribing your voice response with Gemini...</span>
              </div>
            )}

            {recordingError && (
              <div className="rounded-xl border border-[#C96D3B]/30 bg-[#FCF3EC] px-3.5 py-2.5 text-xs text-[#C96D3B]">
                {recordingError}
              </div>
            )}

            {audioPreviewUrl && !isRecording && (
              <div className="rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[#181A1F]">
                  <Volume2 strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63] shrink-0" />
                  <span>Recorded Audio Playback</span>
                </div>
                <audio controls src={audioPreviewUrl} className="h-8 max-w-full sm:w-64" />
              </div>
            )}

            <textarea
              value={answerText}
              onChange={(e) => {
                setAnswerText(e.target.value);
                if (!audioPreviewUrl) setResponseMode('typed');
              }}
              rows={7}
              disabled={loadingQuestion || isRecording}
              placeholder={
                currentQuestion?.category === 'Behavioral'
                  ? 'Outline your answer using Situation, Task, Action, and measurable Result...'
                  : 'Explain your approach, core data structures or architecture, edge cases, and time/space complexity...'
              }
              aria-label="Mock interview response"
              className="w-full px-4 py-3 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-sm text-[#181A1F] placeholder:text-slate-400 focus:outline-none focus:border-[#0D5C63] focus:bg-white transition-colors leading-relaxed resize-y"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono tabular-nums">
                <span>{wordCount} words</span>
                {answerText.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswerText('');
                      setEvaluation(null);
                      setEvaluationError(null);
                    }}
                    className="inline-flex items-center gap-1 font-sans font-medium text-slate-500 hover:text-[#C96D3B] transition-colors"
                  >
                    <Trash2 strokeWidth={1.75} className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                disabled={
                  evaluating ||
                  isRecording ||
                  isTranscribing ||
                  loadingQuestion ||
                  !currentQuestion ||
                  !answerText.trim()
                }
                onClick={() => void handleEvaluateAnswer()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D5C63] text-white text-xs font-semibold hover:bg-[#09454B] disabled:opacity-50 transition-colors"
              >
                {evaluating ? (
                  <Loader2 strokeWidth={1.75} className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send strokeWidth={1.75} className="w-3.5 h-3.5" />
                )}
                <span>{evaluating ? 'Evaluating Response...' : 'Get AI Feedback'}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right: AI Feedback Panel & Session History */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE4]">
              <h3 className="font-display text-base font-semibold text-[#181A1F]">
                AI Interview Feedback
              </h3>
              {evaluation && (
                <span className="font-mono text-sm font-bold text-[#0D5C63] tabular-nums">
                  {evaluation.overallScore} / 10
                </span>
              )}
            </div>

            {evaluationError ? (
              <div className="rounded-xl border border-[#C96D3B]/35 bg-[#FCF3EC] p-4 space-y-2">
                <p className="text-xs font-semibold text-[#C96D3B]">Evaluation Error</p>
                <p className="text-xs text-slate-600 leading-relaxed">{evaluationError}</p>
              </div>
            ) : evaluating ? (
              <div className="py-10 flex flex-col items-center text-center gap-3">
                <Loader2 strokeWidth={1.75} className="w-6 h-6 text-[#0D5C63] animate-spin" />
                <div>
                  <p className="text-xs font-semibold text-[#181A1F]">
                    Reviewing against {selectedDrive.companyName} bar
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Checking technical depth, clarity, and structure...
                  </p>
                </div>
              </div>
            ) : evaluation ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="space-y-4"
              >
                <div className="rounded-xl bg-[#EAF3F3] border border-[#0D5C63]/20 p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0D5C63]">{evaluation.verdict}</span>
                    <span className="text-[11px] font-mono text-slate-500 uppercase">
                      {responseMode}
                    </span>
                  </div>
                  <p className="text-xs text-[#181A1F] leading-relaxed">
                    {evaluation.summaryFeedback}
                  </p>
                </div>

                {evaluation.strengths.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#181A1F]">What Went Well</p>
                    <ul className="space-y-1.5">
                      {evaluation.strengths.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                        >
                          <CheckCircle2
                            strokeWidth={1.75}
                            className="w-3.5 h-3.5 text-[#0D5C63] shrink-0 mt-0.5"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.improvements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#181A1F]">Areas to Sharpen</p>
                    <ul className="space-y-1.5">
                      {evaluation.improvements.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                        >
                          <AlertCircle
                            strokeWidth={1.75}
                            className="w-3.5 h-3.5 text-[#C96D3B] shrink-0 mt-0.5"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.sampleStrongPoints && (
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] p-3.5 space-y-1">
                    <p className="text-xs font-semibold text-[#181A1F]">
                      High-Bar Answer Outline
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {evaluation.sampleStrongPoints}
                    </p>
                  </div>
                )}

                {currentQuestion && currentQuestion.expectedSignals.length > 0 && (
                  <div className="pt-2 border-t border-[#F0ECE4] space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Key Interviewer Signals Checked
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      {currentQuestion.expectedSignals.map((sig) => (
                        <li key={sig}>{sig}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => void generateQuestion(selectedDrive, track)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-semibold text-[#181A1F] hover:bg-[#F3EFE8] transition-colors"
                >
                  <RefreshCw strokeWidth={1.75} className="w-3.5 h-3.5 text-[#0D5C63]" />
                  <span>Practice Next Question</span>
                </motion.button>
              </motion.div>
            ) : (
              <div className="py-6 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Submit a recorded or typed answer to receive calibrated Gemini scoring (1–10),
                  company-specific feedback, strengths, and a model answer outline.
                </p>
                <div className="rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] p-3.5 space-y-1.5 text-[11px] text-slate-600">
                  <p className="font-semibold text-[#181A1F]">Pipeline Context ({selectedDrive.companyName})</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedDrive.rounds.slice(0, 3).map((round) => (
                      <li key={round}>{round}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Completed Rounds in Current Session */}
          {sessionHistory.length > 0 && (
            <div className="bg-white border border-[#E8E3DA] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-semibold text-[#181A1F]">
                  Session History
                </h4>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {sessionHistory.length} completed
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sessionHistory.map((entry) => (
                  <motion.button
                    key={entry.id}
                    type="button"
                    whileTap={{ scale: 0.99 }}
                    transition={SPRING_SNAPPY}
                    onClick={() => handleRestoreHistoryItem(entry)}
                    className="w-full text-left p-3 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] hover:border-[#0D5C63]/40 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-[#181A1F]">
                        {entry.question.companyName} · {entry.question.category}
                      </span>
                      <span className="font-mono font-semibold text-[#0D5C63] tabular-nums">
                        {entry.evaluation.overallScore}/10
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {entry.question.question}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
