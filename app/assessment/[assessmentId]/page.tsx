'use client'

import { useParams, useRouter } from 'next/navigation'
import { Loader2, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { RevenueSidePanel } from '@/src/components/RevenueSidePanel'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { CharacterPicker } from '@/src/components/CharacterPicker'
import { CinemaOverlay, StageNarrationOverlay, SnapshotDashboard, MentorTipPopup } from '@/src/components/AnimatedComponents'
import { MentorLifelinesCard, MentorOverlay } from '@/src/components/MentorComponents'
import { SimulationHeader } from '@/src/components/SimulationHeader'
import { IdeationView } from './_views/IdeationView'
import { StageView } from './_views/StageView'
import { PhaseTransitionView } from './_views/PhaseTransitionView'
import { RestartConfirmDialog } from './_views/RestartConfirmDialog'
import { useSimulation } from '@/src/hooks/useSimulation'
import { STAGE_THEMES, STAGE_NARRATIVES, STAGE_ORDER, STAGE_MENTOR_TIPS, NARRATION_STAGE_LABELS } from '@/src/lib/constants'
import { stageLabel } from '@/src/lib/helpers'
import type { StageName } from '@/src/types'

export default function SimulationPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const router = useRouter()

  const sim = useSimulation(assessmentId)
  const {
    state, loading, error, simulation, questions, currentQ, qIndex, answers, mcqFeedback,
    dynamicScenario, loadingScenario, dynamicScenarioError,
    loadingFollowup, followupScenarios, followupError,
    buyoutCompany, buyoutAmount, submitting, submitError,
    phaseScenario, showingScenario, showRestartCheckpoint,
    revenue, prevRevenue, userId, batchCode, budgetAllocations,
    mentors, loadingConfig, showMentorPanel, selectedMentorId, mentorQuestion, mentorLoading, mentorResult,
    showPanelSelection, settingCharacters, showCapitalAnimation,
    showStageNarration, showSnapshot, showMentorTip,
    stageTimer, shouldRunTimer, isCrisisQuestion,
    entries, connected, updatedAt, snapshotContinueRef,
    showRestartConfirm, setShowRestartConfirm, confirmRestart,
    isIdeationStage, isLastQuestion, isFirstQuestion, currentAnswer, answeredCount, lifelinesLeft,
    // Setters
    setShowMentorPanel, setSelectedMentorId, setMentorQuestion, setMentorResult,
    setBuyoutCompany, setBuyoutAmount, setShowStageNarration, setQIndex, setMcqFeedback,
    // Handlers
    goBack, goNext, handleSelectOption, handleConfirmScenarioDecision, handleTextChange,
    handleBudgetAllocation, doPhaseSubmit, handleCharacterConfirm,
    handleRestart, handleContinue, handleUseMentor, closeMentorPanel,
    handleBuyoutSubmit, handleScenarioSubmit, retryScenario, acknowledgeInfo,
  } = sim

  // ---- Loading / Error ----
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0806' }}>
      <div className="text-center space-y-4">
        <div className="text-4xl animate-torch-glow">🐉</div>
        <div className="w-8 h-8 mx-auto" style={{ border: '2px solid rgba(201,162,39,0.2)', borderTopColor: '#c9a227', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p className="text-xs" style={{ fontFamily: "'Cinzel', Georgia, serif", color: '#c9a227', letterSpacing: '0.15em' }}>SUMMONING THE COUNCIL...</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a0806' }}>
      <p style={{ color: '#c23b3b', fontFamily: "'Cinzel', Georgia, serif" }}>{error}</p>
      <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227', padding: '8px 20px', borderRadius: '3px', fontFamily: "'Cinzel', Georgia, serif", fontSize: '0.75rem', letterSpacing: '0.1em', cursor: 'pointer' }}>Return to the Keep</button>
    </div>
  )
  if (!state || !simulation) return null

  const accent = STAGE_THEMES[simulation.currentStage] || '#6366f1'
  const narration = STAGE_NARRATIVES[simulation.currentStage]
  const mentorTip = STAGE_MENTOR_TIPS[simulation.currentStage]
  const stageIdx = STAGE_ORDER.indexOf(simulation.currentStage as StageName)

  // ---- Panel Selection ----
  if (showPanelSelection) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0806, #110e0a)' }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.3), transparent)' }} />
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <div className="text-3xl">👑</div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Cinzel', Georgia, serif", color: '#e8e0d0', letterSpacing: '0.06em' }}>Assemble the War Council</h1>
            <div className="h-px max-w-sm mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.4), transparent)' }} />
            <p style={{ color: '#8c8075', fontSize: '0.85rem', letterSpacing: '0.04em' }}>Choose wisely, Lord Commander. Their counsel will shape your fate.</p>
          </div>
          <CharacterPicker mentors={mentors} leaders={[]} investors={[]} onConfirm={handleCharacterConfirm} loading={settingCharacters} />
        </div>
      </div>
    )
  }

  // ---- Phase Transition ----
  if (showingScenario && phaseScenario) {
    return (
      <>
        <PhaseTransitionView
          phaseScenario={phaseScenario}
          showRestartCheckpoint={showRestartCheckpoint}
          submitting={submitting}
          revenue={revenue}
          prevRevenue={prevRevenue}
          entries={entries}
          userId={userId}
          onScenarioSubmit={handleScenarioSubmit}
          onRestart={handleRestart}
          onContinue={handleContinue}
        />
        <MentorOverlay
          show={showMentorPanel}
          lifelinesLeft={lifelinesLeft}
          mentors={mentors}
          loadingConfig={loadingConfig}
          selectedMentorId={selectedMentorId}
          mentorQuestion={mentorQuestion}
          mentorLoading={mentorLoading}
          mentorResult={mentorResult}
          onSelectMentor={setSelectedMentorId}
          onQuestionChange={setMentorQuestion}
          onSubmit={handleUseMentor}
          onClose={closeMentorPanel}
        />
      </>
    )
  }

  // ---- Shared overlays ----
  const sharedOverlays = (
    <>
      <RestartConfirmDialog
        open={showRestartConfirm}
        submitting={submitting}
        onCancel={() => setShowRestartConfirm(false)}
        onConfirm={confirmRestart}
      />
      <MentorOverlay
        show={showMentorPanel}
        lifelinesLeft={lifelinesLeft}
        mentors={mentors}
        loadingConfig={loadingConfig}
        selectedMentorId={selectedMentorId}
        mentorQuestion={mentorQuestion}
        mentorLoading={mentorLoading}
        mentorResult={mentorResult}
        onSelectMentor={setSelectedMentorId}
        onQuestionChange={setMentorQuestion}
        onSubmit={handleUseMentor}
        onClose={closeMentorPanel}
      />
      {narration && (
        <StageNarrationOverlay
          show={showStageNarration}
          data={narration}
          stageIndex={stageIdx}
          totalStages={STAGE_ORDER.length}
          stageLabels={NARRATION_STAGE_LABELS}
          accentColor={accent}
          onDismiss={() => setShowStageNarration(false)}
        />
      )}
      <SnapshotDashboard
        show={showSnapshot && !showStageNarration}
        revenue={revenue}
        previousRevenue={prevRevenue}
        leaderboardEntries={entries.map(e => ({ name: e.name || e.userId, score: e.revenueProjection || 0, isUser: e.userId === userId }))}
        stageName={stageLabel(simulation.currentStage)}
        onContinue={() => snapshotContinueRef.current?.()}
      />
      {mentorTip && (
        <MentorTipPopup
          show={showMentorTip}
          message={mentorTip}
          onDismiss={() => { /* handled in hook */ }}
          onAskMentor={() => { setMentorResult(null); setShowMentorPanel(true) }}
        />
      )}
      {/* Capital animation */}
      <AnimatePresence>
        {showCapitalAnimation && (
          <motion.div initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.5, y: -50 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center" style={{ background: 'rgba(10,8,6,0.9)', border: '2px solid rgba(201,162,39,0.6)', borderRadius: '4px', padding: '2rem 3rem', boxShadow: '0 0 60px rgba(201,162,39,0.4), 0 0 120px rgba(201,162,39,0.15)' }}>
              <div className="text-3xl mb-2">🐉</div>
              <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '1.8rem', fontWeight: 900, color: '#c9a227', letterSpacing: '0.08em', textShadow: '0 0 30px rgba(201,162,39,0.8)' }}>+$50,000 PLEDGED!</div>
              <div style={{ fontSize: '0.7rem', color: '#8c8075', letterSpacing: '0.15em', marginTop: '4px' }}>THE COUNCIL INVESTS IN YOUR REALM</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mentor button */}
      <div className="fixed bottom-6 right-6 z-40 group">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowMentorPanel(true)}
          className="flex items-center gap-2"
          style={{ background: 'rgba(17,14,10,0.9)', border: `1px solid ${accent}40`, borderRadius: '24px', padding: '8px 16px 8px 8px', boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 20px ${accent}20`, backdropFilter: 'blur(8px)' }}
        >
          <div className="h-9 w-9 rounded-full flex items-center justify-center relative" style={{ background: 'rgba(201,162,39,0.1)', border: `1px solid ${accent}40` }}>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accent }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: accent }} />
            </span>
            <Users className="h-4 w-4" style={{ color: accent }} />
          </div>
          <span className="text-xs font-bold" style={{ fontFamily: "'Cinzel', Georgia, serif", color: accent, letterSpacing: '0.06em' }}>Counsel</span>
        </motion.button>
      </div>
    </>
  )

  // ---- Sidebar (shared) ----
  const sidebar = {
    left: (
      <div className="hidden lg:flex flex-col gap-4">
        <RevenueSidePanel revenue={revenue} previousRevenue={prevRevenue} currentStage={simulation.currentStage} capital={simulation.capital} budgetAllocations={simulation.budgetAllocations} />
      </div>
    ),
    right: (
      <div className="hidden lg:flex flex-col gap-4">
        <MentorLifelinesCard lifelinesLeft={lifelinesLeft} onOpen={() => { setMentorResult(null); setShowMentorPanel(true) }} />
        {batchCode ? (
          <LeaderboardPanel entries={entries} currentUserId={userId} connected={connected} updatedAt={updatedAt} className="flex-1 max-h-[500px]" />
        ) : (
          <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">Join a batch to see live leaderboard</div>
        )}
      </div>
    ),
  }

  // ---- Ideation ----
  if (isIdeationStage) {
    return (
      <>
        {sharedOverlays}
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0a0806 0%, #110e0a 100%)' }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.2), transparent)', zIndex: 40 }} />
          <CinemaOverlay show={submitting} icon={<div className="text-4xl animate-torch-glow">⚔</div>} title="The Council weighs your idea..." subtitle="Forging your founder assessment" />
          <SimulationHeader
            stageName="Stage -2: IDEATION"
            progressLabel={`${answeredCount}/${questions.length} answered`}
            progressPct={questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}
            timer={shouldRunTimer ? stageTimer : undefined}
            showTimer={shouldRunTimer}
            accent={accent}
          />
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 max-w-7xl mx-auto w-full px-4 py-6">
            {sidebar.left}
            <IdeationView
              questions={questions}
              answers={answers}
              answeredCount={answeredCount}
              submitting={submitting}
              submitError={submitError}
              accent={accent}
              onTextChange={(text, qId) => handleTextChange(text, qId)}
              onSelectOption={(opt, qId) => handleSelectOption(opt, qId)}
              onSubmitPhase={doPhaseSubmit}
            />
            {sidebar.right}
          </div>
        </div>
      </>
    )
  }

  // ---- Normal Stage ----
  const pct = questions.length > 0 ? Math.round(((qIndex + 1) / questions.length) * 100) : 0

  return (
    <>
      {sharedOverlays}
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0a0806 0%, #110e0a 100%)' }}>
        <div className="fixed inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.15), transparent)', zIndex: 31 }} />
        <CinemaOverlay show={submitting} icon={<div className="text-4xl animate-torch-glow">⚔</div>} title="The Council deliberates..." subtitle="Your answers are being judged" />
        {isCrisisQuestion && <div className="crisis-vignette" />}
        <SimulationHeader
          stageName={stageLabel(simulation.currentStage)}
          progressLabel={`Q${qIndex + 1} of ${questions.length}`}
          progressPct={pct}
          timer={shouldRunTimer ? stageTimer : undefined}
          showTimer={shouldRunTimer}
          isCrisis={isCrisisQuestion}
          accent={accent}
        />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 max-w-7xl mx-auto w-full px-4 py-6">
          {sidebar.left}
          <StageView
            questions={questions}
            qIndex={qIndex}
            currentQ={currentQ}
            currentAnswer={currentAnswer}
            answers={answers}
            isCrisisQuestion={isCrisisQuestion}
            submitting={submitting}
            submitError={submitError}
            isLastQuestion={isLastQuestion}
            isFirstQuestion={isFirstQuestion}
            answeredCount={answeredCount}
            dynamicScenario={dynamicScenario}
            loadingScenario={loadingScenario}
            dynamicScenarioError={dynamicScenarioError}
            loadingFollowup={loadingFollowup}
            followupScenarios={followupScenarios}
            followupError={followupError}
            mcqFeedback={mcqFeedback}
            capital={simulation.capital || 100000}
            budgetAllocations={budgetAllocations}
            buyoutCompany={buyoutCompany}
            buyoutAmount={buyoutAmount}
            accent={accent}
            onGoBack={goBack}
            onGoNext={goNext}
            onSelectOption={handleSelectOption}
            onConfirmScenarioDecision={handleConfirmScenarioDecision}
            onTextChange={handleTextChange}
            onBudgetAllocation={handleBudgetAllocation}
            onSubmitPhase={doPhaseSubmit}
            onBuyoutCompanyChange={setBuyoutCompany}
            onBuyoutAmountChange={setBuyoutAmount}
            onBuyoutSubmit={handleBuyoutSubmit}
            onRetryScenario={retryScenario}
            onAcknowledge={acknowledgeInfo}
            setQIndex={setQIndex}
            setMcqFeedback={setMcqFeedback}
          />
          {sidebar.right}
        </div>
      </div>
    </>
  )
}
