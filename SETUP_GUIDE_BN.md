# 🚀 iNAYA Auth 2.0 — সেটআপ গাইড (বাংলা)

## ধাপ ১: সিস্টেম সেটআপ সম্পূর্ণ

### ✅ যা যা সেটআপ করা হয়েছে:

#### 1. PostgreSQL + Prisma ORM
- ✅ ডেটাবেস স্কিমা তৈরি (`prisma/schema.prisma`)
- ✅ User, Account, Session, VerificationToken মডেল
- ✅ Role-based access control (USER, MODERATOR, ADMIN, SUPERADMIN)
- ✅ Audit logging সিস্টেম
- ✅ Refresh token ম্যানেজমেন্ট
- ✅ Migration স্ক্রিপ্ট
- ✅ Seed data (টেস্ট ইউজার)

#### 2. Auth.js v5 (NextAuth.js)
- ✅ Credentials provider (Email + Password)
- ✅ OAuth providers (GitHub, Google)
- ✅ JWT session strategy
- ✅ Custom callbacks (JWT, Session, SignIn)
- ✅ Password hashing (bcrypt)
- ✅ Account activation/deactivation
- ✅ Failed login logging
- ✅ Server actions for auth

#### 3. Tailwind CSS + iNAYA Brand Colors
- ✅ Indigo (#6D28D9) - Primary color
- ✅ Gold (#F59E0B) - Accent color
- ✅ Custom design system
- ✅ Dark mode support
- ✅ Custom animations
- ✅ Glass morphism effects
- ✅ Gradient utilities

#### 4. Multi-Language (next-intl)
- ✅ English (default)
- ✅ Bengali (বাংলা)
- ✅ Hindi (हिन्दी)
- ✅ Arabic (العربية) - RTL support
- ✅ Locale-based routing
- ✅ Translation files

---

## 🛠️ লোকাল সেটআপ নির্দেশনা

### ধাপ ১: PostgreSQL ডেটাবেস তৈরি করুন

```bash
# PostgreSQL ইনস্টল করুন (যদি না থাকে)
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Windows: https://www.postgresql.org/download/windows/

# ডেটাবেস তৈরি করুন
createdb inaya_auth

# অথবা psql দিয়ে:
psql -U postgres
CREATE DATABASE inaya_auth;
\q
```

### ধাপ ২: Environment Variables সেট করুন

```bash
# .env ফাইল এডিট করুন
nano .env

# DATABASE_URL আপডেট করুন
DATABASE_URL="postgresql://postgres:password@localhost:5432/inaya_auth?schema=public"

# AUTH_SECRET তৈরি করুন
openssl rand -base64 32
```

### ধাপ ৩: ডেটাবেস মাইগ্রেশন

```bash
# Prisma Client জেনারেট করুন
npx prisma generate

# মাইগ্রেশন চালান
npx prisma migrate dev --name init

# Prisma Studio খুলুন (ডেটাবেস দেখতে)
npx prisma studio
```

### ধাপ ৪: Seed Data (টেস্ট ইউজার তৈরি)

```bash
npx prisma db seed
```

টেস্ট অ্যাকাউন্ট:
- **Admin**: admin@inaya-auth.com / Admin@123456
- **Moderator**: moderator@inaya-auth.com / Mod@123456
- **User**: user@inaya-auth.com / User@123456

### ধাপ ৫: ডেভেলপমেন্ট সার্ভার চালু করুন

```bash
npm run dev
```

ব্রাউজারে খুলুন: http://localhost:3000

---

## 📁 প্রজেক্ট স্ট্রাকচার

```
inaya-auth-2.0-management-system-v2/
├── prisma/
│   ├── schema.prisma          # ডেটাবেস স্কিমা
│   └── seed.ts                # সীড ডাটা
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/  # Auth API
│   │   └── [locale]/                # লোকেল রাউটিং
│   ├── components/
│   │   └── ui/                      # UI কম্পোনেন্ট
│   ├── i18n/                        # i18n কনফিগ
│   ├── lib/
│   │   ├── auth/                    # Auth.js কনফিগ
│   │   ├── prisma/                  # Prisma ক্লায়েন্ট
│   │   └── utils/                   # ইউটিলিটি
│   └── middleware/                   # মিডলওয়্যার
├── messages/                        # ট্রান্সলেশন ফাইল
│   ├── en.json                      # ইংরেজি
│   ├── bn.json                      # বাংলা
│   ├── hi.json                      # হিন্দি
│   └── ar.json                      # আরবি
└── tailwind.config.ts               # Tailwind কনফিগ
```

---

## 🎯 পরবর্তী ধাপসমূহ

### ধাপ ২: UI কম্পোনেন্ট ও পেজ
- [ ] Dashboard layout
- [ ] Sidebar navigation
- [ ] User management table
- [ ] Profile settings page
- [ ] Audit log viewer

### ধাপ ৩: ফাংশনালিটি
- [ ] Password reset flow
- [ ] Email verification
- [ ] Role management
- [ ] User search & filter
- [ ] Bulk actions

### ধাপ ৪: অ্যাডমিন ফিচার
- [ ] System settings
- [ ] Audit log filtering
- [ ] User export/import
- [ ] Activity analytics
- [ ] Notification system

---

## 🔧 কমন কমান্ড

```bash
# ডেভেলপমেন্ট
npm run dev              # ডেভ সার্ভার চালু

# ডেটাবেস
npm run db:generate      # Prisma Client জেনারেট
npm run db:push          # স্কিমা পুশ
npm run db:migrate       # মাইগ্রেশন চালাও
npm run db:studio        # Prisma Studio খুলুন
npm run db:seed          # সীড ডাটা

# বিল্ড
npm run build            # প্রোডাকশন বিল্ড
npm run start            # প্রোডাকশন সার্ভার

# কোয়ালিটি
npm run lint             # ESLint চেক
npm run type-check       # TypeScript চেক
```

---

## 🌐 ভাষা পরিবর্তন

URL-এ লোকেল প্রিফিক্স ব্যবহার করুন:

- English: http://localhost:3000/en
- Bengali: http://localhost:3000/bn
- Hindi: http://localhost:3000/hi
- Arabic: http://localhost:3000/ar

ডিফল্ট (ইংরেজি): http://localhost:3000

---

## 🐛 সমস্যা সমাধান

### সমস্যা ১: ডেটাবেস কানেকশন এরর
```bash
# PostgreSQL সার্ভিস চালু করুন
sudo systemctl start postgresql

# কানেকশন চেক করুন
psql -U postgres -h localhost
```

### সমস্যা ২: Prisma migration failed
```bash
# ডেটাবেস রিসেট করুন (সতর্কতা: সব ডাটা মুছে যাবে!)
npx prisma migrate reset
```

### সমস্যা ৩: Port already in use
```bash
# 3000 পোর্ট মুক্ত করুন
lsof -ti:3000 | xargs kill -9

# অথবা অন্য পোর্ট ব্যবহার করুন
PORT=3001 npm run dev
```

---

## 📞 সাহায্য দরকার?

- **Documentation**: README.md পড়ুন
- **Issues**: GitHub Issues-এ রিপোর্ট করুন
- **Email**: support@inaya-auth.com

---

<div align="center">

**iNAYA Auth 2.0 — সফলভাবে সেটআপ সম্পন্ন! 🎉**

</div>
