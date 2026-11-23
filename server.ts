import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { Content } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ChatRoleMode = 'placement_advisor' | 'mock_interviewer' | 'resume_coach';

interface IncomingHistoryMessage {
  role: 'user' | 'model';
  text: string;
}

interface StudentContextPayload {
  name?: string;
  branch?: string;
  batchYear?: number;
  cgpa?: number;
  activeBacklogs?: number;
  skills?: string[];
  eligibleCount?: number;
  totalDrives?: number;
  prepPercent?: number;
  applicationsSummary?: string[];
  upcomingDeadlinesSummary?: string[];
}

interface ChatRequestBody {
  message?: string;
  history?: IncomingHistoryMessage[];
  roleMode?: ChatRoleMode;
  studentContext?: StudentContextPayload;
}

const ROLE_INSTRUCTIONS: Record<ChatRoleMode, string> = {
  placement_advisor:
    'You are the NexusPlace Placement Advisor, a sharp, encouraging university campus recruitment strategist. Help students prioritize campus drives, evaluate eligibility trade-offs, prepare for upcoming deadlines, and manage their multi-stage application pipeline. Keep answers concise, structured with clear bullet points, and directly actionable.',
  mock_interviewer:
    'You are the NexusPlace Mock Interview Coach, a supportive senior engineer and campus hiring interviewer. Conduct realistic mock technical (DSA, OS/DBMS/CN, system design) and behavioral (STAR method) interviews. Ask one focused question at a time when starting a mock round, or give crisp, constructive feedback with concrete improvement tips when the student answers.',
  resume_coach:
    'You are the NexusPlace Resume & OA Coach. Help students tailor resume project bullets with measurable impact, close skill gaps for target campus recruiters, and plan high-yield Online Assessment revision sprints. Be specific, practical, and concise.',
};

function buildSystemInstruction(
  roleMode: ChatRoleMode,
  studentContext?: StudentContextPayload
): string {
  const baseRole = ROLE_INSTRUCTIONS[roleMode] ?? ROLE_INSTRUCTIONS.placement_advisor;

  if (!studentContext) {
    return baseRole;
  }

  const contextLines = [
    `Student Profile: ${studentContext.name ?? 'Student'} (${studentContext.branch ?? 'CSE'}, Class of ${studentContext.batchYear ?? 2027})`,
    `Academics: CGPA ${typeof studentContext.cgpa === 'number' ? studentContext.cgpa.toFixed(2) : 'N/A'}, Active Backlogs: ${studentContext.activeBacklogs ?? 0}`,
    `Skills: ${studentContext.skills?.length ? studentContext.skills.join(', ') : 'Not specified'}`,
    `Eligibility Snapshot: ${studentContext.eligibleCount ?? 0} of ${studentContext.totalDrives ?? 0} campus drives eligible`,
    `Prep Checklist Completion: ${studentContext.prepPercent ?? 0}%`,
  ];

  if (studentContext.applicationsSummary?.length) {
    contextLines.push(
      `Active Applications: ${studentContext.applicationsSummary.join(' | ')}`
    );
  }

  if (studentContext.upcomingDeadlinesSummary?.length) {
    contextLines.push(
      `Upcoming Deadlines: ${studentContext.upcomingDeadlinesSummary.join(' | ')}`
    );
  }

  return `${baseRole}\n\nUse the student's live NexusPlace workspace context below when relevant, without repeating it unnecessarily:\n${contextLines.join('\n')}`;
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (lower.includes('permission_denied') || lower.includes('api_key_invalid') || lower.includes('403') || lower.includes('401')) {
    return {
      status: 403,
      message:
        'Gemini API authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return {
      status: 429,
      message:
        'Gemini API quota limit reached. Please try again shortly or check your quota in Settings > Secrets.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message: 'The requested Gemini model was not found or is currently unavailable.',
    };
  }
  return {
    status: 500,
    message: rawMessage || 'Failed to generate a response from Gemini.',
  };
}

interface MockQuestionRequestBody {
  companyName?: string;
  roleTitle?: string;
  tagline?: string;
  requiredSkills?: string[];
  rounds?: string[];
  archiveTip?: string;
  track?: 'Mixed' | 'Technical' | 'Behavioral';
  previousQuestions?: string[];
  studentProfile?: {
    branch?: string;
    skills?: string[];
    cgpa?: number;
  };
}

interface MockTranscribeRequestBody {
  audioBase64?: string;
  mimeType?: string;
}

interface MockEvaluateRequestBody {
  companyName?: string;
  roleTitle?: string;
  question?: string;
  category?: 'Technical' | 'Behavioral';
  focusArea?: string;
  expectedSignals?: string[];
  answer?: string;
  responseMode?: 'typed' | 'recorded';
}

async function runWithTransientRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (firstErr) {
    const info = formatGeminiError(firstErr);
    if (info.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return await fn();
    }
    throw firstErr;
  }
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.post('/api/chat', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as ChatRequestBody;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured. Please set GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const roleMode: ChatRoleMode =
      body.roleMode && body.roleMode in ROLE_INSTRUCTIONS
        ? body.roleMode
        : 'placement_advisor';

    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const sdkHistory: Content[] = rawHistory
      .filter(
        (item) =>
          (item.role === 'user' || item.role === 'model') &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0
      )
      .slice(-24)
      .map((item) => ({
        role: item.role,
        parts: [{ text: item.text }],
      }));

    const systemInstruction = buildSystemInstruction(roleMode, body.studentContext);

    const chat = ai.chats.create({
      model: 'gemini-4-hydrogen',
      config: {
        systemInstruction,
      },
      history: sdkHistory,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const writeSse = (payload: Record<string, unknown>) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      let stream;
      try {
        stream = await chat.sendMessageStream({ message });
      } catch (firstErr) {
        const firstInfo = formatGeminiError(firstErr);
        if (firstInfo.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          stream = await chat.sendMessageStream({ message });
        } else {
          throw firstErr;
        }
      }

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          writeSse({ text: chunkText });
        }
      }

      writeSse({ done: true });
      if (!res.writableEnded) {
        res.end();
      }
    } catch (err) {
      const { message: errMessage } = formatGeminiError(err);
      writeSse({ error: errMessage });
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  app.post('/api/mock-interview/question', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as MockQuestionRequestBody;
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const roleTitle = typeof body.roleTitle === 'string' ? body.roleTitle.trim() : '';

    if (!companyName || !roleTitle) {
      res.status(400).json({ error: 'Company name and role title are required.' });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured. Please set GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const requestedTrack =
      body.track === 'Technical' || body.track === 'Behavioral' ? body.track : 'Mixed';
    const targetCategory: 'Technical' | 'Behavioral' =
      requestedTrack === 'Mixed'
        ? Math.random() < 0.58
          ? 'Technical'
          : 'Behavioral'
        : requestedTrack;

    const technicalAngles = [
      'Data Structures & Algorithmic Complexity',
      'System Design & Scalability Trade-offs',
      'Database Indexing, Transactions & API Design',
      'Debugging, Concurrency & Edge Cases',
      'Real-World Engineering & Code Architecture',
    ];
    const behavioralAngles = [
      'Ownership Under Ambiguity',
      'Resolving Team Technical Disagreement',
      'Handling Failure & Tight Deadlines',
      'Customer / Product Empathy & Prioritization',
      'Learning Quickly on a Complex Project',
    ];
    const anglePool = targetCategory === 'Technical' ? technicalAngles : behavioralAngles;
    const pickedAngle = anglePool[Math.floor(Math.random() * anglePool.length)];
    const randomSeed = Math.floor(Math.random() * 100000);

    const previousQuestions = Array.isArray(body.previousQuestions)
      ? body.previousQuestions.filter((q) => typeof q === 'string' && q.trim().length > 0).slice(-10)
      : [];

    const skillsText = body.requiredSkills?.length
      ? body.requiredSkills.join(', ')
      : 'Computer Science fundamentals, problem solving';
    const roundsText = body.rounds?.length ? body.rounds.join(' -> ') : 'Technical & HR rounds';
    const studentInfo = body.studentProfile
      ? `Candidate background: ${body.studentProfile.branch ?? 'CSE'} student, CGPA ${typeof body.studentProfile.cgpa === 'number' ? body.studentProfile.cgpa.toFixed(2) : 'N/A'}, skills: ${body.studentProfile.skills?.join(', ') || 'General CS'}.`
      : '';

    const prompt = [
      `Generate ONE fresh, realistic ${targetCategory} campus placement interview question for ${companyName} (${roleTitle}).`,
      body.tagline ? `Company context: ${body.tagline}.` : '',
      `Key role skills: ${skillsText}.`,
      `Hiring pipeline: ${roundsText}.`,
      body.archiveTip ? `Past campus feedback tip: ${body.archiveTip}` : '',
      `Selected angle for variety: ${pickedAngle} (variation seed #${randomSeed}).`,
      studentInfo,
      previousQuestions.length
        ? `Do NOT repeat or closely paraphrase any of these previously asked questions:\n- ${previousQuestions.join('\n- ')}`
        : '',
      targetCategory === 'Technical'
        ? 'Ask a focused, answerable spoken/written technical question (explain approach, trade-offs, complexity, or design — not a 100-line coding boilerplate).'
        : 'Ask a focused behavioral question suited for STAR-method storytelling in a campus engineering/product interview.',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await runWithTransientRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a senior campus recruitment interviewer at a leading technology company. Return strictly valid JSON matching the requested schema. Keep the question crisp, natural, and directly answerable in 2-4 minutes.',
            responseMimeType: 'application/json',
            seed: randomSeed,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                question: {
                  type: Type.STRING,
                  description: 'A clear, single interview question tailored to the company and role.',
                },
                category: {
                  type: Type.STRING,
                  description: 'Must be either Technical or Behavioral.',
                },
                focusArea: {
                  type: Type.STRING,
                  description: 'Short 2-4 word topic label for this question.',
                },
                difficulty: {
                  type: Type.STRING,
                  description: 'Must be Moderate, Challenging, or High.',
                },
                interviewerHint: {
                  type: Type.STRING,
                  description: 'A brief 1-sentence hint to guide the student if stuck.',
                },
                expectedSignals: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Three concise signals interviewers evaluate in a great answer.',
                },
              },
              required: [
                'question',
                'category',
                'focusArea',
                'difficulty',
                'interviewerHint',
                'expectedSignals',
              ],
            },
          },
        })
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty interview question.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        question?: string;
        category?: string;
        focusArea?: string;
        difficulty?: string;
        interviewerHint?: string;
        expectedSignals?: string[];
      };

      res.json({
        question: parsed.question ?? 'Walk me through a challenging technical trade-off you made recently.',
        category: parsed.category === 'Behavioral' ? 'Behavioral' : targetCategory,
        focusArea: parsed.focusArea ?? pickedAngle,
        difficulty:
          parsed.difficulty === 'High' || parsed.difficulty === 'Moderate'
            ? parsed.difficulty
            : 'Challenging',
        interviewerHint:
          parsed.interviewerHint ?? 'Structure your answer clearly with concrete examples and trade-offs.',
        expectedSignals: Array.isArray(parsed.expectedSignals)
          ? parsed.expectedSignals.slice(0, 4)
          : [],
      });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/mock-interview/transcribe', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as MockTranscribeRequestBody;
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64.trim() : '';
    const mimeType = typeof body.mimeType === 'string' && body.mimeType.trim()
      ? body.mimeType.trim().split(';')[0]
      : 'audio/webm';

    if (!audioBase64) {
      res.status(400).json({ error: 'Audio recording payload is empty.' });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured. Please set GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    try {
      const response = await runWithTransientRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe this spoken mock interview answer cleanly and verbatim into plain text without adding commentary or timestamps.',
              },
            ],
          },
        })
      );

      const transcript = (response.text ?? '').trim();
      if (!transcript) {
        res.status(422).json({
          error: 'No clear speech was detected in the recording. Please try speaking closer to your microphone or type your response.',
        });
        return;
      }

      res.json({ transcript });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/mock-interview/evaluate', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as MockEvaluateRequestBody;
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const roleTitle = typeof body.roleTitle === 'string' ? body.roleTitle.trim() : '';
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const answer = typeof body.answer === 'string' ? body.answer.trim() : '';

    if (!companyName || !question || !answer) {
      res.status(400).json({
        error: 'Company, interview question, and student response are required for evaluation.',
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured. Please set GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const category = body.category === 'Behavioral' ? 'Behavioral' : 'Technical';
    const expectedSignalsText = body.expectedSignals?.length
      ? `Expected interview signals: ${body.expectedSignals.join('; ')}`
      : '';

    const prompt = [
      `Company: ${companyName} (${roleTitle || 'Campus Role'})`,
      `Question Category: ${category}${body.focusArea ? ` — ${body.focusArea}` : ''}`,
      `Interview Question: "${question}"`,
      expectedSignalsText,
      `Response Mode: ${body.responseMode === 'recorded' ? 'Recorded & transcribed spoken answer' : 'Typed written answer'}`,
      `Candidate's Answer:\n"""\n${answer}\n"""`,
      'Evaluate the candidate fairly and constructively against campus hiring standards at this company.',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const response = await runWithTransientRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a calibrating campus hiring panelist. Score the answer honestly from 1 to 10 (do not inflate scores for vague or very short answers), identify specific strengths, concrete improvements, and provide a concise high-bar answer framework. Return strictly valid JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallScore: {
                  type: Type.INTEGER,
                  description: 'Integer score from 1 to 10.',
                },
                verdict: {
                  type: Type.STRING,
                  description: 'Short 2-4 word rating label such as Strong Hire Signal, Solid Foundation, or Needs Deeper Structure.',
                },
                summaryFeedback: {
                  type: Type.STRING,
                  description: '2-3 sentences of direct, constructive feedback tailored to the company.',
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2-3 specific strengths observed in the candidate response.',
                },
                improvements: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2-3 actionable things to sharpen or add next time.',
                },
                sampleStrongPoints: {
                  type: Type.STRING,
                  description: 'A concise model answer outline demonstrating a 9/10 response.',
                },
              },
              required: [
                'overallScore',
                'verdict',
                'summaryFeedback',
                'strengths',
                'improvements',
                'sampleStrongPoints',
              ],
            },
          },
        })
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty evaluation.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        overallScore?: number;
        verdict?: string;
        summaryFeedback?: string;
        strengths?: string[];
        improvements?: string[];
        sampleStrongPoints?: string;
      };

      const clampedScore = Math.min(
        10,
        Math.max(1, Math.round(Number(parsed.overallScore) || 5))
      );

      res.json({
        overallScore: clampedScore,
        verdict: parsed.verdict ?? 'Evaluated',
        summaryFeedback: parsed.summaryFeedback ?? '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        sampleStrongPoints: parsed.sampleStrongPoints ?? '',
      });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`NexusPlace server running at http://localhost:${port}`);
  });
}

createServer();
