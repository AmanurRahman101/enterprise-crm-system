import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTenant() {
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants in database:', tenants);
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found! Run: npm run prisma:seed');
    } else {
      console.log(`✅ Found ${tenants.length} tenant(s)`);
    }
  } catch (error) {
    console.error('Error checking tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenant();
