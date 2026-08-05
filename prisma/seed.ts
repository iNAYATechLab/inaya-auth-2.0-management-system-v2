import { PrismaClient, Role, TenantPlan, TenantRole, KYCStatus, VerificationTier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Password generation function: {username}@iNAYATechLabs010826!
function generatePassword(username: string): string {
  return `${username}@iNAYATechLabs010826!`;
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ─── 1. Create Default Tenant ──────────────────────────────────────────────
  console.log('📦 Creating default tenant...');
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'iNAYA TechLabs',
      slug: 'default',
      domain: 'iNAYATechLabs.com',
      plan: TenantPlan.ENTERPRISE,
      isActive: true,
      settings: {
        maxUsers: -1,
        maxOAuthClients: -1,
        maxApiKeys: -1,
        maxWebhooks: -1,
      },
    },
  });
  console.log(`✅ Default tenant created: ${defaultTenant.name}\n`);

  // ─── 2. Create Users ───────────────────────────────────────────────────────
  console.log('👥 Creating users...\n');

  // CEO and Founder
  const ceoUsername = 'ceo';
  const ceoPassword = await bcrypt.hash(generatePassword(ceoUsername), 12);
  const ceo = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: `${ceoUsername}@iNAYATechLabs.com`
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'CEO & Founder',
      username: ceoUsername,
      email: `${ceoUsername}@iNAYATechLabs.com`,
      password: ceoPassword,
      role: Role.CEO,
      tenantRole: TenantRole.OWNER,
      isActive: true,
      emailVerified: new Date(),
      isVerified: true,
      verificationTier: VerificationTier.PREMIUM,
      kycStatus: KYCStatus.VERIFIED,
      locale: 'en',
    },
  });
  console.log(`✅ CEO & Founder created:`);
  console.log(`   Email: ${ceoUsername}@iNAYATechLabs.com`);
  console.log(`   Password: ${generatePassword(ceoUsername)}`);
  console.log(`   Username: ${ceoUsername}\n`);

  // Administration Head
  const adminHeadUsername = 'adminhead';
  const adminHeadPassword = await bcrypt.hash(generatePassword(adminHeadUsername), 12);
  const adminHead = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: `${adminHeadUsername}@iNAYATechLabs.com`
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Administration Head',
      username: adminHeadUsername,
      email: `${adminHeadUsername}@iNAYATechLabs.com`,
      password: adminHeadPassword,
      role: Role.ADMIN_HEAD,
      tenantRole: TenantRole.ADMIN,
      isActive: true,
      emailVerified: new Date(),
      isVerified: true,
      verificationTier: VerificationTier.PREMIUM,
      kycStatus: KYCStatus.VERIFIED,
      locale: 'en',
    },
  });
  console.log(`✅ Administration Head created:`);
  console.log(`   Email: ${adminHeadUsername}@iNAYATechLabs.com`);
  console.log(`   Password: ${generatePassword(adminHeadUsername)}`);
  console.log(`   Username: ${adminHeadUsername}\n`);

  // Super Admin
  const superAdminUsername = 'superadmin';
  const superAdminPassword = await bcrypt.hash(generatePassword(superAdminUsername), 12);
  const superAdmin = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: `${superAdminUsername}@iNAYATechLabs.com`
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Super Administrator',
      username: superAdminUsername,
      email: `${superAdminUsername}@iNAYATechLabs.com`,
      password: superAdminPassword,
      role: Role.SUPERADMIN,
      tenantRole: TenantRole.OWNER,
      isActive: true,
      emailVerified: new Date(),
      isVerified: true,
      verificationTier: VerificationTier.PREMIUM,
      kycStatus: KYCStatus.VERIFIED,
      locale: 'en',
    },
  });
  console.log(`✅ Super Admin created:`);
  console.log(`   Email: ${superAdminUsername}@iNAYATechLabs.com`);
  console.log(`   Password: ${generatePassword(superAdminUsername)}`);
  console.log(`   Username: ${superAdminUsername}\n`);

  // Admin
  const adminUsername = 'admin';
  const adminPassword = await bcrypt.hash(generatePassword(adminUsername), 12);
  const admin = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: `${adminUsername}@iNAYATechLabs.com`
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Administrator',
      username: adminUsername,
      email: `${adminUsername}@iNAYATechLabs.com`,
      password: adminPassword,
      role: Role.ADMIN,
      tenantRole: TenantRole.ADMIN,
      isActive: true,
      emailVerified: new Date(),
      isVerified: true,
      verificationTier: VerificationTier.VERIFIED,
      kycStatus: KYCStatus.VERIFIED,
      locale: 'en',
    },
  });
  console.log(`✅ Admin created:`);
  console.log(`   Email: ${adminUsername}@iNAYATechLabs.com`);
  console.log(`   Password: ${generatePassword(adminUsername)}`);
  console.log(`   Username: ${adminUsername}\n`);

  // Moderator
  const moderatorUsername = 'moderator';
  const moderatorPassword = await bcrypt.hash(generatePassword(moderatorUsername), 12);
  const moderator = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: `${moderatorUsername}@iNAYATechLabs.com`
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Moderator',
      username: moderatorUsername,
      email: `${moderatorUsername}@iNAYATechLabs.com`,
      password: moderatorPassword,
      role: Role.MODERATOR,
      tenantRole: TenantRole.MEMBER,
      isActive: true,
      emailVerified: new Date(),
      isVerified: true,
      verificationTier: VerificationTier.VERIFIED,
      kycStatus: KYCStatus.VERIFIED,
      locale: 'en',
    },
  });
  console.log(`✅ Moderator created:`);
  console.log(`   Email: ${moderatorUsername}@iNAYATechLabs.com`);
  console.log(`   Password: ${generatePassword(moderatorUsername)}`);
  console.log(`   Username: ${moderatorUsername}\n`);

  // Regular User 1
  const user1Username = 'user1';
  const user1Password = await bcrypt.hash(generatePassword(user1Username), 12);
  const user1 = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: `${user1Username}@iNAYATechLabs.com`
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Regular User One',
      username: user1Username,
      email: `${user1Username}@iNAYATechLabs.com`,
      password: user1Password,
      role: Role.USER,
      tenantRole: TenantRole.MEMBER,
      isActive: true,
      emailVerified: new Date(),
      isVerified: true,
      verificationTier: VerificationTier.BASIC,
      kycStatus: KYCStatus.NOT_SUBMITTED,
      locale: 'en',
    },
  });
  console.log(`✅ Regular User 1 created:`);
  console.log(`   Email: ${user1Username}@iNAYATechLabs.com`);
  console.log(`   Password: ${generatePassword(user1Username)}`);
  console.log(`   Username: ${user1Username}\n`);

  // Regular User 2
  const user2Username = 'user2';
  const user2Password = await bcrypt.hash(generatePassword(user2Username), 12);
  const user2 = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: `${user2Username}@iNAYATechLabs.com`
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Regular User Two',
      username: user2Username,
      email: `${user2Username}@iNAYATechLabs.com`,
      password: user2Password,
      role: Role.USER,
      tenantRole: TenantRole.MEMBER,
      isActive: true,
      emailVerified: new Date(),
      isVerified: true,
      verificationTier: VerificationTier.BASIC,
      kycStatus: KYCStatus.NOT_SUBMITTED,
      locale: 'bn',
    },
  });
  console.log(`✅ Regular User 2 created:`);
  console.log(`   Email: ${user2Username}@iNAYATechLabs.com`);
  console.log(`   Password: ${generatePassword(user2Username)}`);
  console.log(`   Username: ${user2Username}\n`);

  // Demo User
  const demoUsername = 'demo';
  const demoPassword = await bcrypt.hash(generatePassword(demoUsername), 12);
  const demo = await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: `${demoUsername}@iNAYATechLabs.com`
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Demo User',
      username: demoUsername,
      email: `${demoUsername}@iNAYATechLabs.com`,
      password: demoPassword,
      role: Role.USER,
      tenantRole: TenantRole.MEMBER,
      isActive: true,
      emailVerified: new Date(),
      isVerified: true,
      verificationTier: VerificationTier.BASIC,
      kycStatus: KYCStatus.NOT_SUBMITTED,
      locale: 'en',
    },
  });
  console.log(`✅ Demo User created:`);
  console.log(`   Email: ${demoUsername}@iNAYATechLabs.com`);
  console.log(`   Password: ${generatePassword(demoUsername)}`);
  console.log(`   Username: ${demoUsername}\n`);

  // ─── 3. Create Default Pricing Plans ───────────────────────────────────────
  console.log('💰 Creating default pricing plans...\n');

  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Perfect for getting started',
      maxUsers: 5,
      maxOAuthClients: 1,
      maxApiKeys: 2,
      maxWebhooks: 1,
      customDomain: false,
      ssoEnabled: false,
      advancedSecurity: false,
      prioritySupport: false,
      pricing: { USD: 0, BDT: 0, EUR: 0 },
      currency: 'USD',
      billingIntervals: { monthly: true, yearly: true },
      isActive: true,
      isDefault: true,
    },
    {
      name: 'Starter',
      slug: 'starter',
      description: 'For small teams and projects',
      maxUsers: 25,
      maxOAuthClients: 5,
      maxApiKeys: 10,
      maxWebhooks: 5,
      customDomain: false,
      ssoEnabled: false,
      advancedSecurity: true,
      prioritySupport: false,
      pricing: { USD: 29, BDT: 3200, EUR: 27 },
      currency: 'USD',
      billingIntervals: { monthly: true, yearly: true, yearly_discount: 20 },
      isActive: true,
      isDefault: false,
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'For growing businesses',
      maxUsers: 100,
      maxOAuthClients: 20,
      maxApiKeys: 50,
      maxWebhooks: 20,
      customDomain: true,
      ssoEnabled: true,
      advancedSecurity: true,
      prioritySupport: true,
      pricing: { USD: 99, BDT: 11000, EUR: 92 },
      currency: 'USD',
      billingIntervals: { monthly: true, yearly: true, yearly_discount: 20 },
      isActive: true,
      isDefault: false,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large organizations',
      maxUsers: -1,
      maxOAuthClients: -1,
      maxApiKeys: -1,
      maxWebhooks: -1,
      customDomain: true,
      ssoEnabled: true,
      advancedSecurity: true,
      prioritySupport: true,
      pricing: { USD: 299, BDT: 33000, EUR: 278 },
      currency: 'USD',
      billingIntervals: { monthly: true, yearly: true, yearly_discount: 20 },
      isActive: true,
      isDefault: false,
    },
  ];

  for (const plan of plans) {
    const created = await prisma.pricingPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
    console.log(`✅ Pricing plan created: ${created.name} - $${(plan.pricing as any).USD}/month`);
  }
  console.log();

  // ─── 4. Create Default Email Templates ─────────────────────────────────────
  console.log('📧 Creating default email templates...\n');

  const emailTemplates = [
    {
      name: 'welcome',
      type: 'WELCOME',
      subject: 'Welcome to iNAYA Auth 2.0!',
      htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to iNAYA Auth 2.0!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hi {{userName}},</h2>
        <p style="color: #666666; line-height: 1.6; font-size: 16px;">
          Thank you for joining iNAYA Auth 2.0! We're excited to have you on board.
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
          © {{year}} iNAYA TechLab. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
      textContent: `Welcome to iNAYA Auth 2.0!

Hi {{userName}},

Thank you for joining iNAYA Auth 2.0! We're excited to have you on board.

Your account has been successfully created. You can now access all our features and start exploring.

Get started: {{loginUrl}}

If you have any questions, feel free to contact our support team.

© {{year}} iNAYA TechLab. All rights reserved.`,
      variables: {
        userName: 'User Name',
        loginUrl: 'https://app.inaya-auth.com/login',
        year: new Date().getFullYear().toString(),
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
  </table>
</body>
</html>
      `.trim(),
      textContent: `Verify Your Email

Hi {{userName}},

Please verify your email address by clicking the link below:

{{verificationUrl}}

This link will expire in {{expiryTime}}.`,
      variables: {
        userName: 'User Name',
        verificationUrl: 'https://app.inaya-auth.com/verify',
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
          If you didn't request a password reset, please ignore this email.
        </p>
        <p style="color: #999999; font-size: 14px;">
          This link will expire in {{expiryTime}}.
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

If you didn't request a password reset, please ignore this email.

This link will expire in {{expiryTime}}.`,
      variables: {
        userName: 'User Name',
        resetUrl: 'https://app.inaya-auth.com/reset-password',
        expiryTime: '1 hour',
      },
    },
  ];

  for (const template of emailTemplates) {
    const created = await prisma.emailTemplate.upsert({
      where: { 
        tenantId_name: {
          tenantId: defaultTenant.id,
          name: template.name
        }
      },
      update: {},
      create: {
        tenantId: defaultTenant.id,
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
    console.log(`✅ Email template created: ${created.name}`);
  }
  console.log();

  // ─── 5. Create Global Settings ─────────────────────────────────────────────
  console.log('⚙️ Creating global settings...\n');

  await prisma.globalCooldownSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      passwordCooldownHours: 24,
      twoFactorCooldownHours: 24,
      passkeyCooldownHours: 24,
      oauthCooldownHours: 24,
      phoneCooldownHours: 24,
      maxSimultaneousChanges: 1,
    },
  });
  console.log('✅ Global cooldown settings created\n');

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Database Seed Summary:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Tenants: 1`);
  console.log(`✅ Users: 8 (1 CEO, 1 Admin Head, 1 Super Admin, 1 Admin, 1 Moderator, 3 Regular Users)`);
  console.log(`✅ Pricing Plans: 4 (Free, Starter, Professional, Enterprise)`);
  console.log(`✅ Email Templates: 3 (Welcome, Verification, Password Reset)`);
  console.log(`✅ Global Settings: 1`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🔐 Default User Credentials:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('CEO & Founder:');
  console.log(`  Email: ceo@iNAYATechLabs.com`);
  console.log(`  Password: ${generatePassword('ceo')}`);
  console.log('  Username: ceo\n');
  
  console.log('Administration Head:');
  console.log(`  Email: adminhead@iNAYATechLabs.com`);
  console.log(`  Password: ${generatePassword('adminhead')}`);
  console.log('  Username: adminhead\n');
  
  console.log('Super Admin:');
  console.log(`  Email: superadmin@iNAYATechLabs.com`);
  console.log(`  Password: ${generatePassword('superadmin')}`);
  console.log('  Username: superadmin\n');
  
  console.log('Admin:');
  console.log(`  Email: admin@iNAYATechLabs.com`);
  console.log(`  Password: ${generatePassword('admin')}`);
  console.log('  Username: admin\n');
  
  console.log('Moderator:');
  console.log(`  Email: moderator@iNAYATechLabs.com`);
  console.log(`  Password: ${generatePassword('moderator')}`);
  console.log('  Username: moderator\n');
  
  console.log('Regular Users:');
  console.log(`  Email: user1@iNAYATechLabs.com`);
  console.log(`  Password: ${generatePassword('user1')}`);
  console.log('  Username: user1\n');
  
  console.log(`  Email: user2@iNAYATechLabs.com`);
  console.log(`  Password: ${generatePassword('user2')}`);
  console.log('  Username: user2\n');
  
  console.log('Demo User:');
  console.log(`  Email: demo@iNAYATechLabs.com`);
  console.log(`  Password: ${generatePassword('demo')}`);
  console.log('  Username: demo\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📧 Email Domain: @iNAYATechLabs.com\n');
  console.log('🎉 Database seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
