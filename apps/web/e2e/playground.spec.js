const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  browserErrors: async ({ page }, use) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await use(errors);
  },
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('main and nested tabs keep selection, panel visibility, and keyboard navigation in sync', async ({ page }) => {
  const todoTab = page.getByRole('tab', { name: /Todo & state/ });
  const todoPanel = page.locator('#todo');

  await todoTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /DOM inspector/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#inspector')).toBeVisible();
  await expect(todoPanel).toBeHidden();
  await expect(page.locator('#todo')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#inspector')).toHaveAttribute('aria-hidden', 'false');

  await page.keyboard.press('ArrowLeft');
  await expect(todoTab).toHaveAttribute('aria-selected', 'true');
  await expect(todoPanel).toBeVisible();

  const widgetTab = page.locator('demo-tabs [role="tab"][data-id="b"]');
  await widgetTab.focus();
  await page.keyboard.press('Home');
  await expect(page.locator('demo-tabs [role="tab"][data-id="a"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('demo-tabs [role="tab"]')).toHaveCount(3);
  await expect(page.locator('demo-tabs [role="tabpanel"]:visible')).toHaveCount(1);
});

test('theme selection persists after reload', async ({ page }) => {
  const themeButton = page.getByRole('button', { name: 'Dark mode' });

  await themeButton.click();
  await expect(page.locator('body')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Light mode' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();

  await expect(page.locator('body')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Light mode' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ui-dark'))).toBe('1');
});

test('modal closes from its controls, backdrop, and Escape while restoring focus', async ({ page }) => {
  const opener = page.getByRole('button', { name: /Quick note/ });
  const dialog = page.getByRole('dialog', { name: /Curiosity is a/ });

  await opener.click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close quick note' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /Back to the lab/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close quick note' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await page.getByRole('button', { name: 'Close quick note' }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await page.locator('#modal').click({ position: { x: 8, y: 8 } });
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('todo app ignores blank tasks and persists additions and removals', async ({ page }) => {
  const todo = page.locator('todo-app');
  const input = todo.getByRole('textbox', { name: 'New task' });

  await page.getByRole('tab', { name: /Todo & state/ }).click();
  await input.fill('   ');
  await input.press('Enter');
  await expect(todo.getByText('Nothing on the list yet. Add a task to get started.')).toBeVisible();

  await input.fill('Prepare the release checklist');
  await input.press('Enter');
  await expect(todo.getByText('Prepare the release checklist')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('demo-todos-v1')))
    .toBe(JSON.stringify(['Prepare the release checklist']));

  await todo.getByRole('button', { name: 'Remove task: Prepare the release checklist' }).click();
  await expect(todo.getByText('Nothing on the list yet. Add a task to get started.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('demo-todos-v1'))).toBe('[]');
});

test('drag list reorders items without duplicating or losing them', async ({ page }) => {
  const items = page.locator('drag-list li');

  await expect(items).toHaveText(['⠿ Item 1', '⠿ Item 2', '⠿ Item 3']);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('drag-list').evaluate((element) => element.scrollIntoView({ block: 'center' }));
  await items.nth(0).dragTo(items.nth(2), {
    steps: 8,
  });
  await expect(items).toHaveText(['⠿ Item 2', '⠿ Item 3', '⠿ Item 1']);
  await expect(items).toHaveCount(3);
});

test('inspector observes a page click without activating it and can be stopped', async ({ page }) => {
  const inspector = page.locator('dom-inspector');
  const toggle = inspector.getByRole('button', { name: /Start inspecting/ });
  const themeButton = page.getByRole('button', { name: 'Dark mode' });

  await page.getByRole('tab', { name: /DOM inspector/ }).click();
  await toggle.click();
  await expect(inspector.getByRole('button', { name: /Stop inspecting/ })).toHaveAttribute('aria-pressed', 'true');
  await themeButton.click();
  await expect(page.locator('body')).not.toHaveClass(/dark/);
  await expect(inspector.locator('#out')).toContainText('theme-label');

  await inspector.getByRole('button', { name: /Stop inspecting/ }).click();
  await expect(inspector.getByRole('button', { name: /Start inspecting/ })).toHaveAttribute('aria-pressed', 'false');
  await themeButton.click();
  await expect(page.locator('body')).toHaveClass(/dark/);
});

test('G highlights the header outside text entry and is ignored in Shadow DOM inputs', async ({ page }) => {
  await page.locator('.site-header').evaluate((header) => {
    window.__highlightWasAdded = false;
    const observer = new MutationObserver(() => {
      if (header.classList.contains('highlight')) {
        observer.disconnect();
        window.__highlightWasAdded = true;
      }
    });
    observer.observe(header, { attributes: true, attributeFilter: ['class'] });
  });
  await page.keyboard.press('g');
  await expect.poll(() => page.evaluate(() => window.__highlightWasAdded)).toBe(true);
  await expect(page.locator('.site-header')).not.toHaveClass(/highlight/, { timeout: 2_000 });

  await page.getByRole('tab', { name: /Todo & state/ }).click();
  const input = page.locator('todo-app').getByRole('textbox', { name: 'New task' });
  await input.focus();

  // Set up observer BEFORE pressing 'g' to catch any transient highlight
  await page.locator('.site-header').evaluate((header) => {
    window.__highlightWhileTyping = false;
    const obs = new MutationObserver(() => {
      if (header.classList.contains('highlight')) {
        window.__highlightWhileTyping = true;
      }
    });
    obs.observe(header, { attributes: true, attributeFilter: ['class'] });
  });

  await page.keyboard.press('g');
  // Wait longer than the 900ms highlight duration to be sure
  await page.waitForTimeout(1200);
  const fired = await page.evaluate(() => window.__highlightWhileTyping);
  expect(fired, 'G shortcut should NOT highlight header while typing in Shadow DOM input').toBe(false);
});

test('layout fits a narrow viewport and honors reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const mobileWidths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(mobileWidths.document).toBeLessThanOrEqual(mobileWidths.viewport);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const animationDuration = await page.locator('.hero').evaluate((element) => (
    Number.parseFloat(getComputedStyle(element).animationDuration)
  ));
  expect(animationDuration).toBeLessThanOrEqual(0.0001);
});

test('tutorial pages are served by the local preview server', async ({ request }) => {
  for (const route of ['/tutorials/widgets.html', '/tutorials/todo.html', '/tutorials/inspector.html']) {
    const response = await request.get(route);
    expect(response.ok(), `${route} should return a successful response`).toBeTruthy();
  }
});

test('main page interactions produce no browser errors', async ({ page, browserErrors }) => {
  await page.getByRole('tab', { name: /Todo & state/ }).click();
  const input = page.locator('todo-app').getByRole('textbox', { name: 'New task' });
  await input.fill('Check browser errors');
  await input.press('Enter');
  await page.getByRole('tab', { name: /DOM inspector/ }).click();
  const inspector = page.locator('dom-inspector');
  await inspector.getByRole('button', { name: /Start inspecting/ }).click();
  await inspector.getByRole('button', { name: /Stop inspecting/ }).click();

  expect(browserErrors).toEqual([]);
});
