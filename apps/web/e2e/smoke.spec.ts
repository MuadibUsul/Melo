import { expect, test } from "@playwright/test";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

test.describe("production smoke", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/\u58f0\u6210\u97f3\u4e50|\u58f0\u6210 Studio/);
    await expect(page.getByText("\u4eca\u65e5\u63a8\u8350")).toBeVisible();
    await expect(page.getByText("\u6301\u7eed\u70ed\u64ad")).toBeVisible();
  });

  test("library has playable tracks", async ({ page }) => {
    await page.goto(`${BASE}/library`);
    await expect(page.getByText("\u66f2\u5e93").first()).toBeVisible();
    await expect(page.getByText("\u559c\u6b22\u7684\u97f3\u4e50")).toBeVisible();
  });

  test("charts page loads", async ({ page }) => {
    await page.goto(`${BASE}/charts`);
    await expect(page.getByText("\u521b\u4f5c\u8005\u98d9\u5347\u699c")).toBeVisible();
    await expect(page.getByText("\u521b\u4f5c\u8005\u98d9\u5347\u699c").first()).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByRole("button", { name: "\u767b\u5f55" })).toBeVisible();
  });

  test("account page is reachable", async ({ page }) => {
    await page.goto(`${BASE}/account`);
    await expect(page.getByText("\u8bf7\u5148\u767b\u5f55")).toBeVisible();
  });

  test("admin modules are reachable", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page.getByText("\u5185\u5bb9\u5ba1\u6838")).toBeVisible();
    await expect(page.getByText("\u8ba1\u8d39\u7ba1\u7406")).toBeVisible();
  });

  test("track and creator pages render from published catalog data", async ({ page }) => {
    await page.goto(`${BASE}/tracks/track-city-afterglow`);
    await expect(page.getByRole("heading", { name: "城市微光" })).toBeVisible();
    await expect(page.getByText("\u52a0\u8f7d\u8bc4\u8bba\u4e2d").first()).toBeVisible();

    await page.goto(`${BASE}/creators/creator-lin-ye`);
    await expect(page.getByRole("heading", { name: "林野" }).first()).toBeVisible();
    await expect(page.getByText("\u4f5c\u54c1", { exact: true })).toBeVisible();
  });

  test("editor playlist page renders", async ({ page }) => {
    await page.goto(`${BASE}/playlists/editor-picks`);
    await expect(page.getByText("\u9996\u66f2\u76ee").first()).toBeVisible();
  });
});
