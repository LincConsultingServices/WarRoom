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
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-destructive">{error}</p><Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button></div>
  if (!state || !simulation) return null

  const accent = STAGE_THEMES[simulation.currentStage] || '#6366f1'
  const narration = STAGE_NARRATIVES[simulation.currentStage]
  const mentorTip = STAGE_MENTOR_TIPS[simulation.currentStage]
  const stageIdx = STAGE_ORDER.indexOf(simulation.currentStage as StageName)

  // ---- Panel Selection ----
  if (showPanelSelection) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Assemble Your Board</h1>
            <p className="text-muted-foreground">Select the mentors, leaders, and investors who will guide your journey.</p>
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
            <div className="bg-green-500 text-white font-black text-4xl sm:text-6xl px-12 py-8 rounded-full shadow-[0_0_100px_rgba(34,197,94,0.8)] border-4 border-white/20 transform -rotate-6">+$50,000 RAISED! 🎉</div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mentor button */}
      <div className="fixed bottom-6 right-6 z-40 group">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowMentorPanel(true)}
          className="flex items-center gap-3 bg-card border-2 shadow-xl rounded-full p-3 pr-5 text-sm font-semibold"
          style={{ borderColor: accent, color: accent }}
        >
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-background border relative">
            <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-primary" /></span>
            <Users className="h-5 w-5" />
          </div>
          <span>Need Help?</span>
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
        <div className="min-h-screen bg-background flex flex-col">
          <CinemaOverlay show={submitting} icon={<Loader2 className="h-10 w-10 animate-spin text-primary" />} title="Evaluating your ideation..." subtitle="AI is reviewing your business concept" />
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
      <div className="min-h-screen bg-background flex flex-col">
        <CinemaOverlay show={submitting} icon={<Loader2 className="h-10 w-10 animate-spin text-primary" />} title="Evaluating phase responses..." subtitle="AI is reviewing your answers" />
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
