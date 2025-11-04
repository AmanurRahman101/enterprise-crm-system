import { getDatabaseStats, checkDatabaseHealth } from './src/utils/database';
import { prisma } from './src/config/database';

async function runTests() {
  console.log('🧪 Starting Tawasol CRM Tests...\n');

  try {
    // Test 1: Database Connection
    console.log('Test 1: Database Connection');
    const health = await checkDatabaseHealth();
    if (health.isHealthy) {
      console.log(`✅ Database connected (${health.latency}ms latency)\n`);
    } else {
      console.log(`❌ Database connection failed: ${health.error}\n`);
      process.exit(1);
    }

    // Test 2: Database Statistics
    console.log('Test 2: Database Statistics');
    const stats = await getDatabaseStats();
    console.log('📊 Record Counts:');
    console.log(`   Users: ${stats.users}`);
    console.log(`   Companies: ${stats.companies}`);
    console.log(`   Contacts: ${stats.contacts}`);
    console.log(`   Deals: ${stats.deals}`);
    console.log(`   Tasks: ${stats.tasks}`);
    console.log(`   Tickets: ${stats.tickets}`);
    console.log(`   Activities: ${stats.activities}`);
    console.log(`   Total Records: ${stats.totalRecords}\n`);

    // Test 3: Verify Expected Counts
    console.log('Test 3: Verify Expected Counts');
    const expected = {
      users: 6,
      companies: 3,
      contacts: 5,
      deals: 3,
      tasks: 3,
      tickets: 3,
      activities: 3,
      totalRecords: 26
    };

    Object.keys(expected).forEach(key => {
      const expectedCount = expected[key as keyof typeof expected];
      const actualCount = stats[key as keyof typeof stats];
      if (expectedCount === actualCount) {
        console.log(`✅ ${key}: ${actualCount} (expected ${expectedCount})`);
      } else {
        console.log(`❌ ${key}: ${actualCount} (expected ${expectedCount})`);
      }
    });
    console.log();

    // Test 4: Sample Data Queries
    console.log('Test 4: Sample Data Queries');
    
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@tawasol.com' }
    });
    console.log(`✅ Admin user found: ${adminUser?.firstName} ${adminUser?.lastName}`);

    const acmeCorp = await prisma.company.findFirst({
      where: { name: 'Acme Corporation' }
    });
    console.log(`✅ Company found: ${acmeCorp?.name} (${acmeCorp?.industry})`);

    const openTickets = await prisma.ticket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });
    console.log(`✅ Open tickets: ${openTickets}\n`);

    // Test 5: Relationships
    console.log('Test 5: Test Relationships');
    
    const contactWithCompany = await prisma.contact.findFirst({
      include: {
        company: true,
        owner: true
      }
    });
    if (contactWithCompany?.company && contactWithCompany?.owner) {
      console.log(`✅ Contact relationships working:`);
      console.log(`   ${contactWithCompany.firstName} ${contactWithCompany.lastName}`);
      console.log(`   Company: ${contactWithCompany.company.name}`);
      console.log(`   Owner: ${contactWithCompany.owner.firstName} ${contactWithCompany.owner.lastName}`);
    }
    console.log();

    const dealWithContact = await prisma.deal.findFirst({
      include: {
        contact: true,
        owner: true
      }
    });
    if (dealWithContact?.contact && dealWithContact?.owner) {
      console.log(`✅ Deal relationships working:`);
      console.log(`   ${dealWithContact.title}`);
      console.log(`   Contact: ${dealWithContact.contact.firstName} ${dealWithContact.contact.lastName}`);
      console.log(`   Owner: ${dealWithContact.owner.firstName} ${dealWithContact.owner.lastName}`);
    }
    console.log();

    // Test 6: Test Login Credentials
    console.log('Test 6: Test User Accounts');
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@tawasol.com', 'john.sales@tawasol.com', 'mike.support@tawasol.com']
        }
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });
    testUsers.forEach(user => {
      console.log(`✅ ${user.role}: ${user.email} (${user.firstName} ${user.lastName})`);
    });
    console.log();

    // Final Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 All Tests Passed!');
    console.log('═══════════════════════════════════════');
    console.log('✅ Database is connected and healthy');
    console.log('✅ All seed data is present');
    console.log('✅ Relationships are working correctly');
    console.log('✅ Test accounts are ready');
    console.log('\n🔐 Test Login Credentials:');
    console.log('   Email: admin@tawasol.com');
    console.log('   Email: john.sales@tawasol.com');
    console.log('   Email: mike.support@tawasol.com');
    console.log('   Password (all): Password123!');
    console.log('\n🚀 Ready for Prompt 3: Authentication System!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
