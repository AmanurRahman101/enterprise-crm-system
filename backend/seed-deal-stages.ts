import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultStages = [
  { name: 'Lead', color: '#64748b', probability: 10, order: 1, isDefault: true },
  { name: 'Qualified', color: '#3b82f6', probability: 25, order: 2 },
  { name: 'Proposal', color: '#8b5cf6', probability: 50, order: 3 },
  { name: 'Negotiation', color: '#f59e0b', probability: 75, order: 4 },
  { name: 'Won', color: '#10b981', probability: 100, order: 5, isWon: true },
  { name: 'Lost', color: '#ef4444', probability: 0, order: 6, isLost: true },
];

async function seedDealStages() {
  try {
    console.log('🌱 Seeding deal stages...');

    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
    });

    console.log(`📦 Found ${tenants.length} active tenant(s)`);

    for (const tenant of tenants) {
      console.log(`\n🏢 Processing tenant: ${tenant.name} (${tenant.subdomain})`);

      // Check if tenant already has stages
      const existingStages = await prisma.dealStage.findMany({
        where: { tenantId: tenant.id },
      });

      if (existingStages.length > 0) {
        console.log(`⏭️  Tenant already has ${existingStages.length} stage(s). Skipping...`);
        continue;
      }

      // Create default stages for this tenant
      for (const stage of defaultStages) {
        const created = await prisma.dealStage.create({
          data: {
            tenantId: tenant.id,
            name: stage.name,
            color: stage.color,
            probability: stage.probability,
            order: stage.order,
            isDefault: stage.isDefault || false,
            isWon: stage.isWon || false,
            isLost: stage.isLost || false,
            isActive: true,
          },
        });
        console.log(`  ✅ Created stage: ${created.name}`);
      }

      console.log(`✨ Created ${defaultStages.length} stages for ${tenant.name}`);
    }

    console.log('\n🎉 Deal stages seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding deal stages:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDealStages()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
