import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding default tenant...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'acme' },
    update: {},
    create: {
      name: 'Acme Corporation',
      subdomain: 'acme',
      email: 'admin@acme.com',
      phone: '+1234567890',
      timezone: 'UTC',
      isActive: true,
    },
  });

  console.log('✅ Default tenant created:', tenant);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
