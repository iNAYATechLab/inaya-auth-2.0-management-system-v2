/**
 * OTP Provider Interface
 * 
 * Task 19: Extensible architecture for SMS/WhatsApp providers
 * All OTP delivery providers must implement this interface
 */

export interface OTPDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OTPDeliveryOptions {
  recipient: string; // email, phone, telegram chatId
  code: string;
  type: 'login' | 'verify' | 'reset';
  locale?: string;
}

export interface OTPProvider {
  /**
   * Unique identifier for this provider
   */
  readonly name: string;

  /**
   * Provider type (email, sms, telegram, whatsapp)
   */
  readonly type: 'email' | 'sms' | 'telegram' | 'whatsapp';

  /**
   * Whether this provider is currently configured and ready to use
   */
  isConfigured(): boolean;

  /**
   * Send OTP code to the recipient
   */
  sendOTP(options: OTPDeliveryOptions): Promise<OTPDeliveryResult>;

  /**
   * Send verification link (email only, for others falls back to code)
   */
  sendVerificationLink?(
    email: string,
    link: string,
    locale?: string
  ): Promise<OTPDeliveryResult>;
}

/**
 * Provider Registry - manages all available OTP providers
 */
export class OTPProviderRegistry {
  private providers: Map<string, OTPProvider> = new Map();

  register(provider: OTPProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): OTPProvider | undefined {
    return this.providers.get(name);
  }

  getByType(type: OTPProvider['type']): OTPProvider[] {
    return Array.from(this.providers.values()).filter(
      (p) => p.type === type && p.isConfigured()
    );
  }

  getAvailable(): OTPProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isConfigured());
  }

  getDefault(type: OTPProvider['type']): OTPProvider | undefined {
    const providers = this.getByType(type);
    return providers.length > 0 ? providers[0] : undefined;
  }
}
