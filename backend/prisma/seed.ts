import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

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
  }

  // Seed Users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  await prisma.user.create({
    data: {
      email: 'admin@tawasol.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const salesManager = await prisma.user.create({
    data: {
      email: 'manager@tawasol.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Manager',
      role: 'MANAGER',
      isActive: true,
    },
  });

  const salesRep1 = await prisma.user.create({
    data: {
      email: 'john.sales@tawasol.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Sales',
      role: 'SALES',
      isActive: true,
    },
  });

  const salesRep2 = await prisma.user.create({
    data: {
      email: 'emma.sales@tawasol.com',
      password: hashedPassword,
      firstName: 'Emma',
      lastName: 'Wilson',
      role: 'SALES',
      isActive: true,
    },
  });

  const supportAgent1 = await prisma.user.create({
    data: {
      email: 'mike.support@tawasol.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Support',
      role: 'SUPPORT',
      isActive: true,
    },
  });

  const supportAgent2 = await prisma.user.create({
    data: {
      email: 'lisa.support@tawasol.com',
      password: hashedPassword,
      firstName: 'Lisa',
      lastName: 'Chen',
      role: 'SUPPORT',
      isActive: true,
    },
  });

  console.log(`✅ Created ${6} users`);

  // Seed Companies
  console.log('🏢 Creating companies...');
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Acme Corporation',
        website: 'https://acmecorp.com',
        industry: 'Technology',
        size: '500-1000',
        phone: '+1-555-0100',
        email: 'contact@acmecorp.com',
        address: '123 Tech Street',
        city: 'San Francisco',
        country: 'USA',
        description: 'Leading enterprise software company',
      },
    }),
    prisma.company.create({
      data: {
        name: 'TechStart Inc',
        website: 'https://techstart.io',
        industry: 'SaaS',
        size: '50-200',
        phone: '+1-555-0200',
        email: 'hello@techstart.io',
        address: '456 Startup Ave',
        city: 'Austin',
        country: 'USA',
        description: 'Fast-growing SaaS startup',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Global Solutions Ltd',
        website: 'https://globalsolutions.co.uk',
        industry: 'Consulting',
        size: '1000+',
        phone: '+44-20-7123-4567',
        email: 'info@globalsolutions.co.uk',
        address: '789 Business Rd',
        city: 'London',
        country: 'UK',
        description: 'International business consulting firm',
      },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // Seed Contacts
  console.log('👥 Creating contacts...');
  const contacts = await Promise.all([
    // Acme Corporation contacts
    prisma.contact.create({
      data: {
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@acmecorp.com',
        phone: '+1-555-0101',
        mobile: '+1-555-0102',
        jobTitle: 'CTO',
        department: 'Technology',
        linkedinUrl: 'https://linkedin.com/in/robertjohnson',
        isCustomer: true,
        tags: ['key-account', 'decision-maker'],
        companyId: companies[0].id,
        ownerId: salesRep1.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Jennifer',
        lastName: 'Smith',
        email: 'jennifer.smith@acmecorp.com',
        phone: '+1-555-0103',
        jobTitle: 'VP of Sales',
        department: 'Sales',
        isCustomer: true,
        tags: ['champion'],
        companyId: companies[0].id,
        ownerId: salesRep1.id,
      },
    }),
    // TechStart contacts
    prisma.contact.create({
      data: {
        firstName: 'David',
        lastName: 'Lee',
        email: 'david.lee@techstart.io',
        phone: '+1-555-0201',
        mobile: '+1-555-0202',
        jobTitle: 'CEO',
        department: 'Executive',
        linkedinUrl: 'https://linkedin.com/in/davidlee',
        isCustomer: false,
        tags: ['prospect', 'hot-lead'],
        companyId: companies[1].id,
        ownerId: salesRep2.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@techstart.io',
        phone: '+1-555-0203',
        jobTitle: 'Product Manager',
        department: 'Product',
        isCustomer: false,
        tags: ['influencer'],
        companyId: companies[1].id,
        ownerId: salesRep2.id,
      },
    }),
    // Global Solutions contacts
    prisma.contact.create({
      data: {
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@globalsolutions.co.uk',
        phone: '+44-20-7123-4568',
        jobTitle: 'Managing Director',
        department: 'Executive',
        city: 'London',
        country: 'UK',
        timezone: 'Europe/London',
        isCustomer: true,
        tags: ['enterprise', 'key-account'],
        companyId: companies[2].id,
        ownerId: salesRep1.id,
      },
    }),
  ]);

  console.log(`✅ Created ${contacts.length} contacts`);

  // Seed Deals
  console.log('💼 Creating deals...');
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: 'Acme Corp - Enterprise License Renewal',
        value: 150000,
        currency: 'USD',
        stage: 'NEGOTIATION',
        probability: 80,
        priority: 'HIGH',
        source: 'Renewal',
        description: 'Annual enterprise license renewal with potential upsell',
        expectedCloseDate: new Date('2025-12-31'),
        contactId: contacts[0].id,
        companyId: companies[0].id,
        ownerId: salesRep1.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'TechStart - New Implementation',
        value: 45000,
        currency: 'USD',
        stage: 'PROPOSAL',
        probability: 60,
        priority: 'MEDIUM',
        source: 'Website',
        description: 'Initial implementation for growing startup',
        expectedCloseDate: new Date('2025-11-30'),
        contactId: contacts[2].id,
        companyId: companies[1].id,
        ownerId: salesRep2.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Global Solutions - Consulting Package',
        value: 250000,
        currency: 'GBP',
        stage: 'QUALIFIED',
        probability: 40,
        priority: 'HIGH',
        source: 'Referral',
        description: 'Large consulting engagement for digital transformation',
        expectedCloseDate: new Date('2026-02-28'),
        contactId: contacts[4].id,
        companyId: companies[2].id,
        ownerId: salesRep1.id,
      },
    }),
  ]);

  console.log(`✅ Created ${deals.length} deals`);

  // Seed Tasks
  console.log('📋 Creating tasks...');
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Follow up on contract terms',
        description: 'Review and discuss final contract terms with Robert',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2025-11-10'),
        contactId: contacts[0].id,
        dealId: deals[0].id,
        assigneeId: salesRep1.id,
        creatorId: salesManager.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Send proposal to TechStart',
        description: 'Prepare and send customized proposal based on discovery call',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2025-11-08'),
        contactId: contacts[2].id,
        dealId: deals[1].id,
        assigneeId: salesRep2.id,
        creatorId: salesRep2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Schedule demo with Global Solutions',
        description: 'Book product demonstration for key stakeholders',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2025-11-15'),
        contactId: contacts[4].id,
        dealId: deals[2].id,
        assigneeId: salesRep1.id,
        creatorId: salesRep1.id,
      },
    }),
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);

  // Seed Tickets
  console.log('🎫 Creating support tickets...');
  const tickets = await Promise.all([
    prisma.ticket.create({
      data: {
        subject: 'Login issues after password reset',
        description: 'User cannot login after resetting password. Getting error message.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        category: 'Technical',
        source: 'EMAIL',
        tags: ['authentication', 'urgent'],
        contactId: contacts[1].id,
        assigneeId: supportAgent1.id,
      },
    }),
    prisma.ticket.create({
      data: {
        subject: 'Feature request: Export to Excel',
        description: 'Customer requesting ability to export reports to Excel format',
        status: 'OPEN',
        priority: 'LOW',
        category: 'Feature Request',
        source: 'APP',
        tags: ['enhancement'],
        contactId: contacts[0].id,
        assigneeId: supportAgent2.id,
      },
    }),
    prisma.ticket.create({
      data: {
        subject: 'Billing inquiry about invoice',
        description: 'Question about recent invoice charges',
        status: 'PENDING',
        priority: 'MEDIUM',
        category: 'Billing',
        source: 'PHONE',
        tags: ['billing'],
        contactId: contacts[4].id,
        assigneeId: supportAgent1.id,
      },
    }),
  ]);

  console.log(`✅ Created ${tickets.length} tickets`);

  // Seed Activities
  console.log('📊 Creating activities...');
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        type: 'CALL',
        subject: 'Discovery call with Robert Johnson',
        description: 'Discussed renewal terms and potential expansion',
        duration: 45,
        outcome: 'Connected',
        contactId: contacts[0].id,
        dealId: deals[0].id,
        userId: salesRep1.id,
        occurredAt: new Date('2025-11-01T10:00:00Z'),
      },
    }),
    prisma.activity.create({
      data: {
        type: 'EMAIL',
        subject: 'Sent proposal to David Lee',
        description: 'Initial proposal for TechStart implementation',
        contactId: contacts[2].id,
        dealId: deals[1].id,
        userId: salesRep2.id,
        occurredAt: new Date('2025-11-02T14:30:00Z'),
      },
    }),
    prisma.activity.create({
      data: {
        type: 'MEETING',
        subject: 'Product demo for Acme Corp',
        description: 'Demonstrated new features to VP of Sales',
        duration: 60,
        contactId: contacts[1].id,
        dealId: deals[0].id,
        userId: salesRep1.id,
        occurredAt: new Date('2025-10-28T15:00:00Z'),
      },
    }),
  ]);

  console.log(`✅ Created ${activities.length} activities`);

  // Seed Notes
  console.log('📝 Creating notes...');
  const notes = await Promise.all([
    prisma.note.create({
      data: {
        content: 'Robert is very interested in the new AI features. This could be a key differentiator for the renewal.',
        contactId: contacts[0].id,
        dealId: deals[0].id,
        authorId: salesRep1.id,
      },
    }),
    prisma.note.create({
      data: {
        content: 'David mentioned they are also evaluating two competitors. Need to emphasize our superior support.',
        contactId: contacts[2].id,
        dealId: deals[1].id,
        authorId: salesRep2.id,
      },
    }),
    prisma.note.create({
      data: {
        content: 'Customer reported issue was resolved by clearing browser cache. Advised on best practices.',
        contactId: contacts[1].id,
        ticketId: tickets[0].id,
        authorId: supportAgent1.id,
      },
    }),
  ]);

  console.log(`✅ Created ${notes.length} notes`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${6}`);
  console.log(`   - Companies: ${companies.length}`);
  console.log(`   - Contacts: ${contacts.length}`);
  console.log(`   - Deals: ${deals.length}`);
  console.log(`   - Tasks: ${tasks.length}`);
  console.log(`   - Tickets: ${tickets.length}`);
  console.log(`   - Activities: ${activities.length}`);
  console.log(`   - Notes: ${notes.length}`);
  console.log('\n🔐 Test Login Credentials:');
  console.log('   Email: admin@tawasol.com | Password: Password123!');
  console.log('   Email: john.sales@tawasol.com | Password: Password123!');
  console.log('   Email: mike.support@tawasol.com | Password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

