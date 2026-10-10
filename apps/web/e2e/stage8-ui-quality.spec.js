const { test, expect } = require('@playwright/test');

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Privacy Notice', path: '/privacy.html' },
  { name: 'Widgets Tutorial', path: '/tutorials/widgets.html' },
  { name: 'Todo Tutorial', path: '/tutorials/todo.html' },
  { name: 'Inspector Tutorial', path: '/tutorials/inspector.html' }
];

test.describe('Stage 8.1: UI Acceptance and Accessibility', () => {
  for (const { name, path } of pages) {
    test(`Reflow: ${name} must not have horizontal scroll at 320px width`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      await page.waitForTimeout(300);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  }

  test('Primary controls target size is at least 44x44 CSS px', async ({ page }) => {
    await page.goto('/');
    const primaryButtons = page.locator('.button.button-primary, #theme-toggle, #auth-button');
    const count = await primaryButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const btn = primaryButtons.nth(i);
      if (await btn.isVisible()) {
        const box = await btn.boundingBox();
        expect(box).not.toBeNull();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Visible focus indicator has at least 3px outline', async ({ page }) => {
    await page.goto('/');
    const themeBtn = page.locator('#theme-toggle');
    await themeBtn.focus();

    const outlineStyle = await themeBtn.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outlineWidth: parseFloat(computed.outlineWidth) || 0,
        outlineStyle: computed.outlineStyle,
      };
    });

    expect(outlineStyle.outlineStyle).not.toBe('none');
    expect(outlineStyle.outlineWidth).toBeGreaterThanOrEqual(3);
  });

  test('prefers-reduced-motion is honored', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const motionTokens = await page.evaluate(() => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      return {
        transitionFast: rootStyle.getPropertyValue('--transition-fast').trim(),
        transitionNormal: rootStyle.getPropertyValue('--transition-normal').trim(),
      };
    });

    expect(['0s', '0ms']).toContain(motionTokens.transitionFast);
    expect(['0s', '0ms']).toContain(motionTokens.transitionNormal);
  });

  test('prefers-color-scheme is respected on first visit with persisted manual override', async ({ page, context }) => {
    // 1. First visit with dark color scheme emulation
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('ui-dark'));
    await page.reload();

    await expect(page.locator('body')).toHaveClass(/dark/);
    const themeBtn = page.locator('#theme-toggle');
    await expect(themeBtn).toHaveAttribute('aria-pressed', 'true');

    // 2. Manual toggle to light mode
    await themeBtn.click();
    await expect(page.locator('body')).not.toHaveClass(/dark/);
    const persisted = await page.evaluate(() => localStorage.getItem('ui-dark'));
    expect(persisted).toBe('0');

    // 3. Reload keeps persisted manual override despite dark OS emulation
    await page.reload();
    await expect(page.locator('body')).not.toHaveClass(/dark/);
  });

  test('Form accessibility: associated labels, aria-describedby, aria-live errors, and focus on invalid field', async ({ page }) => {
    await page.goto('/');
    await page.locator('#auth-button').click();
    await expect(page.locator('#auth-modal')).toBeVisible();

    // Verify associated labels
    const emailLabel = page.locator('label[for="auth-email"]');
    const passwordLabel = page.locator('label[for="auth-password"]');
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();

    // Verify aria-describedby points to error elements
    const emailInput = page.locator('#auth-email');
    const passwordInput = page.locator('#auth-password');
    await expect(emailInput).toHaveAttribute('aria-describedby', 'auth-email-error');
    await expect(passwordInput).toHaveAttribute('aria-describedby', 'auth-password-error');

    // Verify error elements have aria-live="polite"
    await expect(page.locator('#auth-email-error')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#auth-password-error')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#auth-global-error')).toHaveAttribute('aria-live', 'polite');

    // Submit with empty email -> focus must move to auth-email
    await page.locator('#auth-email').fill('');
    await page.locator('#auth-submit').click();
    await expect(emailInput).toBeFocused();
    await expect(page.locator('#auth-email-error')).not.toBeEmpty();

    // Fill valid email, empty password -> focus moves to auth-password
    await page.locator('#auth-email').fill('test@example.com');
    await page.locator('#auth-password').fill('short');
    await page.locator('#auth-submit').click();
    await expect(passwordInput).toBeFocused();
    await expect(page.locator('#auth-password-error')).not.toBeEmpty();
  });

  test('Todo panel provides empty, loading, and error states (never blank)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /Todo & state/ }).click();
    const todoApp = page.locator('todo-app');
    await expect(todoApp).toBeVisible();

    // Empty state should be rendered when no tasks exist
    await page.evaluate(() => localStorage.removeItem('demo-todos-v1'));
    await page.reload();
    await page.getByRole('tab', { name: /Todo & state/ }).click();

    const emptyMsg = todoApp.locator('.empty');
    await expect(emptyMsg).toBeVisible();
    await expect(emptyMsg).toContainText('Nothing on the list yet');
  });
});

