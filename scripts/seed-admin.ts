import mongoose from 'mongoose';
import database from '../src/services/database';
import User from '../src/APIs/user/_shared/models/user.model';
import hashing from '../src/utils/hashing';
import { EUserRoles } from '../src/constant/users';

// Load environment variables (assumes using dotenv in the project entry)
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
  console.error('Missing ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME environment variables.');
  process.exit(1);
}

async function seedAdmin() {
  try {
    // Ensure database connection is established
    await database.connect();

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`Admin user with email ${ADMIN_EMAIL} already exists. Skipping creation.`);
      return;
    }

    const hashedPassword = await hashing.hashPassword(ADMIN_PASSWORD);
    const adminUser = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: EUserRoles.ADMIN,
      // Assuming other required fields like isConfirmed or isActive exist; set sensible defaults
      isConfirmed: true,
      isActive: true,
    });

    await adminUser.save();
    console.log(`Admin user created with email ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
