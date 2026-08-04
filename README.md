# iNAYA Auth 2.0 Management System

<div align="center">

![iNAYA Auth](https://img.shields.io/badge/iNAYA-Auth%202.0-6D28D9?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkw0IDdWMTJDNCAxNi40MTgzIDcuNTgxNyAyMCAxMiAyMFMyMCAxNi40MTgzIDIwIDEyVjdMMTIgMloiIGZpbGw9IiM2RDI4RDkiLz48L3N2Zz4=)
![Next.js](https://img.shields.io/badge/Next.js-15.1-000000?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-000000?style=for-the-badge&logo=auth0&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)

**A modern authentication and authorization management system built with Next.js 15, PostgreSQL, Prisma, and Auth.js v5**

[Features](#features) • [Installation](#installation) • [Configuration](#configuration) • [Usage](#usage) • [Documentation](#documentation)

</div>

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Multi-Provider Authentication**: Credentials (email/password) + OAuth (GitHub, Google)
- **Role-Based Access Control (RBAC)**: USER, MODERATOR, ADMIN, SUPERADMIN roles
- **Session Management**: JWT-based sessions with secure cookies
- **Password Security**: bcrypt hashing with configurable rounds
- **Account Activation/Deactivation**: Admin control over user accounts

### 🛡️ Security Features
- **Audit Logging**: Track all authentication events and user actions
- **Rate Limiting**: Protect against brute-force attacks
- **Input Validation**: Zod schemas for all forms
- **CSRF Protection**: Built-in with Auth.js
- **Secure Headers**: Helmet.js integration

### 🌐 Internationalization (i18n)
- **Multi-Language Support**: English (default), Bengali, Hindi, Arabic
- **RTL Support**: Full right-to-left language support
- **Locale-Based Routing**: Automatic locale detection and routing
- **Easy Translation**: JSON-based message files

### 🎨 Design System
- **iNAYA Brand Colors**: Indigo (#6D28D9) + Gold (#F59E0B)
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: shadcn/ui-inspired component library
- **Dark Mode**: System-aware dark/light theme
- **Responsive Design**: Mobile-first approach

### 📊 Database & ORM
- **PostgreSQL**: Robust relational database
- **Prisma ORM**: Type-safe database client
- **Migrations**: Version-controlled schema changes
- **Seed Data**: Development data seeding

---

## 🚀 Installation

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL 14+ database
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/iNAYATechLab/inaya-auth-2.0-management-system.git
cd inaya-auth-2.0-management-system-v2
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Setup
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/inaya_auth?schema=public"

# Auth.js
AUTH_SECRET="generate-a-secure-secret-here"
AUTH_TRUST_HOST=true

# OAuth Providers (Optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="iNAYA Auth 2.0"
NODE_ENV="development"
```

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Step 4: Database Setup

**Option A: Using Prisma Migrate (Recommended)**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database with test data
npx prisma db seed
```

**Option B: Push Schema Directly**
```bash
npx prisma db push
```

### Step 5: Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
inaya-auth-2.0-management-system-v2/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data script
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/  # Auth API routes
│   │   └── [locale]/                # Locale-based routes
│   │       ├── (auth)/              # Auth pages (login, register)
│   │       └── (dashboard)/         # Dashboard pages
│   ├── components/
│   │   ├── ui/                      # UI components (Button, Input, etc.)
│   │   ├── auth/                    # Auth-specific components
│   │   └── layout/                  # Layout components
│   ├── config/                      # App configuration
│   ├── i18n/                        # Internationalization config
│   ├── lib/
│   │   ├── auth/                    # Auth.js configuration
│   │   ├── prisma/                  # Prisma client
│   │   └── utils/                   # Utilities (validation, audit)
│   ├── middleware/                   # Middleware (route protection)
│   ├── styles/                      # Global styles
│   └── types/                       # TypeScript types
├── messages/                        # Translation files
│   ├── en.json                      # English
│   ├── bn.json                      # Bengali
│   ├── hi.json                      # Hindi
│   └── ar.json                      # Arabic
├── .env.example                     # Environment template
├── tailwind.config.ts               # Tailwind configuration
├── next.config.ts                   # Next.js configuration
└── package.json
```

---

## 🔧 Configuration

### Database Models

The system uses the following database models:

- **User**: User accounts with roles and status
- **Account**: OAuth provider accounts (GitHub, Google)
- **Session**: Active user sessions
- **VerificationToken**: Email verification tokens
- **RefreshToken**: JWT refresh tokens
- **AuditLog**: System activity logs

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| USER | View/edit own profile |
| MODERATOR | USER + View users, audit logs |
| ADMIN | MODERATOR + Manage users, settings |
| SUPERADMIN | All permissions |

### Authentication Flow

1. **Credentials Login**: Email + Password → bcrypt verification → JWT token
2. **OAuth Login**: GitHub/Google → Account linking → JWT token
3. **Session**: JWT stored in secure HTTP-only cookie
4. **Middleware**: Route protection + locale detection

---

## 📖 Usage

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Releases
npm run release:patch    # Patch release (2.0.0 → 2.0.1)
npm run release:minor    # Minor release (2.0.0 → 2.1.0)
npm run release:major    # Major release (2.0.0 → 3.0.0)
```

### Test Accounts (After Seeding)

```
Admin:     admin@inaya-auth.com / Admin@123456
Moderator: moderator@inaya-auth.com / Mod@123456
User:      user@inaya-auth.com / User@123456
```

### Accessing Prisma Studio

```bash
npm run db:studio
```

Opens at [http://localhost:5555](http://localhost:5555)

---

## 🌍 Internationalization

### Supported Languages

| Code | Language | Direction |
|------|----------|-----------|
| `en` | English | LTR |
| `bn` | Bengali (বাংলা) | LTR |
| `hi` | Hindi (हिन्दी) | LTR |
| `ar` | Arabic (العربية) | RTL |

### Adding a New Language

1. Create `messages/[locale].json`
2. Add locale to `src/i18n/config.ts`
3. Update `generateStaticParams` in layout

### Using Translations

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('auth.login');
  return <h1>{t('title')}</h1>;
}
```

---

## 🎨 Design System

### Brand Colors

```css
/* Primary - Indigo */
--primary-700: #6D28D9;
--primary-800: #5B21B6;

/* Accent - Gold */
--accent-500: #F59E0B;
--accent-600: #D97706;
```

### Custom Classes

```css
.bg-inaya-gradient     /* Indigo → Gold gradient background */
.text-inaya-gradient   /* Indigo → Gold gradient text */
.shadow-inaya          /* iNAYA brand shadow */
.glass                 /* Glassmorphism effect */
```

---

## 🚢 Deployment

### Environment Variables

Set these in your production environment:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

### Build & Deploy

```bash
# Build
npm run build

# Start production server
npm start
```

### Database Migration (Production)

```bash
npx prisma migrate deploy
```

### Recommended Hosting

- **Frontend**: Vercel, Netlify, or Railway
- **Database**: Supabase, Railway, or Neon (PostgreSQL)

---

## 📝 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | Sign in (credentials/OAuth) |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/csrf` | Get CSRF token |

### Protected Routes

- `/dashboard` - Main dashboard
- `/profile` - User profile management
- `/settings` - Application settings
- `/users-management` - Admin user management (ADMIN only)
- `/audit-log` - System audit logs (MODERATOR+)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Auth.js v5 (NextAuth.js)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **i18n**: next-intl

---

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Auth.js Documentation](https://authjs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Authentication by [Auth.js](https://authjs.dev)
- Database ORM by [Prisma](https://prisma.io)
- UI inspired by [shadcn/ui](https://ui.shadcn.com)

---

## 📞 Support

For support, email **support@inaya-auth.com** or join our Discord channel.

---

<div align="center">

**Made with ❤️ by [iNAYA TechLab](https://github.com/iNAYATechLab)**

⭐ Star this repo if you find it helpful!

</div>
