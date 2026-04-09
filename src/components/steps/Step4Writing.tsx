import { useEffect, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import { Button } from "../ui/Button";

const MOCK_ARTICLE = `# DeepSeek R2 发布：国产大模型首次超越 GPT-4o，我们该怎么看？

这件事情发生的时候，我正好在刷推特。

凌晨两点，DeepSeek 官方突然发布了一条微博。没有倒计时，没有发布会，就这么丢出来——R2 发布，全面超越 GPT-4o。评论区炸了。

我花了大概二十分钟把基准测试数据扫了一遍。数据确实好看，但"全面超越"这四个字让我停顿了一下。

<!-- ✏️ 编辑建议：在这里加一句你自己第一次看到这个消息时的感受 -->

## 数据说明了什么

MMLU 上，R2 拿到了 91.3，比 GPT-4o 的 88.7 高了不少。编程能力测评 HumanEval 里，差距更明显，足足高出 6 个百分点。

但数学推理和多语言理解，两家几乎打平。

这里有一个细节值得注意：DeepSeek 的训练成本据说只有 OpenAI 的十分之一。如果这个数字是真的，那这才是真正值得关注的事情。

## 为什么国内的反应比国外更复杂

在硅谷，这件事基本被定性为"技术进步，值得关注"。但国内创投圈的讨论就热闹多了——有人说国内 AI 终于站起来了，有人说这不过是参数刷榜，还有人在讨论这对字节、百度意味着什么。

<!-- ✏️ 编辑建议：你怎么看国内 AI 生态的竞争格局？加入你的判断 -->

情绪超过了技术本身，这挺正常的。

## 但有一些问题还没有答案

基准测试和实际使用之间，永远存在一道墙。我在写这篇文章的时候，用 R2 跑了几个任务。有的地方确实比 GPT-4o 顺滑，有的地方你能感觉到它在用力——那种用力的感觉，是不自然的。

这不是批评，只是观察。

任何一个模型从发布到真正被开发者信任，都需要时间。GPT-4o 也是如此，Claude 也是如此。

---

真正重要的可能不是谁第一，而是这件事情在加速。越来越多的人有机会用上越来越好的工具。这对大多数普通人来说，才是值得关注的变化。`;

interface Step4WritingProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step4Writing({ onNext, onBack }: Step4WritingProps) {
  const [phase, setPhase] = useState<"loading" | "streaming" | "done">("loading");
  const [displayedLines, setDisplayedLines] = useState(0);
  const lines = MOCK_ARTICLE.split("\n");

  useEffect(() => {
    const loadTimer = setTimeout(() => setPhase("streaming"), 1500);
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (phase !== "streaming") return;
    if (displayedLines >= lines.length) {
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setDisplayedLines((n) => n + 1), 18);
    return () => clearTimeout(t);
  }, [phase, displayedLines, lines.length]);

  const content = lines.slice(0, displayedLines).join("\n");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-near-black)] mb-1">写作</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {phase === "loading" && "正在准备写作参数…"}
            {phase === "streaming" && "AI 正在写作，请稍候…"}
            {phase === "done" && `初稿完成，共 ${content.replace(/\s/g, "").length} 字。`}
          </p>
        </div>
        {phase === "streaming" && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-apple-blue)]">
            <Loader2 size={13} className="animate-spin" />
            <span>写作中</span>
          </div>
        )}
        {phase === "done" && (
          <div className="flex items-center gap-2 text-[12px] text-green-600">
            <FileText size={13} />
            <span>初稿完成</span>
          </div>
        )}
      </div>

      {phase === "loading" ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div
          className="rounded-[var(--radius-sm)] bg-[var(--color-light-bg)] p-4 font-mono text-[12px] text-[var(--color-near-black)] leading-relaxed overflow-y-auto whitespace-pre-wrap"
          style={{ maxHeight: "420px" }}
        >
          {content}
          {phase === "streaming" && <span className="inline-block w-2 h-3.5 bg-[var(--color-apple-blue)] ml-0.5 align-middle animate-pulse" />}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button size="md" variant="secondary" onClick={onBack} disabled={phase !== "done"}>上一步</Button>
        <Button size="md" variant="primary" onClick={onNext} disabled={phase !== "done"}>
          去AI化处理
        </Button>
      </div>
    </div>
  );
}
