const { test, expect } = require('@playwright/test');

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

test.describe('Stage 8.2: Keyboard Walkthrough', () => {
  test('Complete Tab order through shell, playground, and each tutorial', async ({ page }) => {
    await page.goto('/');

    // 1. Skip link
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveClass(/skip-link/);

    // 2. Brand
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveClass(/brand/);

    // 3. Theme toggle
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveId('theme-toggle');

    // 4. Auth button
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveId('auth-button');

    // 5. Quick note
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveId('open-modal');

    // 6. Tabs
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveId('tab-widgets');

    // Test walkthrough on each tutorial page
    const tutorialUrls = [
      '/tutorials/widgets.html',
      '/tutorials/todo.html',
      '/tutorials/inspector.html',
      '/privacy.html'
    ];

    for (const url of tutorialUrls) {
      await page.goto(url);
      // Skip link first
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveClass(/skip-link/);

      // Brand link second
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveClass(/brand/);

      // Theme toggle third
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveId('theme-toggle');
    }
  });

  test('Auth form modal: focus trapping, Escape closes, focus returns to trigger', async ({ page }) => {
    await page.goto('/');
    const authBtn = page.locator('#auth-button');
    await authBtn.focus();
    await expect(authBtn).toBeFocused();

    // Open via Enter key
    await page.keyboard.press('Enter');
    const authModal = page.locator('#auth-modal');
    await expect(authModal).toBeVisible();

    // Focus lands on the first interactive field (email input)
    await expect(page.locator('#auth-email')).toBeFocused();

    // Tab through all modal controls
    await page.keyboard.press('Tab');
    await expect(page.locator('#auth-password')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('#auth-submit')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('#auth-toggle-mode')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('#close-auth-modal')).toBeFocused();

    // Next Tab wraps around back to first element (focus trapped)
    await page.keyboard.press('Tab');
    await expect(page.locator('#auth-email')).toBeFocused();

    // Shift+Tab wraps backwards (focus trapped)
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#close-auth-modal')).toBeFocused();

    // Escape closes modal and returns focus to auth-button
    await page.keyboard.press('Escape');
    await expect(authModal).toBeHidden();
    await expect(authBtn).toBeFocused();
  });

  test('Delete-account dialog: focus trapped, Escape closes, focus returns to trigger', async ({ page }) => {
    const email = `del-${randomId()}@test.com`;
    const password = 'password123';

    await page.goto('/');
    // Register account
    await page.locator('#auth-button').click();
    await page.locator('#auth-toggle-mode').click();
    await page.locator('#auth-email').fill(email);
    await page.locator('#auth-password').fill(password);
    await page.locator('#auth-submit').click();
    await expect(page.locator('#auth-modal')).toBeHidden();

    const deleteBtn = page.locator('#delete-account-button');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.focus();
    await expect(deleteBtn).toBeFocused();

    // Open delete modal with Enter
    await page.keyboard.press('Enter');
    const deleteModal = page.locator('#delete-modal');
    await expect(deleteModal).toBeVisible();

    // First element in delete dialog is focused
    await expect(page.locator('#confirm-delete-button')).toBeFocused();

    // Tab through dialog controls
    await page.keyboard.press('Tab');
    await expect(page.locator('#cancel-delete-button')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('#close-delete-modal')).toBeFocused();

    // Focus trapped: next Tab wraps around to confirm button
    await page.keyboard.press('Tab');
    await expect(page.locator('#confirm-delete-button')).toBeFocused();

    // Escape closes modal and returns focus to delete button
    await page.keyboard.press('Escape');
    await expect(deleteModal).toBeHidden();
    await expect(deleteBtn).toBeFocused();
  });
});

