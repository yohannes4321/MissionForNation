const mongoose = require('mongoose');
const { User, Region, Config } = require('./models');

async function initializeSystem() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/regional_admin_db');
    console.log('Connected to database');
    
    // Initialize regions
    await Region.initializeRegions();
    console.log('✓ Regions initialized');
    
    // Initialize config
    await Config.initializeDefaults();
    console.log('✓ Default configuration initialized');
    
    // Check if Super Admin exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('✓ Super Admin already exists:', existingSuperAdmin.email);
    } else {
      console.log('\n========================================');
      console.log('No Super Admin found!');
      console.log('========================================');
      console.log('\nTo create the first Super Admin, run:');
      console.log('  node create-super-admin.js');
      console.log('\nOr use the /api/auth/setup endpoint (one-time use)');
      console.log('========================================\n');
    }
    
    console.log('\n✓ System initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

// If run directly
if (require.main === module) {
  initializeSystem();
}

module.exports = initializeSystem;