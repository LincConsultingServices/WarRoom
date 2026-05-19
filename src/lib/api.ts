// ============================================
// KK's War Room 2.0 - API Client
// ============================================

import type {
  Assessment,
  AssessmentState,
  SubmitResponseResult,
  MentorLifelineResult,
  InvestorScorecard,
  EvaluationReport,
  ResponseData,
  Mentor,
  Investor,
  Leader,
  Competency,
  SimStage,
  CompetencyCode,
  StageName,
  BatchInfo,
  LeaderboardEntry,
  CharactersState,
  PhaseSubmitRequest,
  PhaseSubmitResult,
  AdminBatch,
  AdminBatchDetail,
  BatchParticipant,
  BatchStats,
  CreateBatchRequest,
  UpdateBatchRequest,
} from '@/src/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// ============================================
// Helper
// ============================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('batch');
      }
      throw new Error('Unauthorized');
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }

  return res.json();
}

// ============================================
// AUTH
// ============================================

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string; batchCode: string }) =>
      request<{ token: string; user: Record<string, unknown> }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string; batchCode?: string }) =>
      request<{ token: string; user: Record<string, unknown>; batch?: BatchInfo }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<{ id: string; email: string; name: string; batchCode: string; role: string }>('/auth/me'),
  },

  // ============================================
  // BATCHES (v2)
  // ============================================

  batches: {
    validate: (code: string) =>
      request<{ valid: boolean; batch?: BatchInfo; error?: string }>('/batches/validate', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),

    getLeaderboard: (code: string) =>
      request<{ batchCode: string; entries: LeaderboardEntry[] }>(`/batches/${code}/leaderboard`),
  },

  // ============================================
  // CONFIG (public)
  // ============================================

  config: {
    getMentors: () => request<Mentor[]>('/config/mentors'),
    getInvestors: () => request<Investor[]>('/config/investors'),
    getLeaders: () => request<Leader[]>('/config/leaders'),
    getCompetencies: () => request<Competency[]>('/config/competencies'),
    getStages: () => request<SimStage[]>('/config/stages'),
    getStageWeights: () =>
      request<Record<StageName, Record<CompetencyCode, number>>>('/config/stage-weights'),
  },

  // ============================================
  // ASSESSMENTS
  // ============================================

  assessments: {
    create: (data: { level: 1 | 2; userIdea?: string; batchCode?: string; selectedMentors?: string[]; selectedLeaders?: string[]; selectedInvestors?: string[] }) =>
      request<Assessment>('/assessments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: () => request<Assessment[]>('/assessments'),

    get: (id: string) => request<AssessmentState>(`/assessments/${id}`),

    // V2: Phase-level bulk submission
    submitPhase: (id: string, data: PhaseSubmitRequest) =>
      request<PhaseSubmitResult>(`/assessments/${id}/phase-submit`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // V2: Characters (mentors/leaders/investors selection)
    getCharacters: (id: string) =>
      request<CharactersState>(`/assessments/${id}/characters`),

    setCharacters: (id: string, data: CharactersState) =>
      request<{ message: string }>(`/assessments/${id}/characters`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // V2: Phase scenario answer
    answerPhaseScenario: (id: string, data: { fromStage: string; toStage: string; response: string }) =>
      request<{ message: string; proficiencyScore: number; feedback: string }>(`/assessments/${id}/phase-scenario`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      

    submitResponse: (id: string, data: { questionId: string; responseData: ResponseData }) =>
      request<SubmitResponseResult>(`/assessments/${id}/responses`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    submitStageResponses: (id: string, responses: Record<string, ResponseData>) =>
      request<SubmitResponseResult>(`/assessments/${id}/stage-responses`, {
        method: 'POST',
        body: JSON.stringify({ responses }),
      }),

    // Mentor Lifeline
    useMentorLifeline: (id: string, mentorId: string, question: string) =>
      request<MentorLifelineResult>(`/assessments/${id}/mentor`, {
        method: 'POST',
        body: JSON.stringify({ mentorId, question }),
      }),

    // War Room
    submitPitch: (id: string, pitchText: string) =>
      request<{ pitchReceived: boolean; investors: Record<string, unknown>[]; message: string }>(
        `/assessments/${id}/warroom/pitch`,
        {
          method: 'POST',
          body: JSON.stringify({ pitchText }),
        }
      ),

    respondToInvestor: (id: string, investorId: string, response: string) =>
      request<InvestorScorecard>(`/assessments/${id}/warroom/respond`, {
        method: 'POST',
        body: JSON.stringify({ investorId, response }),
      }),

    getScorecard: (id: string) =>
      request<InvestorScorecard[]>(`/assessments/${id}/warroom/scorecard`),

    getWarRoomOffers: (id: string) =>
      request<Record<string, unknown>[]>(`/assessments/${id}/warroom/offers`),

    counterNegotiate: (id: string, investorId: string, capital: number, equity: number) =>
      request<{ message: string; accepted: boolean; capital: number; equity: number }>(`/assessments/${id}/warroom/counter`, {
        method: 'POST',
        body: JSON.stringify({ investorId, capital, equity }),
      }),

    acceptDeal: (id: string, investorId: string, capital: number, equity: number) =>
      request<{ message: string }>(`/assessments/${id}/warroom/accept-deal`, {
        method: 'POST',
        body: JSON.stringify({ investorId, capital, equity }),
      }),

    rejectOffer: (id: string, offerId: string) =>
      request<Record<string, unknown>>(`/assessments/${id}/warroom/reject-offer`, {
        method: 'POST',
        body: JSON.stringify({ offerId }),
      }),

    counterNegotiateAudio: async (id: string, investorId: string, audioBlob: Blob) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const formData = new FormData()
      formData.append('audio', audioBlob, 'counter.webm')
      formData.append('investorId', investorId)
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 35000)
      try {
        const res = await fetch(`${API_BASE}/assessments/${id}/warroom/counter-audio`, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal,
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || `API error: ${res.status}`)
        }
        const data = (await res.json()) as {
          transcription: string
          message: string
          accepted: boolean
          isFinal: boolean
          capital: number
          equity: number
          audioBase64?: string
        }
        if (!data.message) {
          throw new Error('Negotiator returned an empty response')
        }
        return data
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('Negotiator timed out — please try again')
        }
        throw err
      } finally {
        clearTimeout(timeout)
      }
    },

    // War Room Audio
    submitPitchAudio: async (id: string, audioBlob: Blob) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const formData = new FormData()
      formData.append('audio', audioBlob, 'pitch.webm')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/assessments/${id}/warroom/pitch-audio`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `API error: ${res.status}`)
      }
      return res.json() as Promise<{
        pitchReceived: boolean
        investors: Record<string, unknown>[]
        message: string
        analysis: {
          transcription: string
          feedback: string
          strengths: string[]
          weaknesses: string[]
          overallScore: number
          clarity: number
          confidence: number
          persuasion: number
        }
      }>
    },

    generateInvestorFollowupAudio: async (id: string, investorId: string, audioBlob: Blob) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const formData = new FormData()
        formData.append('audio', audioBlob, 'response.webm')
        formData.append('investorId', investorId)
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/assessments/${id}/warroom/investor-followup-audio`, {
            method: 'POST',
            headers,
            body: formData,
        })
        if (!res.ok) throw new Error('Failed to generate investor followup')
        return res.json()
    },

    respondToInvestorFinalAudio: async (id: string, investorId: string, initialTranscription: string, followupQuestion: string, audioBlob: Blob) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const formData = new FormData()
        formData.append('audio', audioBlob, 'final_response.webm')
        formData.append('investorId', investorId)
        formData.append('initialTranscription', initialTranscription)
        formData.append('followupQuestion', followupQuestion)
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/assessments/${id}/warroom/respond-final-audio`, {
            method: 'POST',
            headers,
            body: formData,
        })
        if (!res.ok) throw new Error('Failed to submit final response')
        return res.json()
    },

    respondToInvestorAudio: async (id: string, investorId: string, audioBlob: Blob) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const formData = new FormData()
      formData.append('audio', audioBlob, 'response.webm')
      formData.append('investorId', investorId)
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/assessments/${id}/warroom/respond-audio`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `API error: ${res.status}`)
      }
      return res.json() as Promise<{
        scorecard: InvestorScorecard
        transcription: string
        ttsError?: string
        audioBase64?: string
      }>
    },

    // Dynamic Scenario
    getDynamicScenario: (id: string, stageId: string, questionId: string) =>
      request<Record<string, unknown>>(`/assessments/${id}/dynamic-scenario?stageId=${stageId}&questionId=${questionId}`),

    getStageDynamicScenarios: (id: string, stageId: string) =>
      request<Record<string, unknown>[]>(`/assessments/${id}/stage/${stageId}/dynamic-scenarios`),

    submitDynamicScenario: (id: string, scenarioId: string, selectedOptionId: string) =>
      request<SubmitResponseResult>(`/assessments/${id}/dynamic-scenario/submit`, {
        method: 'POST',
        body: JSON.stringify({ scenarioId, selectedOptionId }),
      }),

    // Flow Branching Follow-up (using public Demo API for convenience)
    generateFollowup: (data: { introduction: string; originalQuestion: string; selectedOptionText: string; selectedOptionFeedback: string; roundNumber: number }) =>
      request<{ question: string }>('/demo/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),


    // AI-generated end-of-phase question
    generateAiQuestion: (id: string, data: { stageId: string; responses: Array<{ questionId: string; summary: string }>; userIdea: string }) =>
      request<{ question: string; leaderName: string }>(`/assessments/${id}/generate-ai-question`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Report
    getReport: (id: string) => request<EvaluationReport>(`/assessments/${id}/report`),

    // Regenerate the report from scratch — drops any cached row and rebuilds from
    // the current assessment state. Use after late answer changes (e.g. user
    // answered more questions after a buyout-triggered draft report was created).
    regenerateReport: (id: string) =>
      request<EvaluationReport>(`/assessments/${id}/report?regenerate=true`),

    // Flow Branching
    // mode="continue" preserves prior responses and just jumps the cursor to the
    // given target stage (defaults to current stage). mode="month_zero" or omitted
    // performs a full wipe and returns the user to Ideation.
    restartAssessment: (id: string, opts?: { mode?: 'month_zero' | 'continue'; targetStage?: string }) =>
      request<Assessment>(`/assessments/${id}/restart`, {
        method: 'POST',
        body: opts ? JSON.stringify(opts) : undefined,
      }),

    chooseBuyout: (id: string, company: string, amount: number) =>
      request<Assessment>(`/assessments/${id}/buyout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, amount }),
      }),

    walkout: (id: string) =>
      request<Assessment>(`/assessments/${id}/walkout`, {
        method: 'POST',
      }),
  },

  // ============================================
  // ADMIN
  // ============================================

  admin: {
    createBatch: (data: CreateBatchRequest) =>
      request<AdminBatchDetail>('/admin/batches', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    listBatches: () => request<AdminBatch[]>('/admin/batches'),

    getBatch: (id: string) => request<AdminBatchDetail>(`/admin/batches/${id}`),

    updateBatch: (id: string, data: UpdateBatchRequest) =>
      request<AdminBatchDetail>(`/admin/batches/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    deleteBatch: (id: string) =>
      request<{ message: string }>(`/admin/batches/${id}`, {
        method: 'DELETE',
      }),

    getParticipants: (id: string) =>
      request<BatchParticipant[]>(`/admin/batches/${id}/participants`),

    getStats: (id: string) =>
      request<BatchStats>(`/admin/batches/${id}/stats`),
  },
};

export default api;
