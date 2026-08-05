# 🗄️ Database Setup Guide - iNAYA Auth 2.0

এই guide আপনাকে PostgreSQL database সেটআপ এবং seed data যোগ করতে সাহায্য করবে।

---

## 📋 প্রয়োজনীয়তা

- **PostgreSQL 14+** installed এবং running
- **Node.js 20+** installed
- **npm** বা **yarn** installed

---

## 🔧 ধাপ ১: PostgreSQL Install

### **Windows:**

1. Download করুন: https://www.postgresql.org/download/windows/
2. Install করুন (default settings ব্যবহার করুন)
3. PostgreSQL service automatically শুরু হবে

**Verify installation:**
```bash
psql --version
```

### **macOS:**

**Option 1: Homebrew (Recommended)**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Option 2: Postgres.app**
Download: https://postgresapp.com/

**Verify installation:**
```bash
psql --version
```

### **Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Verify installation:**
```bash
psql --version
```

---

## 🔐 ধাপ ২: Database এবং User তৈরি করুন

### **Option 1: Default PostgreSQL User ব্যবহার করুন**

```bash
# PostgreSQL এ লগইন করুন
sudo -u postgres psql

# Database তৈরি করুন
CREATE DATABASE inaya_auth;

# Verify
\l

# Exit
\q
```

### **Option 2: Custom User তৈরি করুন (Recommended for Production)**

```bash
# PostgreSQL এ লগিন করুন
sudo -u postgres psql

# User তৈরি করুন
CREATE USER inaya_user WITH PASSWORD 'YourStrongPassword123!';

# Database তৈরি করুন
CREATE DATABASE inaya_auth OWNER inaya_user;

# Permissions দিন
GRANT ALL PRIVILEGES ON DATABASE inaya_auth TO inaya_user;

# Verify
\l

# Exit
\q
```

---

## ⚙️ ধাপ ৩: Environment Variables সেট করুন

### **Development (.env ফাইল):**

`.env` ফাইল তৈরি করুন এবং নিচের values যোগ করুন:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/inaya_auth?schema=public"

# অথবা custom user ব্যবহার করলে:
# DATABASE_URL="postgresql://inaya_user:YourStrongPassword123!@localhost:5432/inaya_auth?schema=public"

# Auth Configuration
AUTH_SECRET="your-super-secret-auth-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="iNAYA Auth 2.0"
NODE_ENV="development"
```

**⚠️ গুরুত্বপূর্ণ:**
- `password` এর জায়গায় আপনার PostgreSQL password দিন
- `AUTH_SECRET` এর জন্য একটা strong random string ব্যবহার করুন

**Generate AUTH_SECRET:**
```bash
# Linux/macOS
openssl rand -base64 32

# অথবা Node.js দিয়ে
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄️ ধাপ ৪: Prisma Migration চালান

### **Step 4.1: Prisma Client Generate করুন**

```bash
npm run db:generate
```

### **Step 4.2: Database Schema Apply করুন**

```bash
npm run db:push
```

**অথবা Migration ব্যবহার করুন (Production এর জন্য recommended):**

```bash
npm run db:migrate
```

এই command আপনাকে migration name জিজ্ঞেস করবে। দিন: `init`

---

## 🌱 ধাপ ৫: Seed Data যোগ করুন

### **Seed চালান:**

```bash
npm run db:seed
```

### **Expected Output:**

```
🌱 Starting database seed...

📦 Creating default tenant...
✅ Default tenant created: iNAYA Default Organization

👥 Creating users...

✅ Super Admin created:
   Email: superadmin@inaya-auth.com
   Password: SuperAdmin@2024!
   Username: superadmin

✅ Admin created:
   Email: admin@inaya-auth.com
   Password: Admin@2024!
   Username: admin

✅ Moderator created:
   Email: moderator@inaya-auth.com
   Password: Mod@2024!
   Username: moderator

✅ Regular User 1 created:
   Email: user1@inaya-auth.com
   Password: User@2024!
   Username: user1

✅ Regular User 2 created:
   Email: user2@inaya-auth.com
   Password: User@2024!
   Username: user2

✅ Demo User created:
   Email: demo@inaya-auth.com
   Password: Demo@2024!
   Username: demo

💰 Creating default pricing plans...
✅ Pricing plan created: Free - $0/month
✅ Pricing plan created: Starter - $29/month
✅ Pricing plan created: Professional - $99/month
✅ Pricing plan created: Enterprise - $299/month

📧 Creating default email templates...
✅ Email template created: welcome
✅ Email template created: verification
✅ Email template created: password-reset

⚙️ Creating global settings...
✅ Global cooldown settings created

═══════════════════════════════════════════════════════════
📊 Database Seed Summary:
═══════════════════════════════════════════════════════════
✅ Tenants: 1
✅ Users: 6 (1 Super Admin, 1 Admin, 1 Moderator, 3 Regular Users)
✅ Pricing Plans: 4 (Free, Starter, Professional, Enterprise)
✅ Email Templates: 3 (Welcome, Verification, Password Reset)
✅ Global Settings: 1
═══════════════════════════════════════════════════════════

🔐 Default User Credentials:
───────────────────────────────────────────────────────────
Super Admin:
  Email: superadmin@inaya-auth.com
  Password: SuperAdmin@2024!
  Username: superadmin

Admin:
  Email: admin@inaya-auth.com
  Password: Admin@2024!
  Username: admin

Moderator:
  Email: moderator@inaya-auth.com
  Password: Mod@2024!
  Username: moderator

Regular Users:
  Email: user1@inaya-auth.com
  Password: User@2024!
  Username: user1

  Email: user2@inaya-auth.com
  Password: User@2024!
  Username: user2

Demo User:
  Email: demo@inaya-auth.com
  Password: Demo@2024!
  Username: demo
═══════════════════════════════════════════════════════════

🎉 Database seeding completed successfully!
```

---

## 🔍 ধাপ ৬: Verify করুন

### **Database এ Data চেক করুন:**

```bash
# Prisma Studio চালু করুন
npm run db:studio
```

এটি browser এ Prisma Studio খুলবে (সাধারণত http://localhost:5555)।

**আপনি দেখতে পাবেন:**
- ✅ `tenants` table এ 1 টি tenant
- ✅ `users` table এ 6 টি user
- ✅ `pricing_plans` table এ 4 টি plan
- ✅ `email_templates` table এ 3 টি template

---

## 🚀 ধাপ ৭: Application চালু করুন

### **Development Server:**

```bash
npm run dev
```

Application চালু হবে: http://localhost:3000

---

## 🔐 Default Login Credentials

### **Super Admin:**
- **Email:** `superadmin@inaya-auth.com`
- **Password:** `SuperAdmin@2024!`
- **Username:** `superadmin`

### **Admin:**
- **Email:** `admin@inaya-auth.com`
- **Password:** `Admin@2024!`
- **Username:** `admin`

### **Moderator:**
- **Email:** `moderator@inaya-auth.com`
- **Password:** `Mod@2024!`
- **Username:** `moderator`

### **Regular Users:**
- **Email:** `user1@inaya-auth.com` / `user2@inaya-auth.com`
- **Password:** `User@2024!`
- **Username:** `user1` / `user2`

### **Demo User:**
- **Email:** `demo@inaya-auth.com`
- **Password:** `Demo@2024!`
- **Username:** `demo`

---

## 🐛 Troubleshooting

### **Error: "Can't reach database server"**

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Start PostgreSQL
sudo systemctl start postgresql   # Linux
brew services start postgresql@14 # macOS
```

### **Error: "Database does not exist"**

**Solution:**
```bash
# Create database
sudo -u postgres createdb inaya_auth

# অথবা psql এ গিয়ে
sudo -u postgres psql
CREATE DATABASE inaya_auth;
\q
```

### **Error: "Permission denied"**

**Solution:**
```bash
# Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE inaya_auth TO your_username;
\q
```

### **Error: "Connection refused"**

**Solution:**
- PostgreSQL port 5432 এ চলছে কিনা চেক করুন
- Firewall PostgreSQL allow করছে কিনা চেক করুন
- `DATABASE_URL` ঠিক আছে কিনা চেক করুন

---

## 📝 Production Deployment

### **Environment Variables:**

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Auth
AUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_APP_NAME="iNAYA Auth 2.0"
NODE_ENV="production"
```

### **Migration চালাতে:**

```bash
npm run db:migrate:prod
```

### **Seed চালাতে (Optional):**

```bash
npm run db:seed
```

---

## 📚 Additional Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Prisma Documentation:** https://www.prisma.io/docs
- **NextAuth Documentation:** https://next-auth.js.org

---

## 🆘 সাহায্য দরকার?

কোনো সমস্যা হলে:
1. Error message পুরোটা কপি করুন
2. `node --version` এবং `npm --version` output কপি করুন
3. `psql --version` output কপি করুন
4. GitHub issue তৈরি করুন

---

**✅ আপনি এখন ready! Application চালু করুন এবং default credentials দিয়ে login করুন।**
