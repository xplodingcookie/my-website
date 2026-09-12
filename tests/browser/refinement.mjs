import assert from "node:assert/strict";
import fs from "node:fs";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? `${process.env.PLAYWRIGHT_MODULE}/index.mjs`
    : "playwright"
);
const base = process.env.REVIEW_URL || "http://127.0.0.1:3001";
const out = process.env.REVIEW_OUTPUT || "/tmp/portfolio-final";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});
const errors = [];
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("favicon"))
    errors.push(m.text());
});
const button = (name) => page.getByRole("button", { name, exact: true });
const state = () => page.locator('[aria-live="polite"]').first().innerText();
async function assertMarkersOnVertices() {
  const distances = await page.locator(".feasible-graph").first().evaluate(svg => {
    const polygon = svg.querySelector("polygon");
    const matrix = polygon.getScreenCTM();
    const vertices = Array.from(polygon.points).map(p => new DOMPoint(p.x, p.y).matrixTransform(matrix));
    return Array.from(svg.querySelectorAll("circle")).map(circle => {
      const r = circle.getBoundingClientRect();
      return Math.min(...vertices.map(v => Math.hypot(v.x - (r.x + r.width / 2), v.y - (r.y + r.height / 2))));
    });
  });
  assert(distances.every(distance => distance < 1), "Rendered point markers align with polygon vertices");
}
try {
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
    await page.waitForTimeout(300);
    const cta = await page.locator(".button-primary").boundingBox();
    assert(
      cta.y >= 68 && cta.y + cta.height <= height,
      `Visible hero CTA at ${width}x${height}`,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `No overflow ${width}`,
    );
    await page.screenshot({ path: `${out}/hero-${width}-${height}.png` });
    await page.goto(base + "/linear-programming");
    await page.waitForTimeout(200);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Math overflow ${width}`,
    );
    assert(
      await page
        .locator(".feasible-graph")
        .evaluate((e) =>
          [...e.querySelectorAll("text")].every(
            (t) => parseFloat(getComputedStyle(t).fontSize) >= 12,
          ),
        ),
    );
    // The default original region starts Phase I at the infeasible origin,
    // which is no polygon vertex; solved, the markers sit on the optimum.
    await button("Solve").click();
    await page.waitForTimeout(150);
    await assertMarkersOnVertices();
    await page.locator(".feasible-graph").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/math-${width}-${height}.png` });
  }
  console.log(
    "Seven viewport pairs: hero CTA, overflow, readable graph labels passed",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "/linear-programming");
  // The page opens on the original polygon: Phase I from the infeasible origin.
  assert.match(await state(), /\(0, 0\)/);
  assert.match(await state(), /Phase I/);
  assert.match(await page.innerText(".eyebrow >> nth=1"), /original polygon/i);
  // The guided walkthrough continues on the preview example.
  await page.getByRole("button", { name: /The preview example/ }).click();
  assert.match(await state(), /\(0, 0\)/);
  await button("Next step").click();
  assert.match(await state(), /\(4, 0\)/);
  await button("Next step").click();
  assert.match(await state(), /Optimal solution/);
  assert.match(await state(), /16/);
  await button("Previous step").click();
  assert.match(await state(), /\(4, 0\)/);
  await button("Reset").click();
  assert.match(await state(), /\(0, 0\)/);
  // Speed 1 (Home) = the slowest pause, 5 seconds per vertex.
  await page.getByLabel("Speed").focus();
  await page.keyboard.press("Home");
  await button("Play").click();
  await page.waitForTimeout(250);
  await button("Pause").click();
  const paused = await state();
  await page.waitForTimeout(5200);
  assert.equal(await state(), paused);
  await button("Play").click();
  await button("Reset").click();
  await page.waitForTimeout(5200);
  assert.match(await state(), /\(0, 0\)/);
  // Speed 10 (End) = the shortest pause, half a second per vertex.
  await page.getByLabel("Speed").focus();
  await page.keyboard.press("End");
  await button("Play").click();
  await page.waitForTimeout(2400);
  assert.match(await state(), /Optimal solution/);
  await button("Reset").click();
  await button("Solve").click();
  assert.match(await state(), /16/);
  for (const raw of ["2oops", "", "-", "1e999", "1e-999"]) {
    await page.getByLabel("c₁", { exact: true }).fill(raw);
    await page.getByLabel("c₁", { exact: true }).blur();
    assert.equal(
      await page.getByLabel("c₁", { exact: true }).inputValue(),
      raw,
    );
    assert.equal(
      await page.getByLabel("c₁", { exact: true }).getAttribute("aria-invalid"),
      "true",
    );
    assert(await button("Solve").isDisabled());
  }
  await page.getByLabel("c₁", { exact: true }).fill("2.5");
  assert(await button("Solve").isDisabled());
  await button("Apply problem").click();
  assert.equal(await button("Solve").isDisabled(), false);
  await button("Solve").click();
  assert.match(await state(), /14/);
  await button("Add constraint").click();
  assert(await button("Solve").isDisabled());
  const rows = page.locator("input[id^=constraint-]");
  assert.equal(await rows.nth(9).inputValue(), "");
  await page
    .getByRole("button", { name: "Remove constraint 4", exact: true })
    .click();
  // Examples are visible by default; the summary still collapses and reopens them.
  await page
    .getByRole("button", { name: /Find a feasible start/ })
    .waitFor({ state: "visible" });
  await page.getByText("Explore other examples", { exact: true }).click();
  await page
    .getByRole("button", { name: /Find a feasible start/ })
    .waitFor({ state: "hidden" });
  await page.getByText("Explore other examples", { exact: true }).click();
  for (const [name, result] of [
    ["Find a feasible start", /Optimal solution/],
    ["No feasible solution", /No feasible solution/],
    ["An unbounded objective", /Unbounded objective/],
    ["More edges", /Optimal solution/],
  ]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await button("Solve").click();
    assert.match(await state(), result);
  }
  // Randomise generates a verified problem: integer, off-origin, optimal.
  await button("Randomise").click();
  assert.match(await page.innerText(".eyebrow >> nth=1"), /random polygon/i);
  await button("Solve").click();
  assert.match(await state(), /Optimal solution/);
  // The objective is editable in the heading; valid input applies at once,
  // invalid input shows the error and leaves the last valid problem solvable.
  await page.getByRole("button", { name: /The preview example/ }).click();
  await page.getByLabel("Objective coefficient of x₁").fill("5");
  await button("Solve").click();
  assert.match(await state(), /24/); // 5(4) + 2(2) at the same optimal vertex
  await page.getByLabel("Objective coefficient of x₁").fill("1e999");
  assert.equal(await page.locator("#objective-error").count(), 1);
  assert.equal(await button("Solve").isDisabled(), false);
  await page.getByLabel("Objective coefficient of x₁").fill("3");
  assert.equal(await page.locator("#objective-error").count(), 0);
  assert.match(await state(), /\(0, 0\)/);
  // Clearing every constraint leaves only nonnegativity: unbounded.
  await button("Clear all constraints").click();
  await button("Apply problem").click();
  await button("Solve").click();
  assert.match(await state(), /Unbounded objective/);
  assert(await button("Clear all constraints").isDisabled());
  await page.getByRole("button", { name: /The preview example/ }).click();
  assert.match(await state(), /\(0, 0\)/);
  console.log(
    "Step controls, slow pause/reset, editing, invalid drafts and all example statuses passed",
  );
  await page.goto(base);
  await page.getByRole("button", { name: "Next simplex step" }).click();
  await page.getByRole("button", { name: "Next simplex step" }).click();
  assert.match(await page.locator(".math-readout").innerText(), /16/);
  await page.getByRole("button", { name: "Reset the simplex preview" }).click();
  await page.goto(base);
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(":focus").innerText(), "Skip to content");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "main-content",
  );
  const focused = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(40);
    const info = await page.evaluate(() => {
      const e = document.activeElement;
      const r = e.getBoundingClientRect();
      let visible = r.width > 0 && r.height > 0;
      for (let p = e; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (
          s.opacity === "0" ||
          s.visibility === "hidden" ||
          s.display === "none"
        )
          visible = false;
      }
      return {
        tag: e.tagName,
        text: e.textContent?.slice(0, 60),
        visible,
        outline: getComputedStyle(e).outlineStyle,
      };
    });
    if (info.tag !== "BODY" && info.tag !== "NEXTJS-PORTAL") {
      assert(info.visible, JSON.stringify(info));
      focused.push(info.text);
    }
  }
  assert(focused.some((s) => s.includes("See my work")));
  assert(focused.some((s) => s.includes("Email")));
  await page.goto(base);
  await page.getByRole("link", { name: "See my work" }).click();
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "experience",
  );
  await page.reload();
  await page.waitForTimeout(300);
  assert((await page.locator("#experience").boundingBox()).y < 200);
  await page.goto(base + "/#contact");
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForTimeout(300);
  assert((await page.locator("#contact").boundingBox()).y < 300);
  console.log("Preview, keyboard traversal, anchor focus and refresh passed");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base);
  await page.locator(".hero-scene[data-ready=true]").waitFor();
  await page.getByRole("button", { name: "Pause hero motion" }).click();
  assert.equal(
    await page.locator(".hero-scene canvas").getAttribute("data-motion"),
    "paused",
  );
  await page.getByRole("button", { name: "Play hero motion" }).click();
  assert.equal(
    await page.locator(".hero-scene canvas").getAttribute("data-motion"),
    "playing",
  );
  await page.getByRole("link", { name: "See my work" }).click();
  await page.waitForTimeout(1300);
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "experience",
  );
  assert.equal(
    await page.locator(".hero-scene canvas").getAttribute("data-motion"),
    "paused",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.locator(".hero-scene canvas").getAttribute("data-motion"),
    "paused",
  );
  console.log("Motion toggle, offscreen shutdown and reduced motion passed");
  const touch = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  await touch.goto(base);
  await touch.getByRole("button", { name: "Open menu" }).tap();
  await touch
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Projects" })
    .tap();
  assert.equal(
    await touch.evaluate(() => document.activeElement.id),
    "projects",
  );
  assert.equal(
    await touch.getByRole("navigation", { name: "Mobile navigation" }).count(),
    0,
  );
  await touch.getByRole("button", { name: "Next simplex step" }).tap();
  assert.match(await touch.locator(".math-readout").innerText(), /12/);
  await touch.getByRole("link", { name: "Continue in the playground" }).tap();
  await touch.getByRole("button", { name: /The preview example/ }).tap();
  await touch.getByRole("button", { name: "Next step", exact: true }).tap();
  assert.match(
    await touch.locator("[aria-live=polite]").first().innerText(),
    /\(4, 0\)/,
  );
  await touch.close();
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(base);
  await page.getByRole("button", { name: "Open menu" }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  assert.match(await page.locator(":focus").innerText(), /About/);
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator(":focus").getAttribute("aria-label"),
    "Open menu",
  );
  console.log("Touch interactions and mobile keyboard disclosure passed");
  const nojs = await browser.newPage({
    viewport: { width: 390, height: 844 },
    javaScriptEnabled: false,
  });
  await nojs.goto(base);
  assert.equal(await nojs.locator(".hero-wire-fallback").count(), 1);
  assert.match(await nojs.locator("#experience").innerText(), /thousands/);
  assert(
    await nojs.locator("#experience").evaluate((e) => {
      for (let p = e; p; p = p.parentElement)
        if (getComputedStyle(p).opacity === "0") return false;
      return true;
    }),
  );
  await nojs.goto(base + "/linear-programming");
  assert.equal(await nojs.locator(".feasible-graph").count(), 1);
  assert.match((await nojs.locator("noscript").allTextContents()).join(" "), /0 → 12 → 16/);
  await nojs.close();
  assert.deepEqual(errors, []);
  console.log("No-JavaScript content and diagrams passed; no browser errors");
} finally {
  await browser.close();
}
