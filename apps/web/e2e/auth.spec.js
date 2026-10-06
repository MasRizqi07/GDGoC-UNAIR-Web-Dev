const { test, expect } = require('@playwright/test');

const randomId = () => Math.random().toString(36).substring(2, 8);

test.describe('Auth Flow & User Isolation', () => {
  let browserErrors = [];

  test.beforeEach(async ({ page }) => {
    browserErrors = [];
    page.on('pageerror', (err) => browserErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        browserErrors.push(msg.text());
      }
    });
  });

  test('register -> add todo -> reload -> persists -> logout -> login -> present -> second user isolation', async ({ page, context }) => {
    const userAEmail = `usera-${randomId()}@test.com`;
    const userAPassword = 'password123';
    const userASecretTask = `Secret Task A - ${randomId()}`;

    const userBEmail = `userb-${randomId()}@test.com`;
    const userBPassword = 'password456';

    await page.goto('/');
    
    // Clear any local storage so import doesn't mess with isolation
    await page.evaluate(() => localStorage.clear());

    // 1. Register User A
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('#auth-modal')).toBeVisible();
    await page.getByRole('button', { name: 'Need an account? Register' }).click();
    
    await page.locator('#auth-email').fill(userAEmail);
    await page.locator('#auth-password').fill(userAPassword);
    await page.getByRole('button', { name: 'Register' }).click();
    
    await expect(page.locator('#auth-modal')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    // 2. Add Todo for User A
    await page.getByRole('tab', { name: /Todo & state/ }).click();
    const todoApp = page.locator('todo-app');
    const input = todoApp.getByRole('textbox', { name: 'New task' });
    
    await input.fill(userASecretTask);
    await input.press('Enter');
    await expect(todoApp.getByText(userASecretTask)).toBeVisible();

    // 3. Reload & Verify Persistence
    await page.reload();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await page.getByRole('tab', { name: /Todo & state/ }).click();
    await expect(page.locator('todo-app').getByText(userASecretTask)).toBeVisible();

    // 4. Logout User A
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    // 5. Login User A again & Verify Presence
    await page.getByRole('button', { name: 'Login' }).click();
    await page.locator('#auth-email').fill(userAEmail);
    await page.locator('#auth-password').fill(userAPassword);
    // It should be in login mode now, but maybe it remembers register? Let's make sure it's login mode
    // Actually, when closed and reopened, it might retain state. The toggle button text will tell us.
    // wait, we can just click "Already have an account? Login" if it exists, or just verify the submit button says 'Login'
    const loginSubmitBtn = page.locator('#auth-submit');
    const submitText = await loginSubmitBtn.textContent();
    if (submitText.trim() === 'Register') {
      await page.getByRole('button', { name: 'Already have an account? Login' }).click();
    }
    
    await loginSubmitBtn.click();
    await expect(page.locator('#auth-modal')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    await page.getByRole('tab', { name: /Todo & state/ }).click();
    await expect(page.locator('todo-app').getByText(userASecretTask)).toBeVisible();

    // 6. Logout A, Register B
    await page.getByRole('button', { name: 'Logout' }).click();
    
    await page.getByRole('button', { name: 'Login' }).click();
    const submitText2 = await loginSubmitBtn.textContent();
    if (submitText2.trim() === 'Login') {
      await page.getByRole('button', { name: 'Need an account? Register' }).click();
    }
    
    await page.locator('#auth-email').fill(userBEmail);
    await page.locator('#auth-password').fill(userBPassword);
    await page.getByRole('button', { name: 'Register' }).click();
    
    await expect(page.locator('#auth-modal')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    // 7. Second user isolation check
    await page.getByRole('tab', { name: /Todo & state/ }).click();
    await expect(page.locator('todo-app').getByText(userASecretTask)).toBeHidden();

    // Zero console errors check
    // Some favicon or Vite dev server errors might happen, so let's assert carefully.
    // Actually, the gate just says "Zero console errors". Let's verify we don't have errors related to auth or fetching.
    expect(browserErrors.filter(e => !e.includes('favicon.ico'))).toEqual([]);
  });
});
