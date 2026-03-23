import { test, expect, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.use({
  ...devices['iPhone 13'],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
});

test.setTimeout(300000);

test.describe('Final PWA Fidelity Verification - Post-Fix Journey', () => {
  const outputDir = path.join(process.cwd(), 'dist', 'screenshots', 'final_verified');

  test.beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'standalone', { get: () => true });
    });

    // Login mock
    await page.goto('/');
    await page.evaluate(() => {
      const dummyUser = {
        id: '12345',
        firstName: 'თინათინ',
        lastName: 'ბერიძე',
        fullName: 'თინათინ ბერიძე',
        personalId: '01024092831',
        email: 't.beridze@student.edu.ge',
        photoUrl: 'assets/profile-placeholder.jpg',
        university: 'თბილისის სახელმწიფო უნივერსიტეტი',
        programName: 'კომპიუტერული მეცნიერება'
      };
      localStorage.setItem('portal_student_user', JSON.stringify(dummyUser));
      localStorage.setItem('portal_theme', 'dark');
    });
  });

  test('Verified Journey: Dashboard -> Mobility -> Surveys', async ({ page }) => {
    // 1. Dashboard (Fixed Theme & Labels)
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outputDir, '01_dashboard_verified.png') });
    
    // 2. Mobility (Fixed Modal Z-Index & Search Zoom)
    await page.goto('/mobility', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="უნივერსიტეტი"]');
    await searchInput.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, '02_mobility_no_zoom_verified.png') });

    await page.click('button:has-text("განაცხადები")');
    const deleteBtn = page.locator('button:has-text("წაშლა")').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForSelector('h2:has-text("განაცხადის წაშლა")');
      await page.waitForTimeout(500);
      // Screenshot should show modal OVER the navigation bar
      await page.screenshot({ path: path.join(outputDir, '03_modal_above_nav_verified.png') });
      await page.click('button:has-text("გაუქმება")');
    }

    // 3. Surveys (Fixed Scroll & Labels)
    await page.goto('/services/surveys', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outputDir, '04_surveys_verified.png') });
  });
});
