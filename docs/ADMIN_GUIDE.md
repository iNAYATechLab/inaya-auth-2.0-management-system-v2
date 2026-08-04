# 👑 Admin Guide - iNAYA Auth 2.0

## Overview

This guide covers administrative tasks for managing iNAYA Auth 2.0 platform, including user management, tenant management, security monitoring, and system configuration.

---

## Super Admin Dashboard

Access the admin dashboard at:
```
https://app.inaya-auth.com/admin/dashboard
```

**Requirements:**
- User must have `SUPERADMIN` role
- IP whitelist configured (optional)

---

## User Management

### View All Users

```
GET /admin/users
```

**Filters:**
- Role: USER, ADMIN, MODERATOR, SUPERADMIN
- Status: Active, Inactive
- KYC Status: Not Submitted, Pending, Verified, Rejected
- Search by email or name

### Create User

1. Navigate to `/admin/users/new`
2. Fill in user details:
   - Email (required)
   - Name (optional)
   - Role (required)
   - Temporary password (required)
3. Click "Create User"
4. Share credentials securely with user

### Edit User

1. Navigate to user profile
2. Click "Edit"
3. Update fields:
   - Name
   - Role
   - Status (Active/Inactive)
   - Email verification status
4. Click "Save Changes"

### Deactivate User

1. Navigate to user profile
2. Click "Deactivate User"
3. Confirm action
4. User will be logged out immediately

### Delete User (GDPR)

**Warning:** This action is irreversible!

1. Navigate to user profile
2. Click "Delete User"
3. Enter confirmation text
4. All user data will be permanently deleted

### Reset Password

1. Navigate to user profile
2. Click "Reset Password"
3. Enter new temporary password
4. Share securely with user

---

## Tenant Management

### View All Tenants

```
GET /admin/tenants
```

**Information:**
- Tenant name and slug
- Plan (Free, Starter, Professional, Enterprise)
- User count
- Status (Active/Inactive)
- Subscription status

### Create Tenant

1. Navigate to `/admin/tenants/new`
2. Fill in tenant details:
   - Name (required)
   - Slug (required, unique)
   - Domain (optional)
   - Owner email (required)
   - Plan (required)
3. Click "Create Tenant"
4. Owner will receive invitation email

### Edit Tenant

1. Navigate to tenant settings
2. Update fields:
   - Name
   - Domain
   - Plan
   - Features (custom domain, SSO, etc.)
   - Status
3. Click "Save Changes"

### Change Tenant Plan

1. Navigate to tenant settings → Billing
2. Select new plan
3. Confirm change
4. Billing will be prorated

### Suspend Tenant

1. Navigate to tenant settings
2. Click "Suspend Tenant"
3. Enter reason
4. All tenant users will be logged out

---

## Subscription Management

### View All Subscriptions

```
GET /admin/subscriptions
```

**Filters:**
- Status: Active, Past Due, Canceled
- Plan: Free, Starter, Professional, Enterprise
- Billing: Monthly, Yearly

### Process Refund

1. Navigate to subscription details
2. Click "Process Refund"
3. Select refund amount (full or partial)
4. Enter reason
5. Click "Confirm Refund"

### Cancel Subscription

1. Navigate to subscription details
2. Click "Cancel Subscription"
3. Choose:
   - Cancel immediately
   - Cancel at end of billing period
4. Confirm cancellation

### Force Cancel (Admin Override)

**Warning:** Use only for fraudulent accounts!

1. Navigate to subscription details
2. Click "Force Cancel"
3. Enter reason
4. Subscription will be terminated immediately

---

## Security Monitoring

### View Security Logs

```
GET /admin/security/logs
```

**Event Types:**
- Login attempts (success/failure)
- Password changes
- 2FA enable/disable
- Role changes
- Data export requests
- Data deletion requests
- CSRF violations
- XSS attempts
- SQL injection attempts
- Brute force attempts

**Filters:**
- Date range
- Event type
- Severity (Low, Medium, High, Critical)
- User
- IP address

### View Login Alerts

```
GET /admin/security/alerts
```

**Alert Types:**
- New device login
- Unusual location
- Multiple failed attempts
- Impossible travel

**Actions:**
- Acknowledge alert
- Mark as trusted device
- Block IP address
- Lock user account

### Block IP Address

1. Navigate to `/admin/security/blocked-ips`
2. Click "Block IP"
3. Enter IP address or CIDR range
4. Enter reason
5. Choose duration:
   - Permanent
   - 1 hour
   - 24 hours
   - 7 days
   - 30 days
6. Click "Block IP"

### Unlock User Account

1. Navigate to user profile
2. Click "Unlock Account"
3. Enter reason
4. User can log in again

---

## KYC Management

### View KYC Requests

```
GET /admin/kyc/requests
```

**Status:**
- Pending
- Under Review
- Verified
- Rejected

### Review KYC Request

1. Navigate to KYC request
2. Review:
   - Document images
   - Selfie
   - Video selfie (if provided)
   - Face match score
   - Liveness score
3. Choose action:
   - Approve
   - Reject (with reason)
   - Request additional information

### Bulk KYC Review

For large volumes, use bulk review:

1. Navigate to `/admin/kyc/bulk-review`
2. Select filter (e.g., "Pending for 24+ hours")
3. Review each request
4. Approve or reject

---

## Analytics & Reporting

### Revenue Analytics

```
GET /admin/analytics/revenue
```

**Metrics:**
- Total Revenue
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Average Revenue Per Tenant
- Revenue by Month (chart)
- Revenue by Plan
- Revenue by Country

### Tenant Analytics

```
GET /admin/analytics/tenants
```

**Metrics:**
- Total Tenants
- Active Tenants
- New Tenants (this month)
- Churn Rate
- Tenants by Plan
- Tenants by Status

### User Analytics

```
GET /admin/analytics/users
```

**Metrics:**
- Total Users
- Active Users
- New Users (this month)
- Average Users Per Tenant
- Users by Month (chart)

### Export Reports

1. Navigate to `/admin/analytics/reports`
2. Select report type:
   - Revenue Report
   - Tenant Report
   - User Report
   - Security Report
3. Select date range
4. Choose format:
   - CSV
   - Excel
   - PDF
5. Click "Export"

---

## System Configuration

### OTP Configuration

Navigate to `/admin/settings/otp`

**Global Settings:**
- Default OTP expiry (minutes)
- Default OTP length
- Rate limit (per hour)
- Resend cooldown (seconds)
- Max attempts
- Lockout duration (minutes)

**Per-Tenant Settings:**
- Allowed delivery methods
- Default method
- Custom expiry
- Custom rate limits

### Pricing Plans

Navigate to `/admin/settings/pricing`

**Create Plan:**

1. Click "Create Plan"
2. Fill in details:
   - Name
   - Slug
   - Description
   - Features:
     - Max Users (-1 for unlimited)
     - Max OAuth Clients
     - Max API Keys
     - Max Webhooks
     - Custom Domain (true/false)
     - SSO Enabled (true/false)
     - Advanced Security (true/false)
     - Priority Support (true/false)
   - Pricing (by country/currency)
   - Billing intervals
3. Click "Save Plan"

**Edit Plan:**

1. Click on plan
2. Update fields
3. Click "Save Changes"

**Delete Plan:**

**Warning:** Cannot delete plan with active subscriptions!

1. Click on plan
2. Click "Delete Plan"
3. Confirm

### Security Settings

Navigate to `/admin/settings/security`

**Global Settings:**
- Password requirements
- 2FA requirements
- Session timeout
- Max failed login attempts
- Lockout duration
- Allowed countries
- Blocked IPs

### Backup & Restore

Navigate to `/admin/settings/backup`

**Create Backup:**

1. Click "Create Backup"
2. Select backup type:
   - Full system backup
   - Database only
   - Files only
3. Click "Start Backup"
4. Wait for completion

**Restore Backup:**

**Warning:** This will overwrite current data!

1. Click on backup
2. Click "Restore"
3. Confirm restore
4. Wait for completion

**Download Backup:**

1. Click on backup
2. Click "Download"
3. File will be downloaded

---

## Audit Logging

All admin actions are logged:

```
GET /admin/audit-logs
```

**Logged Actions:**
- User management (create, edit, delete)
- Tenant management
- Subscription changes
- Security actions
- System configuration changes

**Filters:**
- Date range
- Action type
- Admin user
- Target entity

---

## Emergency Procedures

### Lock All Users

**Use only in case of security breach!**

1. Navigate to `/admin/emergency`
2. Click "Lock All Users"
3. Confirm action
4. All users will be logged out
5. Send notification to all users

### Disable New Registrations

1. Navigate to `/admin/settings/registration`
2. Toggle "Allow New Registrations" off
3. Save changes

### Enable Maintenance Mode

1. Navigate to `/admin/settings/maintenance`
2. Toggle "Maintenance Mode" on
3. Set maintenance message
4. Save changes

---

## Monitoring & Alerts

### Set Up Alerts

Navigate to `/admin/settings/alerts`

**Alert Types:**
- High CPU usage (>80%)
- High memory usage (>90%)
- Database connection issues
- Failed login attempts (>100/hour)
- Security incidents (critical)

**Notification Channels:**
- Email
- Slack
- SMS

### View System Health

Navigate to `/admin/health`

**Metrics:**
- CPU usage
- Memory usage
- Disk usage
- Database connections
- API response time
- Error rate

---

## Best Practices

### 1. Use Role-Based Access Control

Only grant SUPERADMIN role to trusted individuals.

### 2. Enable 2FA for Admin Accounts

All admin accounts should have 2FA enabled.

### 3. Review Security Logs Daily

Check for suspicious activity daily.

### 4. Keep Backups

Create daily backups and test restore procedure monthly.

### 5. Monitor Performance

Set up alerts for performance issues.

### 6. Document Changes

Keep a changelog of all configuration changes.

---

## Troubleshooting

### User Cannot Login

1. Check if user account is active
2. Check if IP is blocked
3. Check if account is locked (failed attempts)
4. Reset password if needed

### Tenant Not Accessible

1. Check tenant status (active/suspended)
2. Check subscription status
3. Check domain configuration
4. Check DNS records

### Subscription Issues

1. Check Stripe webhook status
2. Verify payment status
3. Check subscription status in database
4. Manually sync if needed

---

## Support

- **Email**: admin@inaya-auth.com
- **Slack**: #admin-support
- **Documentation**: https://docs.inaya-auth.com/admin

---

**Last Updated:** 2026-08-04
