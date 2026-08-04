// Cookie Consent Banner Tests
import { render, screen, fireEvent } from '@testing-library/react';
import CookieConsentBanner from '@/components/security/CookieConsentBanner';

// Mock the GDPR action
jest.mock('@/lib/security/gdpr.util', () => ({
  updateCookieConsentAction: jest.fn(),
}));

import { updateCookieConsentAction } from '@/lib/security/gdpr.util';

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should not render if consent already given', () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    }));

    render(<CookieConsentBanner />);
    expect(screen.queryByText(/cookie consent/i)).not.toBeInTheDocument();
  });

  it('should render banner if no consent given', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByText(/cookie consent/i)).toBeInTheDocument();
    expect(screen.getByText(/accept all/i)).toBeInTheDocument();
    expect(screen.getByText(/reject all/i)).toBeInTheDocument();
  });

  it('should show all cookie categories', () => {
    render(<CookieConsentBanner />);
    
    expect(screen.getByText(/essential cookies/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics cookies/i)).toBeInTheDocument();
    expect(screen.getByText(/marketing cookies/i)).toBeInTheDocument();
    expect(screen.getByText(/preference cookies/i)).toBeInTheDocument();
  });

  it('should have essential cookies always checked and disabled', () => {
    render(<CookieConsentBanner />);
    
    const essentialCheckbox = screen.getByRole('checkbox', { name: /essential cookies/i });
    expect(essentialCheckbox).toBeChecked();
    expect(essentialCheckbox).toBeDisabled();
  });

  it('should allow toggling analytics cookies', () => {
    render(<CookieConsentBanner />);
    
    const analyticsCheckbox = screen.getByRole('checkbox', { name: /analytics cookies/i });
    expect(analyticsCheckbox).not.toBeChecked();
    
    fireEvent.click(analyticsCheckbox);
    expect(analyticsCheckbox).toBeChecked();
  });

  it('should save all consents when Accept All is clicked', async () => {
    render(<CookieConsentBanner />);
    
    const acceptAllButton = screen.getByText(/accept all/i);
    fireEvent.click(acceptAllButton);

    expect(updateCookieConsentAction).toHaveBeenCalledWith({
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('cookie-consent', expect.any(String));
  });

  it('should save minimal consents when Reject All is clicked', () => {
    render(<CookieConsentBanner />);
    
    const rejectAllButton = screen.getByText(/reject all/i);
    fireEvent.click(rejectAllButton);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cookie-consent',
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false,
        preferences: false,
      })
    );
  });

  it('should save selected consents when Accept Selected is clicked', () => {
    render(<CookieConsentBanner />);
    
    // Enable analytics and preferences
    const analyticsCheckbox = screen.getByRole('checkbox', { name: /analytics cookies/i });
    const preferencesCheckbox = screen.getByRole('checkbox', { name: /preference cookies/i });
    
    fireEvent.click(analyticsCheckbox);
    fireEvent.click(preferencesCheckbox);
    
    const acceptSelectedButton = screen.getByText(/accept selected/i);
    fireEvent.click(acceptSelectedButton);

    expect(updateCookieConsentAction).toHaveBeenCalledWith({
      essential: true,
      analytics: true,
      marketing: false,
      preferences: true,
    });
  });

  it('should close banner after accepting cookies', () => {
    render(<CookieConsentBanner />);
    
    const acceptAllButton = screen.getByText(/accept all/i);
    fireEvent.click(acceptAllButton);

    expect(screen.queryByText(/cookie consent/i)).not.toBeInTheDocument();
  });

  it('should have link to privacy policy', () => {
    render(<CookieConsentBanner />);
    
    const privacyLink = screen.getByText(/learn more about cookies/i);
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy#cookies');
  });
});
