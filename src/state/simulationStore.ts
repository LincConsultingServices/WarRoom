'use client'

/**
 * simulationStore — Zustand stub.
 *
 * The actual simulation state lives in `useWarRoom` / `useSimulation`
 * hook composition today. This store exists as a stable import path
 * for cross-cutting concerns (e.g. the Narrator wanting to know which
 * phase the user is in) and for future slices to extend.
 *
 * Landing slice does not write to this store. Actions are no-ops
 * until a later slice wires them up.
 */

import { create } from 'zustand'

export type SimulationPhase =
  | 'idle'
  | 'onboarding'
  | 'simulation'
  | 'warroom'
  | 'verdict'
  | 'complete'

export type WarRoomPhase = 'entrance' | 'pitching' | 'deliberation' | 'verdict'

export type InvestorMood =
  | 'neutral'
  | 'interested'
  | 'skeptical'
  | 'hostile'
  | 'impressed'
  | 'deliberating'

interface SimulationState {
  phase: SimulationPhase
  currentStageId: string | null
  activeInvestorId: string | null
  investorMoods: Record<string, InvestorMood>
  warRoomPhase: WarRoomPhase | null

  setPhase: (phase: SimulationPhase) => void
  setCurrentStage: (stageId: string | null) => void
  setActiveInvestor: (id: string | null) => void
  setInvestorMood: (investorId: string, mood: InvestorMood) => void
  setWarRoomPhase: (phase: WarRoomPhase | null) => void
  reset: () => void
}

const initial = {
  phase: 'idle' as SimulationPhase,
  currentStageId: null as string | null,
  activeInvestorId: null as string | null,
  investorMoods: {} as Record<string, InvestorMood>,
  warRoomPhase: null as WarRoomPhase | null,
}

export const useSimulationStore = create<SimulationState>((set) => ({
  ...initial,
  setPhase: (phase) => set({ phase }),
  setCurrentStage: (currentStageId) => set({ currentStageId }),
  setActiveInvestor: (activeInvestorId) => set({ activeInvestorId }),
  setInvestorMood: (investorId, mood) =>
    set((state) => ({
      investorMoods: { ...state.investorMoods, [investorId]: mood },
    })),
  setWarRoomPhase: (warRoomPhase) => set({ warRoomPhase }),
  reset: () => set(initial),
}))
