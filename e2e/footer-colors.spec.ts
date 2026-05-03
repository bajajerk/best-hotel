/**
 * Footer colour regression — guards against the .luxe token-flip bug where
 * --ink/--cream variables invert, making cream-background footers invisible.
 * All footer colours must be hardcoded hex in Footer.tsx (never CSS variables).
 */
import { test, expect } from "@playwright/test";

test.describe("Footer text visibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="site-footer"]');
  });

  test("footer background is cream #f5f0e8", async ({ page }) => {
    const footer = page.locator('[data-testid="site-footer"]');
    const bg = await footer.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    // rgb(245, 240, 232) === #f5f0e8
    expect(bg).toBe("rgb(245, 240, 232)");
  });

  test("brand name is dark #1a1a1a", async ({ page }) => {
    const brand = page.locator('[data-testid="footer-brand"]');
    const color = await brand.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    // rgb(26, 26, 26) === #1a1a1a
    expect(color).toBe("rgb(26, 26, 26)");
  });

  test("description text is dark #4a4a4a", async ({ page }) => {
    const desc = page.locator('[data-testid="footer-desc"]');
    const color = await desc.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    // rgb(74, 74, 74) === #4a4a4a
    expect(color).toBe("rgb(74, 74, 74)");
  });

  test("column headings are dark #1a1a1a", async ({ page }) => {
    const headings = page.locator('[data-testid="footer-heading"]');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const color = await headings.nth(i).evaluate((el) =>
        window.getComputedStyle(el).color
      );
      expect(color).toBe("rgb(26, 26, 26)");
    }
  });

  test("copyright text is muted #6a6a6a", async ({ page }) => {
    const copyright = page.locator('[data-testid="footer-copyright"]');
    const color = await copyright.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    // rgb(106, 106, 106) === #6a6a6a
    expect(color).toBe("rgb(106, 106, 106)");
  });

  test("legal links are muted #6a6a6a", async ({ page }) => {
    const links = page.locator('[data-testid="footer-legal"]');
    const count = await links.count();
    expect(count).toBe(2);
    for (let i = 0; i < count; i++) {
      const color = await links.nth(i).evaluate((el) =>
        window.getComputedStyle(el).color
      );
      expect(color).toBe("rgb(106, 106, 106)");
    }
  });

  test("footer text is visible (not white or near-cream against cream bg)", async ({ page }) => {
    // Sanity check: no element in the footer should have a white or near-white
    // computed colour — that would be invisible on the cream background.
    const allText = page.locator('[data-testid="site-footer"] *');
    const count = await allText.count();
    for (let i = 0; i < count; i++) {
      const el = allText.nth(i);
      const tag = await el.evaluate((node) => node.tagName);
      if (["DIV", "FOOTER", "SVG", "PATH", "RECT"].includes(tag)) continue;
      const color = await el.evaluate((node) =>
        window.getComputedStyle(node).color
      );
      // white is rgb(255,255,255) — reject anything with R,G,B all > 220
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        expect(
          r > 220 && g > 220 && b > 220,
          `Element <${tag}> has near-white colour ${color} — invisible on cream footer`
        ).toBe(false);
      }
    }
  });
});
