import { prisma } from '@/lib/prisma';
import { EmailTemplateType } from '@prisma/client';

export interface DefaultTemplate {
  name: string;
  type: EmailTemplateType;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, string>;
}

const defaultTemplates: DefaultTemplate[] = [
  {
    name: 'welcome',
    type: 'WELCOME',
    subject: 'Welcome to {{companyName}}!',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to {{companyName}}!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hi {{userName}},</h2>
        <p style="color: #666666; line-height: 1.6; font-size: 16px;">
          Thank you for joining {{companyName}}! We're excited to have you on board.
        </p>
        <p style="color: #666666; line-height: 1.6; font-size: 16px;">
          Your account has been successfully created. You can now access all our features and start exploring.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="{{loginUrl}}" style="background-color: #6D28D9; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Get Started
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #666666; line-height: 1.6; font-size: 16px;">
          If you have any questions, feel free to contact our support team.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
        <p style="color: #999999; font-size: 14px; margin: 0;">
          © {{year}} {{companyName}}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    textContent: `Welcome to {{companyName}}!

Hi {{userName}},

Thank you for joining {{companyName}}! We're excited to have you on board.

Your account has been successfully created. You can now access all our features and start exploring.

Get started: {{loginUrl}}

If you have any questions, feel free to contact our support team.

© {{year}} {{companyName}}. All rights reserved.`,
    variables: {
      companyName: 'Company Name',
      userName: 'User Name',
      loginUrl: 'https://example.com/login',
      year: '2024',
    },
  },
  {
    name: 'verification',
    type: 'VERIFICATION',
    subject: 'Verify your email address',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Verify Your Email</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hi {{userName}},</h2>
        <p style="color: #666666; line-height: 1.6; font-size: 16px;">
          Please verify your email address by clicking the button below.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="{{verificationUrl}}" style="background-color: #6D28D9; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #666666; line-height: 1.6; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="{{verificationUrl}}" style="color: #6D28D9;">{{verificationUrl}}</a>
        </p>
        <p style="color: #999999; font-size: 14px;">
          This link will expire in {{expiryTime}}.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
        <p style="color: #999999; font-size: 14px; margin: 0;">
          If you didn't request this verification, please ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    textContent: `Verify Your Email

Hi {{userName}},

Please verify your email address by clicking the link below:

{{verificationUrl}}

This link will expire in {{expiryTime}}.

If you didn't request this verification, please ignore this email.`,
    variables: {
      userName: 'User Name',
      verificationUrl: 'https://example.com/verify',
      expiryTime: '24 hours',
    },
  },
  {
    name: 'password-reset',
    type: 'PASSWORD_RESET',
    subject: 'Reset your password',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Password Reset Request</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hi {{userName}},</h2>
        <p style="color: #666666; line-height: 1.6; font-size: 16px;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <a href="{{resetUrl}}" style="background-color: #6D28D9; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #666666; line-height: 1.6; font-size: 14px;">
          If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
        <p style="color: #999999; font-size: 14px;">
          This link will expire in {{expiryTime}}.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
        <p style="color: #999999; font-size: 14px; margin: 0;">
          © {{year}} {{companyName}}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    textContent: `Password Reset Request

Hi {{userName}},

We received a request to reset your password. Click the link below to create a new password:

{{resetUrl}}

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

This link will expire in {{expiryTime}}.

© {{year}} {{companyName}}. All rights reserved.`,
    variables: {
      userName: 'User Name',
      resetUrl: 'https://example.com/reset-password',
      expiryTime: '1 hour',
      companyName: 'Company Name',
      year: '2024',
    },
  },
];

/**
 * Create default email templates for a tenant
 */
export async function createDefaultTemplates(tenantId: string): Promise<void> {
  for (const template of defaultTemplates) {
    await prisma.emailTemplate.create({
      data: {
        tenantId,
        name: template.name,
        type: template.type,
        isActive: true,
        versions: {
          create: {
            version: 1,
            subject: template.subject,
            htmlContent: template.htmlContent,
            textContent: template.textContent,
            variables: template.variables,
            isActive: true,
            createdBy: 'system',
          },
        },
      },
    });
  }
}

/**
 * Get all available template types
 */
export function getTemplateTypes(): EmailTemplateType[] {
  return Object.values(EmailTemplateType);
}
