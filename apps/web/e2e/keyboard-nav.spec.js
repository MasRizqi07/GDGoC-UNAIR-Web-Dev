const { test, expect } = require('@playwright/test');

test('keyboard navigation reaches playground tabs and tutorials', async ({ page }) => {
  await page.goto('/');

  // 1. Skip link
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveClass(/skip-link/);

  // 2. Brand
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveClass(/brand/);

  // 3. Theme toggle
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('id', 'theme-toggle');

  // 4. Quick note
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('id', 'open-modal');

  // 5. Tabs (Widgets is active by default, so it receives focus first in the tablist)
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('id', 'tab-widgets');
  
  // Navigate tabs with ArrowRight
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAttribute('id', 'tab-todo');
  
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAttribute('id', 'tab-inspector');

  // Go back to Widgets to enter its panel
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  
  // Enter the widgets panel
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('id', 'widgets');
  
  // Let's just use a loop to Tab until we reach the tutorial link
  let reachedTutorial = false;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const focusedHref = await page.evaluate(() => document.activeElement.getAttribute('href'));
    if (focusedHref && focusedHref.includes('tutorials/widgets.html')) {
      reachedTutorial = true;
      break;
    }
  }
  expect(reachedTutorial).toBe(true);
  
  // Press Enter to navigate to the tutorial
  await page.keyboard.press('Enter');
  
  // Wait for navigation
  await page.waitForURL('**/tutorials/widgets.html');
  
  // Verify we are on the tutorial page
  await expect(page).toHaveTitle(/Widgets/);
  
  // Verify skip link is the first focusable on the new page
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveClass(/skip-link/);
});
