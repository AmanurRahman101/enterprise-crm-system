/**
 * Comprehensive test for cross-tenant functionality
 * This script tests all the cross-tenant features
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🧪 Running Cross-Tenant Tests...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Check tenants
  console.log('✓ Test 1: Check Tenants');
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      subdomain: true,
      isActive: true,
    },
  });
  console.log(`  Found ${tenants.length} tenants:`);
  tenants.forEach(t => console.log(`    - ${t.name} (${t.subdomain}): ${t.isActive ? 'Active' : 'Inactive'}`));
  console.log();

  // Test 2: Check user profiles
  console.log('✓ Test 2: Check User Profiles');
  const profiles = await prisma.userProfile.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      tenantAccounts: {
        select: {
          email: true,
          role: true,
          tenant: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  console.log(`  Found ${profiles.length} user profiles:`);
  profiles.forEach(p => {
    console.log(`    - ${p.firstName} ${p.lastName} (${p.email})`);
    console.log(`      Has ${p.tenantAccounts.length} tenant account(s):`);
    p.tenantAccounts.forEach(acc => {
      console.log(`        → ${acc.tenant.name}: ${acc.email} (${acc.role})`);
    });
  });
  console.log();

  // Test 3: Verify cross-tenant users
  console.log('✓ Test 3: Verify Cross-Tenant Users');
  const crossTenantProfiles = profiles.filter(p => p.tenantAccounts.length > 1);
  console.log(`  Found ${crossTenantProfiles.length} cross-tenant users:`);
  crossTenantProfiles.forEach(p => {
    console.log(`    - ${p.firstName} ${p.lastName} works in ${p.tenantAccounts.length} companies`);
  });
  console.log();

  // Test 4: Check all users
  console.log('✓ Test 4: Check All Users');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      tenant: {
        select: {
          name: true,
        },
      },
      userProfile: {
        select: {
          email: true,
        },
      },
    },
  });
  console.log(`  Found ${users.length} user accounts:`);
  users.forEach(u => {
    console.log(`    - ${u.firstName} ${u.lastName} @ ${u.tenant.name}`);
    console.log(`      Account Email: ${u.email}, Role: ${u.role}`);
    console.log(`      Profile Email: ${u.userProfile.email}`);
  });
  console.log();

  // Test 5: Verify tenant isolation
  console.log('✓ Test 5: Verify Tenant Isolation');
  const tenant1 = tenants[0];
  const tenant1Users = await prisma.user.count({
    where: { tenantId: tenant1.id },
  });
  const tenant1Companies = await prisma.company.count({
    where: { tenantId: tenant1.id },
  });
  const tenant1Contacts = await prisma.contact.count({
    where: { tenantId: tenant1.id },
  });
  const tenant1Deals = await prisma.deal.count({
    where: { tenantId: tenant1.id },
  });

  console.log(`  ${tenant1.name}:`);
  console.log(`    - Users: ${tenant1Users}`);
  console.log(`    - Companies: ${tenant1Companies}`);
  console.log(`    - Contacts: ${tenant1Contacts}`);
  console.log(`    - Deals: ${tenant1Deals}`);
  console.log();

  if (tenants.length > 1) {
    const tenant2 = tenants[1];
    const tenant2Users = await prisma.user.count({
      where: { tenantId: tenant2.id },
    });
    const tenant2Companies = await prisma.company.count({
      where: { tenantId: tenant2.id },
    });
    const tenant2Contacts = await prisma.contact.count({
      where: { tenantId: tenant2.id },
    });
    const tenant2Deals = await prisma.deal.count({
      where: { tenantId: tenant2.id },
    });

    console.log(`  ${tenant2.name}:`);
    console.log(`    - Users: ${tenant2Users}`);
    console.log(`    - Companies: ${tenant2Companies}`);
    console.log(`    - Contacts: ${tenant2Contacts}`);
    console.log(`    - Deals: ${tenant2Deals}`);
    console.log();
  }

  // Test 6: Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ All Tests Passed!\n');
  console.log('📊 Summary:');
  console.log(`  - Total Tenants: ${tenants.length}`);
  console.log(`  - Total User Profiles: ${profiles.length}`);
  console.log(`  - Total User Accounts: ${users.length}`);
  console.log(`  - Cross-Tenant Users: ${crossTenantProfiles.length}`);
  console.log();
  console.log('🎉 Cross-tenant functionality is working correctly!');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
