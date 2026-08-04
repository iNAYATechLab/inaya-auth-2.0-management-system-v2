// E2E Tests - GDPR Compliance
import { test, expect } from '@playwright/test';

test.describe('GDPR Compliance', () => {
  test('should show cookie consent banner', async ({ page }) => {
    await page.goto('/');
    
    // Should show cookie consent banner
    await expect(page.locator('text=cookie consent')).toBeVisible();
    await expect(page.locator('text=accept all')).toBeVisible();
    await expect(page.locator('text=reject all')).toBeVisible();
  });

  test('should allow accepting all cookies', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: /accept all/i }).click();
    
    // Banner should disappear
    await expect(page.locator('text=cookie consent')).not.toBeVisible();
    
    // Should store consent in localStorage
    const consent = await page.evaluate(() => localStorage.getItem('cookie-consent'));
    expect(consent).toBeTruthy();
    
    const parsed = JSON.parse(consent!);
    expect(parsed.essential).toBe(true);
    expect(parsed.analytics).toBe(true);
    expect(parsed.marketing).toBe(true);
  });

  test('should allow rejecting all cookies', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: /reject all/i }).click();
    
    // Banner should disappear
    await expect(page.locator('text=cookie consent')).not.toBeVisible();
    
    // Should store minimal consent
    const consent = await page.evaluate(() => localStorage.getItem('cookie-consent'));
    const parsed = JSON.parse(consent!);
    expect(parsed.essential).toBe(true);
    expect(parsed.analytics).toBe(false);
    expect(parsed.marketing).toBe(false);
  });

  test('should allow granular cookie consent', async ({ page }) => {
    await page.goto('/');
    
    // Enable only analytics
    const analyticsCheckbox = page.getByRole('checkbox', { name: /analytics cookies/i });
    await analyticsCheckbox.click();
    
    await page.getByRole('button', { name: /accept selected/i }).click();
    
    // Should store selected consent
    const consent = await page.evaluate(() => localStorage.getItem('cookie-consent'));
    const parsed = JSON.parse(consent!);
    expect(parsed.essential).toBe(true);
    expect(parsed.analytics).toBe(true);
    expect(parsed.marketing).toBe(false);
  });

  test('should display privacy policy page', async ({ page }) => {
    await page.goto('/privacy-policy');
    
    await expect(page.locator('h1')).toContainText(/privacy policy/i);
    
    // Should contain all required sections
    await expect(page.locator('h2').filter({ hasText: /information we collect/i })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /how we use/i })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /data sharing/i })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /your rights/i })).toBeVisible();
  });

  test('should display terms of service page', async ({ page }) => {
    await page.goto('/terms');
    
    await expect(page.locator('h1')).toContainText(/terms of service/i);
    
    // Should contain key sections
    await expect(page.locator('h2').filter({ hasText: /acceptance of terms/i })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /user accounts/i })).toBeVisible();
  });

  test('should display DPA page', async ({ page }) => {
    await page.goto('/dpa');
    
    await expect(page.locator('h1')).toContainText(/data processing agreement/i);
    
    // Should contain DPA sections
    await expect(page.locator('h2').filter({ hasText: /data processor obligations/i })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /data subject rights/i })).toBeVisible();
  });

  test('should navigate to data management from privacy policy', async ({ page }) => {
    await page.goto('/privacy-policy');
    
    // Find link to data management
    const link = page.getByRole('link', { name: /data management/i });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/.*data-management/);
    }
  });
});

test.describe('Data Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('session', JSON.stringify({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'USER',
        },
      }));
    });
  });

  test('should display data management page', async ({ page }) => {
    await page.goto('/data-management');
    
    await expect(page.locator('h1')).toContainText(/data management/i);
    
    // Should show download and delete options
    await expect(page.getByRole('button', { name: /request data download/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /request data deletion/i })).toBeVisible();
  });

  test('should require confirmation for data deletion', async ({ page }) => {
    await page.goto('/data-management');
    
    // Listen for dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain(/warning/i);
      await dialog.dismiss();
    });
    
    await page.getByRole('button', { name: /request data deletion/i }).click();
  });

  test('should show GDPR rights information', async ({ page }) => {
    await page.goto('/data-management');
    
    // Should display GDPR rights
    await expect(page.locator('text=right to access')).toBeVisible();
    await expect(page.locator('text=right to erasure')).toBeVisible();
    await expect(page.locator('text=right to data portability')).toBeVisible();
  });
});
