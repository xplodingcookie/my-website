import assert from "node:assert/strict";
import fs from "node:fs";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? `${process.env.PLAYWRIGHT_MODULE}/index.mjs`
    : "playwright"
);
const base = process.env.REVIEW_URL || "http://127.0.0.1:3002";
const out = process.env.REVIEW_OUTPUT || "/tmp/hero-restored";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const canvas = page.locator(".hero-scene canvas");
async function scroll(y) {
  await page.evaluate((y) => {
    window.__lenis?.stop();
    window.scrollTo({ top: y, behavior: "instant" });
  }, y);
  await page.waitForTimeout(200);
}
try {
  for (const motion of ["reduce", "no-preference"]) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const [width, height] of [
      [1280, 600],
      [1280, 720],
      [1440, 900],
      [1920, 1080],
      [320, 568],
      [390, 844],
      [430, 932],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(base);
      await page.locator(".hero-scene[data-ready=true]").waitFor();
      await page.waitForTimeout(350);
      const rect = await page.locator(".button-primary").boundingBox();
      assert(
        rect.y >= 68 && rect.y + rect.height <= height,
        `${motion} CTA ${width}x${height}`,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.equal(
        await canvas.getAttribute("data-motion"),
        motion === "reduce" ? "paused" : "playing",
      );
      await page.screenshot({
        path: `${out}/${motion}-${width}-${height}.png`,
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base);
  await page.locator(".hero-scene[data-ready=true]").waitFor();
  await page.getByRole("button", { name: "Pause hero motion" }).click();
  assert.equal(await canvas.getAttribute("data-motion"), "paused");
  const paused = await canvas.screenshot();
  await page.waitForTimeout(900);
  assert.deepEqual(
    await canvas.screenshot(),
    paused,
    "Paused frames do not change",
  );
  await page.getByRole("button", { name: "Play hero motion" }).click();
  const before = await canvas.screenshot();
  await page.waitForTimeout(1200);
  assert.notDeepEqual(
    await canvas.screenshot(),
    before,
    "Morphing/rotation resumes",
  );
  await scroll(700);
  assert(
    await page
      .locator(".button-primary")
      .evaluate((e) => !!e.closest("[inert]")),
  );
  await page.getByRole("button", { name: "Pause hero motion" }).focus();
  await page.keyboard.press("Shift+Tab");
  assert.notEqual(
    await page.locator(":focus").innerText(),
    "Explore the maths",
  );
  await scroll(0);
  await page.locator(".button-primary").focus();
  await scroll(700);
  assert.equal(
    await page
      .locator("[data-hero-copy]")
      .evaluate((e) => getComputedStyle(e).opacity),
    "1",
  );
  assert.equal(
    await page.locator("[data-hero-copy]").getAttribute("inert"),
    null,
  );
  await page.getByRole("button", { name: "Pause hero motion" }).focus();
  assert.equal(
    await page.locator("[data-hero-copy]").getAttribute("inert"),
    "",
  );
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/flight-restored.png` });
  await scroll(3500);
  assert.equal(await canvas.getAttribute("data-motion"), "paused");
  await scroll(700);
  assert.equal(await canvas.getAttribute("data-motion"), "playing");
  await page.reload();
  await page.locator(".hero-scene[data-ready=true]").waitFor();
  await page.waitForTimeout(500);
  assert.equal(
    await page.locator("[data-hero-copy]").getAttribute("inert"),
    "",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await scroll(0);
  await page.waitForTimeout(300);
  assert.equal(await canvas.getAttribute("data-motion"), "paused");
  assert.equal(
    await page.locator("[data-hero-copy]").getAttribute("inert"),
    null,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Restored hero: 14 viewport/motion combinations; live WebGL; pause/resume; invisible-focus prevention; focused-link visibility; offscreen shutdown; mid-flight refresh; reactive reduced motion passed.",
  );
} finally {
  await browser.close();
}
