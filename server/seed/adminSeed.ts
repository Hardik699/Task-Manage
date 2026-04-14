import { User } from '../models/User';
import { connectDB } from '../config/db';

export async function seedAdmin() {
  try {
    await connectDB();

    const adminUsername = process.env.ADMIN_USERNAME || 'masteradmin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fintask.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe@123456';

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [{ username: adminUsername }, { role: 'superadmin' }],
    });

    if (existingAdmin) {
      console.log('✓ Master admin already exists');
      return;
    }

    // Create master admin
    const admin = await User.create({
      name: 'Master Admin',
      username: adminUsername,
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'superadmin',
      telegramLinked: false,
      notificationPrefs: {
        tasks: true,
        payments: true,
        policies: true,
        monthlyReport: true,
      },
    });

    console.log('✓ Master admin created successfully');
    console.log(`  Username: ${adminUsername}`);
    console.log(`  Email: ${adminEmail}`);
    console.log('  ⚠️  IMPORTANT: Change the default password immediately!');
  } catch (error) {
    console.error('✗ Error seeding admin:', error);
    throw error;
  }
}

// Note: Seed is called from server/node-build.ts in production
// Uncomment below to run seed manually: node server/seed/adminSeed.ts
/*
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin()
    .then(() => {
      console.log('\n✓ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Seed failed:', error);
      process.exit(1);
    });
}
*/
