
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  AssessmentState,
  SimQuestion,
  PhaseResponse,
  Mentor,
  Leader,
  Investor,
  MentorLifelineResult,
  PhaseScenarioOut,
} from '@/src/types';

interface AssessmentStoreState {
  assessmentId: string | null;
  loading: boolean;
  error: string | null;
  state: AssessmentState | null;
  answers: Record<string, PhaseResponse>;
  qIndex: number;
  mcqFeedback: string | null;
  dynamicScenario: any | null;
  loadingScenario: boolean;
  dynamicScenarioError: string | null;
  dynamicScenarioBlocked: Record<string, boolean>;
  stageDynamicScenarios: Record<string, any>;
  loadingStageScenarios: boolean;
  loadingFollowup: Record<string, boolean>;
  followupScenarios: Record<string, { question: string }>;
  followupError: Record<string, string>;
  buyoutCompany: string;
  buyoutAmount: string;
  submitting: boolean;
  submitError: string | null;
  phaseScenario: PhaseScenarioOut | null;
  showingScenario: boolean;
  revenue: number;
  prevRevenue: number | undefined;
  userId: string | undefined;
  batchCode: string | undefined;
  budgetAllocations: Record<string, Record<string, number>>;
  mentors: Mentor[];
  leaders: Leader[];
  investors: Investor[];
  loadingConfig: boolean;
  showMentorPanel: boolean;
  selectedMentorId: string;
  mentorQuestion: string;
  mentorLoading: boolean;
  mentorResult: MentorLifelineResult | null;
  showPanelSelection: boolean;
  showRestartCheckpoint: boolean;
  settingCharacters: boolean;
  showCapitalAnimation: boolean;
  showStageNarration: boolean;
  showSnapshot: boolean;
  showMentorTip: boolean;
}

interface AssessmentStoreActions {
  setAssessmentId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setState: (state: AssessmentState | null) => void;
  setAnswers: (answers: Record<string, PhaseResponse>) => void;
  setQIndex: (index: number) => void;
  setMcqFeedback: (feedback: string | null) => void;
  setDynamicScenario: (scenario: any | null) => void;
  setLoadingScenario: (loading: boolean) => void;
  setDynamicScenarioError: (error: string | null) => void;
  setDynamicScenarioBlocked: (blocked: Record<string, boolean>) => void;
  setStageDynamicScenarios: (scenarios: Record<string, any>) => void;
  setLoadingStageScenarios: (loading: boolean) => void;
  setLoadingFollowup: (loading: Record<string, boolean>) => void;
  setFollowupScenarios: (scenarios: Record<string, { question: string }>) => void;
  setFollowupError: (error: Record<string, string>) => void;
  setBuyoutCompany: (company: string) => void;
  setBuyoutAmount: (amount: string) => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
  setPhaseScenario: (scenario: PhaseScenarioOut | null) => void;
  setShowingScenario: (showing: boolean) => void;
  setRevenue: (revenue: number) => void;
  setPrevRevenue: (revenue: number | undefined) => void;
  setUserId: (id: string | undefined) => void;
  setBatchCode: (code: string | undefined) => void;
  setBudgetAllocations: (allocations: Record<string, Record<string, number>>) => void;
  setMentors: (mentors: Mentor[]) => void;
  setLeaders: (leaders: Leader[]) => void;
  setInvestors: (investors: Investor[]) => void;
  setLoadingConfig: (loading: boolean) => void;
  setShowMentorPanel: (show: boolean) => void;
  setSelectedMentorId: (id: string) => void;
  setMentorQuestion: (q: string) => void;
  setMentorLoading: (loading: boolean) => void;
  setMentorResult: (result: MentorLifelineResult | null) => void;
  setShowPanelSelection: (show: boolean) => void;
  setShowRestartCheckpoint: (show: boolean) => void;
  setSettingCharacters: (setting: boolean) => void;
  setShowCapitalAnimation: (show: boolean) => void;
  setShowStageNarration: (show: boolean) => void;
  setShowSnapshot: (show: boolean) => void;
  setShowMentorTip: (show: boolean) => void;
}

export const useAssessmentStore = create<AssessmentStoreState & AssessmentStoreActions>()(
  immer((set) => ({
    assessmentId: null,
    loading: true,
    error: null,
    state: null,
    answers: {},
    qIndex: 0,
    mcqFeedback: null,
    dynamicScenario: null,
    loadingScenario: false,
    dynamicScenarioError: null,
    dynamicScenarioBlocked: {},
    stageDynamicScenarios: {},
    loadingStageScenarios: false,
    loadingFollowup: {},
    followupScenarios: {},
    followupError: {},
    buyoutCompany: '',
    buyoutAmount: '',
    submitting: false,
    submitError: null,
    phaseScenario: null,
    showingScenario: false,
    revenue: 0,
    prevRevenue: undefined,
    userId: undefined,
    batchCode: undefined,
    budgetAllocations: {},
    mentors: [],
    leaders: [],
    investors: [],
    loadingConfig: false,
    showMentorPanel: false,
    selectedMentorId: '',
    mentorQuestion: '',
    mentorLoading: false,
    mentorResult: null,
    showPanelSelection: false,
    showRestartCheckpoint: false,
    settingCharacters: false,
    showCapitalAnimation: false,
    showStageNarration: false,
    showSnapshot: false,
    showMentorTip: false,

    setAssessmentId: (assessmentId) => set({ assessmentId }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setState: (state) => set({ state }),
    setAnswers: (answers) => set({ answers }),
    setQIndex: (qIndex) => set({ qIndex }),
    setMcqFeedback: (mcqFeedback) => set({ mcqFeedback }),
    setDynamicScenario: (dynamicScenario) => set({ dynamicScenario }),
    setLoadingScenario: (loadingScenario) => set({ loadingScenario }),
    setDynamicScenarioError: (dynamicScenarioError) => set({ dynamicScenarioError }),
    setDynamicScenarioBlocked: (dynamicScenarioBlocked) => set({ dynamicScenarioBlocked }),
    setStageDynamicScenarios: (stageDynamicScenarios) => set({ stageDynamicScenarios }),
    setLoadingStageScenarios: (loadingStageScenarios) => set({ loadingStageScenarios }),
    setLoadingFollowup: (loadingFollowup) => set({ loadingFollowup }),
    setFollowupScenarios: (followupScenarios) => set({ followupScenarios }),
    setFollowupError: (followupError) => set({ followupError }),
    setBuyoutCompany: (buyoutCompany) => set({ buyoutCompany }),
    setBuyoutAmount: (buyoutAmount) => set({ buyoutAmount }),
    setSubmitting: (submitting) => set({ submitting }),
    setSubmitError: (submitError) => set({ submitError }),
    setPhaseScenario: (phaseScenario) => set({ phaseScenario }),
    setShowingScenario: (showingScenario) => set({ showingScenario }),
    setRevenue: (revenue) => set({ revenue }),
    setPrevRevenue: (prevRevenue) => set({ prevRevenue }),
    setUserId: (userId) => set({ userId }),
    setBatchCode: (batchCode) => set({ batchCode }),
    setBudgetAllocations: (budgetAllocations) => set({ budgetAllocations }),
    setMentors: (mentors) => set({ mentors }),
    setLeaders: (leaders) => set({ leaders }),
    setInvestors: (investors) => set({ investors }),
    setLoadingConfig: (loadingConfig) => set({ loadingConfig }),
    setShowMentorPanel: (showMentorPanel) => set({ showMentorPanel }),
    setSelectedMentorId: (selectedMentorId) => set({ selectedMentorId }),
    setMentorQuestion: (mentorQuestion) => set({ mentorQuestion }),
    setMentorLoading: (mentorLoading) => set({ mentorLoading }),
    setMentorResult: (mentorResult) => set({ mentorResult }),
    setShowPanelSelection: (showPanelSelection) => set({ showPanelSelection }),
    setShowRestartCheckpoint: (showRestartCheckpoint) => set({ showRestartCheckpoint }),
    setSettingCharacters: (settingCharacters) => set({ settingCharacters }),
    setShowCapitalAnimation: (showCapitalAnimation) => set({ showCapitalAnimation }),
    setShowStageNarration: (showStageNarration) => set({ showStageNarration }),
    setShowSnapshot: (showSnapshot) => set({ showSnapshot }),
    setShowMentorTip: (showMentorTip) => set({ showMentorTip }),
  }))
);
