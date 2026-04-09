import { useCallback } from "react";
import { usePipelineStore } from "../store/pipeline";
import { StepProgress } from "../components/StepProgress";
import { Card } from "../components/ui/Card";
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

export function PipelinePage() {
  const {
    steps, currentStep, mode,
    setCurrentStep, setStepStatus, setMode, reset,
    selectedTopic, setSelectedTopic, setArticleContent, setSelectedFramework,
    selectedFramework,
  } = usePipelineStore();

  const goNext = useCallback(() => {
    setStepStatus(currentStep, "done");
    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
      setStepStatus(currentStep + 1, "running");
    }
  }, [currentStep, setCurrentStep, setStepStatus]);

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
              onClick={() => setMode(m)}
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
