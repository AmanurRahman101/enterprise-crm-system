import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingUsersStatus() {
  try {
    console.log('🔄 Updating existing users status...');

    // Update all users to APPROVED status (since this is for existing users before approval system)
    const result = await prisma.user.updateMany({
      data: {
        status: 'APPROVED' as any
      }
    });

    console.log(`✅ Updated ${result.count} existing user(s) to APPROVED status`);

    console.log('\n🎉 User status update completed!');
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingUsersStatus()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
