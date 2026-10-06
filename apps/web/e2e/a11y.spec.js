const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Widgets Tutorial', path: '/tutorials/widgets.html' },
  { name: 'Todo Tutorial', path: '/tutorials/todo.html' },
  { name: 'Inspector Tutorial', path: '/tutorials/inspector.html' }
];

for (const { name, path } of pages) {
  test.describe(`A11y: ${name}`, () => {
    test('should not have any automatically detectable serious/critical accessibility issues in light mode', async ({ page }) => {
      await page.goto(path);
      // Wait for any components to connect
      await page.waitForTimeout(500);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      const violations = accessibilityScanResults.violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      );

      expect(violations).toEqual([]);
    });

    test('should not have any automatically detectable serious/critical accessibility issues in dark mode', async ({ page }) => {
      await page.goto(path);
      // Trigger dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('ui-dark');
      });
      await page.waitForTimeout(500);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      const violations = accessibilityScanResults.violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      );

      expect(violations).toEqual([]);
    });
  });
}
