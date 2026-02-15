const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createSuperAdmin() {
  try {
    // Get credentials from environment or command line
    const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || 'yohannes@example.com';
    const password = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD;
    const firstName = process.argv[4] || process.env.SUPER_ADMIN_FIRSTNAME || 'Yohannes';
    const lastName = process.argv[5] || process.env.SUPER_ADMIN_LASTNAME || 'Admin';
    
    if (!password) {
      console.error('❌ Error: Password is required');
      console.log('\nUsage:');
      console.log('  node create-super-admin.js <email> <password> [firstName] [lastName]');
      console.log('\nOr set environment variables:');
      console.log('  SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_FIRSTNAME, SUPER_ADMIN_LASTNAME');
      process.exit(1);
    }
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/regional_admin_db');
    console.log('✓ Connected to database');
    
    // Check if Super Admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      console.log('⚠️  Super Admin already exists:', existingAdmin.email);
      console.log('Only one Super Admin is allowed in the system.');
      process.exit(0);
    }
    
    // Create Super Admin
    const superAdmin = new User({
      email: email.toLowerCase(),
      password: password, // Will be hashed by pre-save hook
      firstName,
      lastName,
      role: 'super_admin',
      isEmailVerified: true,
      isActive: true
    });
    
    await superAdmin.save();
    
    console.log('\n========================================');
    console.log('✅ Super Admin Created Successfully!');
    console.log('========================================');
    console.log(`Email:    ${email}`);
    console.log(`Name:     ${firstName} ${lastName}`);
    console.log(`Role:     super_admin`);
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin;