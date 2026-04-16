import { expect, test, type Page } from "@playwright/test";

async function scrollToSection(page: Page, id: string) {
  await page.evaluate((targetId) => {
    const section = document.getElementById(targetId);
    if (!section) return;
    const top = Math.max(section.offsetTop - 140, 0);
    window.scrollTo(0, top);
  }, id);
}

test.describe("Landing page UI regression", () => {
  test("导航高亮会随滚动区块切换", async ({ page }) => {
    await page.goto("/");

    const workLink = page.getByRole("link", { name: "Work", exact: true });
    const teamLink = page.getByRole("link", { name: "Team", exact: true });
    const contactLink = page.getByRole("link", { name: "Contact", exact: true });

    await expect(workLink).toHaveAttribute("aria-current", "page");

    await scrollToSection(page, "team");
    await expect.poll(() => teamLink.getAttribute("aria-current")).toBe("page");

    await scrollToSection(page, "contact");
    await expect.poll(() => contactLink.getAttribute("aria-current")).toBe("page");
  });

  test("联系表单校验与提交反馈可用", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Contact", exact: true }).click();

    const submitButton = page.getByRole("button", { name: "Send Brief" });

    await submitButton.click();
    await expect(page.getByText("Please enter your name.")).toBeVisible();
    await expect(page.getByText("Please enter your email.")).toBeVisible();
    await expect(page.getByText("Please describe your project.")).toBeVisible();

    await page.locator("#name").fill("Riot Client");
    await page.locator("#email").fill("invalid-email");
    await page.locator("#project").fill("too short project");

    await submitButton.click();
    await expect(page.getByText("Use a valid email format, for example team@brand.com.")).toBeVisible();
    await expect(page.getByText("Add a little more detail (at least 24 characters)."))
      .toBeVisible();

    await page.locator("#email").fill("team@brand.com");
    await page
      .locator("#project")
      .fill("We are launching a new campaign site and need bold brutalist motion with strong conversion.");

    await submitButton.click();
    await expect(page.getByText("Brief sent. We will reach out within 48 hours.")).toBeVisible();
  });

  test("Dark Mode 切换后主题 token 生效", async ({ page }) => {
    await page.goto("/");

    const main = page.locator("main#main-content");
    const themeButton = page.getByRole("button", { name: /switch to/i });

    const before = await main.evaluate((el) => getComputedStyle(el).getPropertyValue("--bg").trim());
    await themeButton.click();
    const after = await main.evaluate((el) => getComputedStyle(el).getPropertyValue("--bg").trim());

    expect(after).not.toBe(before);
  });

  test.describe("移动端布局", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("无横向溢出且案例卡片保持单列", async ({ page }) => {
      await page.goto("/");

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBeFalsy();

      const cards = page.locator("#work article");
      await cards.first().scrollIntoViewIfNeeded();

      const firstBox = await cards.nth(0).boundingBox();
      const secondBox = await cards.nth(1).boundingBox();

      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();
      expect(Math.abs((firstBox?.x ?? 0) - (secondBox?.x ?? 0))).toBeLessThan(3);
      expect((secondBox?.y ?? 0)).toBeGreaterThan((firstBox?.y ?? 0) + (firstBox?.height ?? 0) - 2);
    });
  });
});
