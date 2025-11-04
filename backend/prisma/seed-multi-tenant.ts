import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting multi-tenant database seed...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.note.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.deal.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
  }

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create Tenant 1 (Acme Corporation)
  console.log('🏢 Creating Tenant 1: Acme Corporation...');
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Acme Corporation',
      subdomain: 'acme',
      email: 'admin@acme.com',
      phone: '+1-555-0100',
      timezone: 'America/New_York',
      isActive: true,
    },
  });

  // Create users for Tenant 1
  const tenant1Admin = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'admin@tawasol.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const tenant1Sales = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'john.sales@tawasol.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Sales',
      role: 'SALES',
    },
  });

  const tenant1Support = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'mike.support@tawasol.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Support',
      role: 'SUPPORT',
    },
  });

  // Create companies for Tenant 1
  const tenant1Company1 = await prisma.company.create({
    data: {
      tenantId: tenant1.id,
      name: 'TechCorp Inc',
      website: 'https://techcorp.com',
      industry: 'Technology',
      size: '100-500',
      email: 'contact@techcorp.com',
      city: 'San Francisco',
      country: 'USA',
    },
  });

  const tenant1Company2 = await prisma.company.create({
    data: {
      tenantId: tenant1.id,
      name: 'StartUp Solutions',
      website: 'https://startupsolutions.io',
      industry: 'SaaS',
      size: '10-50',
      email: 'hello@startupsolutions.io',
      city: 'Austin',
      country: 'USA',
    },
  });

  // Create contacts for Tenant 1
  const tenant1Contact1 = await prisma.contact.create({
    data: {
      tenantId: tenant1.id,
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'robert.johnson@techcorp.com',
      phone: '+1-555-0301',
      jobTitle: 'CEO',
      companyId: tenant1Company1.id,
      ownerId: tenant1Sales.id,
    },
  });

  await prisma.contact.create({
    data: {
      tenantId: tenant1.id,
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.w@startupsolutions.io',
      phone: '+1-555-0302',
      jobTitle: 'CTO',
      companyId: tenant1Company2.id,
      ownerId: tenant1Sales.id,
    },
  });

  // Create deals for Tenant 1
  await prisma.deal.create({
    data: {
      tenantId: tenant1.id,
      title: 'Enterprise License - TechCorp',
      value: 50000,
      stage: 'PROPOSAL',
      contactId: tenant1Contact1.id,
      companyId: tenant1Company1.id,
      ownerId: tenant1Sales.id,
      expectedCloseDate: new Date('2025-12-31'),
    },
  });

  // Create tasks for Tenant 1
  await prisma.task.create({
    data: {
      tenantId: tenant1.id,
      title: 'Follow up with Robert',
      description: 'Discuss enterprise license terms',
      status: 'TODO',
      priority: 'HIGH',
      contactId: tenant1Contact1.id,
      assigneeId: tenant1Sales.id,
      creatorId: tenant1Admin.id,
      dueDate: new Date('2025-11-10'),
    },
  });

  // Create tickets for Tenant 1
  await prisma.ticket.create({
    data: {
      tenantId: tenant1.id,
      subject: 'Login Issue',
      description: 'Cannot access dashboard',
      status: 'OPEN',
      priority: 'HIGH',
      contactId: tenant1Contact1.id,
      assigneeId: tenant1Support.id,
    },
  });

  // Create activity for Tenant 1
  await prisma.activity.create({
    data: {
      tenantId: tenant1.id,
      type: 'CALL',
      subject: 'Discovery call with Robert',
      description: 'Discussed enterprise needs',
      duration: 45,
      contactId: tenant1Contact1.id,
      userId: tenant1Sales.id,
    },
  });

  // Create note for Tenant 1
  await prisma.note.create({
    data: {
      tenantId: tenant1.id,
      content: 'Very interested in our enterprise features',
      contactId: tenant1Contact1.id,
      authorId: tenant1Sales.id,
    },
  });

  console.log(`✅ Tenant 1 (Acme): 3 users, 2 companies, 2 contacts, 1 deal, 1 task, 1 ticket, 1 activity, 1 note`);

  // Create Tenant 2 (TechStart Inc)
  console.log('🏢 Creating Tenant 2: TechStart Inc...');
  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'TechStart Inc',
      subdomain: 'techstart',
      email: 'admin@techstart.com',
      phone: '+1-555-0200',
      timezone: 'America/Los_Angeles',
      isActive: true,
    },
  });

  // Create users for Tenant 2
  await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      email: 'admin@techstart.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  const tenant2Sales = await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      email: 'bob.sales@techstart.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Seller',
      role: 'SALES',
    },
  });

  // Create companies for Tenant 2
  const tenant2Company1 = await prisma.company.create({
    data: {
      tenantId: tenant2.id,
      name: 'Digital Innovations',
      website: 'https://digitalinnovations.com',
      industry: 'Consulting',
      size: '50-100',
      email: 'info@digitalinnovations.com',
      city: 'Seattle',
      country: 'USA',
    },
  });

  // Create contacts for Tenant 2
  const tenant2Contact1 = await prisma.contact.create({
    data: {
      tenantId: tenant2.id,
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.m@digitalinnovations.com',
      phone: '+1-555-0401',
      jobTitle: 'VP of Sales',
      companyId: tenant2Company1.id,
      ownerId: tenant2Sales.id,
    },
  });

  // Create deals for Tenant 2
  await prisma.deal.create({
    data: {
      tenantId: tenant2.id,
      title: 'Consulting Package',
      value: 25000,
      stage: 'QUALIFIED',
      contactId: tenant2Contact1.id,
      companyId: tenant2Company1.id,
      ownerId: tenant2Sales.id,
      expectedCloseDate: new Date('2025-11-30'),
    },
  });

  // Create activity for Tenant 2
  await prisma.activity.create({
    data: {
      tenantId: tenant2.id,
      type: 'EMAIL',
      subject: 'Sent proposal to David',
      description: 'Comprehensive consulting proposal',
      contactId: tenant2Contact1.id,
      userId: tenant2Sales.id,
    },
  });

  console.log(`✅ Tenant 2 (TechStart): 2 users, 1 company, 1 contact, 1 deal, 1 activity`);

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 Multi-tenant seed completed!');
  console.log('═══════════════════════════════════════');
  console.log('📊 Summary:');
  console.log('  - Tenants: 2');
  console.log('  - Total Users: 5');
  console.log('  - Total Companies: 3');
  console.log('  - Total Contacts: 3');
  console.log('  - Total Deals: 2');
  console.log('  - Total Activities: 2');
  console.log('\n🔐 Test Credentials:');
  console.log('  Tenant 1 (acme.tawasol.com):');
  console.log('    - admin@tawasol.com / Password123!');
  console.log('    - john.sales@tawasol.com / Password123!');
  console.log('  Tenant 2 (techstart.tawasol.com):');
  console.log('    - admin@techstart.com / Password123!');
  console.log('    - bob.sales@techstart.com / Password123!');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
