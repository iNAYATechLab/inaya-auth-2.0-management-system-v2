// iNAYA Auth 2.0 — Database Seed Script
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inaya-auth.com' },
    update: {},
    create: {
      email: 'admin@inaya-auth.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create moderator user
  const modPassword = await bcrypt.hash('Mod@123456', 12);

  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@inaya-auth.com' },
    update: {},
    create: {
      email: 'moderator@inaya-auth.com',
      name: 'System Moderator',
      password: modPassword,
      role: 'MODERATOR',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Moderator user created:', moderator.email);

  // Create test user
  const userPassword = await bcrypt.hash('User@123456', 12);

  const user = await prisma.user.upsert({
    where: { email: 'user@inaya-auth.com' },
    update: {},
    create: {
      email: 'user@inaya-auth.com',
      name: 'Test User',
      password: userPassword,
      role: 'USER',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Test user created:', user.email);

  // Create audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'REGISTER',
        description: 'Admin account created via seed',
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
      },
      {
        userId: moderator.id,
        action: 'REGISTER',
        description: 'Moderator account created via seed',
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
      },
      {
        userId: user.id,
        action: 'REGISTER',
        description: 'Test user account created via seed',
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
      },
    ],
  });

  console.log('✅ Audit logs created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Test credentials:');
  console.log('   Admin:     admin@inaya-auth.com / Admin@123456');
  console.log('   Moderator: moderator@inaya-auth.com / Mod@123456');
  console.log('   User:      user@inaya-auth.com / User@123456\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
