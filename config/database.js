const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/regional_admin_db', {
      // These options are no longer needed in Mongoose 6+, but good to have for older versions
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize default data
    const { Region, Config } = require('../models');
    await Region.initializeRegions();
    await Config.initializeDefaults();
    
    console.log('Default regions and config initialized');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;