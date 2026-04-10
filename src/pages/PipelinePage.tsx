import { useCallback, useState } from "react";
import { usePipelineStore } from "../store/pipeline";
import { StepProgress } from "../components/StepProgress";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Step1EnvCheck } from "../components/steps/Step1EnvCheck";
import { Step2Topics } from "../components/steps/Step2Topics";
import { Step3Framework } from "../components/steps/Step3Framework";
import { Step4Writing } from "../components/steps/Step4Writing";
import { Step5Humanizer } from "../components/steps/Step5Humanizer";
import { Step6SEO } from "../components/steps/Step6SEO";
import { Step7Images } from "../components/steps/Step7Images";
import { Step8Layout } from "../components/steps/Step8Layout";
import { Step9Finish } from "../components/steps/Step9Finish";

const STEP_TITLES = [
  "环境检查", "选题", "框架+素材", "写作", "去AI化", "SEO+验证", "配图", "排版+发布", "收尾"
];

const MODE_LABELS: Record<string, string> = {
  auto: "自动",
  interactive: "交互",
  stepwise: "逐步",
};

// Steps that require explicit confirmation in interactive mode
const INTERACTIVE_CONFIRM_STEPS = new Set([2, 3, 7]);
// All steps require confirmation in stepwise mode
const STEPWISE_CONFIRM_STEPS = new Set([1, 2, 3, 4, 5, 6, 7, 8]);

export function PipelinePage() {
  const {
    steps, currentStep, mode,
    setCurrentStep, setStepStatus, setMode, reset,
    selectedTopic, setSelectedTopic, setArticleContent, setSelectedFramework,
    selectedFramework,
  } = usePipelineStore();

  // Confirmation state for stepwise/interactive modes
  const [pendingConfirm, setPendingConfirm] = useState<number | null>(null);

  const needsConfirm = (step: number) => {
    if (mode === "stepwise") return STEPWISE_CONFIRM_STEPS.has(step);
    if (mode === "interactive") return INTERACTIVE_CONFIRM_STEPS.has(step);
    return false;
  };

  const doAdvance = useCallback((toStep: number) => {
    setStepStatus(currentStep, "done");
    setCurrentStep(toStep);
    setStepStatus(toStep, "running");
    setPendingConfirm(null);
  }, [currentStep, setCurrentStep, setStepStatus]);

  const goNext = useCallback((targetStep?: number) => {
    const next = targetStep ?? currentStep + 1;
    if (next > 9) return;
    if (needsConfirm(next)) {
      setPendingConfirm(next); // pause and wait for user to confirm
    } else {
      doAdvance(next);
    }
  }, [currentStep, needsConfirm, doAdvance]);

  const confirmAdvance = useCallback(() => {
    if (pendingConfirm !== null) {
      doAdvance(pendingConfirm);
    }
  }, [pendingConfirm, doAdvance]);

  const cancelAdvance = useCallback(() => {
    setPendingConfirm(null);
  }, []);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setStepStatus(currentStep, "pending");
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep, setStepStatus]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const progressSteps = steps.map((s) => ({
    number: s.id,
    title: STEP_TITLES[s.id - 1],
    status: s.status,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-[15px] font-semibold text-[var(--color-near-black)]">写作流程</h1>
        <div className="flex items-center gap-1 p-0.5 rounded-[var(--radius-sm)] bg-[var(--color-light-bg)]">
          {(["auto", "interactive", "stepwise"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setPendingConfirm(null); }}
              className={`px-3 py-1.5 text-[12px] rounded-[var(--radius-micro)] transition-all duration-150 ${
                mode === m
                  ? "bg-white text-[var(--color-near-black)] shadow-[var(--shadow-card)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-near-black)]"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Step progress */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white">
        <StepProgress
          steps={progressSteps}
          currentStep={currentStep}
          onStepClick={(n) => {
            const clickedStep = steps.find((s) => s.id === n);
            if (clickedStep && (clickedStep.status === "done" || n === currentStep)) {
              setCurrentStep(n);
            }
          }}
        />
      </div>

      {/* Confirmation overlay for stepwise/interactive mode */}
      {pendingConfirm !== null && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-[13px] text-blue-700">
            {mode === "stepwise"
              ? `第 ${pendingConfirm} 步「${STEP_TITLES[pendingConfirm - 1]}」已完成，是否继续？`
              : `确认进入「${STEP_TITLES[pendingConfirm - 1]}」？`}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={cancelAdvance}>返回修改</Button>
            <Button size="sm" variant="primary" onClick={confirmAdvance}>确认继续</Button>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-[var(--shadow-card)]">
            {currentStep === 1 && <Step1EnvCheck onNext={goNext} />}
            {currentStep === 2 && (
              <Step2Topics
                onNext={goNext}
                onBack={goBack}
                onTopicSelected={(t) => { setSelectedTopic({ title: t.title, framework: t.framework, keywords: t.keywords }); setSelectedFramework(null); }}
              />
            )}
            {currentStep === 3 && <Step3Framework onNext={(fw) => { setSelectedFramework(fw); goNext(); }} onBack={goBack} />}
            {currentStep === 4 && (
              <Step4Writing
                onNext={goNext}
                onBack={goBack}
                topic={selectedTopic ?? undefined}
                framework={selectedFramework ?? selectedTopic?.framework ?? undefined}
                onArticleReady={(content) => setArticleContent(content)}
              />
            )}
            {currentStep === 5 && <Step5Humanizer onNext={goNext} onBack={goBack} />}
            {currentStep === 6 && <Step6SEO onNext={goNext} onBack={goBack} />}
            {currentStep === 7 && <Step7Images onNext={goNext} onBack={goBack} />}
            {currentStep === 8 && <Step8Layout onNext={goNext} onBack={goBack} />}
            {currentStep === 9 && <Step9Finish onReset={handleReset} />}
          </Card>
        </div>
      </div>
    </div>
  );
}
