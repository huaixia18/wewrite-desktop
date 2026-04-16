import { expect, test, type Page, type Route } from "@playwright/test";

const HOTSPOT_FIXTURE = [
  {
    id: "hotspot-a",
    platform: "weibo",
    title: "热点-A-唯一",
    score: 96,
    url: "",
    keywords: ["A"],
    trend: "rising",
  },
  {
    id: "hotspot-b",
    platform: "toutiao",
    title: "热点-B-唯一",
    score: 88,
    url: "",
    keywords: ["B"],
    trend: "stable",
  },
  {
    id: "hotspot-c",
    platform: "baidu",
    title: "热点-C-唯一",
    score: 76,
    url: "",
    keywords: ["C"],
    trend: "fading",
  },
] as const;

function makeSse(events: Array<Record<string, unknown> | "[DONE]">): string {
  return events
    .map((event) => `data: ${event === "[DONE]" ? event : JSON.stringify(event)}\n\n`)
    .join("");
}

async function mockHotspots(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      hotspots: HOTSPOT_FIXTURE,
      meta: { mode: "live" },
      sources: ["weibo", "toutiao", "baidu"],
      timestamp: new Date().toISOString(),
    }),
  });
}

async function registerAndEnterWrite(page: Page): Promise<void> {
  const unique = Date.now();
  const email = `e2e+${unique}@example.com`;
  const password = "123456";
  const nickname = `e2e-${unique}`;

  await page.goto("/login");
  await page.getByRole("tab", { name: "注册" }).click();
  await page.locator("#register-name").fill(nickname);
  await page.locator("#register-email").fill(email);
  await page.locator("#register-password").fill(password);
  await page.getByRole("button", { name: "注册并开始写作" }).click();
  await page.waitForURL("**/write");
  await expect(page.getByRole("heading", { name: "当前阶段：环境+配置" })).toBeVisible();
  await page.getByRole("button", { name: "进入选题" }).click();
  await expect(page.getByRole("heading", { name: "当前阶段：选题" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "热点抓取" })).toBeVisible();
}

test.describe("写作流程 E2E 回归", () => {
  test("只选 1 条热点时计数显示正确", async ({ page }, testInfo) => {
    await page.route("**/api/topics/hotspots", mockHotspots);

    await registerAndEnterWrite(page);
    await page.getByText("热点-A-唯一", { exact: true }).click();

    await expect(page.getByText("已选 1 条", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "生成选题（1 条）" })).toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("hotspot-selected-one.png"),
      fullPage: true,
    });
  });

  test("开始写作请求使用当前选中的选题", async ({ page }, testInfo) => {
    let writePayload: Record<string, unknown> | null = null;
    let writeRequestedResolve: (() => void) | null = null;
    const writeRequested = new Promise<void>((resolve) => {
      writeRequestedResolve = resolve;
    });

    await page.route("**/api/topics/hotspots", mockHotspots);
    await page.route("**/api/topics/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          topics: [
            {
              id: "topic-a",
              title: "测试选题-A",
              score: 85,
              clickPotential: 4,
              seoScore: 8,
              framework: "故事型",
              keywords: ["测试", "A"],
              reason: "用于回归测试",
            },
            {
              id: "topic-b",
              title: "目标选题-B",
              score: 91,
              clickPotential: 5,
              seoScore: 9,
              framework: "清单型",
              keywords: ["目标", "B"],
              reason: "验证开始写作使用当前选题",
            },
          ],
          meta: { mode: "live", provider: "openai" },
        }),
      });
    });
    await page.route("**/api/topics/materials", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          materials: [
            { title: "素材1", source: "测试源", url: "" },
            { title: "素材2", source: "测试源", url: "" },
          ],
          meta: { mode: "live" },
        }),
      });
    });
    await page.route("**/api/ai/write", async (route) => {
      writePayload = route.request().postDataJSON() as Record<string, unknown>;
      const topic = (writePayload?.topic as Record<string, unknown>) ?? {};
      const title = String(topic.title ?? "未命名选题");
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-AI-Mode": "live",
          "X-AI-Provider": "openai",
        },
        body: makeSse([
          { type: "title", text: `${title}（自动测试）` },
          { type: "content", text: `# ${title}\n\n这是一篇围绕「${title}」生成的测试文案。` },
          { type: "done" },
          "[DONE]",
        ]),
      });
      writeRequestedResolve?.();
    });

    await registerAndEnterWrite(page);
    await page.getByText("热点-A-唯一", { exact: true }).click();
    await page.getByRole("button", { name: "生成选题（1 条）" }).click();

    await expect(page.getByText("选题分析")).toBeVisible();
    await expect(page.getByText("目标选题-B")).toBeVisible();
    await page.getByText("目标选题-B", { exact: true }).click();
    await page.getByRole("button", { name: "选择框架" }).click();

    const frameworkTitle = page.getByText("选择框架");
    if (await frameworkTitle.isVisible({ timeout: 1500 }).catch(() => false)) {
      await page.getByText("清单型", { exact: true }).first().click();
      await page.getByRole("button", { name: "下一步" }).click();

      await expect(page.getByText("选择增强策略")).toBeVisible();
      await page.getByText("细节锚定", { exact: true }).click();
      await page.getByRole("button", { name: "开始写作" }).click();
    }

    await expect(page.getByRole("heading", { name: "当前阶段：框架+素材" })).toBeVisible();
    await page.getByRole("button", { name: "开始写作" }).click();

    await writeRequested;
    const topic = (writePayload?.topic as Record<string, unknown>) ?? {};
    expect(topic.title).toBe("目标选题-B");

    await expect(
      page.locator("textarea[placeholder='写作内容将在这里实时显示...']")
    ).toHaveValue(/这是一篇围绕「目标选题-B」生成的测试文案。/);
    await page.screenshot({
      path: testInfo.outputPath("writing-uses-selected-topic.png"),
      fullPage: true,
    });
  });

  test("整体冒烟：写作中心/内容库/设置/订阅页面可访问", async ({ page }, testInfo) => {
    await page.route("**/api/topics/hotspots", mockHotspots);

    await registerAndEnterWrite(page);
    await expect(page.getByText("当前阶段：选题")).toBeVisible();

    await page.getByRole("link", { name: "内容库" }).click();
    await page.waitForURL("**/history");
    await expect(page.getByText("历史文章")).toBeVisible();

    await page.getByRole("link", { name: "系统设置" }).click();
    await page.waitForURL("**/settings");
    await expect(page.getByRole("heading", { name: "系统设置" })).toBeVisible();

    await page.getByRole("link", { name: "账单与订阅" }).click();
    await page.waitForURL("**/pricing");
    await expect(page.getByText("订阅方案")).toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath("dashboard-smoke.png"),
      fullPage: true,
    });
  });
});
