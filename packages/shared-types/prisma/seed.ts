import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data (optional - remove in production)
  await prisma.orderItem.deleteMany();
  await prisma.orderRestaurantFee.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.jastipOverride.deleteMany();
  await prisma.jastipRuleTier.deleteMany();
  await prisma.jastipRuleTenant.deleteMany();
  await prisma.jastipRuleGlobal.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // ============================================
  // GLOBAL JASTIP RULE
  // ============================================
  const globalRule = await prisma.jastipRuleGlobal.create({
    data: {
      type: 'PER_MULTIPLE',
      multiple: 6,
      fee: 15000,
      appliesTo: 'INCLUDE_JASTIP',
      minOrderQty: 1,
      isActive: true,
    },
  });
  console.log('✅ Global jastip rule created:', globalRule.id);

  // ============================================
  // TENANTS
  // ============================================
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'Toko A - Titip Makanan',
      slug: 'toko-a',
      domain: 'toko-a.jastip.com',
      settings: JSON.stringify({ theme: 'blue', currency: 'IDR' }),
      isActive: true,
    },
  });

  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Toko B - Jastip Sehat',
      slug: 'toko-b',
      domain: 'toko-b.jastip.com',
      settings: JSON.stringify({ theme: 'green', currency: 'IDR' }),
      isActive: true,
    },
  });
  console.log('✅ Tenants created:', tenantA.name, tenantB.name);

  // ============================================
  // TENANT-SPECIFIC JASTIP RULES (Override global)
  // ============================================
  await prisma.jastipRuleTenant.create({
    data: {
      tenantId: tenantA.id,
      useGlobalRule: true, // Use global rule
    },
  });

  await prisma.jastipRuleTenant.create({
    data: {
      tenantId: tenantB.id,
      type: 'PER_UNIT',
      fee: 3000,
      appliesTo: 'INCLUDE_JASTIP',
      useGlobalRule: false, // Override global
    },
  });
  console.log('✅ Tenant jastip rules created');

  // ============================================
  // USERS
  // ============================================
  const passwordHash = await bcrypt.hash('password123', 12);

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@jastip.com',
      passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      tenantId: tenantA.id, // Assign to first tenant for login
    },
  });

  // Admin Tenant A
  const adminA = await prisma.user.create({
    data: {
      email: 'admin@toko-a.com',
      passwordHash,
      name: 'Admin Toko A',
      role: 'ADMIN_TENANT',
      tenantId: tenantA.id,
    },
  });

  // Staff Tenant A
  const staffA = await prisma.user.create({
    data: {
      email: 'staff@toko-a.com',
      passwordHash,
      name: 'Staff Toko A',
      role: 'STAFF',
      tenantId: tenantA.id,
    },
  });

  // Admin Tenant B
  const adminB = await prisma.user.create({
    data: {
      email: 'admin@toko-b.com',
      passwordHash,
      name: 'Admin Toko B',
      role: 'ADMIN_TENANT',
      tenantId: tenantB.id,
    },
  });

  // Staff Tenant B
  const staffB = await prisma.user.create({
    data: {
      email: 'staff@toko-b.com',
      passwordHash,
      name: 'Staff Toko B',
      role: 'STAFF',
      tenantId: tenantB.id,
    },
  });
  console.log('✅ Users created:', { superAdmin, adminA, staffA, adminB, staffB });

  // ============================================
  // RESTAURANTS - Tenant A
  // ============================================
  const restA1 = await prisma.restaurant.create({
    data: {
      name: 'Warung Makan Sederhana',
      jastipFee: 2000,
      multiple: 1,
      taxService: 5,
      taxCharge: 10,
      isActive: true,
      tenantId: tenantA.id,
    },
  });

  const restA2 = await prisma.restaurant.create({
    data: {
      name: 'Bakso Pak Kumis',
      jastipFee: 3000,
      multiple: 1,
      taxService: 0,
      taxCharge: 0,
      isActive: true,
      tenantId: tenantA.id,
    },
  });

  // ============================================
  // RESTAURANTS - Tenant B
  // ============================================
  const restB1 = await prisma.restaurant.create({
    data: {
      name: 'Nasi Goreng Bu Siti',
      jastipFee: 2500,
      multiple: 1,
      taxService: 10,
      taxCharge: 5,
      isActive: true,
      tenantId: tenantB.id,
    },
  });

  const restB2 = await prisma.restaurant.create({
    data: {
      name: 'Sate Pak Budi',
      jastipFee: 4000,
      multiple: 2,
      taxService: 0,
      taxCharge: 0,
      isActive: true,
      tenantId: tenantB.id,
    },
  });
  console.log('✅ Restaurants created');

  // ============================================
  // MENU CATEGORIES
  // ============================================
  const categoriesA = await Promise.all([
    prisma.menuCategory.create({ data: { name: 'Makanan', tenantId: tenantA.id, sortOrder: 1 } }),
    prisma.menuCategory.create({ data: { name: 'Minuman', tenantId: tenantA.id, sortOrder: 2 } }),
    prisma.menuCategory.create({ data: { name: 'Snack', tenantId: tenantA.id, sortOrder: 3 } }),
  ]);

  const categoriesB = await Promise.all([
    prisma.menuCategory.create({ data: { name: 'Nasi & Mie', tenantId: tenantB.id, sortOrder: 1 } }),
    prisma.menuCategory.create({ data: { name: 'Minuman', tenantId: tenantB.id, sortOrder: 2 } }),
    prisma.menuCategory.create({ data: { name: 'Lauk', tenantId: tenantB.id, sortOrder: 3 } }),
  ]);
  console.log('✅ Menu categories created');

  // ============================================
  // MENU ITEMS - Tenant A
  // ============================================
  const menuItemsA = [
    // Warung Makan Sederhana
    { restaurantId: restA1.id, externalId: 'm1', name: 'Nasi Goreng Spesial', description: 'Nasi goreng + telur + ayam', price: 18000, category: 'Makanan', includeJastip: true, isAvailable: true, sortOrder: 1 },
    { restaurantId: restA1.id, externalId: 'm2', name: 'Mie Goreng', description: 'Mie goreng simple', price: 15000, category: 'Makanan', includeJastip: true, isAvailable: true, sortOrder: 2 },
    { restaurantId: restA1.id, externalId: 'm3', name: 'Nasi Uduk', description: 'Nasi uduk lengkap', price: 16000, category: 'Makanan', includeJastip: true, isAvailable: true, sortOrder: 3 },
    { restaurantId: restA1.id, externalId: 'm4', name: 'Es Teh Manis', description: 'Es teh manis segar', price: 4000, category: 'Minuman', includeJastip: false, isAvailable: true, sortOrder: 1 },
    { restaurantId: restA1.id, externalId: 'm5', name: 'Es Jeruk', description: 'Es jeruk peras', price: 6000, category: 'Minuman', includeJastip: false, isAvailable: true, sortOrder: 2 },

    // Bakso Pak Kumis
    { restaurantId: restA2.id, externalId: 'm6', name: 'Bakso Urat', description: 'Bakso urat + mie', price: 20000, category: 'Makanan', includeJastip: true, isAvailable: true, sortOrder: 1 },
    { restaurantId: restA2.id, externalId: 'm7', name: 'Bakso Beranak', description: 'Bakso beranak isi 5', price: 22000, category: 'Makanan', includeJastip: true, isAvailable: true, sortOrder: 2 },
    { restaurantId: restA2.id, externalId: 'm8', name: 'Es Campur', description: 'Es campur segar', price: 8000, category: 'Minuman', includeJastip: false, isAvailable: true, sortOrder: 1 },
  ];

  await Promise.all(
    menuItemsA.map((item, i) =>
      prisma.menuItem.create({
        data: { ...item, tenantId: tenantA.id, addons: '[]', jastipFeeSpecial: null },
      })
    )
  );

  // ============================================
  // MENU ITEMS - Tenant B
  // ============================================
  const menuItemsB = [
    // Nasi Goreng Bu Siti
    { restaurantId: restB1.id, externalId: 'm9', name: 'Nasi Goreng Gila', description: 'Nasi goreng + sosis + bakso + telur', price: 22000, category: 'Nasi & Mie', includeJastip: true, isAvailable: true, sortOrder: 1 },
    { restaurantId: restB1.id, externalId: 'm10', name: 'Mie Goreng Jawa', description: 'Mie goreng jawa authentic', price: 18000, category: 'Nasi & Mie', includeJastip: true, isAvailable: true, sortOrder: 2 },
    { restaurantId: restB1.id, externalId: 'm11', name: 'Kwetiau Goreng', description: 'Kwetiau goreng seafood', price: 25000, category: 'Nasi & Mie', includeJastip: true, isAvailable: true, sortOrder: 3 },
    { restaurantId: restB1.id, externalId: 'm12', name: 'Es Teh Tawar', description: 'Es teh tawar', price: 3000, category: 'Minuman', includeJastip: false, isAvailable: true, sortOrder: 1 },
    { restaurantId: restB1.id, externalId: 'm13', name: 'Jus Alpukat', description: 'Jus alpukat premium', price: 12000, category: 'Minuman', includeJastip: false, isAvailable: true, sortOrder: 2 },

    // Sate Pak Budi
    { restaurantId: restB2.id, externalId: 'm14', name: 'Sate Ayam', description: 'Sate ayam 10 tusuk', price: 30000, category: 'Lauk', includeJastip: true, isAvailable: true, sortOrder: 1 },
    { restaurantId: restB2.id, externalId: 'm15', name: 'Sate Kambing', description: 'Sate kambing 10 tusuk', price: 40000, category: 'Lauk', includeJastip: true, isAvailable: true, sortOrder: 2 },
    { restaurantId: restB2.id, externalId: 'm16', name: 'Lontong', description: 'Lontong sayur', price: 8000, category: 'Lauk', includeJastip: true, isAvailable: true, sortOrder: 3 },
    { restaurantId: restB2.id, externalId: 'm17', name: 'Es Kelapa', description: 'Es kelapa muda', price: 10000, category: 'Minuman', includeJastip: false, isAvailable: true, sortOrder: 1 },
  ];

  await Promise.all(
    menuItemsB.map((item) =>
      prisma.menuItem.create({
        data: { ...item, tenantId: tenantB.id, addons: '[]', jastipFeeSpecial: null },
      })
    )
  );
  console.log('✅ Menu items created');

  // ============================================
  // CUSTOMERS
  // ============================================
  const customersA = await Promise.all([
    prisma.customer.create({ data: { name: 'Budi Santoso', phone: '081234567890', email: 'budi@email.com', tenantId: tenantA.id } }),
    prisma.customer.create({ data: { name: 'Siti Rahayu', phone: '081234567891', email: 'siti@email.com', tenantId: tenantA.id } }),
    prisma.customer.create({ data: { name: 'Ahmad Wijaya', phone: '081234567892', tenantId: tenantA.id } }),
  ]);

  const customersB = await Promise.all([
    prisma.customer.create({ data: { name: 'Dewi Lestari', phone: '081234567893', email: 'dewi@email.com', tenantId: tenantB.id } }),
    prisma.customer.create({ data: { name: 'Rudi Hermawan', phone: '081234567894', tenantId: tenantB.id } }),
  ]);
  console.log('✅ Customers created');

  // ============================================
  // SETTINGS PER TENANT
  // ============================================
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      tenantId: tenantA.id,
      shopName: 'Titip Makanan Toko A',
      tagline: 'Jasa Titip Makanan Terpercaya',
      bankAccounts: JSON.stringify([
        { bank: 'BCA', number: '1234567890', name: 'Toko A' },
        { bank: 'Mandiri', number: '0987654321', name: 'Toko A' },
      ]),
    },
  });

  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      tenantId: tenantB.id,
      shopName: 'Jastip Sehat Toko B',
      tagline: 'Makanan Sehat di Antar',
      bankAccounts: JSON.stringify([
        { bank: 'BNI', number: '1122334455', name: 'Toko B' },
      ]),
    },
  });
  console.log('✅ Settings created');

  // ============================================
  // SAMPLE ORDERS
  // ============================================
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Order for Tenant A
  const orderA1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-001`,
      customerId: customersA[0].id,
      customerName: customersA[0].name,
      status: 'DELIVERED',
      subtotal: 36000,
      jastipFeeTotal: 15000,
      taxServiceTotal: 1800,
      taxChargeTotal: 3600,
      grandTotal: 56400,
      ongkir: 10000,
      destination: 'Jl. Sudirman No. 123',
      paymentStatus: 'PAID',
      tenantId: tenantA.id,
      createdAt: yesterday,
      updatedAt: yesterday,
      items: {
        create: [
          { name: 'Nasi Goreng Spesial', price: 18000, quantity: 1, category: 'Makanan', includeJastip: true, subtotal: 18000, isManual: false },
          { name: 'Mie Goreng', price: 18000, quantity: 1, category: 'Makanan', includeJastip: true, subtotal: 18000, isManual: false },
        ],
      },
      restaurantFees: {
        create: [
          {
            restaurantId: restA1.id,
            restaurantName: restA1.name,
            subtotal: 36000,
            subtotalTaxable: 36000,
            subtotalNonTax: 0,
            calculatedFee: 15000,
            finalFee: 15000,
            taxServiceAmount: 1800,
            taxChargeAmount: 3600,
            total: 56400,
            totalQuantity: 2,
            qtyIncludeJastip: 2,
            multiple: 1,
            batches: 1,
            hasMultipleWarning: false,
          },
        ],
      },
    },
  });

  // Order for Tenant B
  await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-002`,
      customerId: customersB[0].id,
      customerName: customersB[0].name,
      status: 'CONFIRMED',
      subtotal: 55000,
      jastipFeeTotal: 6000,
      taxServiceTotal: 5500,
      taxChargeTotal: 2750,
      grandTotal: 69250,
      ongkir: 0,
      paymentStatus: 'UNPAID',
      tenantId: tenantB.id,
      createdAt: now,
      updatedAt: now,
      items: {
        create: [
          { name: 'Nasi Goreng Gila', price: 22000, quantity: 1, category: 'Nasi & Mie', includeJastip: true, subtotal: 22000, isManual: false },
          { name: 'Jus Alpukat', price: 12000, quantity: 1, category: 'Minuman', includeJastip: false, subtotal: 12000, isManual: false },
          { name: 'Sate Ayam', price: 30000, quantity: 1, category: 'Lauk', includeJastip: true, subtotal: 30000, isManual: false },
        ],
      },
      restaurantFees: {
        create: [
          {
            restaurantId: restB1.id,
            restaurantName: restB1.name,
            subtotal: 34000,
            subtotalTaxable: 34000,
            subtotalNonTax: 0,
            calculatedFee: 3000,
            finalFee: 3000,
            taxServiceAmount: 3400,
            taxChargeAmount: 1700,
            total: 42100,
            totalQuantity: 2,
            qtyIncludeJastip: 1,
            multiple: 1,
            batches: 1,
            hasMultipleWarning: false,
          },
          {
            restaurantId: restB2.id,
            restaurantName: restB2.name,
            subtotal: 30000,
            subtotalTaxable: 30000,
            subtotalNonTax: 0,
            calculatedFee: 3000,
            finalFee: 3000,
            taxServiceAmount: 2100,
            taxChargeAmount: 1050,
            total: 36150,
            totalQuantity: 1,
            qtyIncludeJastip: 1,
            multiple: 2,
            batches: 1,
            hasMultipleWarning: false,
          },
        ],
      },
    },
  });
  console.log('✅ Sample orders created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Login credentials (all passwords: password123):');
  console.log('  Super Admin: admin@jastip.com');
  console.log('  Admin Toko A: admin@toko-a.com');
  console.log('  Staff Toko A: staff@toko-a.com');
  console.log('  Admin Toko B: admin@toko-b.com');
  console.log('  Staff Toko B: staff@toko-b.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });