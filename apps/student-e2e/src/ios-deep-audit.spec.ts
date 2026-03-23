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

test.describe('Deep iOS PWA Audit Verification', () => {
  const outputDir = path.join(process.cwd(), 'dist', 'screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Mocking standalone mode
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
      // Set dark theme for FOUC test
      localStorage.setItem('portal_theme', 'dark');
    });
  });

  test('GAP-1: Dark Mode Flash of Unstyled Content (FOUC)', async ({ page }) => {
    // We want to capture the background color before Angular applies the 'dark' class
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const bgColor = window.getComputedStyle(document.documentElement).backgroundColor;
        (window as any).initialBgColor = bgColor;
      });
    });

    await page.goto('/dashboard');
    const initialBg = await page.evaluate(() => (window as any).initialBgColor);
    console.log(`Detected Initial BG Color: ${initialBg}`);
    
    // Screenshot during early load
    await page.screenshot({ path: path.join(outputDir, 'gap-1-fouc-flash.png') });
  });

  test('Bug 2: Modal Z-Index Conflict (Nav overlaps Modal)', async ({ page }) => {
    await page.goto('/mobility', { waitUntil: 'networkidle' });
    await page.click('button:has-text("განაცხადები")');
    
    const deleteBtn = page.locator('button:has-text("წაშლა")').first();
    await deleteBtn.click();
    await page.waitForSelector('h2:has-text("განაცხადის წაშლა")');
    
    // Ensure modal is visible
    await page.waitForTimeout(500);
    
    // Verify z-indexes
    const data = await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0.z-50');
      const nav = document.querySelector('.bottom-nav');
      return {
        modalZ: modal ? window.getComputedStyle(modal).zIndex : 'N/A',
        navZ: nav ? window.getComputedStyle(nav).zIndex : 'N/A'
      };
    });
    console.log(`Z-Indexes - Modal: ${data.modalZ}, Nav: ${data.navZ}`);

    await page.screenshot({ path: path.join(outputDir, 'bug-2-modal-zindex-clash.png') });
  });

  test('Bug 3: Input Auto-Zoom (Font-size < 16px)', async ({ page }) => {
    await page.goto('/mobility', { waitUntil: 'networkidle' });
    const input = page.locator('input[placeholder*="უნივერსიტეტი"]');
    
    const fontSize = await input.evaluate(el => window.getComputedStyle(el).fontSize);
    console.log(`Input Font Size: ${fontSize}`);
    
    await input.click();
    await page.waitForTimeout(1000); // Wait for iOS zoom animation
    await page.screenshot({ path: path.join(outputDir, 'bug-3-input-auto-zoom.png') });
  });

  test('GAP-3: Keyboard Occludes Inputs (Fixed Height Issue)', async ({ page }) => {
    await page.goto('/mobility', { waitUntil: 'networkidle' });
    await page.click('button:has-text("განაცხადები")');
    
    // Simulate keyboard by shrinking viewport or injecting overlay
    // The audit says height is fixed at window.screen.height
    await page.evaluate(() => {
      const kbd = document.createElement('div');
      kbd.style.position = 'fixed';
      kbd.style.bottom = '0';
      kbd.style.width = '100%';
      kbd.style.height = '300px';
      kbd.style.background = 'rgba(0,0,0,0.8)';
      kbd.style.zIndex = '10000';
      kbd.style.color = 'white';
      kbd.style.display = 'flex';
      kbd.style.alignItems = 'center';
      kbd.style.justifyContent = 'center';
      kbd.innerText = 'iOS KEYBOARD SIMULATION (300px)';
      document.body.appendChild(kbd);
    });

    await page.screenshot({ path: path.join(outputDir, 'gap-3-keyboard-occlusion.png') });
  });

  test('GAP-4: Long-Press Touch Callout', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    const styles = await page.evaluate(() => {
      const el = document.querySelector('.relative.w-full.aspect-\\[1\\.58\\/1\\]'); // ID Card
      if (!el) return 'Element not found';
      const s = window.getComputedStyle(el);
      return {
        touchCallout: (s as any).webkitTouchCallout,
        userSelect: s.userSelect
      };
    });
    console.log('Touch Callout Styles:', styles);
    
    await page.screenshot({ path: path.join(outputDir, 'gap-4-long-press-callout.png') });
  });

  test('GAP-6: Scroll Position Not Reset on Route Change', async ({ page }) => {
    await page.goto('/services/surveys', { waitUntil: 'networkidle' });
    
    // Scroll deep
    await page.evaluate(() => {
      const content = document.querySelector('.app-content');
      if (content) content.scrollTop = 1000;
    });
    
    await page.waitForTimeout(500);
    const scrollBefore = await page.evaluate(() => document.querySelector('.app-content')?.scrollTop);
    console.log(`Scroll Position Before: ${scrollBefore}`);

    // Navigate to Dashboard
    await page.click('a[routerLink="/dashboard"]');
    await page.waitForTimeout(1000);
    
    const scrollAfter = await page.evaluate(() => document.querySelector('.app-content')?.scrollTop);
    console.log(`Scroll Position After: ${scrollAfter}`);
    
    await page.screenshot({ path: path.join(outputDir, 'gap-6-scroll-persistence.png') });
  });

  test('GAP-9: Nav Label Size (HIG Compliance)', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    const size = await page.evaluate(() => {
      const span = document.querySelector('.nav-item span');
      return span ? window.getComputedStyle(span).fontSize : 'N/A';
    });
    console.log(`Nav Label Size: ${size}`);
    
    await page.screenshot({ path: path.join(outputDir, 'gap-9-nav-label-small.png') });
  });

  test('Bug 4 & GAP-7: Bottom Safe Area / Home Indicator Overlap', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    // Inject a simulated home indicator
    await page.evaluate(() => {
      const hi = document.createElement('div');
      hi.style.position = 'fixed';
      hi.style.bottom = '8px';
      hi.style.left = '50%';
      hi.style.transform = 'translateX(-50%)';
      hi.style.width = '134px';
      hi.style.height = '5px';
      hi.style.background = 'black';
      hi.style.borderRadius = '100px';
      hi.style.zIndex = '10001';
      document.body.appendChild(hi);
    });

    await page.screenshot({ path: path.join(outputDir, 'bug-4-home-indicator-overlap.png') });
  });
});
