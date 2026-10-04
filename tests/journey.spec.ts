import { test, expect, type Page } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync } from 'fflate';

async function ready(page: Page) {
  await expect(page.getByText('Fonts ready', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Saved on this device', { exact: true }),
  ).toBeVisible();
}
const specimen = (page: Page) =>
  page.frameLocator('iframe[title="Proofroom specimen"]');
async function downloadZip(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export ZIP' }).click();
  const download = await pending;
  return unzipSync(new Uint8Array(await readFile((await download.path())!)));
}
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (e) => errors.push(e.message));
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page) ?? [], 'No uncaught application errors').toEqual(
    [],
  );
});

test('full edit, pin, flip, resize, undo/redo, save, reload, export and reopen journey', async ({
  page,
}) => {
  await page.goto('./');
  await ready(page);
  await expect(page.getByLabel('Style preset', { exact: true })).toHaveValue(
    'Signal',
  );
  await expect(specimen(page).locator('h1')).toHaveCSS(
    'font-family',
    /Manrope/,
  );
  await page
    .getByLabel('Style preset', { exact: true })
    .selectOption('Editorial');
  await page.getByRole('button', { name: 'Content', exact: true }).click();
  const title = 'A longer fieldnote about café tables & thoughtful repairs.';
  await page
    .getByRole('textbox', { name: 'Overview title', exact: true })
    .fill(title);
  await page
    .getByRole('textbox', { name: 'Introduction', exact: true })
    .focus();
  await expect(specimen(page).locator('h1')).toHaveText(title);
  await page
    .getByRole('button', { name: 'Pin reference', exact: true })
    .click();
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await page.getByLabel('Style preset', { exact: true }).selectOption('Clear');
  await ready(page);
  await expect(specimen(page).locator('h1')).toHaveText(title);
  await expect(specimen(page).locator('h1')).toHaveCSS(
    'font-family',
    /Manrope/,
  );
  await page.getByRole('button', { name: 'Reference', exact: true }).click();
  await ready(page);
  await expect(specimen(page).locator('h1')).toHaveCSS(
    'font-family',
    /Source Serif 4/,
  );
  await expect(page.getByLabel('Display font', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Content', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Overview title', exact: true })
    .fill(title + ' Shared.');
  await page
    .getByRole('textbox', { name: 'Introduction', exact: true })
    .focus();
  await page.getByRole('button', { name: 'Flip direction' }).click();
  await ready(page);
  await expect(specimen(page).locator('h1')).toHaveText(title + ' Shared.');
  await page.getByRole('button', { name: '360', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCSS('width', '360px');
  await page.getByLabel('Viewport width', { exact: true }).fill('517');
  await expect(page.locator('iframe')).toHaveCSS('width', '517px');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(specimen(page).locator('h1')).toHaveText(title);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(specimen(page).locator('h1')).toHaveText(title + ' Shared.');
  await ready(page);
  await page.reload();
  await ready(page);
  await expect(page.getByLabel('Style preset', { exact: true })).toHaveValue(
    'Clear',
  );
  await expect(specimen(page).locator('h1')).toHaveText(title + ' Shared.');
  const zip = await downloadZip(page);
  expect(Object.keys(zip)).toContain('signup-error.html');
  expect(Object.keys(zip).filter((k) => k.endsWith('.woff2'))).toHaveLength(3);
  await page
    .getByRole('button', { name: 'Project', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Duplicate project' }).click();
  await ready(page);
  await page
    .getByLabel('Project name', { exact: true })
    .fill('Independent copy');
  await page
    .getByLabel('Decision note', { exact: true })
    .fill('Prefer the measured rhythm.');
  await page.getByLabel('Import JSON file').setInputFiles({
    name: 'reopen.proofroom.json',
    mimeType: 'application/json',
    buffer: Buffer.from(zip['project.proofroom.json']),
  });
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue(
    'Untitled proof',
  );
  await expect(specimen(page).locator('h1')).toHaveText(title + ' Shared.');
  await page.getByRole('button', { name: 'Reference', exact: true }).click();
  await ready(page);
  await expect(specimen(page).locator('h1')).toHaveCSS(
    'font-family',
    /Source Serif 4/,
  );
});

test('content loading is explicit, presets keep copy, keyboard selection and history are safe', async ({
  page,
}) => {
  await page.goto('./');
  await ready(page);
  await page
    .getByRole('button', { name: 'Project', exact: true })
    .first()
    .click();
  await page
    .getByLabel('Example content', { exact: true })
    .selectOption('Common Hours');
  await expect(specimen(page).locator('h1')).toContainText('Good work');
  await page.getByRole('button', { name: 'Load example content' }).click();
  await expect(specimen(page).locator('h1')).toContainText(
    'learn from one another',
  );
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(specimen(page).locator('h1')).toContainText('Good work');
  await page.getByRole('button', { name: 'Content', exact: true }).click();
  const field = page.getByRole('textbox', {
    name: 'Overview title',
    exact: true,
  });
  const original = await field.inputValue();
  await field.focus();
  await field.press('End');
  await field.pressSequentially(' native edit');
  await expect(field).toHaveValue(original + ' native edit');
  await field.press('Control+z');
  await expect(field).not.toHaveValue(original + ' native edit');
  expect(await field.inputValue()).toContain(original);
  await expect(field).toBeFocused();
  await expect(specimen(page).locator('h1')).toHaveCSS(
    'font-family',
    /Manrope/,
  );
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await specimen(page).locator('.pr-caption').first().click();
  await expect(page.getByLabel('Semantic role', { exact: true })).toHaveValue(
    'caption',
  );
  await page.getByLabel('Semantic role', { exact: true }).selectOption('title');
  await page
    .getByLabel('Display font', { exact: true })
    .selectOption('source-sans-3');
  await page.getByLabel('Weight', { exact: true }).fill('900');
  await page.getByLabel('Text font', { exact: true }).selectOption('manrope');
  await page
    .getByLabel('Family assignment', { exact: true })
    .selectOption('text');
  await expect(page.getByLabel('Weight', { exact: true })).toHaveValue('800');
  await page.getByLabel('Semantic role', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByLabel('Family assignment', { exact: true }),
  ).toBeFocused();
  expect(
    await page
      .getByLabel('Family assignment', { exact: true })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe('solid');
});

test('invalid import is useful and storage failure preserves editing and export', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('./');
  await expect(
    page.getByText('Could not save on this device', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Content', exact: true }).click();
  await page
    .getByLabel('Overview title', { exact: true })
    .fill('Still editable with storage unavailable');
  await expect(specimen(page).locator('h1')).toHaveText(
    'Still editable with storage unavailable',
  );
  await page.getByLabel('Import JSON file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":200}'),
  });
  await expect(page.getByText(/Unsupported project version 200/)).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Project JSON', exact: true }).click();
  const d = await pending;
  expect(await readFile((await d.path())!, 'utf8')).toContain('Still editable');
});

test('font failure is visible; selecting a working family recovers', async ({
  page,
}) => {
  await page.route('**/*source-serif-4*.woff2', (route) => route.abort());
  await page.goto('./');
  await ready(page);
  await page
    .getByLabel('Display font', { exact: true })
    .selectOption('source-serif-4');
  await expect(page.getByText(/Font failed:/)).toBeVisible();
  await page
    .getByLabel('Display font', { exact: true })
    .selectOption('manrope');
  await expect(page.getByText('Fonts ready', { exact: true })).toBeVisible();
  await expect(specimen(page).locator('h1')).toHaveCSS(
    'font-family',
    /Manrope/,
  );
});

test('flipping keeps the same section context', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  await page.getByRole('button', { name: '360', exact: true }).click();
  await page
    .getByRole('button', { name: 'Pin reference', exact: true })
    .click();
  await page.getByLabel('Style preset', { exact: true }).selectOption('Clear');
  await ready(page);
  const frame = page.frames().find((f) => f.parentFrame())!;
  await specimen(page)
    .getByRole('link', { name: 'The journal', exact: true })
    .click();
  await expect(specimen(page).locator('h1')).toContainText('Good work');
  await expect(page.getByText('Fonts ready', { exact: true })).toBeVisible();
  const before = await frame.evaluate(
    () => document.getElementById('section-one')!.getBoundingClientRect().top,
  );
  await page.getByRole('button', { name: 'Flip direction' }).click();
  await ready(page);
  const after = await page
    .frames()
    .find((f) => f.parentFrame())!
    .evaluate(
      () => document.getElementById('section-one')!.getBoundingClientRect().top,
    );
  expect(Math.abs(before - after)).toBeLessThanOrEqual(1);
});

for (const composition of ['overview', 'signup'] as const) {
  test(`${composition} reflows at representative and intermediate widths, enlarged text and spacing`, async ({
    page,
  }) => {
    await page.goto('./');
    await ready(page);
    await page
      .getByLabel('Composition', { exact: true })
      .selectOption(composition);
    await page.getByRole('button', { name: 'Content', exact: true }).click();
    if (composition === 'signup') {
      await page.getByLabel('Preview error state').check();
      await expect(specimen(page).locator('#specimen-email')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expect(specimen(page).locator('button')).toHaveAttribute(
        'type',
        'button',
      );
      await page
        .getByLabel('Name field label', { exact: true })
        .fill('W'.repeat(300));
      await page
        .getByLabel('Email field label', { exact: true })
        .fill('W'.repeat(300));
    }
    for (const width of [360, 517, 768, 1280]) {
      await page
        .getByLabel('Viewport width', { exact: true })
        .fill(String(width));
      await expect(page.locator('iframe')).toHaveCSS('width', `${width}px`);
      await expect(
        page.getByText('Fonts ready', { exact: true }),
      ).toBeVisible();
      const frame = page.frames().find((f) => f.parentFrame())!;
      expect(
        await frame.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBeTruthy();
      await frame.evaluate(() => {
        const style = document.createElement('style');
        style.id = 'test-spacing';
        style.textContent =
          'html{font-size:200%!important}p{margin-bottom:2em!important}*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}';
        document.head.append(style);
      });
      expect(
        await frame.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBeTruthy();
      await frame.evaluate(() =>
        document.getElementById('test-spacing')?.remove(),
      );
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      await page.evaluate(
        () => matchMedia('(prefers-reduced-motion: reduce)').matches,
      ),
    ).toBeTruthy();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });
}

test('standalone ZIP matches preview computed styles and geometry after fonts load', async ({
  page,
  browser,
}, testInfo) => {
  await page.goto('./');
  await ready(page);
  await page.getByLabel('Style preset', { exact: true }).selectOption('Clear');
  await page
    .getByRole('button', { name: 'Pin reference', exact: true })
    .click();
  await page.getByLabel('Style preset', { exact: true }).selectOption('Warm');
  await ready(page);
  const files = await downloadZip(page);
  const exported = await browser.newPage();
  await exported.route('https://proofroom-export.test/**', async (route) => {
    const name = new URL(route.request().url()).pathname.slice(1);
    const bytes = files[name];
    await route.fulfill({
      status: bytes ? 200 : 404,
      contentType: name.endsWith('.woff2')
        ? 'font/woff2'
        : name.endsWith('.css')
          ? 'text/css'
          : 'text/html',
      body: Buffer.from(bytes ?? new Uint8Array()),
    });
  });
  const measure = () =>
    [
      ...document.querySelectorAll<HTMLElement>(
        '.pr-title,.pr-section-font,.pr-body,.pr-caption,.pr-label,.pr-button,.pr-detail,input',
      ),
    ].map((el) => {
      const r = el.getBoundingClientRect(),
        c = getComputedStyle(el);
      return {
        tag: el.tagName,
        text: el.textContent,
        font: c.fontFamily,
        size: c.fontSize,
        weight: c.fontWeight,
        line: c.lineHeight,
        tracking: c.letterSpacing,
        color: c.color,
        background: c.backgroundColor,
        x: r.x,
        y: r.y + scrollY,
        w: r.width,
        h: r.height,
      };
    });
  let maxDelta = 0;
  for (const composition of ['overview', 'signup'] as const) {
    await page
      .getByLabel('Composition', { exact: true })
      .selectOption(composition);
    for (const width of [360, 517, 768, 1280]) {
      await page
        .getByLabel('Viewport width', { exact: true })
        .fill(String(width));
      await expect(
        page.getByText('Fonts ready', { exact: true }),
      ).toBeVisible();
      const frame = page.frames().find((f) => f.parentFrame())!;
      await frame.evaluate(() => document.fonts.ready);
      const preview = await frame.evaluate(measure);
      const frameHeight = await page
        .locator('iframe')
        .evaluate((el) => el.clientHeight);
      await exported.setViewportSize({ width, height: frameHeight });
      await exported.goto(
        `https://proofroom-export.test/${composition === 'overview' ? 'index' : 'signup'}.html`,
      );
      await exported.evaluate(() => document.fonts.ready);
      const actual = await exported.evaluate(measure);
      expect(actual.length).toBe(preview.length);
      for (let i = 0; i < actual.length; i++) {
        for (const key of [
          'tag',
          'text',
          'font',
          'size',
          'weight',
          'line',
          'tracking',
          'color',
          'background',
        ] as const)
          expect(actual[i][key], `${composition}/${width}/${i}/${key}`).toBe(
            preview[i][key],
          );
        for (const key of ['x', 'y', 'w', 'h'] as const) {
          const delta = Math.abs(actual[i][key] - preview[i][key]);
          maxDelta = Math.max(maxDelta, delta);
          expect(
            delta,
            `${composition}/${width}/${i}/${key}`,
          ).toBeLessThanOrEqual(1);
        }
      }
    }
  }
  await page.getByRole('button', { name: 'Reference', exact: true }).click();
  await ready(page);
  const referenceFiles = await downloadZip(page);
  expect(new TextDecoder().decode(referenceFiles['theme.css'])).toContain(
    'Manrope',
  );
  expect(new TextDecoder().decode(referenceFiles['theme.css'])).not.toBe(
    new TextDecoder().decode(files['theme.css']),
  );
  await exported.unroute('https://proofroom-export.test/**');
  await exported.route('https://proofroom-export.test/**', async (route) => {
    const name = new URL(route.request().url()).pathname.slice(1);
    await route.fulfill({
      status: 200,
      contentType: name.endsWith('.woff2')
        ? 'font/woff2'
        : name.endsWith('.css')
          ? 'text/css'
          : 'text/html',
      body: Buffer.from(referenceFiles[name]),
    });
  });
  const referencePreview = await page
    .frames()
    .find((f) => f.parentFrame())!
    .evaluate(measure);
  await exported.goto('https://proofroom-export.test/signup.html');
  await exported.evaluate(() => document.fonts.ready);
  const referenceActual = await exported.evaluate(measure);
  expect(referenceActual.length).toBe(referencePreview.length);
  for (let i = 0; i < referenceActual.length; i++) {
    for (const key of [
      'font',
      'size',
      'weight',
      'line',
      'tracking',
      'color',
      'background',
    ] as const)
      expect(referenceActual[i][key]).toBe(referencePreview[i][key]);
    for (const key of ['x', 'y', 'w', 'h'] as const) {
      const delta = Math.abs(
        referenceActual[i][key] - referencePreview[i][key],
      );
      maxDelta = Math.max(maxDelta, delta);
      expect(delta).toBeLessThanOrEqual(1);
    }
  }
  await testInfo.attach('parity-measurement', {
    body: `Eight edited-working composition/width combinations plus pinned-reference Signup; exact computed font/color properties; maximum geometry delta ${maxDelta}px; allowed tolerance 1px.`,
    contentType: 'text/plain',
  });
  console.log(
    `Export parity: 9 cases; maximum geometry delta ${maxDelta}px (tolerance 1px).`,
  );
  await exported.close();
  // Verify the extracted export can also load its relative fonts directly from disk.
  const folder = testInfo.outputPath('standalone');
  await mkdir(folder, { recursive: true });
  for (const [name, bytes] of Object.entries(files)) {
    const target = join(folder, name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  const filePage = await browser.newPage();
  await filePage.goto(pathToFileURL(join(folder, 'index.html')).href);
  await filePage.evaluate(() => document.fonts.ready);
  expect(
    await filePage.evaluate(() =>
      document.fonts.check('400 16px "Source Serif 4"'),
    ),
  ).toBeTruthy();
  await expect(filePage.locator('h1')).toHaveCSS(
    'font-family',
    /Source Serif 4/,
  );
  await filePage.close();
});

test('import collision creates a copy and keeps the newer saved project after undo and reload', async ({
  page,
}) => {
  await page.goto('./');
  await ready(page);
  const oldFiles = await downloadZip(page);
  const old = JSON.parse(
    new TextDecoder().decode(oldFiles['project.proofroom.json']),
  );
  await page.getByRole('button', { name: 'Content', exact: true }).click();
  await page
    .getByLabel('Overview title', { exact: true })
    .fill('Newer original that must survive');
  await ready(page);
  await page
    .getByRole('button', { name: 'Project', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Duplicate project' }).click();
  await ready(page);
  await page.getByLabel('Project name', { exact: true }).fill('Project B');
  await page.getByLabel('Decision note', { exact: true }).focus();
  await ready(page);
  await page.getByLabel('Import JSON file').setInputFiles({
    name: 'older.json',
    mimeType: 'application/json',
    buffer: Buffer.from(oldFiles['project.proofroom.json']),
  });
  await expect(
    page.getByText(/as an imported copy. Existing project retained/),
  ).toBeVisible();
  await ready(page);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue(
    'Project B',
  );
  await page.getByLabel('Saved projects', { exact: true }).selectOption(old.id);
  await expect(specimen(page).locator('h1')).toHaveText(
    'Newer original that must survive',
  );
  await ready(page);
  await page.reload();
  await ready(page);
  await expect(specimen(page).locator('h1')).toHaveText(
    'Newer original that must survive',
  );
});
