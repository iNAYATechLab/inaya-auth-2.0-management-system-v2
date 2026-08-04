// E2E Tests - Authentication Flow
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1')).toContainText(/welcome/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.locator('text=invalid')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByText(/don't have an account/i).click();
    
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1')).toContainText(/create account/i);
  });

  test('should validate registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('should validate password strength on registration', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).fill('weak');
    
    // Should show password strength warning
    await expect(page.locator('text=at least 8 characters')).toBeVisible();
  });

  test('should show password mismatch error', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/^password/i).fill('Test@12345');
    await page.getByLabel(/confirm password/i).fill('Different@12345');
    
    // Should show mismatch error
    await expect(page.locator('text=passwords do not match')).toBeVisible();
  });
});

test.describe('Password Reset Flow', () => {
  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByText(/forgot password/i).click();
    
    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test('should validate email on forgot password', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /send reset link/i }).click();
    
    // Should show validation error
    await expect(page.locator('text=valid email')).toBeVisible();
  });

  test('should show success message on valid email', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();
    
    // Should show success message
    await expect(page.locator('text=check your email')).toBeVisible({ timeout: 5000 });
  });
});
