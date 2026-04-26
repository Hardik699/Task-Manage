import { User } from '../models/User';
import { connectDB } from '../config/db';

async function manageUserRole(email: string, role: 'user' | 'superadmin') {
  try {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      return;
    }

    if (user.role === role) {
      console.log(`✅ User "${email}" already has role: ${role}`);
      return;
    }

    const previousRole = user.role;
    await User.findByIdAndUpdate(user._id, { role });

    console.log(`✅ Successfully updated user role`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Previous role: ${previousRole}`);
    console.log(`   New role: ${role}`);

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    throw error;
  }
}

// Parse command line arguments
const email = process.argv[2];
const role = process.argv[3] as 'user' | 'superadmin';

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npm run manage-user-role <email> <role>');
  console.log('Example: npm run manage-user-role ardikmachhi@gmail.com superadmin');
  process.exit(1);
}

if (!role || !['user', 'superadmin'].includes(role)) {
  console.error('❌ Please provide a valid role: "user" or "superadmin"');
  console.log('Usage: npm run manage-user-role <email> <role>');
  console.log('Example: npm run manage-user-role ardikmachhi@gmail.com superadmin');
  process.exit(1);
}

manageUserRole(email, role)
  .then(() => {
    console.log('\n✅ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Operation failed:', error);
    process.exit(1);
  });