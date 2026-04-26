import { User } from '../models/User';
import { connectDB } from '../config/db';

async function makeUserAdmin(email: string) {
  try {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      return;
    }

    if (user.role === 'superadmin') {
      console.log(`✅ User "${email}" is already a superadmin`);
      return;
    }

    await User.findByIdAndUpdate(user._id, { role: 'superadmin' });

    console.log(`✅ Successfully made "${email}" a superadmin`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Previous role: ${user.role}`);
    console.log(`   New role: superadmin`);

  } catch (error) {
    console.error('❌ Error making user admin:', error);
    throw error;
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'ardikmachhi@gmail.com';

makeUserAdmin(email)
  .then(() => {
    console.log('\n✅ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Operation failed:', error);
    process.exit(1);
  });